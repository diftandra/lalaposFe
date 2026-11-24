import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject } from 'rxjs';
import { MASTER_DATA_HEADER_CODE_MH_01 } from 'src/app/model/general';
import { Brand, Master } from 'src/app/model/master-data';
import { Order, OrderBePost, OrderDetailBe } from 'src/app/model/order';
import { RestService } from 'src/app/service/rest/rest.service';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { StockBeGet, stockD, StockDetail, stockH } from 'src/app/model/stock';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogComponent } from 'src/app/component/dialog/dialog.component';
import { DialogPaymentComponent } from 'src/app/component/dialog-payment/dialog-payment.component';
import { MatSort } from '@angular/material/sort';
import { QzTrayService, SalesReceipt } from 'src/app/services/qz-tray.service';
import { BarcodeService } from 'src/app/services/barcode.service';

const HELD_ORDERS_KEY = 'lalapos_held_orders_v1';
const DEFAULT_CUSTOMER = 'Umum';

export interface HeldOrder {
  id: string;
  customerName: string;
  heldAt: string;
  items: Order[];
  grandTotal: number;
}

@Component({
  selector: 'app-detail-order',
  templateUrl: './detail-order.component.html',
  styleUrls: ['./detail-order.component.css']
})
export class DetailOrderComponent implements OnInit, AfterViewInit {

  displayedColumns = ['idx', 'product_brand_code', 'product_code', 'product_desc', 'product_qty', 'unit_amount', 'discount', 'sub_total', 'actn']
  dataTable: Order[] = [];
  dataSource = new MatTableDataSource(this.dataTable)
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;
  listForm: string[] = [
    "customer_name",
    "product_code",
    "product_brand_code",
    "product_desc",
    "product_entry_date",
    "product_amount",
    "product_qty",
    "product_unit",
    "discount",

  ]
  formGroup = new FormGroup({
    merkName: new FormControl(''),
    customer_name: new FormControl(DEFAULT_CUSTOMER, Validators.required),
    product_code: new FormControl('', Validators.required),
    product_brand_code: new FormControl('', Validators.required),
    product_desc: new FormControl('', Validators.required),
    product_entry_date: new FormControl(new Date),
    product_amount: new FormControl(undefined, Validators.required),
    product_qty: new FormControl(undefined, Validators.required),
    product_unit: new FormControl(undefined, Validators.required),
    discount: new FormControl(0),
    harga_satuan: new FormControl(undefined),
    salesDetailCode: new FormControl(undefined)
  })

  disabelBtn: boolean = false;

