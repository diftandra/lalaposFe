import { Component, OnInit } from '@angular/core';
import { QzTrayService } from 'src/app/services/qz-tray.service';

@Component({
  selector: 'app-printer-selector',
  templateUrl: './printer-selector.component.html',
  styleUrls: ['./printer-selector.component.css']
})
export class PrinterSelectorComponent implements OnInit {
  printers: string[] = [];
  selectedPrinter: string = '';
  isQzActive: boolean = false;
  loading: boolean = true;

  constructor(private qzTray: QzTrayService) {}

  async ngOnInit() {
    await this.loadPrinters();
  }

  async loadPrinters() {
    this.loading = true;
    try {
      // Check if QZ Tray is active
      this.isQzActive = await this.qzTray.isActive();
      
      if (!this.isQzActive) {
        alert('QZ Tray tidak aktif.\n\nSilakan:\n1. Install QZ Tray dari https://qz.io/download/\n2. Jalankan aplikasi QZ Tray (cek system tray)\n3. Refresh halaman ini');
        this.loading = false;
        return;
      }

      // Get list of printers
      this.printers = await this.qzTray.getPrinters();
      
      // Load saved printer or use default
      const saved = localStorage.getItem('selectedPrinter');
      if (saved && this.printers.includes(saved)) {
        this.selectedPrinter = saved;
      } else if (this.printers.length > 0) {
        this.selectedPrinter = await this.qzTray.getDefaultPrinter();
        this.savePrinter();
      }
      
      this.loading = false;
    } catch (error: any) {
      console.error('Error loading printers:', error);
      alert('Gagal mengakses printer: ' + error.message);
      this.loading = false;
    }
  }

  savePrinter() {
    if (this.selectedPrinter) {
      localStorage.setItem('selectedPrinter', this.selectedPrinter);
      alert('Printer tersimpan: ' + this.selectedPrinter);
    }
  }

  async testPrint() {
    if (!this.selectedPrinter) {
      alert('Pilih printer terlebih dahulu');
      return;
    }

    try {
      const testReceipt = [
        '========================================',
        '           TEST PRINT',
        '========================================',
        'Printer: ' + this.selectedPrinter,
        'Waktu  : ' + new Date().toLocaleString('id-ID'),
        '========================================',
        '',
        'Jika struk ini tercetak dengan baik,',
        'berarti printer sudah siap digunakan.',
        '',
        '========================================',
        ''
      ];

      await this.qzTray.printReceipt(this.selectedPrinter, testReceipt);
      alert('Test print berhasil!');
    } catch (error: any) {
      alert('Test print gagal: ' + error.message);
    }
  }

  async refreshPrinters() {
    await this.loadPrinters();
  }
}
