import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ReportOrder } from 'src/app/model/report';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-report-order',
  templateUrl: './report-order.component.html',
  styleUrls: ['./report-order.component.css']
})
export class ReportOrderComponent implements OnInit, AfterViewInit {

  displayedColumns = ['order_date', 'sales_header_code', 'customer_name', 'product_code', 'brand_name', 'product_desc', 'base_price', 'product_sell_price', 'discount', 'product_amount', 'product_amount_packing', 'jumlah_item', 'packing', 'total_per_item', 'total_bon'];

  dataTable: ReportOrder[] = [];
  dataSource = new MatTableDataSource(this.dataTable)
  @ViewChild(MatPaginator) paginator: MatPaginator | any;

  formGroup = new FormGroup({
    sDate: new FormControl(new Date()),
    eDate: new FormControl(new Date())
  })
  length = 0;

  constructor(private rest: RestService, private datePipe: DatePipe) { }
  ngAfterViewInit(): void {
    this.paginator?.page.subscribe((event: PageEvent) => {
      let sDate = this.datePipe.transform(this.formGroup.get('sDate')?.value, 'yyyy-MM-dd');
      let eDate = this.datePipe.transform(this.formGroup.get('eDate')?.value, 'yyyy-MM-dd');
      this.getData(sDate!, eDate!, event.pageIndex, event.pageSize)
    });
  }

  ngOnInit(): void {
    this.getData()
  }
  dateChange() {
    let sDate = this.datePipe.transform(this.formGroup.get('sDate')?.value, 'yyyy-MM-dd');
    let eDate = this.datePipe.transform(this.formGroup.get('eDate')?.value, 'yyyy-MM-dd');
    this.getData(sDate!, eDate!);
  }
  getData(sDate?: string, eDate?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    this.rest.getReportViewOrder(sDate, eDate, currentPage, pageSize, sortDir, sortCol).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {

        this.dataTable = Object(event.body)['data']['content'];
        this.dataSource = new MatTableDataSource(this.dataTable);

        this.length = Object(event.body)['data']['totalElements'];
      }
    })
  }
  downloadReport() {
    let sDate = this.datePipe.transform(this.formGroup.get('sDate')?.value, 'yyyy-MM-dd');
    let eDate = this.datePipe.transform(this.formGroup.get('eDate')?.value, 'yyyy-MM-dd');
    this.rest.PostDownloadReportOrder(sDate!, eDate!).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {

        let data: any = event.body
        let ui8 = new Uint8Array(data)
        let blob1 = new Blob([new Uint8Array(ui8)], { type: 'file' })

        let file = document.createElement('a');
        file.type = 'download';
        file.href = URL.createObjectURL(blob1);
        file.download = "report order " + sDate + '-' + eDate + ".xlsx";
        file.click()
      }

    })
  }
}
