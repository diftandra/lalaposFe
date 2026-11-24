import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as qz from 'qz-tray';
import { environment } from 'src/environments/environment';

export interface SalesReceiptItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  discount: number;
  total: number;
}

export interface SalesReceipt {
  salesHeaderCode?: string;
  customerName: string;
  orderDate: string;
  items: SalesReceiptItem[];
  grandTotal: number;
  payment: number;
  change: number;
  paymentMethod?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QzTrayService {
  private connecting: Promise<void> | null = null;

  constructor(private http: HttpClient) {
    // Signed requests: QZ Tray trusts the site and stops showing the "Untrusted website" prompt.
    // Public certificate is served from assets; the private key stays on the backend (/lala-pos/qz/sign).
    qz.security.setCertificatePromise((resolve: any, reject: any) => {
      this.http.get('assets/qz/digital-certificate.txt', { responseType: 'text' })
        .subscribe(cert => {
          // nginx falls back to index.html when the file is missing from the build
          if (cert.includes('-----BEGIN CERTIFICATE-----')) {
            resolve(cert);
          } else {
            console.error('QZ certificate not found in build (assets/qz/digital-certificate.txt)');
            reject('QZ certificate not found');
          }
        }, reject);
    });
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise((toSign: string) => (resolve: any, reject: any) => {
      const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
      this.http.post(environment.urlHost + '/lala-pos/qz/sign', toSign, { headers, responseType: 'text' })
        .subscribe(resolve, reject);
    });
  }

  /**
   * Connect to QZ Tray application (reuses the open connection)
   */
  async connect(): Promise<void> {
    if (qz.websocket.isActive()) {
      return;
    }
    if (!this.connecting) {
      this.connecting = qz.websocket.connect()
        .then(() => console.log('QZ Tray connected successfully'))
        .finally(() => this.connecting = null);
    }
    try {
      await this.connecting;
    } catch (error) {
      console.error('Failed to connect to QZ Tray:', error);
      throw new Error('QZ Tray tidak aktif. Pastikan aplikasi QZ Tray sudah berjalan.');
    }
  }

  /**
   * Disconnect from QZ Tray
   */
  async disconnect(): Promise<void> {
    if (!qz.websocket.isActive()) {
      return;
    }

    try {
      await qz.websocket.disconnect();
      console.log('QZ Tray disconnected');
    } catch (error) {
      console.error('Failed to disconnect from QZ Tray:', error);
    }
  }

  /**
   * Get list of available printers
   */
  async getPrinters(): Promise<string[]> {
    await this.connect();
    try {
      const printers = await qz.printers.find();
      console.log('Available printers:', printers);
      return printers;
    } catch (error) {
      console.error('Failed to get printers:', error);
      throw error;
    }
  }

  /**
   * Get default printer
   */
  async getDefaultPrinter(): Promise<string> {
    await this.connect();
    try {
      const printer = await qz.printers.getDefault();
      console.log('Default printer:', printer);
      return printer;
    } catch (error) {
      console.error('Failed to get default printer:', error);
      throw error;
    }
  }

  /**
   * Print raw data (ESC/POS commands)
   */
  async printRaw(printerName: string, data: string[]): Promise<void> {
    await this.connect();

    const config = qz.configs.create(printerName);

    try {
      await qz.print(config, data);
      console.log('Print job sent successfully');
    } catch (error) {
      console.error('Failed to print:', error);
      throw error;
    }
  }

  /**
   * Print text receipt
   */
  async printReceipt(printerName: string, lines: string[]): Promise<void> {
    const data = lines.map(line => line + '\n');
    await this.printRaw(printerName, data);
  }

  /**
   * Print ESC/POS receipt with formatting
   */
  async printEscPos(printerName: string, content: {
    header?: string[];
    items: Array<{ name: string; qty: number; price: number; total: number }>;
    footer?: string[];
    total: number;
  }): Promise<void> {
    await this.connect();

    const ESC = '\x1B';
    const GS = '\x1D';
    
    const commands: string[] = [];

    // Initialize printer
    commands.push(ESC + '@'); // Initialize

    // Header
    if (content.header) {
      commands.push(ESC + 'a' + '\x01'); // Center align
      commands.push(ESC + '!' + '\x30'); // Double size
      content.header.forEach(line => {
        commands.push(line + '\n');
      });
      commands.push(ESC + '!' + '\x00'); // Normal size
      commands.push('\n');
    }

    // Items
    commands.push(ESC + 'a' + '\x00'); // Left align
    commands.push('-'.repeat(48) + '\n');
    
    content.items.forEach(item => {
      const name = item.name.substring(0, 20).padEnd(20);
      const qty = item.qty.toString().padStart(3);
      const price = item.price.toLocaleString('id-ID').padStart(10);
      const total = item.total.toLocaleString('id-ID').padStart(12);
      commands.push(`${name} ${qty} ${price} ${total}\n`);
    });

    commands.push('-'.repeat(48) + '\n');

    // Total
    commands.push(ESC + '!' + '\x10'); // Bold
    const totalLine = 'TOTAL'.padEnd(35) + content.total.toLocaleString('id-ID').padStart(12);
    commands.push(totalLine + '\n');
    commands.push(ESC + '!' + '\x00'); // Normal
    commands.push('\n');

    // Footer
    if (content.footer) {
      commands.push(ESC + 'a' + '\x01'); // Center align
      content.footer.forEach(line => {
        commands.push(line + '\n');
      });
    }

    // Cut paper
    commands.push('\n\n\n');
    commands.push(GS + 'V' + '\x00'); // Full cut

    const config = qz.configs.create(printerName);

    try {
      await qz.print(config, commands);
      console.log('Receipt printed successfully');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }

  /**
   * Printer from localStorage, or the system default printer (saved for next time)
   */
  async resolvePrinter(): Promise<string> {
    let printerName = localStorage.getItem('selectedPrinter');
    if (!printerName) {
      printerName = await this.getDefaultPrinter();
      localStorage.setItem('selectedPrinter', printerName);
    }
    return printerName;
  }

  /**
   * Print a sales receipt (80mm, 48 columns), same layout as the backend receipt
   */
  async printSalesReceipt(printerName: string, receipt: SalesReceipt): Promise<void> {
    const W = 48;
    const ESC = '\x1B';
    const GS = '\x1D';
    const fmt = (n: number) => Number(n || 0).toLocaleString('id-ID');
    const separator = '-'.repeat(W) + '\n';
    const leftRight = (left: string, right: string) =>
      left + ' '.repeat(Math.max(1, W - left.length - right.length)) + right + '\n';

    const c: string[] = [];
    c.push(ESC + '@');
    c.push(ESC + 'a' + '\x01');
    c.push(ESC + '!' + '\x30', 'TOKO LALA\n', ESC + '!' + '\x00');
    c.push('Ruko Permata Pamoyanan Jl. RE Soemantadiredja\n');
    c.push('No. 19, Kel Pamoyanan Kec Bogor Selatan\n');
    c.push('0815-8664-0019\n\n');

    c.push(ESC + 'a' + '\x00');
    c.push('Client: ' + (receipt.customerName || '-') + '\n');
    c.push(receipt.orderDate + '\n');
    if (receipt.salesHeaderCode) {
      c.push(receipt.salesHeaderCode + '\n');
    }
    c.push(separator);

    receipt.items.forEach(item => {
      c.push((item.name || '').substring(0, W) + '\n');
      c.push(leftRight(`${Number(item.qty)} ${item.unit || ''} x ${fmt(item.price)}`, fmt(item.total)));
      if (Number(item.discount) > 0) {
        c.push(leftRight('Diskon', '(' + fmt(item.discount) + ')'));
      }
    });

    c.push(separator);
    c.push(ESC + 'E' + '\x01');
    c.push(leftRight('TOTAL', fmt(receipt.grandTotal)));
    c.push(leftRight('METODE', receipt.paymentMethod || 'TUNAI'));
    c.push(leftRight('PEMBAYARAN', fmt(receipt.payment)));
    c.push(leftRight('KEMBALIAN', fmt(receipt.change)));
    c.push(ESC + 'E' + '\x00');
    c.push(separator);

    c.push(ESC + 'a' + '\x01');
    c.push('TERIMA KASIH TELAH BERBELANJA\n');
    c.push('KLAIM MAX 1x24 JAM\n');
    c.push('HARAP PERIKSA KEMBALI BARANG ANDA\n');
    c.push('\n\n\n\n\n\n');
    c.push(GS + 'V' + '\x00');

    await this.printRaw(printerName, c);
  }

  /**
   * Check if QZ Tray is active
   */
  async isActive(): Promise<boolean> {
    try {
      // Keep the connection open so the next print doesn't reconnect (and re-prompt)
      await this.connect();
      return true;
    } catch (error) {
      return false;
    }
  }
}
