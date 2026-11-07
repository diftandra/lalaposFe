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
  loading: boolean = false;
  showPassword: boolean = false;
  readonly year: number = new Date().getFullYear();

  constructor(private router: Router, private authS: AuthService, private rest: RestService) { }

  /** Field is invalid AND the user has interacted with it. */
  isInvalid(control: string): boolean {
    const c = this.formGroup.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  login() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    // Clear any leftover session (e.g. an expired token) before a fresh login.
    sessionStorage.clear();
    this.auth = true;
    this.loading = true;

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
          this.loading = false;
        }
      }
    }, error => {
      this.auth = false;
      this.loading = false;
    })
  }

  getMenu(username: string, role: string) {
    this.rest.getMenu(username, role).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        let data: MenuBe[] = Object(event.body)['output_schema'];

        if (data.length == 0) {
          this.auth = false;
          this.loading = false;
        }
        else {
          let pass = crypto.AES.encrypt(this.formGroup.get('password')?.value ? this.formGroup.get('password')!.value!.trim() : '', ENC_KEY).toString();

          sessionStorage.setItem(sessionStorage_username_key, username);
          sessionStorage.setItem(sessionStorage_password_key, pass);
          this.authS.isLoggin.next(true)
          let menu: string[] = data.map(m => crypto.AES.encrypt(m.menu_code, ENC_KEY).toString());
          sessionStorage.setItem(sessionStorage_menu_key, menu.toString())

          this.router.navigate(['home'])
        }
      }
    }, error => {
      this.auth = false;
      this.loading = false;
    })
  }

}
