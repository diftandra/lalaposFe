import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './component/layout/layout.component';
import { SidenavComponent } from './component/sidenav/sidenav.component';
import { SidenavMenuComponent } from './component/sidenav-menu/sidenav-menu.component';
import { HomeComponent } from './component/home/home.component';
import { LoginComponent } from './component/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModuleModule } from './module/shared-module/shared-module.module';
import { BreadcrumbComponent } from './component/breadcrumb/breadcrumb.component';
import { DialogComponent } from './component/dialog/dialog.component';
import { DialogPaymentComponent } from './component/dialog-payment/dialog-payment.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/http=interceptor/http-interceptor.service';
@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SidenavComponent,
    SidenavMenuComponent,
    HomeComponent,
    LoginComponent,
    BreadcrumbComponent,
    DialogComponent,
    DialogPaymentComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModuleModule
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: HttpInterceptorService,
    multi: true,
  },],
  bootstrap: [AppComponent]
})
export class AppModule { }
