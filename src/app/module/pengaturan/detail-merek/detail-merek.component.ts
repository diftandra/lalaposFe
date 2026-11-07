import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { Brand, BrandPost } from 'src/app/model/master-data';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-detail-merek',
  templateUrl: './detail-merek.component.html',
  styleUrls: ['./detail-merek.component.css']
})
export class DetailMerekComponent implements OnInit {
  titel: string = ''
  data: Brand = { brandCode: '', brandName: '', created_date: '', isActive: false, productBrandId: '' };
  id: string = '';
  formGroup = new FormGroup({
    created_date: new FormControl(this.data?.created_date),
    brandName: new FormControl(this.data?.brandName, Validators.required),
    brandCode: new FormControl(this.data?.brandCode, Validators.required),
    isActive: new FormControl(this.data?.isActive, Validators.required)
  })
  disabel: boolean = false;

  constructor(private activeRoute: ActivatedRoute, private rest: RestService, private matDialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.formGroup.get('brandCode')?.disable();
    this.activeRoute.params.subscribe(event => {

      this.id = event['id']
      if (this.id) {
        this.titel = "Edit"
        this.formGroup.get('created_date')?.disable()
        this.getData(this.id)
      } else {
        this.titel = "Input"
        this.formGroup.get('created_date')?.setValue(new Date)
      }
    })
  }
  getData(id: string) {
    this.rest.getBrandById(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.data = Object(event.body)['output_schema'];
        this.formGroup.get('created_date')?.setValue(new Date)
        this.formGroup.get('brandName')?.setValue(this.data.brandName)
        this.formGroup.get('brandCode')?.setValue(this.data.brandCode)
        this.formGroup.get('isActive')?.setValue(this.data.isActive)
      }
    })
  }
  setDataRadio(value: MatRadioChange) {
    this.formGroup.get('isActive')?.setValue(value.value)
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
  add() {
    this.disabel = true
    let data: BrandPost = { brand_code: '', brand_name: this.formGroup.get('brandName')?.value, is_active: this.formGroup.get('isActive')?.value }
    console.log(data)
    this.rest.postAddBrand(JSON.stringify(data)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.disabel = false
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil menambahkan Brand",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.router.navigate(['pengaturan/merk'])
        })
      }
    }, error => {
      this.disabel = false
    })
  }

  edit() {
    this.disabel = true
    let data: BrandPost = { brand_code: this.formGroup.get('brandCode')?.value, brand_name: this.formGroup.get('brandName')?.value, is_active: this.formGroup.get('isActive')?.value }
    console.log(data)
    this.rest.PutBrand(JSON.stringify(data)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.disabel = false
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil mengupdate Brand",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.router.navigate(['pengaturan/merk'])
        })
      }
    }, error => {
      this.disabel = false
    })
  }
}
