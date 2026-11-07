import { DatePipe } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { MASTER_DATA_HEADER_CODE_MH_01 } from 'src/app/model/general';
import { Brand, Master } from 'src/app/model/master-data';
import { Stock, StockBeGet, StockBePost, StockDetail } from 'src/app/model/stock';
import { Supplier } from 'src/app/model/supplier';
import { ReadCsvService } from 'src/app/service/read-csv/read-csv.service';
import { RestService } from 'src/app/service/rest/rest.service';

@Component({
  selector: 'app-detail-stcok-barang',
  templateUrl: './detail-stcok-barang.component.html',
  styleUrls: ['./detail-stcok-barang.component.css']
})
export class DetailStcokBarangComponent {
  titel = "Input"
  displayedColumns = ['merk', 'deskripsi', 'stock', 'packingName', 'hargaBeli', 'supplier', 'actn']
  data: Stock = { dateTime: new Date(), deskripsi: '', detailStock: [{ packing: '', sellPrice: undefined, stock: undefined, totalPerPacking: 1 }], merk: '', supplier: '' }
  dataTable: Stock[] = [];
  dataSource = new MatTableDataSource(this.dataTable)
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;

  listForm = ['merk', 'deskripsi', 'dateTime', 'minimalStock', 'unit', 'hargaBeli', 'supplier', 'notes']
  listUnit: Master[] = [];
  listSupplier: Supplier[] = [];
  disabelBtn: boolean = false;

  formGroup = new FormGroup(
    {
      merkName: new FormControl(''),
      merk: new FormControl(this.data.merk, [Validators.required]),
      deskripsi: new FormControl(this.data.deskripsi, [Validators.required]),
      dateTime: new FormControl(this.data.dateTime, [Validators.required]),
      minimalStock: new FormControl(this.data.minimalStock),
      unit: new FormControl(this.data.unit),
      hargaBeli: new FormControl(this.data.hargaBeli, Validators.required),
      supplier: new FormControl(this.data.supplier, Validators.required),
      notes: new FormControl(this.data.notes),

    }
  )
  loading: boolean = false;
  listBrand: Brand[] = [];
  filterBrand: Observable<Brand[]> | undefined
  listProduct: StockBeGet[] = [];
  filterProduct: Observable<StockBeGet[]> | undefined
  id: string | undefined;
  inputMerk = new Subject();
  uploadCsv: boolean = false;
  uploadManual: boolean = false;

