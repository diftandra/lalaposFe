import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export type PaymentMethod = 'TUNAI' | 'QRIS' | 'TRANSFER';

export interface PaymentDialogResult {
  pembayaran: number;
  kembalian: number;
  paymentMethod: PaymentMethod;
}

@Component({
  selector: 'app-dialog-payment',
  templateUrl: './dialog-payment.component.html',
  styleUrls: ['./dialog-payment.component.css']
})
export class DialogPaymentComponent implements OnInit, AfterViewInit {

  readonly methods: Array<{ value: PaymentMethod; label: string }> = [
    { value: 'TUNAI', label: 'Tunai' },
    { value: 'QRIS', label: 'QRIS' },
    { value: 'TRANSFER', label: 'Transfer' }
  ];

  readonly total: number;
  readonly quickAmounts: number[];

  @ViewChild('payInput') payInput: ElementRef<HTMLInputElement> | undefined;

  formGroup = new FormGroup({
    paymentMethod: new FormControl('TUNAI', Validators.required),
    totalBon: new FormControl(undefined, Validators.required),
    pembayaran: new FormControl(undefined, Validators.required),
    kembalian: new FormControl(0, Validators.required)
  });

  constructor(
    private dialog: MatDialogRef<DialogPaymentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.total = Number(data?.total || 0);
    this.quickAmounts = this.buildQuickAmounts(this.total);

    const initialMethod: PaymentMethod = this.normalizeMethod(data?.paymentMethod);
    this.formGroup.get('paymentMethod')?.setValue(initialMethod);
    this.formGroup.get('totalBon')?.setValue(this.total);
    this.formGroup.get('totalBon')?.disable();
    this.formGroup.get('kembalian')?.disable();

    this.formGroup.get('pembayaran')?.valueChanges.subscribe(val => {
      const paid = Number(val);
      if (val === null || val === undefined || val === '' || Number.isNaN(paid)) {
        this.formGroup.get('kembalian')?.setValue(undefined);
      } else {
        this.formGroup.get('kembalian')?.setValue(paid - this.total);
      }
    });

    this.formGroup.get('paymentMethod')?.valueChanges.subscribe((method: PaymentMethod) => {
      if (method !== 'TUNAI') {
        this.formGroup.get('pembayaran')?.setValue(this.total);
      } else {
        setTimeout(() => this.focusPayInput());
      }
    });

    if (initialMethod !== 'TUNAI') {
      this.formGroup.get('pembayaran')?.setValue(this.total);
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.currentMethod === 'TUNAI') {
      setTimeout(() => this.focusPayInput());
    }
  }

  get currentMethod(): PaymentMethod {
    return (this.formGroup.get('paymentMethod')?.value || 'TUNAI') as PaymentMethod;
  }

  get changeValue(): number | null {
    const val = this.formGroup.get('kembalian')?.value;
    return val === null || val === undefined || Number.isNaN(Number(val)) ? null : Number(val);
  }

  get canSubmit(): boolean {
    const paid = Number(this.formGroup.get('pembayaran')?.value);
    return this.formGroup.valid && !Number.isNaN(paid) && paid >= this.total;
  }

  selectAmount(amount: number) {
    this.formGroup.get('pembayaran')?.setValue(amount);
    this.focusPayInput();
  }

  cetak() {
    if (!this.canSubmit) {
      return;
    }
    const paid = Number(this.formGroup.get('pembayaran')?.value);
    const result: PaymentDialogResult = {
      pembayaran: paid,
      kembalian: paid - this.total,
      paymentMethod: this.currentMethod
    };
    this.dialog.close(result);
  }

  onNoClick(): void {
    this.dialog.close();
  }

  private focusPayInput() {
    const el = this.payInput?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }

  private normalizeMethod(raw?: string): PaymentMethod {
    const upper = (raw || '').toUpperCase();
    if (upper === 'QRIS' || upper === 'TRANSFER') {
      return upper;
    }
    return 'TUNAI';
  }

  /** Builds up to 4 convenient cash bill presets strictly greater than total. */
  private buildQuickAmounts(total: number): number[] {
    if (total <= 0) {
      return [10000, 20000, 50000, 100000];
    }
    const candidates = new Set<number>();
    const steps = [5000, 10000, 20000, 50000, 100000];
    for (const step of steps) {
      const rounded = Math.ceil(total / step) * step;
      if (rounded > total) {
        candidates.add(rounded);
      }
    }
    for (const bill of [10000, 20000, 50000, 100000, 200000, 500000]) {
      if (bill > total) {
        candidates.add(bill);
      }
    }
    return Array.from(candidates).sort((a, b) => a - b).slice(0, 4);
  }
}
