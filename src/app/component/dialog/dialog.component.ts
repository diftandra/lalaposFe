import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit {

  pertanyaan: string = "";
  yesStr: string = "";
  noStr: string = "";

  constructor(private dialog: MatDialogRef<DialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }
  yes() {
    this.dialog.close({ data: 'YES' });
  }

  no() {
    this.dialog.close({ data: undefined });
  }

}
