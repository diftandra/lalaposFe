import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ReportStock } from 'src/app/model/report';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-report-stock',
  templateUrl: './report-stock.component.html',
  styleUrls: ['./report-stock.component.css']
})
export class ReportStockComponent implements OnInit {
  displayedColumns = ['product_entry_date', 'product_code', 'brand_name', 'product_desc', 'stock', 'packing', 'sisa_stock', 'packing2', 'base_price', 'supplier_name', 'modal'];

  dataTable: ReportStock[] = [];
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
    this.rest.getReportViewStock(sDate, eDate, currentPage, pageSize, sortDir, sortCol).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        console.log(event.body);
        this.dataTable = Object(event.body)['data']['content'];
        this.dataSource = new MatTableDataSource(this.dataTable);
        this.length = Object(event.body)['data']['totalElements'];
      }
    })
  }
  downloadReport() {
    let sDate = this.datePipe.transform(this.formGroup.get('sDate')?.value, 'yyyy-MM-dd');
    let eDate = this.datePipe.transform(this.formGroup.get('eDate')?.value, 'yyyy-MM-dd');
    this.rest.PostDownloadReportStock(sDate!, eDate!).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {

        let data: any = event.body
        let ui8 = new Uint8Array(data)
        let blob1 = new Blob([new Uint8Array(ui8)], { type: 'file' })

        let file = document.createElement('a');
        file.type = 'download';
        file.href = URL.createObjectURL(blob1);
        file.download = "report stock " + sDate + '-' + eDate + ".xlsx";
        file.click()
      }

    })
  }
}