  inputProductCode = new Subject<any>();
  loadingDetail: boolean = false;
  listUnit: StockDetail[] = [];
  listProduct: StockBeGet[] = []  
  listBrand: Brand[] = [];
  filterBrand: Observable<Brand[]> | undefined;
  filterProduct: StockBeGet[] = [];
  disableBtn: boolean = false;
  id: string = '';
  inputMerk = new Subject();
  inputDesc = new Subject();
  // Barcode scanner (HPRT N130 in USB keyboard mode types the code + Enter).
  // Kept outside formGroup so it never affects the form's validity.
  scanCode = new FormControl('');
  scanMessage: { type: 'success' | 'warning' | 'error', text: string } | undefined;
  lastScanned: Order | undefined;
  heldOrders: HeldOrder[] = [];
  showHeldOrders: boolean = true;
  @ViewChild('scanInput') scanInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('customerInput') customerInput: ElementRef<HTMLInputElement> | undefined;
  // Scans are processed one after another so two quick scans of the same
  // item both count and never create two cart lines.
  private scanQueue: Promise<void> = Promise.resolve();
  constructor(private datePipe: DatePipe, private restS: RestService, private matDialog: MatDialog, private router: Router, private activeRouter: ActivatedRoute, private qzTray: QzTrayService, private barcode: BarcodeService) {
    this.getMaterBrand();
    this.inputMerk.pipe(debounceTime(700), distinctUntilChanged())
      .subscribe((res: any) => {
        let merk: string = (<HTMLInputElement>res.target).value;
        if (merk.length > 1) {
          this.formGroup.get('product_desc')?.reset();
          this.formGroup.get('product_desc')?.setValue(undefined);
          this.filterProduct = [];
          this.getProductByBrand(this.listBrand.find(f => (f.brandName ?? '').toLowerCase() == (merk ?? '').toString().toLowerCase())?.brandCode!)
        }
      })
  }
  ngOnInit(): void {
    this.activeRouter.params.subscribe(event => {
      this.id = event['id'];

      if (this.id && event['pid']) {
        this.getdataEdit(this.id, event['pid'])
      }
    })
    this.filterBrand = this.formGroup.get('merkName')?.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBrand(value || '')),
    );
    
     this.formGroup.get('product_desc')?.valueChanges.subscribe(event => {
      {this.filterProduct= this._filterProduct(event || '')}
     }) ;
    
    this.formGroup.get('product_entry_date')?.disable();
    this.formGroup.get('product_code')?.disable()
    this.formGroup.get('harga_satuan')?.disable();
    this.formGroup.get('product_qty')?.disable();
    this.formGroup.get('product_amount')?.disable();
    this.heldOrders = this.loadHeldOrders();
    
  }

  @HostListener('window:keydown', ['$event'])
  handleShortcuts(event: KeyboardEvent) {
    if (this.id || this.matDialog.openDialogs.length > 0) {
      return;
    }
    if (event.key === 'F2') {
      event.preventDefault();
      this.focusScan();
    } else if (event.key === 'F8') {
      if (this.dataTable.length > 0) {
        event.preventDefault();
        this.holdOrder();
      }
    } else if (event.key === 'F9') {
      if (this.dataTable.length > 0 && !this.disabelBtn) {
        event.preventDefault();
        this.kirim();
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusScan());
  }
  focusScan() {
    if (!this.id) {
      this.scanInput?.nativeElement.focus();
    }
  }
  /** Enter in Nama Pembeli jumps to the scan field so the next scan lands there. */
  customerEnter(event: Event) {
    event.preventDefault();
    this.focusScan();
  }
  onScan(event?: Event) {
    if (event instanceof KeyboardEvent && event.isComposing) {
      return;
    }
    event?.preventDefault();
    const raw = this.barcode.normalize(this.scanCode.value);
    if (!raw) {
      this.scanCode.setValue('');
      return;
    }
    // Optional multiplier prefix: e.g. "12*2000000000183" adds +12 in one scan.
    let qty = 1;
    let code = raw;
    const multMatch = raw.match(/^(\d+)\*(.*)$/);
    if (multMatch) {
      qty = parseInt(multMatch[1], 10);
      code = this.barcode.normalize(multMatch[2]);
      if (!code) {
        this.scanFeedback('warning', 'Jumlah x' + qty + ' siap. Arahkan scanner ke barcode barang.');
        return;
      }
      if (!Number.isFinite(qty) || qty < 1) {
        this.scanCode.setValue('');
        this.scanFeedback('error', 'Jumlah scan minimal 1.');
        return;
      }
    }
    this.scanCode.setValue('');
    this.scanQueue = this.scanQueue.then(() => this.addScanned(code, qty)).catch(() => undefined);
  }
  private scanFeedback(type: 'success' | 'warning' | 'error', text: string) {
    this.scanMessage = { type, text };
    this.barcode.beep(type != 'error');
  }
  private lookupBarcode(code: string): Promise<StockBeGet | null> {
    return new Promise((resolve, reject) => {
      this.restS.getProductByBarcode(code).subscribe(event => {
        if (event.type == HttpEventType.Response) {
          resolve(event.ok && event.body ? Object(event.body)['output_schema'] : null);
        }
      }, error => reject(error));
    });
  }
  /** Adds qty units of the scanned product/packing to the cart (or +qty when already there). */
  private async addScanned(code: string, qty: number = 1) {
    const rawCustomer = this.formGroup.getRawValue().customer_name;
    const customer = (rawCustomer && rawCustomer.toString().trim()) ? rawCustomer.toString().trim() : DEFAULT_CUSTOMER;
    if (!rawCustomer || !rawCustomer.toString().trim()) {
      this.formGroup.get('customer_name')?.setValue(customer);
    }
    this.loadingDetail = true;
    let p: StockBeGet | null;
    try {
      p = await this.lookupBarcode(code);
    } catch (e) {
      this.scanFeedback('error', 'Gagal mencari barcode ' + code + '. Cek koneksi ke server.');
      return;
    } finally {
      this.loadingDetail = false;
      this.focusScan();
    }
    if (!p) {
      this.scanFeedback('error', 'Barcode ' + code + ' tidak dikenal. Daftarkan dulu di Input Stok.');
      return;
    }
    const level = p.matchedLevel || 1;
    const suffix = level == 1 ? '' : level.toString();
    const pa: any = p;
    const packing: string = pa['packing' + suffix];
    const packingCode: string = pa['packingCode' + level];
    const price = Number(pa['sellPrice' + suffix] || 0);
    const stock = Number(pa['stock' + suffix] || 0);
    const line = this.dataTable.find(f => f.product_code == p!.productCode && f.product_unit == packingCode);
    const inCart = line ? Number(line.product_amount) : 0;
    const name = ((p.productBrand || '') + ' ' + (p.productDesc || '')).trim();
    if (stock - inCart < qty) {
      this.scanFeedback('error', 'Stok ' + name + ' (' + packing + ') tidak cukup. Sisa ' + Math.max(0, stock - inCart) + ' (diminta +' + qty + ').');
      return;
    }
    if (line) {
      line.product_amount = inCart + qty;
      line.max_stock = stock;
      line.product_qty = stock - line.product_amount;
      line.sub_total = Number(line.product_sell_price) * line.product_amount - Number(line.discount || 0);
      this.lastScanned = line;
    } else {
      const temp: any = {
        customer_name: customer,
        product_code: p.productCode,
        product_brand_code: p.productBrandCode,
        product_desc: p.productDesc,
        product_entry_date: this.formGroup.get('product_entry_date')?.value || new Date(),
        product_amount: qty,
        product_qty: stock - qty,
        max_stock: stock,
        product_unit: packingCode,
        discount: 0,
        unit_amount: packing,
        merkName: p.productBrand,
        productDesc: p.productDesc,
        product_sell_price: price,
        sub_total: price * qty,
        salesDetailCode: undefined,
        idx: this.dataTable.length + 1,
      };
      this.dataTable.push(temp);
      this.lastScanned = temp;
    }
    this.refreshTable();
    const amount = Number(this.lastScanned?.product_amount);
    const left = stock - amount;
    const addedLabel = qty > 1 ? ' (+' + qty + ' → x' + amount + ')' : ' x' + amount;
    if (left <= 0) {
      this.scanFeedback('warning', name + ' (' + packing + ')' + addedLabel + '. Stok habis setelah order ini.');
    } else {
      this.scanFeedback('success', name + ' (' + packing + ')' + addedLabel + ' · Rp ' + price.toLocaleString('id-ID') + ' · sisa stok ' + left);
    }
  }
  /** Parks the current cart in localStorage so cashier can serve the next buyer. */
  holdOrder() {
    if (this.id || this.dataTable.length === 0) {
      return;
    }
    const rawCustomer = this.formGroup.getRawValue().customer_name;
    const customerName = (rawCustomer && rawCustomer.toString().trim()) ? rawCustomer.toString().trim() : DEFAULT_CUSTOMER;
    const snapshot: HeldOrder = {
      id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      customerName,
      heldAt: new Date().toISOString(),
      items: this.dataTable.map(item => ({ ...item, customer_name: customerName })),
      grandTotal: this.getGrandTotal()
    };
    this.heldOrders = [snapshot, ...this.heldOrders];
    this.saveHeldOrders();
    this.showHeldOrders = true;

    this.dataTable = [];
    this.lastScanned = undefined;
    this.refreshTable();
    this.formGroup.get('customer_name')?.enable();
    this.formGroup.get('customer_name')?.setValue(DEFAULT_CUSTOMER);
    this.scanFeedback('warning', 'Bon ' + customerName + ' ditahan. Siap melayani pembeli berikutnya.');
    this.focusScan();
  }
  /** Restores a held cart. If current cart has items, parks it first so nothing is lost. */
  resumeHeldOrder(held: HeldOrder) {
    if (this.id) {
      return;
    }
    const remaining = this.heldOrders.filter(h => h.id !== held.id);
    if (this.dataTable.length > 0) {
      const rawCustomer = this.formGroup.getRawValue().customer_name;
      const currentName = (rawCustomer && rawCustomer.toString().trim()) ? rawCustomer.toString().trim() : DEFAULT_CUSTOMER;
      remaining.unshift({
        id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        customerName: currentName,
        heldAt: new Date().toISOString(),
        items: this.dataTable.map(item => ({ ...item, customer_name: currentName })),
        grandTotal: this.getGrandTotal()
      });
    }
    this.heldOrders = remaining;
    this.saveHeldOrders();

    this.dataTable = held.items.map((item, idx) => ({ ...item, idx: idx + 1 }));
    this.lastScanned = undefined;
    this.formGroup.get('customer_name')?.enable();
    this.formGroup.get('customer_name')?.setValue(held.customerName || DEFAULT_CUSTOMER);
    this.refreshTable();
    this.scanMessage = { type: 'success', text: 'Melanjutkan bon ' + held.customerName + ' (' + held.items.length + ' item).' };
    this.focusScan();
  }
  removeHeldOrder(heldId: string) {
    this.heldOrders = this.heldOrders.filter(h => h.id !== heldId);
    this.saveHeldOrders();
  }
  private loadHeldOrders(): HeldOrder[] {
    try {
      const raw = localStorage.getItem(HELD_ORDERS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  private saveHeldOrders() {
    try {
      localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(this.heldOrders));
    } catch {
      // Ignore storage quota errors
    }
  }
  /** Adjusts a cart row's quantity by delta (-1 / +1) with stock validation. */
  stepQty(row: Order, delta: number) {
    const current = Number(row.product_amount) || 0;
    const next = current + delta;
    this.applyRowQty(row, next, true);
  }
  /** Commits a typed quantity from the inline cart input. */
  commitRowQty(row: Order, input: HTMLInputElement, refocusScan: boolean) {
    const raw = (input.value ?? '').trim();
    const parsed = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
    const ok = this.applyRowQty(row, parsed, refocusScan);
    if (!ok) {
      input.value = String(row.product_amount);
    }
  }
  onQtyEnter(event: Event, row: Order, input: HTMLInputElement) {
    if (event instanceof KeyboardEvent && event.isComposing) {
      return;
    }
    event.preventDefault();
    this.commitRowQty(row, input, true);
  }
  private applyRowQty(row: Order, nextQty: number, refocusScan: boolean): boolean {
    const name = ((row.merkName || '') + ' ' + (row.product_desc || '')).trim();
    const packing = row.unit_amount || '';
    if (!Number.isFinite(nextQty) || nextQty < 1) {
      this.scanFeedback('error', 'Jumlah ' + name + ' minimal 1.');
      return false;
    }
    if (row.max_stock != null && nextQty > row.max_stock) {
      this.scanFeedback('error', 'Stok ' + name + ' (' + packing + ') tidak cukup. Tersedia ' + row.max_stock + '.');
      return false;
    }
    if (nextQty === Number(row.product_amount)) {
      if (refocusScan) {
        this.focusScan();
      }
      return true;
    }
    row.product_amount = nextQty;
    if (row.max_stock != null) {
      row.product_qty = row.max_stock - nextQty;
    }
    row.sub_total = Number(row.product_sell_price) * nextQty - Number(row.discount || 0);
    this.lastScanned = row;
    if (row.max_stock != null) {
      const left = row.max_stock - nextQty;
      if (left <= 0) {
        this.scanFeedback('warning', name + ' (' + packing + ') x' + nextQty + '. Stok habis setelah order ini.');
      } else {
        this.scanMessage = { type: 'success', text: name + ' (' + packing + ') x' + nextQty + ' · sisa stok ' + left };
      }
    }
    if (refocusScan) {
      this.focusScan();
    }
    return true;
  }
  /** Line numbers 1..n after a line is removed. */
  private renumber() {
    this.dataTable.forEach((row, i) => row.idx = i + 1);
  }
  private refreshTable() {
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  private _filterBrand(value: string): Brand[] {
    const filterValue = (value ?? '').toString().toLowerCase();
    return this.listBrand.filter(option => (option.brandName ?? '').toLowerCase().includes(filterValue));
  }
  private _filterProduct(value: string): StockBeGet[] {
    console.log(1)
    const filterValue = (value ?? '').toString().toLowerCase();
    return JSON.parse(JSON.stringify(this.listProduct.filter(option => (option.productDesc ?? '').toLowerCase().includes(filterValue)))) ;
  }
  getdataEdit(id: string, pid: string) {
    this.restS.getSalesHeader(id).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        let header: stockH = Object(event.body)['output_schema'];


        this.restS.getSalesDetail(id).subscribe(event2 => {
          if (event2.type == HttpEventType.Response && event2.ok && event2.body) {
            let detail: stockD[] = Object(event2.body)['output_schema'];
            detail.forEach(element => {
              if (element.product_code == pid) {
                let temp: Order = {
                  customer_name: header.customer_name,
                  discount: element.discount,
                  notes: '',
                  product_amount: element.product_amount,
                  product_brand_code: element.product_brand_code,
                  product_category_code: '',
                  product_code: element.product_code,
                  product_desc: element.product_desc,
                  product_entry_date: header.order_date,
                  product_qty: 0,
                  product_sell_price: parseInt(element.product_sell_price.toString()),
                  product_unit: element.unit_amount_code,
                  sub_total: element.total,
                  idx: this.dataTable.length + 1,
                  merkName: element.brand_name,
                  unit_amount: element.unit_amount,
                  salesDetailCode: element.sales_detail_code
                }
                this.dataTable.push(temp)
              }
            })
            this.dataSource = new MatTableDataSource(this.dataTable);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            console.log(this.dataTable)

            this.formGroup.get('customer_name')?.disable();
            this.formGroup.get('merkName')?.disable();
            this.formGroup.get('product_desc')?.disable()
            this.formGroup.get('product_unit')?.disable();
            this.formGroup.get('discount')?.disable();
            this.formGroup.get('product_qty')?.disable();
            this.formGroup.get('product_amount')?.enable()
          }
        });

      }
    });

  }

  getMaterBrand() {
    this.restS.getMasterDataBrand().subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listBrand = Object(event.body)['output_schema'];

      }
    })
  }
  getProductByBrand(brand: string) {
    this.formGroup.get('product_desc')?.reset();
    this.filterProduct = [];
    this.formGroup.get('product_brand_code')?.setValue(brand);
    this.restS.getProductByBrand(brand).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listProduct = Object(event.body)['output_schema'];
      }
    })
  }

  getSisaStock() {
    let unitId = this.formGroup.get('product_unit')?.value;
    let unit = this.listUnit.find(f => f.packingCode == unitId);

    if (unit) {
      let temp = this.dataTable.find(f => f.product_code == this.formGroup.get('product_code')?.value && f.product_unit == unitId)?.product_amount;

      this.id ? undefined : this.formGroup.get('harga_satuan')?.setValue(unit.sellPrice)
      let sisa = (unit.stock ? unit.stock : 0) - this.formGroup.get('product_amount')?.value - (temp ? temp : 0)
        ;
      this.formGroup.get('product_qty')?.setValue(sisa >= 0 ? sisa : undefined);
      this.formGroup.get('product_amount')?.enable()
    }

  }

  getDetailProduct(product_amount?: any, data?: StockBeGet) {
    // console.log(data)
    if (!data)
      return
    this.formGroup.get('product_code')?.setValue(data.productCode);


    this.listUnit = [
      {
        packing: data.packing,
        stock: data.stock,
        totalPerPacking: data.totalPerPacking,
        sellPrice: data.sellPrice,
        packingCode: data.packingCode1,
      },
      {
        packing: data.packing2,
        stock: data.stock2,
        totalPerPacking: data.totalPerPacking2,
        sellPrice: data.sellPrice2,
        packingCode: data.packingCode2,
      },
      {
        packing: data.packing3,
        stock: data.stock3,
        totalPerPacking: data.totalPerPacking3,
        sellPrice: data.sellPrice3,
        packingCode: data.packingCode3,
      },
      {
        packing: data.packing4,
        stock: data.stock4,
        totalPerPacking: data.totalPerPacking4,
        sellPrice: data.sellPrice4,
        packingCode: data.packingCode4,
      }
    ]
    let packing = this.formGroup.get('product_unit')?.value;
    let cPacking = this.listUnit.find(f => f.packingCode == packing);
    // console.log(packing,)
    // console.log(cPacking)
    // console.log(product_amount)
    // console.log(parseInt(product_amount?.toString()!) + (cPacking?.stock ? cPacking?.stock : 0))
    if (product_amount) {
      this.formGroup.get('product_qty')?.setValue(parseInt(product_amount) + (cPacking?.stock ? cPacking?.stock : 0));
      this.formGroup.get('product_amount')?.setValue(0);
      try {
        this.listUnit.find(f => f.packingCode == packing)!.stock = parseInt(product_amount) + (cPacking?.stock ? cPacking?.stock : 0)
      } catch (error) {

      }

    }



  }
  getSubTotal() {
    let basePrice = this.formGroup.get('harga_satuan')?.value;
    let discount = this.formGroup.get('discount')?.value;
    if (basePrice)
      return (basePrice * this.formGroup.get('product_amount')?.value) - (discount ? discount : 0);
    return 0
  }
  simpan() {

    let temp: any = {};
    this.listForm.forEach(element => {
      temp[element] = this.formGroup.get(element)?.value;
    })
    
    
    const selectedUnit = this.listUnit.find(f => f.packingCode == this.formGroup.get('product_unit')?.value);
    temp['unit_amount'] = selectedUnit?.packing;
    if (selectedUnit?.stock != null) {
      temp['max_stock'] = Number(selectedUnit.stock);
    }
    temp['merkName'] = this.formGroup.get('merkName')?.value
    temp['productDesc'] = this.listProduct.find(f => f.productCode == this.formGroup.get('product_desc')?.value)?.productDesc;
    temp.product_sell_price = this.formGroup.get('harga_satuan')?.value
    temp['sub_total'] = (temp.product_sell_price * this.formGroup.get('product_amount')?.value) - (temp.discount ? temp.discount : 0);
    temp['salesDetailCode'] = this.formGroup.get('salesDetailCode')?.value
    temp.idx = this.dataTable.length + 1;
    try {
      // Same product AND same packing on one line (the old check could match two different lines).
      let data = this.dataTable.find(f => f.product_code == temp['product_code'] && f.product_unit == temp['product_unit']);
      if (data) {
        data!.product_amount = Number.parseInt(data!.product_amount +'') +  Number.parseInt(temp['product_amount'] +'');
        data!.discount = Number.parseInt(data!.discount +'') +  Number.parseInt(temp['discount'] +'');
        data!.sub_total = Number.parseInt(data!.sub_total +'') +  Number.parseInt(temp['sub_total'] +'');
        if (temp['max_stock'] != null) {
          data!.max_stock = temp['max_stock'];
        }
      }else
      this.dataTable.push(temp);
    } catch (error) {
      this.dataTable.push(temp);
    }
    // console.log(this.dataTable)
    
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.formGroup.reset();

    this.formGroup.get('product_entry_date')?.setValue(new Date());
    this.formGroup.get('customer_name')?.setValue(temp.customer_name || DEFAULT_CUSTOMER);
    this.formGroup.get('product_amount')?.disable();
    this.listProduct = [];
    this.listUnit = [];
    this.focusScan();
  }
  edit(row: Order) {
    // By row identity: one product can be on several lines (one per packing).
    let data: any = row;
    this.listForm.forEach(element => {
      this.formGroup.get(element)?.setValue(data[element]);
    });
    this.formGroup.get('merkName')?.setValue(data['merkName'])
    this.formGroup.get('harga_satuan')?.setValue(data['product_sell_price'])
    this.formGroup.get('salesDetailCode')?.setValue(data['salesDetailCode'])
    let idx = this.dataTable.indexOf(row);
    this.restS.getProductByBrand(data['product_brand_code']).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listProduct = Object(event.body)['output_schema'];
        let detail = this.listProduct.find(f => f.productCode == data['product_code'])
        this.getDetailProduct(this.id ? data['product_amount'] : undefined, detail ? detail : undefined);

      }
    })
    this.dataTable.splice(idx, 1);
    this.renumber();
    this.formGroup.get('product_amount')?.enable();
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator
  }
  delete(row: Order) {
    let idx = this.dataTable.indexOf(row);
    if (idx < 0) {
      return;
    }
    this.dataTable.splice(idx, 1);
    this.renumber();
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator
  }
  kirim() {
    if (this.id)
      this.update();
    else {
      let detailOrder: OrderDetailBe[] = []
      this.dataTable.forEach(element => {
        detailOrder.push({
          salesHeaderCode: this.id ? this.id : '',
          productCode: element.product_code,
          productBrandCode: element.product_brand_code,
          discount: element.discount ? element.discount : 0,
          productAmount: parseFloat(element.product_amount.toString()),
          productDesc: element.product_desc,
          productSellPrice: element.product_sell_price,
          total: element.sub_total,
          unitForProductAmount: element.product_unit
        });
      });
      const rawCustomer = this.formGroup.getRawValue().customer_name;
      const customerName = (rawCustomer && rawCustomer.toString().trim())
        ? rawCustomer.toString().trim()
        : (this.dataTable[0].customer_name || DEFAULT_CUSTOMER);
      let order: OrderBePost = {
        salesHeaderCode: this.id ? this.id : '',
        customerName: customerName,
        orderDate: this.datePipe.transform(this.dataTable[0].product_entry_date, 'yyyy-MM-dd')!,
        orderDetail: detailOrder,
        grandTotal: detailOrder.map(m => m.total).reduce((accumulate: number, current: number) => {
          return accumulate + current
        }, 0)
      }
      console.log(order)

      this.disabelBtn = true;
      const dialogPayment = this.matDialog.open(DialogPaymentComponent, {
        width: '460px',
        maxWidth: '95vw',
        data: {
          total: order.grandTotal
        },
      });
      dialogPayment.afterClosed().subscribe(dp => {
        if (dp?.pembayaran != undefined && dp?.kembalian != undefined) {
          console.log(dp)
          order.change = dp.kembalian;
          order.payment = dp.pembayaran;
          order.paymentMethod = dp.paymentMethod || 'TUNAI';

          this.restS.postAddOrder(JSON.stringify(order)).subscribe(async event => {
            if (event.type == HttpEventType.Response && event.ok && event.body) {
              // Backend returns the generated invoice code in output_schema (may be empty on older backends)
              const salesHeaderCode = Object(event.body)['output_schema'];
              let question = "Berhasil menambahkan Order";
              try {
                await this.printReceipt(order, typeof salesHeaderCode == 'string' ? salesHeaderCode : undefined);
              } catch (printError: any) {
                console.error('Print error:', printError);
                question += "\n\nPrint gagal: " + (printError?.message || printError)
                  + "\nStruk bisa dicetak ulang dari Daftar Order.";
              }
              const dialog = this.matDialog.open(DialogComponent,
                {
                  width: '33%',
                  data: {
                    question: question,
                    yesStr: "Ok",

                  },
                }
              );
              dialog.afterClosed().subscribe(event => {
                this.router.navigate(['order'])
              })
              this.disabelBtn = false
            }
          }, error => {
            this.disabelBtn = false
          })
        } else
          this.disabelBtn = false
      })
    }
  }

  private async printReceipt(order: OrderBePost, salesHeaderCode?: string) {
    const receipt: SalesReceipt = {
      salesHeaderCode: salesHeaderCode,
      customerName: order.customerName,
      orderDate: this.datePipe.transform(new Date(), 'dd MMM yyyy HH:mm:ss') || '',
      items: this.dataTable.map(item => ({
        name: `${item.merkName || ''} ${item.productDesc || item.product_desc || ''}`.trim(),
        qty: Number(item.product_amount),
        unit: item.unit_amount || '',
        price: Number(item.product_sell_price),
        discount: Number(item.discount || 0),
        total: Number(item.sub_total)
      })),
      grandTotal: order.grandTotal,
      payment: order.payment || 0,
      change: order.change || 0,
      paymentMethod: order.paymentMethod || 'TUNAI'
    };
    const printerName = await this.qzTray.resolvePrinter();
    await this.qzTray.printSalesReceipt(printerName, receipt);
  }

  getGrandTotal() {
    let detailOrder: OrderDetailBe[] = []
    this.dataTable.forEach(element => {
      detailOrder.push({
        salesHeaderCode: this.id ? this.id : '',
        productCode: element.product_code,
        productBrandCode: element.product_brand_code,
        discount: element.discount ? element.discount : 0,
        productAmount: parseInt(element.product_amount.toString()),
        productDesc: element.product_desc,
        productSellPrice: element.product_sell_price,
        total: element.sub_total,
        unitForProductAmount: element.product_unit
      });
    });
    return detailOrder.map(m => m.total).reduce((accumulate: number, current: number) => {
      return accumulate + current
    }, 0)
  }

  update() {
    let detailOrder: OrderDetailBe | undefined;
    this.dataTable.forEach(element => {
      detailOrder = {
        salesHeaderCode: this.id ? this.id : '',
        productCode: element.product_code,
        productBrandCode: element.product_brand_code,
        discount: element.discount ? element.discount : 0,
        productAmount: parseFloat(element.product_amount.toString()),
        productDesc: element.product_desc,
        productSellPrice: element.product_sell_price,
        total: element.sub_total,
        unitForProductAmount: element.product_unit,
        salesDetailCode: element.salesDetailCode
      };
    });
    this.disabelBtn = true
    this.restS.putUpdateOrderDetail(JSON.stringify(detailOrder)).subscribe(event => {
      if (event.type == HttpEventType.Response && event.ok && event.body) {
        const dialog = this.matDialog.open(DialogComponent,
          {
            width: '33%',
            data: {
              question: "Berhasil update detail Order",
              yesStr: "Ok",

            },
          }
        );
        dialog.afterClosed().subscribe(event => {
          this.router.navigate(['order/review-order', this.id])
        })
        this.disabelBtn = false
      }
    }, error => {
      this.disabelBtn = false
    })
  }
}

