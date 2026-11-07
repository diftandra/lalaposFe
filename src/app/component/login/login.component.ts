import { HttpEventType } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ENC_KEY, sessionStorage_menu_key, sessionStorage_password_key, sessionStorage_token_key, sessionStorage_username_key } from 'src/app/model/general';
import { AuthService } from 'src/app/service/auth.service';
import { RestService } from 'src/app/service/rest/rest.service';
import * as crypto from 'crypto-js';
import { Login, MenuBe } from 'src/app/model/profile';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  formGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  auth: boolean = true;

  constructor(private router: Router, private authS: AuthService, private rest: RestService) { }
  login() {
    if (this.formGroup.valid) {
      // Clear any leftover session (e.g. an expired token) before a fresh login.
      sessionStorage.clear();
      this.auth = true;
      this.rest.login(this.formGroup.get('username')?.value, this.formGroup.get('password')!.value!.trim()).subscribe(event => {
        if (event.type == HttpEventType.Response && event.ok && event.body) {
          let respond: Login = Object(event.body)['output_schema'];


          if (respond != null) {
            if (respond.token) {
              sessionStorage.setItem(sessionStorage_token_key, respond.token);
            }
            let username = respond.username
            this.getMenu(username, respond.role_group_code);
          }
          else {
            this.auth = false;
          }
        }
      }, error => {
        this.auth = false;
      })
    }
  }

  getMenu(username: string, role: string) {
    this.rest.getMenu(username, role).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        let data: MenuBe[] = Object(event.body)['output_schema'];
        console.log(data.map(m => m.menu_code));
        if (data.length == 0)
          this.auth = false
        else {
          let pass = crypto.AES.encrypt(this.formGroup.get('password')?.value ? this.formGroup.get('password')!.value!.trim() : '', ENC_KEY).toString();

          sessionStorage.setItem(sessionStorage_username_key, username);
          sessionStorage.setItem(sessionStorage_password_key, pass);
          this.authS.isLoggin.next(true)
          this.router.navigate(['home'])
          let menu: string[] = data.map(m => crypto.AES.encrypt(m.menu_code, ENC_KEY).toString());

          sessionStorage.setItem(sessionStorage_menu_key, menu.toString())

        }


      }
    })

  }

}
