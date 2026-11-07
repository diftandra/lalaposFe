import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { Supplier, SupplierPost } from 'src/app/model/supplier';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-detail-supplier',
  templateUrl: './detail-supplier.component.html',
  styleUrls: ['./detail-supplier.component.css']
})
export class DetailSupplierComponent implements OnInit {

  titel: string = ''
  data: Supplier = { created_date: new Date, supplierAddress: '', supplierCode: '', supplierContact: '', supplierId: '', supplierName: '', supplierNotes: '' };
  id: string = '';
  formGroup = new FormGroup({
    created_date: new FormControl(this.data?.created_date),
    supplierName: new FormControl(this.data?.supplierName, Validators.required),
    supplierContact: new FormControl(this.data?.supplierContact, Validators.required),
    supplierAddress: new FormControl(this.data?.supplierAddress, Validators.required),
    supplierNotes: new FormControl(this.data?.supplierNotes),
    supplierCode: new FormControl(this.data?.supplierCode, Validators.required)
  })
  disabel: boolean = false;

  constructor(private activeRoute: ActivatedRoute, private rest: RestService, private matDialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.formGroup.get('supplierCode')?.disable()
    this.formGroup.get('created_date')?.disable()
    this.activeRoute.params.subscribe(event => {

      this.id = event['id']
      if (this.id) {
        this.titel = "Edit"
        this.formGroup.get('created_date')?.disable()
        this.getData(this.id)
      } else {
        this.titel = "Input"

      }
    })
  }
  getData(id: string) {
    this.rest.getSupplierById(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.data = Object(event.body)['output_schema'];
        this.formGroup.get('created_date')?.setValue(new Date)
        this.formGroup.get('supplierName')?.setValue(this.data.supplierName)
        this.formGroup.get('supplierContact')?.setValue(this.data.supplierContact)
        this.formGroup.get('supplierAddress')?.setValue(this.data.supplierAddress)
        this.formGroup.get('supplierNotes')?.setValue(this.data.supplierNotes)
        this.formGroup.get('supplierCode')?.setValue(this.data.supplierCode)
      }
    })
  }
  simpan() {
    this.formGroup.markAllAsTouched()
    if (this.formGroup.valid) {
      if (this.id) {
        this.edit()
      }

      else {
        this.add()
      }
    }
  }
  edit() {
    this.disabel = true
    let data: SupplierPost = {

      supplier_code: this.formGroup.get('supplierCode')?.value,
      supplier_address: this.formGroup.get('supplierAddress')?.value,
      supplier_contact: this.formGroup.get('supplierContact')?.value,
      supplier_name: this.formGroup.get('supplierName')?.value,
      notes: this.formGroup.get('supplierNotes')?.value
    }
    console.log(data)
    this.rest.PutSupplier(JSON.stringify(data)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.disabel = false
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil memperbarui Brand",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.router.navigate(['pengaturan/supplier'])
        })
      }
    }, error => {
      this.disabel = false
    })
  }
  add() {
    this.disabel = true
    let data: SupplierPost = {
      supplier_code: '',
      supplier_address: this.formGroup.get('supplierAddress')?.value,
      supplier_contact: this.formGroup.get('supplierContact')?.value,
      supplier_name: this.formGroup.get('supplierName')?.value,
      notes: this.formGroup.get('supplierNotes')?.value
    }

    this.rest.postAddSupplier(JSON.stringify(data)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.disabel = false
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil menambahkan Supplier",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.router.navigate(['pengaturan/supplier'])
        })
      }
    }, error => {
      this.disabel = false
    })
  }
}
