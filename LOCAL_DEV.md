# Menjalankan Frontend Lala PoS di PC Lokal

Frontend ini adalah aplikasi **Angular 13**, yang membutuhkan **Node.js 16**.
Jangan pakai Node versi terbaru (18/20/22) karena build Angular 13 akan gagal.

## 1. Pakai Node 16

**Windows** — install [nvm-windows](https://github.com/coreybutler/nvm-windows):
```bat
nvm install 16
nvm use 16
```

**macOS/Linux** — pakai [nvm](https://github.com/nvm-sh/nvm). File `.nvmrc`
sudah tersedia:
```bash
nvm install
nvm use
```

Cek versi:
```bash
node -v   # harus v16.x
```

## 2. Install dependency

```bash
npm install
```

## 3. Jalankan dev server

```bash
npm start
```

Aplikasi aktif di `http://localhost:3000`. Port ini sengaja dipakai agar cocok
dengan konfigurasi CORS di backend (`http://localhost:3000`).

Pastikan backend sudah jalan lebih dulu (lihat `lalapos-be/LOCAL_DEV.md`).
Frontend memanggil backend di `http://localhost:8080` (lihat
`src/environments/environment.ts`).

## Build produksi

```bash
npm run build
```

Hasil build ada di `dist/lala-pos/`.

## Menjalankan via Docker

Frontend dijalankan bersama backend lewat `docker-compose.yml` di repo
`lalapos-be` (lihat `lalapos-be/WINDOWS_SETUP.md`). Compose memakai `Dockerfile`,
yang menyalin hasil build, jadi build dulu:

```bash
npm ci
npm run build -- --configuration production
```

nginx (port 4200) meneruskan `/lala-pos/` ke service `backend`, jadi container
ini tidak bisa dijalankan sendirian dengan `docker run`.

## Konfigurasi alamat backend

- `src/environments/environment.ts` — dipakai saat `npm start` (development)
- `src/environments/environment.prod.ts` — dipakai saat `npm run build` (produksi)

Keduanya berisi `urlHost`. Ubah ke alamat backend yang sesuai bila bukan
`http://localhost:8080`.
