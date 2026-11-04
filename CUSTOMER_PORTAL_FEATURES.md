# Customer Portal — WhatsApp OTP, Billing, Tickets, Service Requests & PWA

Dokumen ini menjelaskan lima fitur portal pelanggan yang diimplementasikan pada
repo `CRMLillyISPFE` (Nuxt 3) dan `CRMLillyISPBE` (Go + Fiber).

| # | Fitur | Halaman FE | Endpoint BE |
|---|-------|-----------|-------------|
| 1 | Login OTP WhatsApp | `/customer/login` | `POST /api/auth/request-otp`, `POST /api/auth/verify-otp` |
| 2 | Tagihan & bayar Midtrans | `/customer/bills` | `GET /api/customer/dashboard/bills`, `POST /api/customer/dashboard/payment/snap`, `GET /api/customer/dashboard/invoice/:id` |
| 3 | Portal pengaduan tiket | `/customer/tickets` | `GET/POST /api/customer/tickets`, `GET /api/customer/tickets/:id`, `GET /api/customer/tickets/trouble-types`, `POST /api/customer/tickets/upload` |
| 4 | Info paket & ubah layanan | `/customer/service` | `GET/POST /api/customer/service-requests`, `GET /api/customer/service-requests/history`, admin: `GET /api/admin/service-requests`, `POST /api/admin/service-requests/:id/review` |
| 5 | PWA | `sw.js`, `/offline` | — |

---

## 1. Login OTP WhatsApp

### Alur
1. Pelanggan membuka `/customer/login`, tab **WhatsApp OTP** aktif secara default.
2. `POST /api/auth/request-otp` dengan `{ phone }`.
   Backend menormalkan nomor (`0812...` -> `62812...`), mencari customer, membuat OTP
   6 digit, menyimpan **hash** (bcrypt) di memori, lalu mengirim via WhatsApp.
3. `POST /api/auth/verify-otp` dengan `{ phone, code }` -> JWT dengan audience
   `CUSTOMER` + data customer (sama seperti `login-customer`).

### Rate limiting (`internal/api/auth/waotp.go`)
| Aturan | Nilai |
|--------|-------|
| Masa berlaku kode | 5 menit |
| Cooldown kirim ulang | 60 detik |
| Maksimum percobaan verifikasi | 5 kali (lalu kode dihapus) |
| Maksimum permintaan per nomor per jam | 5 |
| OTP sekali pakai | ya (dihapus setelah berhasil) |

### Pemisahan token customer vs admin
- OTP dan `login-customer` menerbitkan token dengan role **`CUSTOMER`**.
- `helpers.VerifyToken` (dipakai semua route `/api/admin/*` dan `/api/tickets`)
  **menolak** token `CUSTOMER` dengan `403 Customer token cannot access this resource`.
- `helpers.CustomerVerifyToken` hanya menerima token `CUSTOMER` dan mengisi
  `customer_id` dari `subject` token - semua query difilter dengan id tersebut,
  sehingga pelanggan hanya bisa membaca datanya sendiri.

### Konfigurasi
```
WA_OTP_PROVIDER=fonnte     # atau "service"; kosong = OTP hanya ditulis ke log
FONNTE_TOKEN=...
FONNTE_API_URL=https://api.fonnte.com/send
WA_SERVICE_URL=http://127.0.0.1:3001   # whatsapp-service lokal
```

---

## 2. Tagihan & pembayaran Midtrans

- `GET /api/customer/dashboard/bills` -> daftar tagihan bulanan
  (`Bulan`, `Nominal`, `Status` Lunas/Pending/Belum Bayar, jatuh tempo, `is_payable`).
- `POST /api/customer/dashboard/payment/snap` -> membuat **Snap token** Midtrans
  (QRIS / VA / e-wallet) dan menyimpan redirect URL ke invoice.
- `GET /api/customer/dashboard/invoice/:id` -> invoice + item, hanya jika
  `customer_id` cocok (dipakai untuk membuat PDF).

FE:
- Halaman `pages/customer/bills.vue` memakai `UTable` dengan kolom
  Bulan / Nominal / Status / Aksi.
- Tombol **Bayar** memuat `snap.js` secara lazy lalu memanggil `snap.pay(token)`
  (popup tanpa pindah halaman). Bila token kosong, fallback ke `redirect_url`.
- Tombol **Unduh** memanggil `helper/invoicePdf.ts` (html2canvas + jsPDF,
  pola yang sama dengan `pages/invoice/[id].vue`) -> `invoice-<id>.pdf`.

