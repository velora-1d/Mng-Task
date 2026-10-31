# Bab 01: Koneksi & Konfigurasi

> **Tujuan Bab Ini**: Kamu bisa menghubungkan aplikasi ke database PostgreSQL dengan cara yang **aman** dan **benar**  tidak ada password yang bocor ke GitHub!

---

## Kenapa Ini Penting?

Bayangkan database itu seperti **gudang penyimpanan** milik kantor kamu.
Nah, untuk masuk ke gudang itu, kamu butuh **kunci** (username & password) dan tahu **alamatnya** (host & port).

Pertanyaannya: **di mana kamu simpan kunci itu?**

 Jangan disimpan langsung di dalam kode  kalau kodenya bocor ke internet, data kamu habis!  
 Simpan di file `.env`  file ini **tidak ikut di-upload ke GitHub**.

---

## Apa itu Connection String?

Connection string adalah **satu baris teks** yang berisi semua info yang dibutuhkan untuk konek ke database.

Format umumnya:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/NAMA_DATABASE
```

Contoh nyata dari proyek kita:

```env
# Tanda "#" = komentar di file .env, tidak dibaca sebagai variabel
# File: .env

# DATABASE_URL = nama variabel yang akan dibaca oleh aplikasi kita
# Nilai di sebelah kanan "=" adalah connection string-nya
DATABASE_URL=postgresql://DB-PGbase:password@100.77.202.57:5433/Mnj-Task?sslmode=disable
# # # driver DB   user:password       host (IP server) port database  opsi tambahan
```

Penjelasan tiap bagian:

| Bagian | Nilai | Artinya |
|--------|-------|---------|
| `postgresql://` |  | Jenis databasenya (PostgreSQL) |
| `DB-PGbase` | username | Nama user untuk login ke database |
| `password` | password | Kata sandi database (jaga kerahasiaannya!) |
| `100.77.202.57` | host | Alamat IP server database |
| `5433` | port | Pintu masuk (port default PostgreSQL adalah 5432) |
| `Mnj-Task` | database | Nama database yang akan dipakai |
| `sslmode=disable` | opsi | Nonaktifkan enkripsi SSL (aman untuk dev lokal, tapi aktifkan di production!) |

---

## Cara Aman Menyimpan Konfigurasi

### Langkah 1  Buat file `.env` di root proyek

```bash
# "touch" = perintah Linux/Mac untuk membuat file kosong baru
# Di Windows PowerShell, bisa pakai: New-Item .env
touch .env
```

Isi dengan:

```env
# Ganti USERNAME, PASSWORD, HOST, PORT, DATABASE_NAME dengan nilai asli kamu
DATABASE_URL=postgresql://username:password@localhost:5432/mnj_task
# # # localhost = database ada di komputer sendiri
# 5432 = port default PostgreSQL
```

### Langkah 2  Pastikan `.env` masuk ke `.gitignore`

```gitignore
# File: .gitignore
# Setiap baris = pola file/folder yang TIDAK mau di-upload ke Git

.env              # File utama environment (berisi password asli!)
.env.local        # File env untuk development lokal
.env.production   # File env untuk server production
```

>  **Ingat!** Kalau `.env` tidak ada di `.gitignore`, password kamu bisa kepublish ke GitHub. Ini sudah banyak kejadian dan menyebabkan data bocor!

### Langkah 3  Buat file `.env.example` untuk dokumentasi

File `.env.example` adalah **template kosong** yang boleh di-upload ke GitHub, supaya developer lain tahu variabel apa yang dibutuhkan.

```env
# File: .env.example (ini AMAN untuk di-commit ke Git!)
# Developer baru: copy file ini, rename jadi ".env", lalu isi nilainya

# Isi dengan connection string database kamu
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

---

## Apa itu Connection Pool?

Kalau aplikasi kamu cuma kamu yang pakai, 1 koneksi database sudah cukup.

Tapi kalau aplikasinya dipakai **banyak orang sekaligus**, kamu butuh banyak koneksi. Di sinilah **Connection Pool** berperan.

### Analogi Mudah:

Bayangkan **loket bank** yang punya 10 teller. Ketika ada 100 nasabah datang sekaligus, nasabah antri dan menunggu teller tersedia.

- **Connection = 1 teller**  bisa layani 1 permintaan dalam satu waktu.
- **Connection Pool = semua teller**  bisa layani banyak permintaan secara paralel.

### Konfigurasi Pool yang Umum:

```javascript
// "new Pool()" = membuat pool koneksi baru
// Pool adalah "kolam" koneksi siap pakai yang dikelola otomatis
const pool = new Pool({

  // Baca DATABASE_URL dari file .env
  // process.env = cara Node.js membaca variabel dari file .env
  connectionString: process.env.DATABASE_URL,

  // max = jumlah MAKSIMAL koneksi yang boleh dibuka sekaligus
  // Kalau semua 10 koneksi sedang dipakai, request berikutnya harus antri
  max: 10,

  // idleTimeoutMillis = berapa lama (dalam milidetik) koneksi yang tidak dipakai
  //   akan otomatis ditutup untuk hemat resource
  // 30000ms = 30 detik
  idleTimeoutMillis: 30000,

  // connectionTimeoutMillis = berapa lama aplikasi menunggu koneksi tersedia
  //   sebelum menyerah dan throw error
  // 2000ms = 2 detik
  connectionTimeoutMillis: 2000,
});
```

---

## Checklist Bab Ini

Sebelum lanjut ke bab berikutnya, pastikan kamu sudah:

- [ ] Punya file `.env` berisi `DATABASE_URL`
- [ ] File `.env` sudah masuk ke `.gitignore`
- [ ] Punya file `.env.example` sebagai panduan untuk developer lain
- [ ] Paham anatomi connection string (host, port, user, dbname)
- [ ] Tahu bedanya single connection vs connection pool

---

## Lanjut ke Bab Berikutnya

 [Bab 02: Strategi Akses Data](../02-strategi-akses-data/README.md)  Kita pilih cara terbaik untuk "ngobrol" dengan database: Raw SQL, Query Builder, atau ORM?
