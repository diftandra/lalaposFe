import { Injectable } from '@angular/core';
import * as JsBarcodeModule from 'jsbarcode';

// jsbarcode is CommonJS (module.exports = function). Depending on the bundler
// interop the function is the namespace itself or its `default`.
const JsBarcode: typeof JsBarcodeModule =
  (JsBarcodeModule as any).default || JsBarcodeModule;

/** One packing level of a product, ready to print as a label. */
export interface BarcodeLabel {
  /** Product name (brand + description). */
  name: string;
  /** Packing label, e.g. "BKS". */
  packing: string;
  /** Sell price for this packing. */
  price: number;
  barcode: string;
  copies: number;
}

/** Label paper size in millimetres. */
export interface LabelSize {
  key: string;
  label: string;
  width: number;
  height: number;
}

export const LABEL_SIZES: LabelSize[] = [
  { key: '50x30', label: '50 x 30 mm', width: 50, height: 30 },
  { key: '40x30', label: '40 x 30 mm', width: 40, height: 30 },
  { key: '58x40', label: '58 x 40 mm', width: 58, height: 40 },
];

/** Max barcode length accepted by the backend. */
export const BARCODE_MAX_LENGTH = 64;

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
  private audio: AudioContext | null = null;

  /**
   * Cleans what the scanner typed: trims whitespace and drops control
   * characters (some scanners send a prefix/suffix such as Tab or CR).
   */
  normalize(raw: string | null | undefined): string {
    return (raw ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  }

  /** True for a 13-digit code with a correct EAN-13 check digit. */
  isEan13(code: string): boolean {
    if (!/^\d{13}$/.test(code)) {
      return false;
    }
    const d = code.split('').map(Number);
    const sum = d.slice(0, 12).reduce((acc, n, i) => acc + n * (i % 2 == 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10 == d[12];
  }

  /** Short beep: high for success, low for an error. Silently skipped when audio is unavailable. */
  beep(ok: boolean) {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) {
        return;
      }
      this.audio = this.audio || new Ctx();
      const ctx = this.audio!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = ok ? 1500 : 300;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (ok ? 0.08 : 0.3));
    } catch (e) {
      // Feedback only; never block a scan because of audio.
    }
  }

  /** SVG markup of a barcode. EAN-13 when the code is a valid EAN-13, otherwise Code128. */
  barcodeSvg(code: string, heightPx: number, fontSize: number): string {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const options = { height: heightPx, fontSize: fontSize, margin: 0, textMargin: 1, width: 2 };
    try {
      if (this.isEan13(code)) {
        JsBarcode(svg, code, { ...options, format: 'EAN13', flat: true });
      } else {
        JsBarcode(svg, code, { ...options, format: 'CODE128' });
      }
    } catch (e) {
      JsBarcode(svg, code, { ...options, format: 'CODE128' });
    }
    // Scale to the label width instead of the intrinsic pixel width.
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')?.replace('px', '')} ${svg.getAttribute('height')?.replace('px', '')}`);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('class', 'bc');
    return svg.outerHTML;
  }

  /** HTML of a single label (escaped text + barcode SVG). */
  labelHtml(item: BarcodeLabel): string {
    const price = 'Rp ' + Number(item.price || 0).toLocaleString('id-ID');
    return `<div class="label">`
      + `<div class="name">${this.escape(item.name)}</div>`
      + `<div class="price">${this.escape(price)}${item.packing ? ' / ' + this.escape(item.packing) : ''}</div>`
      + this.barcodeSvg(item.barcode, 40, 14)
      + `</div>`;
  }

  /** CSS shared by the print window and the on-screen preview. */
  labelCss(size: LabelSize, forPrint: boolean): string {
    const page = forPrint
      ? `@page { size: ${size.width}mm ${size.height}mm; margin: 0; }
         html, body { margin: 0; padding: 0; }
         .label { page-break-after: always; break-after: page; }
         .label:last-child { page-break-after: auto; break-after: auto; }`
      : '';
    return `${page}
      .label { box-sizing: border-box; width: ${size.width}mm; height: ${size.height}mm; padding: 1.5mm 2mm;
               display: flex; flex-direction: column; overflow: hidden; background: #fff; color: #000;
               font-family: Arial, Helvetica, sans-serif; }
      .label .name { font-size: ${size.height >= 40 ? 10 : 8}pt; font-weight: bold; line-height: 1.15;
                     max-height: 2.3em; overflow: hidden; }
      .label .price { font-size: ${size.height >= 40 ? 11 : 9}pt; font-weight: bold; margin: 0.5mm 0; }
      .label .bc { flex: 1 1 auto; min-height: 0; width: 100%; }`;
  }

  /**
   * Prints labels through the browser print dialog (any installed printer:
   * label printer via its driver, or a normal printer). Each label is one page
   * of the selected size. Returns false when the popup was blocked.
   */
  printLabels(items: BarcodeLabel[], size: LabelSize): boolean {
    const body = items
      .map(item => Array(Math.max(0, Math.floor(item.copies || 0))).fill(this.labelHtml(item)).join(''))
      .join('');
    if (!body) {
      return true;
    }
    const win = window.open('', '_blank', 'width=480,height=600');
    if (!win) {
      return false;
    }
    win.document.open();
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Label Barcode</title>`
      + `<style>${this.labelCss(size, true)}</style></head><body>${body}</body></html>`);
    win.document.close();
    // Give the new window a moment to lay out before opening the print dialog.
    win.onafterprint = () => win.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
    return true;
  }

  private escape(text: string): string {
    return (text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
  }
}
