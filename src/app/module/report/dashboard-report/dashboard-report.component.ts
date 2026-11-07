import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pairValue } from 'src/app/model/general';

@Component({
  selector: 'app-dashboard-report',
  templateUrl: './dashboard-report.component.html',
  styleUrls: ['./dashboard-report.component.css']
})
export class DashboardReportComponent implements OnInit {

  listReport: pairValue[] = [
    {
      key: 'Laporan Order',
      value: 'report/report-order'
    },
    {
      key: 'Laporan Stock',
      value: 'report/report-stock'
    }
  ]
  constructor(private router: Router) { }

  ngOnInit(): void {
  }
  click(url: string) {
    this.router.navigate([url]);
  }
}
