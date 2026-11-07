import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dialog-payment',
  templateUrl: './dialog-payment.component.html',
  styleUrls: ['./dialog-payment.component.css']
})
export class DialogPaymentComponent implements OnInit {

  formGroup = new FormGroup({
    totalBon: new FormControl(undefined, Validators.required),
    pembayaran: new FormControl(undefined, Validators.required),
    kembalian: new FormControl(Validators.required)
  })

  constructor(private dialog: MatDialogRef<DialogPaymentComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.formGroup.get('kembalian')?.disable();
    this.formGroup.get('totalBon')?.disable();
    this.formGroup.get('totalBon')?.setValue(data.total)
    this.formGroup.get('pembayaran')?.valueChanges.subscribe(event => {

      this.formGroup.get('kembalian')?.setValue( event - this.formGroup.get('totalBon')?.value );

    })
  }

  ngOnInit(): void {
  }
  cetak() {

    this.dialog.close({
      pembayaran: this.formGroup.get('pembayaran')?.value,
      kembalian: this.formGroup.get('kembalian')?.value
    })
  }
  onNoClick(): void {
    this.dialog.close();
  }
}
