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
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { pairValue } from 'src/app/model/general';
import { Order } from 'src/app/model/order';
import { Stock, StockBeGet } from 'src/app/model/stock';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-daftar-stcok-barang',
  templateUrl: './daftar-stcok-barang.component.html',
  styleUrls: ['./daftar-stcok-barang.component.css']
})
export class DaftarStcokBarangComponent implements OnInit, AfterViewInit {

  dataTable: StockBeGet[] = [];
  dataSource = new MatTableDataSource(this.dataTable);
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;
  displayedColumns = ['productEntryDate', 'productCode', 'productBrandCode', 'productDesc', 'stock', 'packing','sellPrice', 'notes', 'actn'];
  length: number = 0;
  formGroup = new FormGroup({
    search: new FormControl(''),
    value: new FormControl('')
  })
  pageE: PageEvent | undefined;
  sortE: Sort | undefined;

  listSearch: pairValue[] = [
    {
      key: 'Product Code',
      value: 'productCode'
    },
    {
      key: 'Product Brand',
      value: 'productBrand'
    },
    {
      key: 'Product Desc',
      value: 'productDesc'
    },
  ]
  mappingSearh: pairValue[] = [
    {
      key: "productCode",
      value: "product_code"
    },
    {
      key: 'productBrandCode',
      value: 'product_brand_code'
    },
    {
      key: 'productDesc',
      value: 'product_desc'
    },
    {
      key: 'packing',
      value: 'packing'
    },
    {
      key: 'productEntryDate',
      value: 'product_entry_date'
    },
    {
      key: 'stock',
      value: 'stock'
    },
  ]
  inputSearch = new Subject();

  constructor(private rest: RestService, private router: Router, private matDialog: MatDialog) {

  }
  ngAfterViewInit(): void {
    this.paginator?.page.subscribe((event: PageEvent) => {
      this.pageE = event;
      this.search(undefined)
    });
    this.sort?.sortChange.subscribe((event: Sort) => {
      this.sortE = event;
      let actv = this.mappingSearh.find(f => f.key == event.active)?.value;
      // this.getData('', '', '', this.pageE?.pageIndex, this.pageE?.pageSize, event.direction, actv ? actv : event.active);
      this.search(actv)
    });
    this.inputSearch.pipe(debounceTime(700), distinctUntilChanged()).subscribe(event => {
      this.search(undefined)
    })
  }
  search(actv:any) {
    switch (this.formGroup.get('search')?.value) {
      case 'productCode':
        this.getData(this.formGroup.get('value')?.value,undefined,undefined,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
        break;
      case 'productBrand':
        this.getData(undefined, this.formGroup.get('value')?.value,undefined,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
        break;
      case 'productDesc':
        this.getData(undefined, undefined, this.formGroup.get('value')?.value,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
        break;
        default:
          this.getData(undefined, undefined, undefined,this.pageE?.pageIndex, this.pageE?.pageSize, this.sortE?.direction, actv ? actv : this.sortE?.active);
    }

  }

  ngOnInit(): void {
    this.getData()
  }

  getData(productCode?: string, productBrand?: string, productDesc?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    this.rest.getListStockBarang(productCode, productBrand, productDesc, currentPage, pageSize, sortDir, sortCol).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        console.log(event.body)
        this.dataTable = Object(event.body)['data']['content'];
        this.length = Object(event.body)['data']['totalElements']
        this.dataSource = new MatTableDataSource(this.dataTable)

      }
    })
  }
  edit(id: string) {
    console.log(id)
    this.router.navigate(['/stock/', id])
  }
  delete(id: string) {
    this.rest.delStock(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Stock Berhasil di hapus",
              yesStr: "Yes",

            },
          }

        );
        dialog.afterClosed().subscribe(event => {
          this.getData();
        })
      }
    })

  }
}
