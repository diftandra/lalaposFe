import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { Profile } from 'src/app/model/profile';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {

  displayedColumns = ['user_id', 'username', 'full_name', 'is_active', 'actn']
  dataTable: Profile[] = [];
  dataSource = new MatTableDataSource(this.dataTable)
  @ViewChild(MatPaginator) paginator: MatPaginator | any;

  constructor(private restS: RestService, private matDialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.getData()
  }
  getData() {
    this.restS.getProfileAll().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.dataTable = Object(event.body)['output_schema'];
        this.dataSource = new MatTableDataSource(this.dataTable);
        this.dataSource.paginator = this.paginator
      }
    })
  }
  tambah() {
    this.router.navigate(['/pengaturan/profil/input-profil'])
  }
  edit(id: string) {
    this.router.navigate(['/pengaturan/profil', id])
  }
  delete(id: string) {
    const dialog = this.matDialog.open(DialogComponent,
      {
        width: '33%',
        data: {
          question: "Yakin akan menghapus Profile ?",
          yesStr: "Yes",
          noStr: "No",
        },
      }
    );
    dialog.afterClosed().subscribe(event => {
      if (event && event.data) {
        this.restS.delProfile(id).subscribe(event => {
          if (event.type == HttpEventType.Response && event.ok && event.body) {
            this.getData()
            this.matDialog.open(DialogComponent,
              {
                width: '33%',
                data: {
                  question: "Berhasil menghapus Profile",
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
