export type Menu = {
    type: 'link' | 'submenu';
    name: string;
    icon?: string;
    authCode?: string;
    link?: string;
    queryParam?: {};
    params?: {};
    submenu?: Menu[];
    menu_code?: string;
    openSubmenu?: boolean;
};
export type Submenu1 = {
    type: 'link' | 'submenu';
    name: string;
    authCode?: string;
    link?: string;
    queryParam?: {};
    params?: {};
    submenu?: Submenu2[];
    openSubmenu?: boolean;
};

export type Submenu2 = {
    type: 'link';
    name: string;
    authCode?: string;
    link: string;
    queryParam?: {};
    params?: {};
};

export const ENC_KEY = "TOLE12345";
export const sessionStorage_username_key = "un";
export const sessionStorage_password_key = "sp";
export const sessionStorage_menu_key = "t1e8913";
export const MASTER_DATA_HEADER_CODE_MH_01 = "MH001"
export const MASTER_DATA_HEADER_CODE_MH_02 = "MH002"
export type pairValue = {
    key: any;
    value: any
}

export let menuList: Menu[] = [
    {
        type: 'link',
        name: 'Home',
        link: '/home',
    },
    {
        type: 'submenu',
        name: 'Stok Barang',
        icon: 'assets/Icon/Vector.png',
        menu_code: 'MN001',
        openSubmenu: false,
        submenu: [
            {
                type: 'link',
                name: 'Daftar Stok Barang',
                link: '/stock',
                menu_code: 'MN003'
            },
            {
                type: 'link',
                name: 'Input Stok Barang',
                link: 'stock/input-stock-barang',
                menu_code: 'MN002'
            },

        ],
    },
    {
        type: 'submenu',
        name: 'Order',
        icon: 'assets/Icon/Vector.png',
        openSubmenu: false,
        menu_code: 'MN004',
        submenu: [
            {
                type: 'link',
                name: 'Daftar Order',
                link: '/order',
                menu_code: 'MN006'
            },
            {
                type: 'link',
                name: 'Input Order',
                link: 'order/input-order',
                menu_code: 'MN005'
            }
        ],
    },
    {
        type: 'submenu',
        name: 'Laporan',
        icon: 'assets/Icon/Vector.png',
        openSubmenu: false,
        menu_code: 'MN007',
        submenu: [
            {
                type: 'link',
                name: 'Daftar Laporan',
                link: 'report',
                menu_code: 'MN008'
            },
        ]
    },
    {
        type: 'submenu',
        name: 'Pengaturan',
        icon: 'assets/Icon/Vector.png',
        openSubmenu: false,
        menu_code: 'MN009',
        submenu: [
            {
                type: 'link',
                name: 'Profil',
                link: 'pengaturan/profil',
                menu_code: 'MN010'
            },
            {
                type: 'link',
                name: 'Merek',
                link: 'pengaturan/merk',
                menu_code: 'MN012'
            },
            {
                type: 'link',
                name: 'Supplier',
                link: 'pengaturan/supplier',
                menu_code: 'MN013'
            }
        ],
    }
];

export const MAPPING_MENU: pairValue[] = [
    {
        key: 'MN001',
        value: 'stock',
    },
    {
        key: 'MN002',
        value: 'input-stock-barang',
    },
    {
        key: 'MN003',
        value: 'stock',
    },
    {
        key: 'MN004',
        value: 'order',
    },
    {
        key: 'MN005',
        value: 'input-order',
    },
    {
        key: 'MN006',
        value: 'order',
    },
    {
        key: 'MN007',
        value: '',
    },
    {
        key: 'MN008',
        value: '',
    },
    {
        key: 'MN009',
        value: 'pengaturan',
    },
    {
        key: 'MN010',
        value: 'profil',
    },
    {
        key: 'MN011',
        value: '',
    },
    {
        key: 'MN012',
        value: 'merk',
    },
    {
        key: 'MN013',
        value: 'supplier',
    },
]