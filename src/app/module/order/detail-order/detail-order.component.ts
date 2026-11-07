import { DatePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-detail-order',
  templateUrl: './detail-order.component.html',
  styleUrls: ['./detail-order.component.css']
})
export class DetailOrderComponent implements OnInit {

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
    customer_name: new FormControl('', Validators.required),
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

  constructor(private datePipe: DatePipe, private restS: RestService, private matDialog: MatDialog, private router: Router, private activeRouter: ActivatedRoute) {
    this.getMaterBrand();
    this.inputMerk.pipe(debounceTime(700), distinctUntilChanged())
      .subscribe((res: any) => {
        let merk: string = (<HTMLInputElement>res.target).value;
        if (merk.length > 1) {
          this.formGroup.get('product_desc')?.reset();
          this.formGroup.get('product_desc')?.setValue(undefined);
          this.filterProduct = [];
          this.getProductByBrand(this.listBrand.find(f => f.brandName.toLowerCase() == merk.toLowerCase())?.brandCode!)
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
    
  }

  private _filterBrand(value: string): Brand[] {
    const filterValue = value.toLowerCase();
    return this.listBrand.filter(option => option.brandName.toLowerCase().includes(filterValue));
  }
  private _filterProduct(value: string): StockBeGet[] {
    console.log(1)
    const filterValue = value.toLowerCase();    
    return JSON.parse(JSON.stringify(this.listProduct.filter(option => option.productDesc.toLowerCase().includes(filterValue)))) ;
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
    
    
    temp['unit_amount'] = this.listUnit.find(f => f.packingCode == this.formGroup.get('product_unit')?.value)?.packing;
    temp['merkName'] = this.formGroup.get('merkName')?.value
    temp['productDesc'] = this.listProduct.find(f => f.productCode == this.formGroup.get('product_desc')?.value)?.productDesc;
    temp.product_sell_price = this.formGroup.get('harga_satuan')?.value
    temp['sub_total'] = (temp.product_sell_price * this.formGroup.get('product_amount')?.value) - (temp.discount ? temp.discount : 0);
    temp['salesDetailCode'] = this.formGroup.get('salesDetailCode')?.value
    temp.idx = this.dataTable.length + 1;
    try {
      if( this.dataTable.find(f => f.product_code ==  temp['product_code']) && this.dataTable.find(f => f.product_unit ==  temp['product_unit']) )  {
        let data = this.dataTable.find(f => f.product_code ==  temp['product_code']) && this.dataTable.find(f => f.product_unit ==  temp['product_unit']);
        data!.product_amount = Number.parseInt(data!.product_amount +'') +  Number.parseInt(temp['product_amount'] +'');
        data!.discount = Number.parseInt(data!.discount +'') +  Number.parseInt(temp['discount'] +'');
        data!.sub_total = Number.parseInt(data!.sub_total +'') +  Number.parseInt(temp['sub_total'] +'');
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
    this.formGroup.get('customer_name')?.setValue(temp.customer_name);
    this.formGroup.get('customer_name')?.disable();
    this.formGroup.get('product_amount')?.disable();
    this.listProduct = [];
    this.listUnit = [];
  }
  edit(id: string) {
    let data: any = this.dataTable.find(f => f.product_code == id);
    this.listForm.forEach(element => {
      this.formGroup.get(element)?.setValue(data[element]);
    });
    this.formGroup.get('merkName')?.setValue(data['merkName'])
    this.formGroup.get('harga_satuan')?.setValue(data['product_sell_price'])
    this.formGroup.get('salesDetailCode')?.setValue(data['salesDetailCode'])
    let idx = this.dataTable.findIndex(f => f.product_code == id);

    this.restS.getProductByBrand(data['product_brand_code']).subscribe(event => {
      if (event.type == HttpEventType.Response && event.body && event.ok) {
        this.listProduct = Object(event.body)['output_schema'];
        let detail = this.listProduct.find(f => f.productCode == data['product_code'])
        this.getDetailProduct(this.id ? data['product_amount'] : undefined, detail ? detail : undefined);

      }
    })
    this.dataTable.splice(idx, 1);
    this.formGroup.get('product_amount')?.enable();
    this.dataSource = new MatTableDataSource(this.dataTable);
    this.dataSource.paginator = this.paginator
  }
  delete(id: string) {
    let idx = this.dataTable.findIndex(f => f.product_code == id);
    this.dataTable.splice(idx, 1);
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
      let order: OrderBePost = {
        salesHeaderCode: this.id ? this.id : '',
        customerName: this.dataTable[0].customer_name,
        orderDate: this.datePipe.transform(this.dataTable[0].product_entry_date, 'yyyy-MM-dd')!,
        orderDetail: detailOrder,
        grandTotal: detailOrder.map(m => m.total).reduce((accumulate: number, current: number) => {
          return accumulate + current
        }, 0)
      }
      console.log(order)

      this.disabelBtn = true;
      const dialogPayment = this.matDialog.open(DialogPaymentComponent, {
        width: '33%',
        data: {
          total: order.grandTotal
        },
      });
      dialogPayment.afterClosed().subscribe(dp => {
        if (dp?.pembayaran != undefined && dp?.kembalian != undefined) {
          console.log(dp)
          order.change = dp.kembalian;
          order.payment = dp.pembayaran;

          this.restS.postAddOrder(JSON.stringify(order)).subscribe(event => {
            if (event.type == HttpEventType.Response && event.ok && event.body) {
              const dialog = this.matDialog.open(DialogComponent,
                {
                  width: '33%',
                  data: {
                    question: "Berhasil menambahkan Order",
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

