export type Master = {
    master_detail_code: string,
    master_detail_desc: string
}

export type Brand = {
    productBrandId: string,
    brandCode: string,
    brandName: string,
    isActive: boolean,
    created_date: string | Date
}
export type BrandPost = {
    brand_code?: string,
    brand_name: string,
    is_active: boolean
}