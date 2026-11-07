export type Profile = {

    created_date?: string | Date,

    updated_date?: string | Date,
    user_id?: string,
    username: string,
    password: string,
    full_name: string,
    is_active: boolean
}
export type profileRole = {
    username: string,
    full_name: string,
    password: string,
    is_active: boolean,
    role_group_code: string
}
export type MenuBe = {
    menu_name: string,
    menu_code: string
}
export type Role = {
    is_active: boolean,
    role_group_code: string,
    role_group_name: string
}

export type Login = {
    full_name: string,
    role_group_code: string,
    username: string,
    token?: string
}