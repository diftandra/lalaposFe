import { DatePipe } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
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
import { BarcodeLabel, BarcodeService, BARCODE_MAX_LENGTH } from 'src/app/services/barcode.service';
import { LabelPrintDialogComponent } from '../label-print-dialog/label-print-dialog.component';

@Component({
  selector: 'app-detail-stcok-barang',
  templateUrl: './detail-stcok-barang.component.html',
  styleUrls: ['./detail-stcok-barang.component.css']
})
export class DetailStcokBarangComponent implements AfterViewInit {
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
  // Barcode scanner (keyboard wedge: types the code + Enter).
  readonly barcodeMaxLength = BARCODE_MAX_LENGTH;
  scanCode = new FormControl('');
  scanMessage: { type: 'success' | 'info' | 'error', text: string } | undefined;
  scanLoading: boolean = false;
  generatingIdx: number | undefined;
  /** Unknown barcode scanned before the product is chosen; re-applied when the packing rows are rebuilt. */
  private pendingBarcode: string | undefined;
  @ViewChild('scanInput') scanInput: ElementRef<HTMLInputElement> | undefined;

  constructor(private datepipe: DatePipe, private httpS: HttpClient, private readCsvS: ReadCsvService, private rest: RestService, private matDialog: MatDialog, private router: Router, private activeRoute: ActivatedRoute, private barcode: BarcodeService) {
    this.inputMerk.pipe(debounceTime(700), distinctUntilChanged())
      .subscribe((res: any) => {
        let merk: string = (<HTMLInputElement>res.target).value;
        if (merk.length > 1) {
          this.getProductByBrand(this.listBrand.find(f => (f.brandName ?? '').toLowerCase() == (merk ?? '').toString().toLowerCase())?.brandCode!)
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
      this.data.detailStock = this.toDetailStock(produk);
      this.applyPendingBarcode();
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
  ngAfterViewInit(): void {
    setTimeout(() => this.scanInput?.nativeElement.focus());
  }
  /** Packing rows (with barcodes) of an existing product; one empty row when there is none. */
  private toDetailStock(p?: StockBeGet): StockDetail[] {
    if (!p?.packing) {
      return [{ packing: '', sellPrice: undefined, stock: undefined, totalPerPacking: 1 }];
    }
    const rows: StockDetail[] = [{ packing: p.packing, packingCode: p.packingCode1, sellPrice: p.sellPrice, stock: p.stock, totalPerPacking: p.totalPerPacking, barcode: p.barcode }];
    if (p.packing2) {
      rows.push({ packing: p.packing2, packingCode: p.packingCode2, sellPrice: p.sellPrice2, stock: p.stock2, totalPerPacking: p.totalPerPacking2, barcode: p.barcode2 });
    }
    if (p.packing3) {
      rows.push({ packing: p.packing3, packingCode: p.packingCode3, sellPrice: p.sellPrice3, stock: p.stock3, totalPerPacking: p.totalPerPacking3, barcode: p.barcode3 });
    }
    if (p.packing4) {
      rows.push({ packing: p.packing4, packingCode: p.packingCode4, sellPrice: p.sellPrice4, stock: p.stock4, totalPerPacking: p.totalPerPacking4, barcode: p.barcode4 });
    }
    return rows;
  }
  /** Puts a scanned-but-unknown barcode on the first packing row that has none. */
  private applyPendingBarcode() {
    const code = this.pendingBarcode;
    if (!code || this.data.detailStock.some(d => d.barcode == code)) {
      return;
    }
    const row = this.data.detailStock.find(d => !d.barcode) || this.data.detailStock[0];
    row.barcode = code;
  }
  onScan(event?: Event) {
    event?.preventDefault();
    const code = this.barcode.normalize(this.scanCode.value);
    this.scanCode.setValue('');
    if (!code || this.scanLoading || this.uploadCsv) {
      return;
    }
    if (code.length > BARCODE_MAX_LENGTH) {
      this.scanFeedback('error', 'Barcode lebih dari ' + BARCODE_MAX_LENGTH + ' karakter.');
      return;
    }
    const onRow = this.data.detailStock.findIndex(d => d.barcode == code);
    if (onRow >= 0) {
      this.scanFeedback('info', 'Barcode ' + code + ' sudah ada di packing ' + (this.data.detailStock[onRow].packing || 'baris ' + (onRow + 1)) + '.');
      return;
    }
    this.scanLoading = true;
    this.rest.getProductByBarcode(code).subscribe(event => {
      if (event.type == HttpEventType.Response) {
        this.scanLoading = false;
        const p: StockBeGet | null = event.ok && event.body ? Object(event.body)['output_schema'] : null;
        p ? this.scannedKnown(code, p) : this.scannedUnknown(code);
        this.scanInput?.nativeElement.focus();
      }
    }, error => {
      this.scanLoading = false;
      this.scanFeedback('error', 'Gagal mencari barcode ' + code + '. Cek koneksi ke server.');
    });
  }
  private scanFeedback(type: 'success' | 'info' | 'error', text: string) {
    this.scanMessage = { type, text };
    this.barcode.beep(type != 'error');
  }
  /** Barcode belongs to a product: open that product for restock (input mode). */
  private scannedKnown(code: string, p: StockBeGet) {
    const level = p.matchedLevel || 1;
    const packing = (p as any)['packing' + (level == 1 ? '' : level)];
    const name = ((p.productBrand || '') + ' ' + (p.productDesc || '')).trim();
    if (this.id) {
      if (p.productCode == this.id) {
        this.scanFeedback('info', 'Barcode ' + code + ' sudah terdaftar di produk ini (' + packing + ').');
      } else {
        this.scanFeedback('error', 'Barcode ' + code + ' sudah dipakai produk lain: ' + name + ' (' + packing + ').');
      }
      return;
    }
    if (this.formGroup.get('deskripsi')?.disabled) {
      this.scanFeedback('error', 'Barcode ' + code + ' milik ' + name + '. Simpan atau kosongkan form ini dulu.');
      return;
    }
    if (this.dataTable.some(f => f.merk == p.productBrandCode && f.deskripsi == p.productDesc)) {
      this.scanFeedback('info', name + ' sudah ada di daftar. Pakai menu Edit pada baris itu.');
      return;
    }
    this.pendingBarcode = undefined;
    this.formGroup.get('merkName')?.setValue(p.productBrand);
    this.formGroup.get('merk')?.setValue(p.productBrandCode);
    this.rest.getProductByBrand(p.productBrandCode).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listProduct = Object(event.body)['output_schema'];
        // Triggers the deskripsi handler, which fills the packing rows.
        this.formGroup.get('deskripsi')?.setValue(p.productDesc);
        this.scanFeedback('success', 'Produk ditemukan: ' + name + ' (' + packing + '). Ubah stok, lalu Simpan.');
      }
    });
  }
  /** New barcode: attach it to the first packing row without a barcode. */
  private scannedUnknown(code: string) {
    this.pendingBarcode = code;
    this.applyPendingBarcode();
    const row = this.data.detailStock.find(d => d.barcode == code);
    this.scanFeedback('success', 'Barcode baru ' + code + ' dipasang di packing ' + (row?.packing || 'baris pertama')
      + '. Lengkapi data produk (pindahkan ke packing lain bila perlu).');
  }
  /** Asks the backend for a new internal EAN-13 barcode for one packing row. */
  generateBarcode(idx: number) {
    this.generatingIdx = idx;
    this.rest.generateBarcode().subscribe(event => {
      if (event.type == HttpEventType.Response) {
        this.generatingIdx = undefined;
        if (event.ok && event.body) {
          this.data.detailStock[idx].barcode = Object(event.body)['output_schema'];
        }
      }
    }, error => this.generatingIdx = undefined);
  }
  /** Keeps a scan into a packing-row barcode field from doing anything else on Enter. */
  rowBarcodeChanged() {
    // The user edits barcodes by hand now; stop re-applying the scanned one.
    this.pendingBarcode = undefined;
  }
  rowBarcodeEnter(event: Event, idx: number) {
    event.preventDefault();
    this.data.detailStock[idx].barcode = this.barcode.normalize(this.data.detailStock[idx].barcode);
  }
  /** Same barcode typed on another packing row of this product. */
  isDuplicateBarcode(idx: number): boolean {
    const code = this.barcode.normalize(this.data.detailStock[idx]?.barcode);
    return !!code && this.data.detailStock.some((d, i) => i != idx && this.barcode.normalize(d.barcode) == code);
  }
  hasDuplicateBarcode(): boolean {
    return this.data.detailStock.some((d, i) => this.isDuplicateBarcode(i));
  }
  /** Barcode for the request: undefined keeps the stored one (CSV, old data), '' clears it. */
  private barcodeOf(idx: number, detail: StockDetail[]): string | undefined {
    const b = this.getDetailItem(idx, detail)?.barcode;
    return b == null ? undefined : this.barcode.normalize(b);
  }
  /** Labels for the saved items that have a barcode. */
  private labelsOf(items: Stock[]): BarcodeLabel[] {
    const labels: BarcodeLabel[] = [];
    items.forEach(item => item.detailStock.forEach(d => {
      const code = this.barcode.normalize(d.barcode);
      if (code) {
        labels.push({ name: ((item.merkName || '') + ' ' + (item.deskripsi || '')).trim(), packing: d.packing || '', price: Number(d.sellPrice || 0), barcode: code, copies: 1 });
      }
    }));
    return labels;
  }
  /** Success dialog; offers label printing when the saved items have barcodes. */
  private saved(message: string, items: Stock[]) {
    const labels = this.labelsOf(items);
    const dialog = this.matDialog.open(DialogComponent, {
      width: '33%',
      data: labels.length
        ? { question: message + "\n\nCetak label barcode sekarang?", yesStr: "Cetak Label", noStr: "Selesai" }
        : { question: message, yesStr: "Ok" },
    });
    dialog.afterClosed().subscribe(result => {
      if (labels.length && result?.data == 'YES') {
        this.matDialog.open(LabelPrintDialogComponent, { width: '640px', data: { labels } })
          .afterClosed().subscribe(() => this.router.navigate(['stock']));
      } else {
        this.router.navigate(['stock']);
      }
    });
  }
  getsupplierByCode(code: string) {
    return this.listSupplier.find(f => f.supplierCode == code);
  }
  private _filterBrand(value: string): Brand[] {
    const filterValue = (value ?? '').toString().toLowerCase();
    return this.listBrand.filter(option => (option.brandName ?? '').toLowerCase().includes(filterValue));
  }
  private _filterProduct(value: string): StockBeGet[] {
    const filterValue = (value ?? '').toString().toLowerCase();
    return this.listProduct.filter(option => (option.productDesc ?? '').toLowerCase().includes(filterValue));
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
    this.pendingBarcode = undefined;
    this.scanMessage = undefined;
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

        this.data.detailStock = this.toDetailStock(data);
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

        barcode: this.barcodeOf(0, element.detailStock),
        barcode2: this.barcodeOf(1, element.detailStock),
        barcode3: this.barcodeOf(2, element.detailStock),
        barcode4: this.barcodeOf(3, element.detailStock),

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
      }, error => this.disabelBtn = false);
    }
    else if (!this.uploadCsv && !this.id)
      this.rest.postAddStock(JSON.stringify(data)).subscribe(event => {
        if (event.type == HttpEventType.Response && event.body && event.ok) {
          this.disabelBtn = false;
          this.saved("Berhasil menambahkan Stock Barang", this.dataTable);
        }
      }, error => this.disabelBtn = false);
    else {
      this.rest.putStock(JSON.stringify(data[0])).subscribe(event => {
        if (event.type == HttpEventType.Response && event.body && event.ok) {
          this.disabelBtn = false;
          this.saved("Berhasil mengupdate Stock Barang", this.dataTable);
        }
      }, error => this.disabelBtn = false);
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
