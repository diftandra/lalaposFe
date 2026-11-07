import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DaftarStcokBarangComponent } from './daftar-stcok-barang/daftar-stcok-barang.component';

import { SharedModuleModule } from '../shared-module/shared-module.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DetailStcokBarangComponent } from './detail-stcok-barang/detail-stcok-barang.component';
import { UploadCsvComponent } from './upload-csv/upload-csv.component';
import { AuthGuardService } from 'src/app/service/auth-guard/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    component: DaftarStcokBarangComponent,

  },
  {
    path: 'input-stock-barang',
    component: DetailStcokBarangComponent,
    data: {
      breadcrumb: 'Input Stock Barang',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: ':id',
    component: DetailStcokBarangComponent,
    data: {
      breadcrumb: 'Edit Stock Barang',
    },

  }
];

@NgModule({
  declarations: [
    DaftarStcokBarangComponent,
    DetailStcokBarangComponent,
    UploadCsvComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModuleModule
  ],

})
export class StockModule { }
