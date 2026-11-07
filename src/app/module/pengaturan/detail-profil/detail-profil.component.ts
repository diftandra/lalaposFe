import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { Profile, profileRole, Role } from 'src/app/model/profile';
import { SupplierPost } from 'src/app/model/supplier';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-detail-profil',
  templateUrl: './detail-profil.component.html',
  styleUrls: ['./detail-profil.component.css']
})
export class DetailProfilComponent implements OnInit {

  titel: string = ''
  data: Profile = { full_name: '', is_active: false, password: '', username: '' };
  id: string = '';
  formGroup = new FormGroup({
    created_date: new FormControl(new Date),
    username: new FormControl(this.data?.username, Validators.required),
    full_name: new FormControl(this.data?.full_name, Validators.required),
    password: new FormControl(this.data?.password, Validators.required),
    is_active: new FormControl(this.data?.is_active, Validators.required),
    role: new FormControl('', Validators.required)
  })
  disabel: boolean = false;
  listRole: Role[] = []
  constructor(private activeRoute: ActivatedRoute, private rest: RestService, private matDialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.getRoles();
    this.formGroup.get('created_date')?.disable();
    this.activeRoute.params.subscribe(event => {

      this.id = event['id']
      if (this.id) {
        this.titel = "Edit"
        this.formGroup.get('username')?.disable();
        this.formGroup.get('role')?.disable();
        this.getData(this.id)
      } else {
        this.titel = "Input"

      }
    })

  }
  setDataRadio(value: MatRadioChange) {
    this.formGroup.get('is_active')?.setValue(value.value)
  }
  getRoles() {
    this.rest.getRoles().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        console.log(event.body)
        this.listRole = Object(event.body)['output_schema']
      }
    })
  }
  getData(id: string) {
    this.rest.getProfileById(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        this.data = Object(event.body)['output_schema'];
        this.formGroup.get('username')?.setValue(this.data.username)
        this.formGroup.get('full_name')?.setValue(this.data.full_name)
        this.formGroup.get('is_active')?.setValue(this.data.is_active)
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
    let data: Profile = {

      username: this.formGroup.get('username')?.value,
      full_name: this.formGroup.get('full_name')?.value,
      is_active: this.formGroup.get('is_active')?.value,
      password: this.formGroup.get('password')?.value
    }
    console.log(data)
    this.rest.PutProfil(JSON.stringify(data)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.disabel = false
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil memperbarui Profil",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.router.navigate(['pengaturan/profil'])
        })
      }
    }, error => {
      this.disabel = false
    })
  }
  add() {
    this.disabel = true
    let data: Profile = {
      username: this.formGroup.get('username')?.value,
      full_name: this.formGroup.get('full_name')?.value,
      is_active: this.formGroup.get('is_active')?.value,
      password: this.formGroup.get('password')?.value
    }
    console.log(data)
    this.rest.postAddProfil(JSON.stringify(data)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        let profileRole: profileRole = {
          full_name: data.full_name,
          is_active: data.is_active,
          password: data.password,
          role_group_code: this.formGroup.get('role')?.value,
          username: data.username
        }
        this.rest.postAddProfilRole(JSON.stringify(profileRole)).subscribe(event => {
          if (event.type == HttpEventType.Response && event.ok && event.body) {
            this.disabel = false
            const dialog = this.matDialog.open(DialogComponent,
              {
                width: '33%',
                data: {
                  question: "Berhasil menambahkan Profil",
                  yesStr: "Ok",

                },
              }
            );
            dialog.afterClosed().subscribe(event => {
              this.router.navigate(['pengaturan/profil'])
            })
          }
        }, error => {
          this.disabel = false;
        })

      }
    }, error => {
      this.disabel = false
    })
  }
}
