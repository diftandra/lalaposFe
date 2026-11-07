import { Component } from '@angular/core';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  openSidebar: boolean = false;

  constructor() { }

  ngOnInit(): void { }

  onCloseSidebar() {
    this.openSidebar = false;
  }

  onOpenSidebar() {
    this.openSidebar = true;
  }
}
