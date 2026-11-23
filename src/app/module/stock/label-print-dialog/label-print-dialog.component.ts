import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BarcodeLabel, BarcodeService, LabelSize, LABEL_SIZES } from 'src/app/services/barcode.service';

const SIZE_STORAGE_KEY = 'lalapos.labelSize';

interface LabelRow extends BarcodeLabel {
  selected: boolean;
}

/** Choose packings, copies and paper size, preview, then print barcode labels. */
@Component({
  selector: 'app-label-print-dialog',
  templateUrl: './label-print-dialog.component.html',
})
export class LabelPrintDialogComponent {
  sizes = LABEL_SIZES;
  size: LabelSize;
  rows: LabelRow[];
  preview: SafeHtml | undefined;
  popupBlocked = false;

  constructor(private dialog: MatDialogRef<LabelPrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { labels: BarcodeLabel[] },
    private barcode: BarcodeService, private sanitizer: DomSanitizer) {
    this.rows = (data.labels || []).map(l => ({ ...l, copies: l.copies || 1, selected: true }));
    const saved = localStorage.getItem(SIZE_STORAGE_KEY);
    this.size = this.sizes.find(s => s.key == saved) || this.sizes[0];
    this.refreshPreview();
  }

  get totalLabels(): number {
    return this.rows.filter(r => r.selected).reduce((acc, r) => acc + Math.max(0, Math.floor(Number(r.copies) || 0)), 0);
  }

  setSize(key: string) {
    this.size = this.sizes.find(s => s.key == key) || this.sizes[0];
    localStorage.setItem(SIZE_STORAGE_KEY, this.size.key);
    this.refreshPreview();
  }

  refreshPreview() {
    const first = this.rows.find(r => r.selected);
    // labelHtml escapes all product text; the SVG is generated locally by jsbarcode.
    this.preview = first
      ? this.sanitizer.bypassSecurityTrustHtml(`<style>${this.barcode.labelCss(this.size, false)}</style>${this.barcode.labelHtml(first)}`)
      : undefined;
  }

  print() {
    const items = this.rows.filter(r => r.selected).map(r => ({ ...r, copies: Math.floor(Number(r.copies) || 0) }));
    this.popupBlocked = !this.barcode.printLabels(items, this.size);
    if (!this.popupBlocked) {
      this.dialog.close(true);
    }
  }

  close() {
    this.dialog.close(false);
  }
}
