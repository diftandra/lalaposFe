import { Component, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Menu, menuList, sessionStorage_menu_key, Submenu1, Submenu2 } from 'src/app/model/general';
import { MenuBe } from 'src/app/model/profile';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-sidenav-menu',
  templateUrl: './sidenav-menu.component.html',
  styleUrls: ['./sidenav-menu.component.css']
})
export class SidenavMenuComponent {
  @Output('changePage') changePage: EventEmitter<string> =
    new EventEmitter<string>();
  menus: Menu[] = [];
  selectedMenu: string = '';
  selectedSubmenu1: string = '';
  selectedSubmenu2: string = '';
  authCode: string[] = [];
  menuList: Menu[] = menuList;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authS: AuthService
  ) {
    this.menus = this.menuList;
    authS.getLoggin.subscribe(event => {
      if (event) {

        this.chekMenu(this.menus, 0, authS.getMenu())
      }
    })
  }

  getAuthMenu() {
    let menuCodes: string[] = this.authS.getMenu();

  }
  public chekMenu(menu: Menu[], idx: number, auth_menu?: string[]) {
    if (menu == undefined || auth_menu == undefined) {

      return;
    }
    for (let i = menu.length - 1; i >= 0; i--) {
      // console.log(menu[i].menu_code, menu[i].name, idx, menu[i].submenu)
      if (
        !auth_menu.find((f) => menu[i].menu_code == f) || menu[i].menu_code == undefined
      ) {

        menu.splice(i, 1);
      }
      if (menu[i]?.submenu != undefined) {

        this.chekMenu(menu[i].submenu!, i + 1, auth_menu);
      }

    }
  }

  onMenuclick(
    menu: Menu | Submenu1 | Submenu2,
    menuName: string,
    submenu1Name: string,
    submenu2Name: string
  ) {
    if (menu.type === 'link') {
      // console.log('link : ', menu.link, menu.params);

      this.router.navigate([menu.link], {
        queryParams: menu.queryParam,
      });

      this.changePage.emit(menu.link);
    } else if (menu.type === 'submenu') {
      menu.openSubmenu = !menu.openSubmenu;
    }

    for (let mainMenu of this.menus) {
      if (mainMenu.type === 'submenu') {
        if (menuName != mainMenu.name) mainMenu.openSubmenu = false;

        if (mainMenu.submenu) {
          for (let submenu1 of mainMenu.submenu) {
            if (submenu1.type === 'submenu') {
              if (submenu1Name != submenu1.name) submenu1.openSubmenu = false;
            }
          }
        }
      }
    }

    this.selectedMenu = menuName;
    this.selectedSubmenu1 = submenu1Name;
    this.selectedSubmenu2 = submenu2Name;
  }
}
