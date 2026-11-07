import { Injectable } from '@angular/core';
import { Csv, listHeader, Stock, StockDetail } from 'src/app/model/stock';

@Injectable({
  providedIn: 'root'
})
export class ReadCsvService {

  constructor() { }

  parseData(value: string) {
    let stock: Stock[] = [];
    try {

      let data: string[] = value.split('\r\n');
      let header: string[] = data[0].split(',');

      data.slice(1, data.length - 1).forEach(element => {

        let row: any = element.split(',');
        let csv: Csv | any = {};
        listHeader.forEach(h => {
          csv[h.value] = h.key == 'number' ?
            Number.isNaN(parseFloat(row[header.findIndex(f => f == h.value)])) ?
              undefined : parseFloat(row[header.findIndex(f => f == h.value)]) : row[header.findIndex(f => f == h.value)]
        })
        let detail: StockDetail[] = [];
        csv.Stock ? detail.push({ packing: csv.Packing, sellPrice: csv.Sell_Price, stock: csv.Stock, totalPerPacking: csv.Total_per_Packing }) : undefined;
        csv.Stock_2 ? detail.push({ packing: csv.Packing_2, sellPrice: csv.Sell_Price_2, stock: csv.Stock_2, totalPerPacking: csv.Total_per_Packing_2 }) : undefined;
        csv.Stock_3 ? detail.push({ packing: csv.Packing_3, sellPrice: csv.Sell_Price_3, stock: csv.Stock_3, totalPerPacking: csv.Total_per_Packing_3 }) : undefined;
        csv.Stock_4 ? detail.push({ packing: csv.Packing_4, sellPrice: csv.Sell_Price_4, stock: csv.Stock_4, totalPerPacking: csv.Total_per_Packing_4 }) : undefined;
        stock.push({
          merk: csv.Brand,
          merkName: csv.Brand,
          dateTime: new Date(),
          deskripsi: csv.Desc,
          detailStock: detail,
          hargaBeli: csv.Base_Price,
          minimalStock: csv.Min_Stock,
          notes: csv.Notes,
          supplier: csv.Supplier,
          unit: csv.Packing
        })
        csv = {}

      })

    } catch (error) {
      alert("error load csv data:" + error);
      return stock;
    }

    return stock;

  }
}
