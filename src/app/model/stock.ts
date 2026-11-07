import { pairValue } from "./general"

export type Stock = {
    merk: string,
    merkName?: string,
    brandName?: string,
    deskripsi: string,
    dateTime: Date,
    minimalStock?: number,
    hargaBeli?: number,
    supplier?: string,
    notes?: string,
    unit?: number,
    detailStock: StockDetail[],
    status?: any

}
export type StockDetail = {
    packing?: string,
    packingCode?: string,
    totalPerPacking?: number,
    stock?: number,
    sellPrice?: number
}
export type StockBeGet = {
    productId: string,
    productCode: string,
    productBrandCode: string,
    productBrand?: string,
    productDesc: string,
    packing: string,
    packingCode1: string,
    totalPerPacking: number,
    stock: number,
    sellPrice: number,
    packing2: string,
    packingCode2: string,
    totalPerPacking2: number,
    stock2: number,
    sellPrice2: number,
    packing3: string,
    packingCode3: string,
    totalPerPacking3: number,
    stock3: number,
    sellPrice3: number,
    packing4: string,
    packingCode4: string,
    totalPerPacking4: number,
    stock4: number,
    sellPrice4: number,
    basePrice: number,
    minStock: number,
    packingMinStock: number,
    isLowStock: boolean,
    productEntryDate: Date,
    supplierCode: string,
    notes: string,
    updated_date: string | Date
}
export type StockBePost = {
    productCode: string,
    brand: string,
    desc: string,
    entryDate: string | Date,
    packing?: string,
    totalPerPacking?: number,
    stock?: number,
    sellPrice?: number,
    packing2?: string,
    totalPerPacking2?: number,
    stock2?: number,
    sellPrice2?: number,
    packing3?: string,
    totalPerPacking3?: number,
    stock3?: number,
    sellPrice3?: number,
    packing4?: string,
    totalPerPacking4?: number,
    stock4?: number,
    sellPrice4?: number,
    basePrice?: number,
    minStock?: number,
    supplier: string,
    notes?: string
}
export type Csv = {
    Brand?: any;
    Desc?: any;
    Packing?: any;
    Total_per_Packing?: any;
    Stock?: any;
    Sell_Price?: any;
    Packing_2?: any;
    Total_per_Packing_2?: any;
    Stock_2?: any;
    Sell_Price_2?: any;
    Packing_3?: any;
    Total_per_Packing_3?: any;
    Stock_3?: any;
    Sell_Price_3?: any;
    Packing_4?: any;
    Total_per_Packing_4?: any;
    Stock_4?: any;
    Sell_Price_4?: any;
    Base_Price?: any;
    Supplier?: any;
    Min_Stock?: any;
    Notes?: any;
}

export type stockD = {
    sales_detail_code: string,
    unit_amount_code: string,
    product_brand_code: string,
    product_code: string,
    sales_header_code: string,
    product_sell_price: number | string,
    total: number,
    brand_name: string,
    product_desc: string,
    product_amount: number,
    unit_amount: string,
    discount: number,
}
export type stockH = {
    sales_header_code: string,
    customer_name: string,
    order_date: string | Date,
    total: number
}
export const listHeader: pairValue[] =
    [{ key: 'string', value: "Brand" },
    { key: 'string', value: "Desc" },
    { key: 'string', value: "Packing" },
    { key: 'number', value: "Total_per_Packing" },
    { key: 'number', value: "Stock" },
    { key: 'number', value: "Sell_Price" },
    { key: 'string', value: "Packing_2" },
    { key: 'number', value: "Total_per_Packing_2" },
    { key: 'number', value: "Stock_2" },
    { key: 'number', value: "Sell_Price_2" },
    { key: 'string', value: "Packing_3" },
    { key: 'number', value: "Total_per_Packing_3" },
    { key: 'number', value: "Stock_3" },
    { key: 'number', value: "Sell_Price_3" },
    { key: 'string', value: "Packing_4" },
    { key: 'number', value: "Total_per_Packing_4" },
    { key: 'number', value: "Stock_4" },
    { key: 'number', value: "Sell_Price_4" },
    { key: 'number', value: "Base_Price" },
    { key: 'string', value: 'Supplier' },
    { key: 'number', value: "Min_Stock" },
    { key: 'string', value: "Notes" },
    ]