Konfigurasi:
```
NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
NUXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```
> Server key Midtrans tetap hanya ada di backend (`internal/api/common/midtrands`).

---

## 3. Portal pengaduan tiket

- Form: jenis kendala (lookup `trouble_type`), judul, penjelasan, upload foto
  (maks 5MB, JPG/PNG/WEBP/GIF). Foto disimpan di `./uploads/cs-images` dan hanya
  nama file yang disimpan di `trouble_tickets.img_cs`.
- Riwayat: badge status + progress 4 tahap.
- Detail: drawer dengan timeline 4 tahap.

### Pemetaan status staf -> tahap pelanggan
| Status DB | Tahap pelanggan |
|-----------|-----------------|
| `unfinished` (belum ada teknisi) | **Tiket Diterima** |
| `unfinished` + `assigned_to` terisi | **Teknisi Dijadwalkan** |
| `ongoing` / `in_progress` | **Dalam Penanganan** |
| `resolved` / `closed` / `technician_completed` | **Selesai** |

Realtime: halaman melakukan polling 20 detik (hanya saat tab terlihat).
Tiket baru masuk ke antrean role **CUSTOMER SERVICE** seperti tiket buatan staf.

---

## 4. Info paket & ubah layanan

- `GET /api/customer/service-requests` mengembalikan satu paket data:
  - `summary`: nama paket, kecepatan download/upload, harga, aktif sejak,
    tagihan berikutnya, sisa hari.
  - `available_plans`: paket lain dengan `direction` (`upgrade`/`downgrade`).
  - `requests`: riwayat pengajuan.
- `POST` dengan `request_type`:
  - `upgrade` / `downgrade` -> wajib `requested_product_id`; backend memvalidasi
    arah berdasarkan harga paket aktif.
  - `relocation` -> wajib `new_address` (min 10 karakter).
- Pengajuan ganda dengan jenis yang sama dan status `pending` ditolak.
- **Antrean approval admin** tersimpan di tabel `customer_service_requests`
  (auto-migrated):
  - `GET /api/admin/service-requests` -> daftar pending.
  - `POST /api/admin/service-requests/:id/review` dengan
    `{ action: "approve"|"reject", review_note }`.

---

## 5. PWA (Progressive Web App)

### Konfigurasi
- `nuxt.config.ts` -> blok `pwa` (manifest, ikon, tema) + `runtimeConfig.public`.
- Manifest lengkap ada di `scripts/generate-sw.mjs` (single source of truth):
  `display: standalone`, `start_url: /customer`, `theme_color #16a34a`,
  ikon 192/512 + maskable, dan shortcuts ke Tagihan & Keluhan.
- Ikon ada di `public/icons/` - **ganti dengan logo resmi** sebelum rilis.

### Service worker
`scripts/generate-sw.mjs` menghasilkan tiga file setelah build:
1. `manifest.webmanifest`
2. `sw.js` - strategi:

   | Request | Strategi |
   |---------|----------|
   | `/api/*` | NetworkOnly (data tagihan tidak boleh basi) |
   | Navigasi halaman | Network first -> cache -> `/offline` |
   | Gambar/aset | Cache first -> network |

3. `register-sw.js` - didaftarkan dari `app.head.script`.

### Perintah build
```bash
yarn build            # nuxt build + generate sw.js & manifest
yarn pwa:generate     # hanya regenerate sw.js & manifest
```

> Catatan teknis: `workbox-build` (dipakai `@vite-pwa/nuxt`) crash di dalam
> konteks Proxy Nuxt/Nitro (`Cannot read properties of undefined (reading
> 'Symbol(ProxyTarget)')`). Karena itu generation SW dilakukan oleh script
> mandiri dengan Web API biasa, dan `pwa.disable = true` mencegah plugin
> menjalankan proses yang bermasalah.

### Offline UX
- `pages/offline.vue` - halaman fallback ("Tidak Ada Koneksi" + tombol coba lagi).
- `plugins/offline-status.client.ts` - menyediakan `$isOffline`.
- `components/customer/PortalShell.vue` - banner merah saat offline.

### Uji
1. `yarn build && yarn preview`
2. DevTools -> Application -> Manifest (pastikan installable) & Service Workers.
3. Centang "Offline" di tab Network, navigasi ke `/customer/bills` -> `/offline` tampil.
4. Android Chrome -> "Add to Home screen" -> aplikasi dibuka tanpa URL bar.

