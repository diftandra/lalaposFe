import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { DaftarOrderComponent } from './daftar-order/daftar-order.component';
import { DetailOrderComponent } from './detail-order/detail-order.component';
import { ReviewOrderComponent } from './review-order/review-order.component';
import { AuthGuardService } from 'src/app/service/auth-guard/auth-guard.service';


const routes: Routes = [
  {
    path: '',
    component: DaftarOrderComponent,

  },
  {
    path: 'input-order',
    component: DetailOrderComponent,
    data: {
      breadcrumb: 'Input Order',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'review-order/:id',
    component: ReviewOrderComponent,
    data: {
      breadcrumb: 'Detail Order',
    },
    // canActivate: [AuthGuardService]
  },
  {
    path: 'edit-order/:id/:pid',
    component: DetailOrderComponent,
    data: {
      breadcrumb: 'Edit Order',
    },
    // canActivate: [AuthGuardService]
  }
];

@NgModule({
  declarations: [



    DaftarOrderComponent,
    DetailOrderComponent,
    ReviewOrderComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModuleModule
  ]
})
export class OrderModule { }
