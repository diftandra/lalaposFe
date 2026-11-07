import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ENC_KEY, MAPPING_MENU, Menu, menuList, pairValue, sessionStorage_menu_key, sessionStorage_password_key, sessionStorage_username_key } from 'src/app/model/general';
import * as crypto from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private router: Router,) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    let menu: string[] | undefined = sessionStorage.getItem(sessionStorage_menu_key)?.split(',').map(m => crypto.AES.decrypt(m, ENC_KEY).toString(crypto.enc.Utf8));
    let path: UrlSegment = Object(route)['url'][0];
    let value: pairValue | undefined = MAPPING_MENU.find(f => f.value == path?.path);
    let username = sessionStorage.getItem(sessionStorage_username_key);
    let pass = sessionStorage.getItem(sessionStorage_password_key);


    if (path.path == 'login') {
      if (username && pass)
        this.router.navigate(['home']);
      else
        return true;
    }
    else if (path.path == 'home' && username && pass)
      return true;
    else if (!menu?.find(f => f == value?.key)) {
      alert("Tidak berhak mengakses menu " + path.path)
      return false
    }
    return true;
  }

}