---

## UX / Tampilan Portal

Semua halaman pelanggan memakai satu shell (`components/customer/PortalShell.vue`) supaya konsisten:

| Elemen | Perilaku |
|--------|----------|
| Header | Sticky, logo/wifi + judul + tombol keluar ikon; berubah jadi **panah kembali** di halaman fitur |
| Bottom nav | 4 tab fixed: Beranda · Tagihan · Keluhan · Layanan, tab aktif diberi pill hijau |
| Safe area | `env(safe-area-inset-bottom)` agar tidak tertutup gesture bar iPhone |
| Offline | Banner merah otomatis saat koneksi putus |
| Prop `backTo` | Menampilkan panah kembali menuju halaman tujuan (mis. `/customer`); fallback ke history lalu `/customer` |
| Lebar konten | `max-w-2xl` (lebih sempit dari admin) + `space-y-6` antar seksi agar tidak terasa penuh |
| Judul seksi | Label kecil uppercase abu-abu sebagai pemisah visual antar blok |

### Sidebar admin tidak lagi muncul
`app.vue` memakai `startsWith('/customer')` (sebelumnya perbandingan persis `!== '/customer'`),
sehingga `/customer/bills`, `/customer/tickets`, `/customer/service`, dan `/customer/monitoring`
tidak lagi dibungkus `layouts/navbar.vue` (sidebar admin). Route `/offline` juga dikecualikan.

### Beranda (`/customer`)
0. **Sapaan** — "Selamat pagi/siang/sore/malam" + "Selamat datang, {nama depan}".
1. **Kartu tagihan utama** — merah bila ada tunggakan (total + jumlah tagihan), hijau bila lunas.
2. **Layanan Cepat** — 4 aksi: Bayar Tagihan · Lapor Gangguan · Ubah Paket · Monitoring.
3. **Paket Anda** — nama, biaya bulanan, terpasang sejak, alamat (grid 2 kolom).
4. **Informasi Perangkat** — hanya MAC & IP.
5. **Status Internet** — baris compact dengan tombol "Periksa".
6. **Tagihan Terakhir** — 3 item dengan badge status + link "Lihat semua".
7. **Muat Ulang Data** — tombol sekunder di paling bawah.

### Format harga
`helper/customerPortal.ts → formatRupiah()` menampilkan **tanpa desimal** (`Rp 150.000`).
`helper/currency.ts → formatIDR()` tetap dipakai halaman admin (dengan `,00`) karena menampilkan nilai ledger presisi.

### Tagihan (`/customer/bills`)
- Kartu ringkasan gradient: total tunggakan / "Semua tagihan lunas" + tombol refresh ikon.
- Daftar tagihan berbentuk **kartu** (bukan tabel) agar terbaca di layar HP: bulan + jatuh tempo, nominal besar, badge status, tombol **Bayar**/**Lunas** dan **Unduh**.

### Redirect login
- Sesi habis di `/customer/*` → `/customer/login` (bukan `/login` milik staf).
- Staf tetap diarahkan ke `/employee`.

---

## Struktur file baru

### Backend (`CRMLillyISPBE`)
```
internal/api/auth/waotp.go                              # OTP store + WA delivery
internal/api/auth/{request,service,handler,route}.go    # request-otp / verify-otp
internal/helpers/jwt.go                                 # pemisahan token customer/admin
internal/helpers/rbac.go                                # role CUSTOMER
internal/api/customer/dashboard/{request,repository,service,handler,route}.go
internal/api/customer/tickets/{request,repository,service,handler,route}.go
internal/api/customer/service_requests/{request,repository,service,route}.go
internal/api/customer/service_requests/admin_handler.go
internal/models/entities/customer_service_request_model.go
internal/config/database/auto_migrate.go                # + CustomerServiceRequest
internal/routes/route.go                                # registrasi route
```

### Frontend (`CRMLillyISPFE`)
```
api/customer/{auth,billing,tickets,service-request}.ts
helper/{customerPortal,invoicePdf}.ts
components/customer/{PortalShell,OtpLoginForm,PasswordLoginForm}.vue
pages/customer/login/index.vue                          # tab OTP + password
pages/customer/{bills,tickets,service}.vue
pages/offline.vue
plugins/offline-status.client.ts
scripts/generate-sw.mjs
public/icons/*.png
nuxt.config.ts                                          # pwa + runtimeConfig
```

