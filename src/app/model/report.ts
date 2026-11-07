export type ReportOrder = {
    base_price: number,
    jumlah_pembelian: number,
    sales_header_code: string,
    product_sell_price: number,
    customer_name: string,
    order_date: string,
    brand_name: string,
    product_desc: string,
    product_amount: number,
    discount: number,
    packing: number,
    total: number,
    product_code: string
}

export type ReportStock = {
    base_price: number,
    sisa_stock: number,
    supplier_name: string,
    modal: number,
    brand_name: string,
    product_desc: string,
    packing: string,
    stock: number,
    product_code: string,
    product_entry_date: string
}