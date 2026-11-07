import { HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { pairValue } from 'src/app/model/general';
import { Brand } from 'src/app/model/master-data';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-merek',
  templateUrl: './merek.component.html',
  styleUrls: ['./merek.component.css']
})
export class MerekComponent implements OnInit, AfterViewInit {

  formGroup = new FormGroup({
    searh: new FormControl(''),
    value: new FormControl(''),

  })
  listSearch: pairValue[] = [
    {
      key: "Kode Merk",
      value: "brandCode",
    },
    {
      key: "Nama Merk",
      value: "brandName",
    },
    {
      key: "Tanggal Pembuatan Merk",
      value: "created_date",
    },
    {
      key: "Status",
      value: "isActive",
    },
  ];

  displayedColumns = ['brandCode', 'brandName', 'created_date', 'isActive', 'actn']
  dataTable: Brand[] = [];
  dataSource = new MatTableDataSource(this.dataTable)
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;
  constructor(private restS: RestService, private matDialog: MatDialog, private router: Router) {
    this.getMaterBrand()
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit(): void {

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

  getMaterBrand() {
    this.restS.getMasterDataBrand().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.dataTable = Object(event.body)['output_schema'];
        this.dataSource = new MatTableDataSource(this.dataTable);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    })
  }

  tambah() {
    this.router.navigate(['/pengaturan/merk/input-merk'])
  }
  edit(id: string) {
    this.router.navigate(['/pengaturan/merk', id])
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
        this.restS.delBrand(id).subscribe(event => {
          if (event.type == HttpEventType.Response && event.ok && event.body) {
            this.getMaterBrand()
            this.matDialog.open(DialogComponent,
              {
                width: '33%',
                data: {
                  question: "Berhasil menghapus Brand",
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
