import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DialogPaymentComponent } from 'src/app/component/dialog-payment/dialog-payment.component';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { pairValue } from 'src/app/model/general';
import { Order, OrderBePost, OrderGetAll } from 'src/app/model/order';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-daftar-order',
  templateUrl: './daftar-order.component.html',
  styleUrls: ['./daftar-order.component.css']
})
export class DaftarOrderComponent implements OnInit, AfterViewInit {

  dataTable: OrderGetAll[] = [];
  dataSource = new MatTableDataSource(this.dataTable);
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;
  displayedColumns = ['salesHeaderCode', 'customerName', 'orderDate', 'grandTotal', 'actn']
  formGroup = new FormGroup({
    search: new FormControl(''),
    value: new FormControl(''),
    sDate: new FormControl(new Date()),
    eDate: new FormControl(new Date())
  })
  listSearch: pairValue[] = [
    {
      key: 'Kode Transaksi',
      value: 'salesHeaderCode'
    },
    {
      key: 'Nama Pembeli',
      value: 'customerName'
    }
  ];
  mappingSearh: pairValue[] = [
    {
      key: "salesHeaderCode",
      value: "sales_header_code"
    },
    {
      key: 'customerName',
      value: 'customer_name'
    },
    {
      key: 'orderDate',
      value: 'order_date'
    },
    {
      key: 'grandTotal',
      value: 'grand_total'
    }
  ]
  inputSearch = new Subject();
  pageE: PageEvent | undefined;
  sortE: Sort | undefined;
  total: number = 0;

  constructor(private rest: RestService, private router: Router, private matDialog: MatDialog, private datePipe: DatePipe) {

  }
  ngAfterViewInit(): void {
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;

    this.paginator?.page.subscribe((event: PageEvent) => {
      this.pageE = event;
      // this.getData('', '', undefined, event.pageIndex, event.pageSize)
      this.search(undefined)
    });
    this.sort?.sortChange.subscribe((event: Sort) => {
      this.sortE = event;
      let actv = this.mappingSearh.find(f => f.key == event.active)?.value;
      // this.getData('', '', undefined, this.pageE?.pageIndex, this.pageE?.pageSize, event.direction, actv ? actv : event.active);
      this.search(actv)
    });

    this.inputSearch.pipe(debounceTime(700), distinctUntilChanged()).subscribe(event => {
      this.search(undefined);
    })
  }

  search(actv:any) {
    console.log(this.formGroup.get('search')?.value)
    switch (this.formGroup.get('search')?.value) {

      case 'salesHeaderCode':
        this.getData(this.formGroup.get('value')?.value,undefined,undefined,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
        break;
      case 'customerName':
        this.getData(undefined, this.formGroup.get('value')?.value,undefined,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
        break;
      case 'grandTotal':
        this.getData(undefined, undefined, this.formGroup.get('value')?.value);
        break;
        default:
          this.getData(undefined,undefined,undefined,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
    }

  }

  ngOnInit(): void {
    this.getData()

  }
  public changeSelectedSearch(value: string) {
    if (value != '')
      this.dataSource.filterPredicate = function (
        data: any,
        filter: any
      ): boolean {
        if (!isNaN(data[value])) {
          let r = new RegExp(/^-?[0-9]\d*(\.\d+)?$/);
          if (r.test(filter)) return data[value] == parseInt(filter);
          return false;
        } else
          return data[value]!.toString().toLocaleLowerCase().includes(filter);
      };
  }
  public strSearch(event: Event) {
    if (event != undefined) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  getData(salesHeaderCode?: string, customerName?: string, grandTotal?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    this.rest.getAllSales(salesHeaderCode, customerName, grandTotal, currentPage, pageSize, sortDir, sortCol).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.dataTable = Object(event.body)['data']['content']
        this.dataSource = new MatTableDataSource(this.dataTable);
        this.total = Object(event.body)['data']['totalElements']
        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.sort;
      }
    })
  }
  dateChange() {
    let sDate = this.datePipe.transform(this.formGroup.get('sDate')?.value, 'yyyy-MM-dd')
    let eDate = this.datePipe.transform(this.formGroup.get('eDate')?.value, 'yyyy-MM-dd')
    this.getDataRangeDate(sDate!, eDate!);
  }
  getDataRangeDate(sDate?: string, eDate?: string) {
    if (sDate && eDate)
      this.rest.getSalesRangeDate(sDate, eDate).subscribe(event => {
        if (event.type == HttpEventType.Response && event.body && event.ok) {
          this.dataTable = Object(event.body)['output_schema']
          this.dataSource = new MatTableDataSource(this.dataTable);

        }
      })
  }
  reviewOrder(id: string) {
    this.router.navigate(['order/review-order/', id])
  }
  delete(id: string) {
    this.rest.delOrderHeader(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil hapus Order",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.getData();
        })
      }
    })
  }

  print(data: OrderGetAll) {
    let order: OrderBePost = {
      salesHeaderCode: data.salesHeaderCode,
      customerName: data.customerName,
      orderDate: this.datePipe.transform(data.orderDate, 'yyyy-MM-dd')!,
      orderDetail: [],
      grandTotal: data.grandTotal
    }

    const dialogPayment = this.matDialog.open(DialogPaymentComponent, {
      width: '33%',
      data: {
        total: data.grandTotal
      },
    });

    dialogPayment.afterClosed().subscribe(dp => {
      if (dp.pembayaran != undefined && dp.kembalian != undefined) {
        console.log(dp)
        order.change = dp.kembalian;
        order.payment = dp.pembayaran;

        this.rest.postPrintOrder(JSON.stringify(order)).subscribe(event => {
          if (event.type == HttpEventType.Response && event.ok && event.body) {
            const dialog = this.matDialog.open(DialogComponent,
              {
                width: '33%',
                data: {
                  question: "Berhasil Print Order",
                  yesStr: "Ok",

                },
              }
            );
            dialog.afterClosed().subscribe(event => {

            })

          }
        }, error => {

        })
      } else
        undefined
      // this.disabelBtn = false
    })
  }
}
