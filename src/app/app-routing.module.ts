import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './component/home/home.component';
import { LoginComponent } from './component/login/login.component';
import { AuthGuardService } from './service/auth-guard/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      breadcrumb: ' ',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'stock',
    loadChildren: () => import('./module/stock/stock.module').then(m => m.StockModule),
    data: {
      breadcrumb: 'Stock Barang',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'order',
    loadChildren: () => import('./module/order/order.module').then(m => m.OrderModule),
    data: {
      breadcrumb: 'Order',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'pengaturan',
    loadChildren: () => import('./module/pengaturan/pengaturan.module').then(m => m.PengaturanModule),
    canActivate: [AuthGuardService]
  },
  {
    path: 'report',
    loadChildren: () => import('./module/report/report.module').then(m => m.ReportModule),
    data: {
      breadcrumb: 'Laporan',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
