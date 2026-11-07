import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { sessionStorage_username_key } from 'src/app/model/general';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements AfterViewInit {

  version: string = "1.0.7"
  date = new Date();
  isLoggedIn: boolean = false;
  username = sessionStorage.getItem(sessionStorage_username_key);
  constructor(private authS: AuthService, private router: Router) {
    authS.getLoggin.subscribe(event => {
      this.isLoggedIn = event;
      this.username = sessionStorage.getItem(sessionStorage_username_key);
    })
  }
  ngAfterViewInit(): void {

  }
  logout() {
    sessionStorage.clear()
    this.authS.isLoggin.next(false);
    this.router.navigate([''])
  }
}
