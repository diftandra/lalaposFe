import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { stockD, stockH } from 'src/app/model/stock';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-review-order',
  templateUrl: './review-order.component.html',
  styleUrls: ['./review-order.component.css']
})
export class ReviewOrderComponent implements OnInit {

  header: stockH = { customer_name: '', order_date: '', sales_header_code: '', total: 0 }
  dataTable: stockD[] = [];
  dataSource = new MatTableDataSource(this.dataTable);
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;
  displayedColumns = ['product_code', 'product_brand_code', 'product_desc', 'product_amount', 'unit_amount', 'discount', 'total', 'actn']
  id = ""
  constructor(private rest: RestService, private router: Router, private matDialog: MatDialog, private datePipe: DatePipe, private activeRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe(event => {
      this.id = event['id'];
      if (event['id'])
        this.getData(event['id'])
    })
  }
  getData(id: string) {
    this.rest.getSalesHeader(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        this.header = Object(event.body)['output_schema'];
      }
    });
    this.rest.getSalesDetail(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        this.dataTable = Object(event.body)['output_schema'];
        this.dataSource = new MatTableDataSource(this.dataTable);
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort;
      }
    });

  }
  edit(id: string, pid: string) {
    this.router.navigate(['order/edit-order/', id, pid])
  }
  delete(idH: string, idD: string) {
    this.rest.delOrderDetail(idH, idD).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil hapus detail order",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.getData(this.id);
        })
      }
    })
  }
}
