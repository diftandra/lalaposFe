import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportOrderComponent } from './report-order/report-order.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModuleModule } from '../shared-module/shared-module.module';
import { ReportStockComponent } from './report-stock/report-stock.component';
import { DashboardReportComponent } from './dashboard-report/dashboard-report.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardReportComponent
  },
  {
    path: 'report-order',
    component: ReportOrderComponent,
    data: {
      breadcrumb: 'Report Order',
    },
  },
  {
    path: 'report-stock',
    component: ReportStockComponent,
    data: {
      breadcrumb: 'Report Stock',
    },
  }
]

@NgModule({
  declarations: [
    ReportOrderComponent,
    ReportStockComponent,
    DashboardReportComponent
  ],
  imports: [
    CommonModule,
    SharedModuleModule,
    RouterModule.forChild(routes)
  ]
})
export class ReportModule { }
