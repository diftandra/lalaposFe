export type Order = {
    customer_name: string,
    product_code: string,
    product_category_code: string,
    product_brand_code: string,
    product_desc: string,
    product_entry_date: Date | string,
    product_amount: number,
    product_qty: number,
    product_unit: string,
    discount: number,
    product_sell_price: number,
    sub_total: number,
    notes: string,
    idx?: number
    merkName?: string
    unit_amount?: string
    productDesc?: string
    salesDetailCode?: string
}

export type OrderBePost = {
    salesHeaderCode: string,
    customerName: string,
    orderDate: string,
    grandTotal: number,
    orderDetail: OrderDetailBe[],
    payment?: number,
    change?: number
}
export type OrderDetailBe = {
    salesHeaderCode: string,
    productCode: string,
    productBrandCode: string,
    productDesc: string,
    productAmount: number,
    unitForProductAmount: string,
    productSellPrice: number,
    discount: number,
    total: number,
    salesDetailCode?: string
}

export type OrderGetAll = {
    salesHeaderId: string,
    salesHeaderCode: string,
    customerName: string,
    orderDate: string | Date,
    grandTotal: number,
    created_by: string,
    created_date: string | Date,
    updated_by: string,
    updated_date: string | Date
}