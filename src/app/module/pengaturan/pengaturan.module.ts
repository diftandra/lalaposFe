import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilComponent } from './profil/profil.component';
import { KategoriComponent } from './kategori/kategori.component';
import { MerekComponent } from './merek/merek.component';
import { SupplierComponent } from './supplier/supplier.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { DetailMerekComponent } from './detail-merek/detail-merek.component';
import { DetailSupplierComponent } from './detail-supplier/detail-supplier.component';
import { DetailProfilComponent } from './detail-profil/detail-profil.component';
import { AuthGuardService } from 'src/app/service/auth-guard/auth-guard.service';

const routes: Routes = [

  {
    path: 'profil',
    component: ProfilComponent,
    data: {
      breadcrumb: 'Profile',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'profil/input-profil',
    component: DetailProfilComponent,
    data: {
      breadcrumb: 'Input Profil',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'profil/:id',
    component: DetailProfilComponent,
    data: {
      breadcrumb: 'Edit Profil',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'merk',
    component: MerekComponent,
    data: {
      breadcrumb: 'Merk',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'merk/input-merk',
    component: DetailMerekComponent,
    data: {
      breadcrumb: 'Input Merk',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'merk/:id',
    component: DetailMerekComponent,
    data: {
      breadcrumb: 'Edit Merk',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'supplier',
    component: SupplierComponent,
    data: {
      breadcrumb: 'Supplier',
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'supplier/input-supplier',
    component: DetailSupplierComponent,
    data: {
      breadcrumb: 'Input Supplier',
    },
  },
  {
    path: 'supplier/:id',
    component: DetailSupplierComponent,
    data: {
      breadcrumb: 'Edit Supplier',
    },
    canActivate: [AuthGuardService]
  },
];

@NgModule({
  declarations: [
    ProfilComponent,
    KategoriComponent,
    MerekComponent,
    SupplierComponent,
    DetailMerekComponent,
    DetailSupplierComponent,
    DetailProfilComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModuleModule
  ]
})
export class PengaturanModule { }
