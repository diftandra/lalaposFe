export type Supplier = {
    supplierId?: string,
    supplierCode?: string,
    supplierName: string,
    supplierContact: string,
    supplierAddress: string,
    supplierNotes?: string,
    created_date: string | Date
}

export type SupplierPost = {
    supplier_code?: string,
    supplier_name: string,
    supplier_contact: string,
    supplier_address: string,
    notes: string
}