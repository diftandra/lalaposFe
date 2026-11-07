import { DatePipe } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Alert } from 'src/app/model/dashboard';
import { ReadCsvService } from 'src/app/service/read-csv/read-csv.service';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  sysDate = new Date();
  displayedColumns: string[] = ['product_code', 'stock', 'packing', 'brand_name', 'product_desc'];
  dataTabel: Alert[] = [];
  dataSource = new MatTableDataSource(this.dataTabel);

  totalData = 0;
  totalOrder = 0;

  @ViewChild(MatSort) sort: MatSort | any;
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  constructor(private datepipe: DatePipe, private rest: RestService, private matDialog: MatDialog, private router: Router, private activeRoute: ActivatedRoute) {
    this.getDataTotalCustomer();
    this.getProductAlert();
    this.getOrderPerday();
  }

  getDataTotalCustomer() {
    this.rest.getDashbaordTotalPerDay(this.datepipe.transform(new Date(), 'ddMMyyyy')!).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.totalData = Object(event.body)['output_schema']['count_order']
      }
    })
  }
  getProductAlert() {
    this.rest.getDashboardProductAlert().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.dataTabel = Object(event.body)['output_schema'];
        this.dataSource = new MatTableDataSource(this.dataTabel);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    })
  }
  getOrderPerday() {
    this.rest.getDashbaordTotalPerDay(this.datepipe.transform(new Date(), 'ddMMyyyy')!).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.totalOrder = Object(event.body)['output_schema']['grand_total_sales'];
      }
    })
  }
}
