import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  url = environment.urlHost;
  constructor(private httpClient: HttpClient) {

  }

  private get(url: string, param?: HttpParams) {
    const request = new HttpRequest('GET', url, { params: param })
    return this.httpClient.request(request);
  }
  private post(url: string, param?: HttpParams, body?: string) {
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, body, { params: param, headers: header })
    return this.httpClient.request(request);
  }
  private put(url: string, param?: HttpParams, body?: string) {
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('PUT', url, body, { params: param, headers: header })
    return this.httpClient.request(request);
  }
  private del(url: string, param?: HttpParams) {
    const request = new HttpRequest('DELETE', url, { params: param })
    return this.httpClient.request(request);
  }

  //master-data
  getMasterDataByHeaderCode(code: string) {
    let url = this.url + '/lala-pos/master-data/' + code;
    return this.get(url, undefined);
  }
  getMasterDataBrand() {
    let url = this.url + '/lala-pos/product-brand/get-all';
    return this.get(url, undefined);
  }
  getBrandById(id: string) {
    let url = this.url + '/lala-pos/product-brand/get-brand-detail/' + id;
    return this.get(url, undefined);
  }
  postAddBrand(data: string) {
    let url = this.url + '/lala-pos/product-brand/add-brand';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  PutBrand(data: string) {
    let url = this.url + '/lala-pos/product-brand/update-brand';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('PUT', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  delBrand(id: string) {
    let url = this.url + '/lala-pos/product-brand/delete-brand/' + id;
    return this.del(url, undefined);
  }
  //stock
  getListStockBarang(productCode?: string, productBrand?: string, productDesc?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    let url = this.url + '/lala-pos/inquiry-product/get-all-product';
    let param = new HttpParams()
      .append('productBrand', productBrand ? productBrand.toUpperCase() : '')
      .append('productDesc', productDesc ? productDesc : '')
      .append('productCode', productCode ? productCode.toUpperCase() : '')
    currentPage ? param = param.append('currentPage', currentPage.toString()) : undefined;
    pageSize ? param = param.append('pageSize', pageSize.toString()) : undefined;
    sortDir ? param = param.append('sortDir', sortDir) : undefined;
    sortCol ? param = param.append('sortCol', sortCol) : undefined;

    return this.get(url, param);
  }
  getProductByProductId(productId: string) {
    let url = this.url + '/lala-pos/inquiry-product/product-detail/' + productId;

    return this.get(url);
  }
  postAddStock(data: string) {
    let url = this.url + '/lala-pos/input-product/add-product';
    return this.post(url, undefined, data);
  }
  postAddStockCsv(data: string) {
    let url = this.url + '/lala-pos/input-product/add-product-upload';
    return this.post(url, undefined, data);
  }
  putStock(data: string) {
    let url = this.url + '/lala-pos/input-product/update-product';
    return this.put(url, undefined, data);
  }
  getProductByBrand(brand: string) {
    let url = this.url + '/lala-pos/input-product/get-product-by-brand/' + brand;
    return this.get(url);
  }
  delStock(id: string) {
    let url = this.url + '/lala-pos/input-product/delete-product/' + id;
    return this.del(url, undefined);
  }
  //order
  postAddOrder(data: string) {
    let url = this.url + '/lala-pos/sales/add-sales';
    return this.post(url, undefined, data);
  }
  postPrintOrder(data: string) {
    let url = this.url + '/lala-pos/inquiry-sales/print-receipt';
    return this.post(url, undefined, data);
  }
  putUpdateOrderDetail(data: string) {
    let url = this.url + '/lala-pos/inquiry-sales/update-sales-product';
    return this.put(url, undefined, data);
  }
  // getAllSales() {
  //   let url = this.url + '/lala-pos/inquiry-sales/get-all-sales'
  //   return this.get(url);
  // }

  getAllSales(salesHeaderCode?: string, customerName?: string, grandTotal?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    let url = this.url + '/lala-pos/inquiry-sales/get-all-sales'
    let param = new HttpParams()
      .append('salesHeaderCode', salesHeaderCode ? salesHeaderCode.toUpperCase() : '')
      .append('customerName', customerName ? customerName.toUpperCase() : '')
      .append('grandTotal', grandTotal ? grandTotal : '')
    currentPage ? param = param.append('currentPage', currentPage.toString()) : undefined;
    pageSize ? param = param.append('pageSize', pageSize.toString()) : undefined;
    sortDir ? param = param.append('sortDir', sortDir) : undefined;
    sortCol ? param = param.append('sortCol', sortCol) : undefined;

    return this.get(url, param);
  }

  getSalesRangeDate(sDate: string, eDate: string) {
    let url = this.url + '/lala-pos/inquiry-sales/get-sales-range-date'
    let param = new HttpParams().append('sDate', sDate).append('eDate', eDate);
    return this.get(url, param);
  }
  getSalesHeader(id: string) {
    let url = this.url + '/lala-pos/inquiry-sales/header/' + id;
    return this.get(url);
  }
  getSalesDetail(id: string) {
    let url = this.url + '/lala-pos/inquiry-sales/detail/' + id;
    return this.get(url);
  }
  delOrderHeader(id: string) {
    let url = this.url + '/lala-pos/inquiry-sales/delete-sales/' + id;
    return this.del(url, undefined);
  }
  delOrderDetail(idH: string, idD: string) {
    let url = this.url + '/lala-pos/inquiry-sales/delete-sales-detail/' + idH + '/' + idD;
    return this.del(url, undefined);
  }
  //supplier
  getSupplierAll() {
    let url = this.url + '/lala-pos/supplier/get-all';
    return this.get(url, undefined);
  }
  delSupplier(id: string) {
    let url = this.url + '/lala-pos/supplier/delete-supplier/' + id;
    return this.del(url, undefined);
  }
  getSupplierById(id: string) {
    let url = this.url + '/lala-pos/supplier/get-supplier-detail/' + id;
    return this.get(url, undefined);
  }
  postAddSupplier(data: string) {
    let url = this.url + '/lala-pos/supplier/add-supplier';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  PutSupplier(data: string) {
    let url = this.url + '/lala-pos/supplier/update-supplier';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('PUT', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  //profile
  getProfileAll() {
    let url = this.url + '/lala-pos/profile/get-all';
    return this.get(url, undefined);
  }
  delProfile(id: string) {
    let url = this.url + '/lala-pos/profile/delete-user/' + id;
    return this.del(url, undefined);
  }
  getProfileById(id: string) {
    let url = this.url + '/lala-pos/profile/get-user-detail/' + id;
    return this.get(url, undefined);
  }
  getRoles() {
    let url = this.url + '/lala-pos/profile/get-all-role';
    return this.get(url, undefined);
  }
  postAddProfil(data: string) {
    let url = this.url + '/lala-pos/profile/add-user';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  postAddProfilRole(data: string) {
    let url = this.url + '/lala-pos/profile/add-user-has-role';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  PutProfil(data: string) {
    let url = this.url + '/lala-pos/profile/update-user';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('PUT', url, data, { headers: header })
    return this.httpClient.request(request);
  }
  //login
  login(username: string, password: string) {
    let url = this.url + '/lala-pos/login/user-detail';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, { username: username, password: password }, { headers: header })
    return this.httpClient.request(request);
  }
  getMenu(username: string, role: string) {
    let url = this.url + '/lala-pos/login/menu-by-role';
    const header = new HttpHeaders().append('Content-Type', 'application/json')
    const request = new HttpRequest('POST', url, { username: username, role_group_code: role }, { headers: header })
    return this.httpClient.request(request);
  }

  //dashbaord
  getDashbaordTotalPerDay(date: string) {
    let url = this.url + '/lala-pos/dashboard/order-per-date/' + date;
    return this.get(url, undefined);
  }
  getDashboardDataTabel() {
    let url = this.url + '/lala-pos/order-per-dete/get-all-order';
    return this.get(url, undefined);
  }
  getDashboardProductAlert() {
    let url = this.url + '/lala-pos/dashboard/product-alert';
    return this.get(url, undefined);
  }
  //report
  getReportViewOrder(sDate?: string, eDate?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    let url = this.url + '/lala-pos/report/view-report-order';
    let param = new HttpParams()

    sDate ? param = param.append('startDate', sDate.toString()) : undefined;
    eDate ? param = param.append('endDate', eDate.toString()) : undefined;
    currentPage ? param = param.append('currentPage', currentPage.toString()) : undefined;
    pageSize ? param = param.append('pageSize', pageSize.toString()) : undefined;
    sortDir ? param = param.append('sortDir', sortDir) : undefined;
    sortCol ? param = param.append('sortCol', sortCol) : undefined;

    return this.post(url, param);
  }
  getReportViewStock(sDate?: string, eDate?: string, currentPage?: number, pageSize?: number, sortDir?: string, sortCol?: string) {
    let url = this.url + '/lala-pos/report/view-report-stock';
    let param = new HttpParams()
      .append('startDate', sDate ? sDate : '')
      .append('endDate', eDate ? eDate : '')

    currentPage ? param = param.append('currentPage', currentPage.toString()) : undefined;
    pageSize ? param = param.append('pageSize', pageSize.toString()) : undefined;
    sortDir ? param = param.append('sortDir', sortDir) : undefined;
    sortCol ? param = param.append('sortCol', sortCol) : undefined;

    return this.post(url, param);
  }
  PostDownloadReportOrder(sDate: string, eDate: string) {
    let url = this.url + '/lala-pos/report/generate-order';
    const header = new HttpHeaders().append('responseType', 'text').append('content-type', 'application/json')
    const request = new HttpRequest('POST', url, { start_date: sDate, end_date: eDate }, { headers: header, responseType: 'arraybuffer' })
    return this.httpClient.request(request);
  }
  PostDownloadReportStock(sDate: string, eDate: string) {
    let url = this.url + '/lala-pos/report/generate-stock';
    const header = new HttpHeaders().append('responseType', 'text').append('content-type', 'application/json')
    const request = new HttpRequest('POST', url, { start_date: sDate, end_date: eDate }, { headers: header, responseType: 'arraybuffer' })
    return this.httpClient.request(request);
  }
}
