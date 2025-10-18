# Bookshelf API & Frontend

Aplikasi Bookshelf terdiri dari backend API (Hapi.js) dan frontend sederhana (HTML/JS) untuk mengelola rak buku: tambah, cari, edit, toggle selesai/belum, dan hapus.

## Prasyarat
- Node.js `>= 18`
- Yarn `>= 1.x`
- Opsional: `curl` untuk uji API dari terminal

## Instalasi
1. Buka folder proyek: `cd /Users/mymac/Downloads/Bookshelf-API`
2. Install dependency: `yarn install`
3. (Disarankan) Hapus `package-lock.json` agar tidak muncul peringatan mixing package manager.

## Menjalankan Aplikasi
- Backend API (port `5000`):
  - `yarn start`
  - Cek kesehatan: buka `http://localhost:5000/` → `{"status":"success","message":"Bookshelf API ready"}`
- Frontend (port `8000`) — direkomendasikan pakai Vite Dev Server:
  - `yarn run vite src/bookshelf-app-starter-project --port 8000`
  - Buka `http://localhost:8000/`
- Alternatif frontend (static server via uv, tidak direkomendasikan untuk dev dengan Vite):
  - `cd src/bookshelf-app-starter-project`
  - `uv run python -m http.server 8000`

## Endpoint API
- `GET /` — Healthcheck.
- `GET /books` — Daftar buku (ringkas: `id`, `name`, `publisher`).
  - Query opsional: `name`, `reading` (`0|1`), `finished` (`0|1`).
- `POST /books` — Tambah buku.
- `GET /books/{id}` — Detail buku.
- `PUT /books/{id}` — Edit buku.
- `DELETE /books/{id}` — Hapus buku.

### Skema Body (POST/PUT)
```
{
  "name": "Judul",
  "year": 2024,
  "author": "Penulis",
  "summary": "",
  "publisher": "",
  "pageCount": 1,
  "readPage": 0,
  "reading": true
}
```
Catatan: `name` wajib. `readPage` tidak boleh lebih besar dari `pageCount`. `finished` dihitung otomatis (`pageCount === readPage`).

### Contoh cURL
- Daftar buku: 
  - `curl http://localhost:5000/books`
  - `curl "http://localhost:5000/books?name=harry"`
- Tambah buku:
  - `curl -X POST http://localhost:5000/books -H "Content-Type: application/json" -d '{"name":"Test","year":2025,"author":"Anon","summary":"","publisher":"","pageCount":1,"readPage":0,"reading":true}'`
- Detail buku:
  - `curl http://localhost:5000/books/<id>`
- Edit buku:
  - `curl -X PUT http://localhost:5000/books/<id> -H "Content-Type: application/json" -d '{"name":"Baru","year":2025,"author":"Anon","summary":"","publisher":"","pageCount":1,"readPage":1,"reading":false}'`
- Hapus buku:
  - `curl -X DELETE http://localhost:5000/books/<id>`

## Fitur Frontend
- Tambah Buku: form di halaman utama, status selesai mengikuti checkbox.
- Pencarian Buku: berdasarkan judul (`GET /books?name=...`).
- Edit Buku: tombol "Edit Buku" memunculkan form inline (Judul, Penulis, Tahun) dengan tombol "Simpan/Batal".
- Toggle Selesai/Belum: tombol mengubah status selesai (`PUT /books/{id}`).
- Hapus Buku: tombol "Hapus Buku" (`DELETE /books/{id}`).

## Linting & Kebersihan Kode
- Jalankan lint: `yarn lint`
- Auto-fix: `yarn run eslint --fix .`
- Pastikan line ending `LF` (bukan `CRLF`) dan gunakan single quotes secara konsisten.

## Troubleshooting
- Peringatan mixing package manager: hapus `package-lock.json` bila memakai Yarn.
- `CRLF` line endings: gunakan `yarn run eslint --fix src/routes.js` atau set editor ke `LF`.
- `404 /@vite/client`: gunakan Vite Dev Server (`yarn run vite ...`) untuk melayani modul dev.
- API root `404`: telah ditambah health route `GET /`.

## Struktur Proyek
```
/Users/mymac/Downloads/Bookshelf-API
├── .eslintrc.json
├── package.json
├── yarn.lock
├── src/
│   ├── books.js
│   ├── handler.js
│   ├── routes.js
│   ├── server.js
│   └── bookshelf-app-starter-project/
│       ├── index.html
│       ├── main.js
│       └── styles.css
```

Selamat mencoba dan semoga lancar!

