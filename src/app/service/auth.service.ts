import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ENC_KEY, sessionStorage_menu_key, sessionStorage_password_key, sessionStorage_username_key } from '../model/general';
import * as crypto from 'crypto-js';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggin = new BehaviorSubject<boolean>(false)

  constructor() {
    if (sessionStorage.getItem(sessionStorage_password_key) && sessionStorage.getItem(sessionStorage_username_key))
      this.isLoggin.next(true)
  }

  get getLoggin() {
    return this.isLoggin.asObservable();
  }
  getMenu() {
    let dec: string[] | undefined = sessionStorage.getItem(sessionStorage_menu_key)?.split(',');
    let data: string[] = [];
    dec?.forEach(element => {
      data.push(crypto.AES.decrypt(element, ENC_KEY).toString(crypto.enc.Utf8))
    })
    return data;
  }
}
