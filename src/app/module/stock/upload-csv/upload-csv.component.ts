import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReadCsvService } from 'src/app/service/read-csv/read-csv.service';

@Component({
  selector: 'app-upload-csv',
  templateUrl: './upload-csv.component.html',
  styleUrls: ['./upload-csv.component.css']
})
export class UploadCsvComponent implements OnInit {

  constructor(private httpS: HttpClient, private readCsvS: ReadCsvService) { }

  ngOnInit(): void {
    // this.loadCsv()
  }

  loadCsv() {
    this.httpS.get('assets/test.csv', { responseType: 'text' }).subscribe(event => {

      this.readCsvS.parseData(event);
    })
  }
}
