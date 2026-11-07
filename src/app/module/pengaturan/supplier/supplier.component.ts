import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { pairValue } from 'src/app/model/general';
import { Supplier } from 'src/app/model/supplier';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.css']
})
export class SupplierComponent implements OnInit {


  formGroup = new FormGroup({
    searh: new FormControl(''),
    value: new FormControl(''),

  })
  listSearch: pairValue[] = [
    {
      key: "Kode Supplier",
      value: "supplierCode",
    },
    {
      key: "Nama Supplier",
      value: "supplierName",
    },
    {
      key: "Alamat Supplier",
      value: "supplierAddress",
    },
    {
      key: "Kontak Supplier",
      value: "supplierContact",
    },
    {
      key: "Tanggal Pembuatan Supplier",
      value: "created_date",
    }
  ];
  displayedColumns = ['supplierCode', 'supplierName', 'supplierAddress', 'supplierContact', 'created_date', 'actn']
  dataTable: Supplier[] = [];
  dataSource = new MatTableDataSource(this.dataTable)
  @ViewChild(MatPaginator) paginator: MatPaginator | any;

  constructor(private restS: RestService, private matDialog: MatDialog, private router: Router) { }

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
  getData() {
    this.restS.getSupplierAll().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.dataTable = Object(event.body)['output_schema'];
        this.dataSource = new MatTableDataSource(this.dataTable);
        this.dataSource.paginator = this.paginator
      }
    })
  }
  tambah() {
    this.router.navigate(['/pengaturan/supplier/input-supplier'])
  }
  edit(id: string) {
    this.router.navigate(['/pengaturan/supplier', id])
  }
  delete(id: string) {
    const dialog = this.matDialog.open(DialogComponent,
      {
        width: '33%',
        data: {
          question: "Yakin akan menghapus Brand ?",
          yesStr: "Yes",
          noStr: "No",
        },
      }
    );
    dialog.afterClosed().subscribe(event => {
      if (event && event.data) {
        this.restS.delSupplier(id).subscribe(event => {
          if (event.type == HttpEventType.Response && event.ok && event.body) {
            this.getData()
            this.matDialog.open(DialogComponent,
              {
                width: '33%',
                data: {
                  question: "Berhasil menghapus Supplier",
                  yesStr: "Ok",
                },
              }
            );
          }
        })
      }
    })
  }
}