  constructor(private datepipe: DatePipe, private httpS: HttpClient, private readCsvS: ReadCsvService, private rest: RestService, private matDialog: MatDialog, private router: Router, private activeRoute: ActivatedRoute) {
    this.inputMerk.pipe(debounceTime(700), distinctUntilChanged())
      .subscribe((res: any) => {
        let merk: string = (<HTMLInputElement>res.target).value;
        if (merk.length > 1) {
          this.getProductByBrand(this.listBrand.find(f => f.brandName.toLowerCase() == merk.toLowerCase())?.brandCode!)
        }
      })

    this.getMasterData();
    this.getMaterBrand();
    this.getSuplier()
    this.filterBrand = this.formGroup.get('merkName')?.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBrand(value || '')),
    );
    this.filterProduct = this.formGroup.get('deskripsi')?.valueChanges.pipe(
      startWith(''),
      map(value => this._filterProduct(value || '')),
    );
    this.formGroup.get('deskripsi')?.valueChanges.subscribe(event => {
      let produk = this.listProduct.find(f => f.productDesc == event);
      this.data.detailStock = [];
      this.data.detailStock.push({ packing: '', sellPrice: undefined, stock: undefined, totalPerPacking: 1 })
      if (produk?.packing) {
        this.data.detailStock = [];
        this.data.detailStock.push({ packing: produk.packing, packingCode: produk.packingCode1, sellPrice: produk.sellPrice, stock: produk.stock, totalPerPacking: produk.totalPerPacking })
      }
      if (produk?.packing2) {
        this.data.detailStock.push({ packing: produk.packing2, packingCode: produk.packingCode2, sellPrice: produk.sellPrice2, stock: produk.stock2, totalPerPacking: produk.totalPerPacking2 })
      }
      if (produk?.packing3) {
        this.data.detailStock.push({ packing: produk.packing3, packingCode: produk.packingCode3, sellPrice: produk.sellPrice3, stock: produk.stock3, totalPerPacking: produk.totalPerPacking3 })
      }
      if (produk?.packing4) {
        this.data.detailStock.push({ packing: produk.packing4, packingCode: produk.packingCode4, sellPrice: produk.sellPrice4, stock: produk.stock4, totalPerPacking: produk.totalPerPacking4 })
      }
      this.formGroup.get('unit')?.setValue(produk?.packing);
      // this.data.detailStock.push
    })
    this.activeRoute.params.subscribe(event => {

      this.id = event['id']
      if (this.id) {
        this.titel = "Edit"
        this.formGroup.get('created_date')?.disable()
        this.getProductByProductCode(this.id)
      } else {
        this.titel = "Input"

      }
    })
    this.formGroup.get('unit')?.disable();
    this.formGroup.get('dateTime')?.disable();

  }
  getsupplierByCode(code: string) {
    return this.listSupplier.find(f => f.supplierCode == code);
  }
  private _filterBrand(value: string): Brand[] {
    const filterValue = value.toLowerCase();
    return this.listBrand.filter(option => option.brandName.toLowerCase().includes(filterValue));
  }
  private _filterProduct(value: string): StockBeGet[] {
    const filterValue = value.toLowerCase();
    return this.listProduct.filter(option => option.productDesc.toLowerCase().includes(filterValue));
  }
  setUnit(value: string, idx: number) {
    if (idx == 0)
      this.formGroup.get('unit')?.setValue(value);
  }
  setMinimalStock(value: number, idx: number) {
    // if (idx == 0)
    //   this.formGroup.get('minimalStock')?.setValue(value);
    if (idx == 0 && this.data.detailStock.length > 1) {
      for (let i = 1; i < this.data.detailStock.length; i++) {
        try {
          this.data.detailStock[i].stock = this.data.detailStock[i - 1].stock! / this.data.detailStock[i].totalPerPacking!
        } catch (error) {
        }

      }
    }
  }
  loadCsv(data: string) {

    this.dataTable = this.readCsvS.parseData(data)
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.uploadCsv = true;
    this.formGroup.disable()
  }
  btnAddDetail(idx: number) {
    try {
      if (idx == 0) {
        return this.data.detailStock[idx].stock! > 0 && this.data.detailStock[idx].packing && this.data.detailStock[idx].sellPrice! > 0;
      } else {
        return this.data.detailStock[idx].totalPerPacking! > 0 && this.data.detailStock[idx].packing && this.data.detailStock[idx].sellPrice! > 0 && this.data.detailStock.length <= 3;
      }
    } catch (error) {
      return false
    }
  }

  calStock(value: any, idx: number) {
    if (idx > 0 && this.data.detailStock[0].stock) {
      let data: string = (<HTMLInputElement>value.target).value;
      // let idx2: number = this.data.detailStock.length - 2;
      this.data.detailStock[idx].stock = this.data.detailStock[idx - 1].stock! / parseInt(data);
      // console.log(data, idx2, this.data.detailStock)
    }
  }

  addDetail() {
    this.data.detailStock.push({ packing: '', sellPrice: undefined, stock: undefined, totalPerPacking: undefined })
  }
  simpan() {

    let temp: any = this.data;
    this.listForm.forEach(element => {
      if (this.formGroup.get(element)?.value != null)
        temp[element] = this.formGroup.get(element)?.value!;
    })
    temp['merkName'] = this.formGroup.get('merkName')?.value
    this.dataTable.push(JSON.parse(JSON.stringify(temp)));
    this.data = { dateTime: new Date(), deskripsi: '', detailStock: [{ packing: '', sellPrice: undefined, stock: undefined, totalPerPacking: 1 }], merk: '' }
    this.formGroup.reset();
    this.formGroup.get('dateTime')?.setValue(new Date());
    this.dataSource = new MatTableDataSource(this.dataTable)
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.uploadManual = true;
    // this.formGroup.get('merkName')?.enable()
    // this.formGroup.get('deskripsi')?.ena;
  }
  uploadFile(event: any) {
    const file: File = event.target.files[0];
    var fileReader = new FileReader();
    this.loading = true;
    fileReader.onload = (e) => {
      let arrayBuffer = fileReader.result?.toString();
      this.loadCsv(atob(arrayBuffer!.split(',')[1]))
      this.loading = false
    };
    fileReader.onerror = (e) => {
      console.log(e)
      this.loading = false
    };
    fileReader.readAsDataURL(file);
  }

  getMasterData() {
    this.rest.getMasterDataByHeaderCode(MASTER_DATA_HEADER_CODE_MH_01).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listUnit = Object(event.body)['output_schema'];
      }
    })
  }
  getMaterBrand() {
    this.rest.getMasterDataBrand().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listBrand = Object(event.body)['output_schema'];

      }
    })
  }
  getProductByProductCode(code: string) {
    this.rest.getProductByProductId(code).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        let data: StockBeGet = Object(event.body)['data'];
        this.formGroup.get('merkName')?.setValue(data.productBrand);
        this.formGroup.get('merk')?.setValue(data.productBrandCode);
        this.formGroup.get('deskripsi')?.setValue(data.productDesc);
        this.formGroup.get('dateTime')?.setValue(new Date());
        this.formGroup.get('minimalStock')?.setValue(data.minStock);
        this.formGroup.get('unit')?.setValue(data.packing);
        this.formGroup.get('hargaBeli')?.setValue(data.basePrice);
        this.formGroup.get('supplier')?.setValue(data.supplierCode);
        this.formGroup.get('notes')?.setValue(data.notes);

        this.formGroup.get('merkName')?.disable();
        this.formGroup.get('deskripsi')?.disable()

        this.data.detailStock = [
          {
            packing: data.packing,
            sellPrice: data.sellPrice,
            stock: data.stock,
            totalPerPacking: data.totalPerPacking,
          }
        ]
        data.packing2 ? this.data.detailStock.push({
          packing: data.packing2,
          sellPrice: data.sellPrice2,
          stock: data.stock2,
          totalPerPacking: data.totalPerPacking2,
        }) : undefined;
        data.packing3 ? this.data.detailStock.push({
          packing: data.packing3,
          sellPrice: data.sellPrice3,
          stock: data.stock3,
          totalPerPacking: data.totalPerPacking3,
        }) : undefined;
        data.packing4 ? this.data.detailStock.push({
          packing: data.packing4,
          sellPrice: data.sellPrice4,
          stock: data.stock4,
          totalPerPacking: data.totalPerPacking4,
        }) : undefined;
      }


    })
  }
  getProductByBrand(brand: string) {
    this.formGroup.get('merk')?.setValue(brand);
    this.rest.getProductByBrand(brand).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listProduct = Object(event.body)['output_schema'];
      }
    })
  }
  getSuplier() {
    this.rest.getSupplierAll().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listSupplier = Object(event.body)['output_schema'];
      }
    })
  }
  kirim() {
    let data: StockBePost[] = [];
    this.dataTable.forEach(element => {
      data.push({
        productCode: this.id ? this.id : '',
        brand: element.merk,
        desc: element.deskripsi,
        entryDate: element.dateTime,
        packing: this.getIdUnit(this.getDetailItem(0, element.detailStock)?.packing ? this.getDetailItem(0, element.detailStock)?.packing : ''),
        totalPerPacking: this.getDetailItem(0, element.detailStock)?.totalPerPacking ? this.getDetailItem(0, element.detailStock)?.totalPerPacking : 0,
        stock: this.getDetailItem(0, element.detailStock)?.stock ? this.getDetailItem(0, element.detailStock)?.stock : 0,
        sellPrice: this.getDetailItem(0, element.detailStock)?.sellPrice ? this.getDetailItem(0, element.detailStock)?.sellPrice : 0,

        packing2: this.getIdUnit(this.getDetailItem(1, element.detailStock)?.packing ? this.getDetailItem(1, element.detailStock)?.packing : ''),
        totalPerPacking2: this.getDetailItem(1, element.detailStock)?.totalPerPacking ? this.getDetailItem(1, element.detailStock)?.totalPerPacking : 0,
        stock2: this.getDetailItem(1, element.detailStock)?.stock ? this.getDetailItem(1, element.detailStock)?.stock : 0,
        sellPrice2: this.getDetailItem(1, element.detailStock)?.sellPrice ? this.getDetailItem(1, element.detailStock)?.sellPrice : 0,

        packing3: this.getIdUnit(this.getDetailItem(2, element.detailStock)?.packing ? this.getDetailItem(2, element.detailStock)?.packing : ''),
        totalPerPacking3: this.getDetailItem(2, element.detailStock)?.totalPerPacking ? this.getDetailItem(2, element.detailStock)?.totalPerPacking : 0,
        stock3: this.getDetailItem(2, element.detailStock)?.stock ? this.getDetailItem(2, element.detailStock)?.stock : 0,
        sellPrice3: this.getDetailItem(2, element.detailStock)?.sellPrice ? this.getDetailItem(2, element.detailStock)?.sellPrice : 0,

        packing4: this.getIdUnit(this.getDetailItem(3, element.detailStock)?.packing ? this.getDetailItem(3, element.detailStock)?.packing : ''),
        totalPerPacking4: this.getDetailItem(3, element.detailStock)?.totalPerPacking ? this.getDetailItem(3, element.detailStock)?.totalPerPacking : 0,
        stock4: this.getDetailItem(3, element.detailStock)?.stock ? this.getDetailItem(3, element.detailStock)?.stock : 0,
        sellPrice4: this.getDetailItem(3, element.detailStock)?.sellPrice ? this.getDetailItem(3, element.detailStock)?.sellPrice : 0,

        basePrice: element.hargaBeli,
        minStock: element.minimalStock,
        supplier: element.supplier ? element.supplier : '',
        notes: element.notes
      })
    })

    this.disabelBtn = true;
    if (this.uploadCsv) {
      this.rest.postAddStockCsv(JSON.stringify(data)).subscribe(event => {
        if (event.type == HttpEventType.Response && event.body && event.ok) {
          this.disabelBtn = false;
          const dialog = this.matDialog.open(DialogComponent,
            {
              width: '33%',
              data: {
                question: "Berhasil menambahkan Stock Barang (csv)",
                yesStr: "Ok",

              },
            }
          );
          dialog.afterClosed().subscribe(event => {
            this.router.navigate(['stock'])
          })
        }
      });
    }
    else if (!this.uploadCsv && !this.id)
      this.rest.postAddStock(JSON.stringify(data)).subscribe(event => {
        if (event.type == HttpEventType.Response && event.body && event.ok) {
          this.disabelBtn = false;
          const dialog = this.matDialog.open(DialogComponent,
            {
              width: '33%',
              data: {
                question: "Berhasil menambahkan Stock Barang",
                yesStr: "Ok",

              },
            }
          );
          dialog.afterClosed().subscribe(event => {
            this.router.navigate(['stock'])
          })
        }
      });
    else {
      this.rest.putStock(JSON.stringify(data[0])).subscribe(event => {
        if (event.type == HttpEventType.Response && event.body && event.ok) {
          this.disabelBtn = false;
          const dialog = this.matDialog.open(DialogComponent,
            {
              width: '33%',
              data: {
                question: "Berhasil mengupdate Stock Barang",
                yesStr: "Ok",

              },
            }
          );
          dialog.afterClosed().subscribe(event => {
            this.router.navigate(['stock'])
          })
        }
      });
    }

  }
  getIdUnit(label?: string) {
    let unit = this.listUnit.find(f => f.master_detail_desc == label)?.master_detail_code;
    return unit ? unit : label;
  }
  getDetailItem(idx: number, detail: StockDetail[]) {
    if (detail.length < idx + 1)
      return undefined;
    return detail[idx]
  }
  btnSimpan() {
    if (this.id) {
      return this.dataTable.length > 0 ? false : true
    }
    return true
  }

  edit(merkId: string, desc: string) {
    let temp: any = this.dataTable.find(f => f.merk == merkId && f.deskripsi == desc);

    this.listForm.forEach(element => {
      this.formGroup.get(element)?.setValue(temp[element])
    })
    this.formGroup.get('merkName')?.setValue(temp['merkName'])

    this.data = { dateTime: new Date(), deskripsi: temp['deskripsi'], detailStock: temp['detailStock'], merk: temp['merk'] }
    this.formGroup.get('dateTime')?.setValue(new Date());
    this.delete(merkId, desc);
    this.formGroup.get('merkName')?.disable()
    this.formGroup.get('deskripsi')?.disable();

  }
  delete(merkId: string, desc: string) {
    let idx = this.dataTable.findIndex(f => f.merk == merkId && f.deskripsi == desc);
    console.log(merkId, desc, idx)
    this.dataTable.splice(idx, 1);
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator;
  }
}
