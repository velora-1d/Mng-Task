# Bab 06: Transaksi & Keamanan

> **Tujuan Bab Ini**: Kamu bisa melindungi data dari **kegagalan operasi di tengah jalan** (transaksi), dan melindungi database dari **serangan SQL Injection** (keamanan).

---

## Part 1: Database Transaction (Transaksi) 

## Kenapa Kita Butuh Transaksi?

Bayangkan kamu beli tiket konser online. Prosesnya:

1.  Kurangi stok tiket dari database
2.  Proses pembayaran ke payment gateway
3.  Catat transaksi pembelian
4.  Kirim email konfirmasi

Sekarang, bayangkan kalau **langkah 1 berhasil** tapi **langkah 2 gagal** (timeout dari payment gateway).

Tanpa transaksi: stok tiket sudah berkurang, tapi pembayaran tidak berhasil. **Data jadi tidak konsisten!**

Dengan transaksi: semua langkah dianggap satu kesatuan. Kalau salah satu gagal, **semua dibatalkan** (rollback).

---

## Prinsip ACID

Transaksi database mengikuti prinsip **ACID**:

| Huruf | Nama | Artinya (Bahasa Mudah) |
|-------|------|------------------------|
| **A** | Atomicity | Semua berhasil, atau semua dibatalkan. Tidak ada "setengah-setengah". |
| **C** | Consistency | Data selalu dalam keadaan valid. Aturan bisnis tidak pernah dilanggar. |
| **I** | Isolation | Transaksi yang berjalan bersamaan tidak saling mengganggu. |
| **D** | Durability | Kalau sudah COMMIT, data aman tersimpan walau server mati. |

---

## Cara Pakai Transaksi di SQL

```sql
-- "BEGIN" = mulai transaksi
-- Semua perintah SQL setelah BEGIN dianggap satu paket / satu kesatuan
-- Belum benar-benar tersimpan ke database sampai ada COMMIT
BEGIN;

  -- Langkah 1: Buat task baru
  -- Ini belum tersimpan permanen, baru "disimpan sementara"
  INSERT INTO tasks (id, title, project_id, created_by)
  VALUES ('task-uuid', 'Setup server baru', 'project-uuid', 'user-uuid');

  -- Langkah 2: Assign label ke task tersebut
  -- "Assign" = menugaskan / menetapkan / menghubungkan
  --   Di sini artinya: pasangkan/tempelkan label ke task ini
  -- Kalau langkah ini gagal (misal: label-uuid tidak ditemukan),
  -- maka langkah 1 di atas juga akan otomatis DIBATALKAN
  INSERT INTO task_labels (task_id, label_id)
  VALUES ('task-uuid', 'label-uuid');

  -- Langkah 3: Tambah komentar awal
  INSERT INTO comments (content, task_id, author_id)
  VALUES ('Task ini dibuat otomatis oleh sistem.', 'task-uuid', 'user-uuid');

-- "COMMIT" = konfirmasi semua perubahan  baru benar-benar tersimpan ke database
-- Kalau semua langkah di atas berhasil, data baru tersimpan permanen di sini
COMMIT;
```

Kalau ada error di salah satu langkah:

```sql
-- "ROLLBACK" = batalkan semua perubahan sejak BEGIN
-- Database kembali ke keadaan persis sebelum BEGIN dijalankan
-- Tidak ada data yang berubah sama sekali
ROLLBACK;
```

---

## Transaksi dalam Kode Aplikasi

```javascript
// Contoh pakai Node.js dengan library 'pg' (node-postgres)

// "pool.connect()" = ambil 1 koneksi dari pool untuk dipakai eksklusif
// Kenapa perlu koneksi eksklusif? Karena transaksi harus dijalankan
// di koneksi yang SAMA dari BEGIN sampai COMMIT/ROLLBACK
const client = await pool.connect();

// "try...catch...finally" = pola penanganan error di JavaScript
try {
  // Kirim perintah "BEGIN" ke database lewat koneksi ini
  // Sekarang semua query berikutnya pada koneksi ini masuk ke dalam transaksi
  await client.query('BEGIN');

  // Langkah 1: Insert task  hasilnya disimpan di variabel taskResult
  const taskResult = await client.query(
    // Template literal (backtick) = bisa tulis SQL multi-baris
    // RETURNING id = hanya kembalikan kolom id, tidak perlu semua kolom
    `INSERT INTO tasks (title, project_id, created_by)
     VALUES ($1, $2, $3) RETURNING id`,
    [title, projectId, userId]  // $1=title, $2=projectId, $3=userId
  );
  // Ambil id dari baris yang baru diinsert
  // .rows[0] = baris pertama (dan satu-satunya) dari hasil query
  // .id = ambil kolom "id" dari baris tersebut
  const taskId = taskResult.rows[0].id;

  // Langkah 2: Assign labels  bisa banyak label sekaligus
  // "Assign" di sini = pasangkan / tempelkan label ke task
  //   (menyimpan relasi task  label di tabel task_labels)
  // "for...of" = loop untuk setiap labelId dalam array labelIds
  for (const labelId of labelIds) {
    await client.query(
      'INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)',
      [taskId, labelId]  // $1=taskId, $2=labelId
    );
  }

  // Semua langkah berhasil  simpan perubahan permanen ke database
  await client.query('COMMIT');

  // Kembalikan data task yang baru dibuat (untuk response ke user)
  return taskResult.rows[0];

} catch (error) {
  // Ada error di salah satu langkah  batalkan SEMUA perubahan
  // Database kembali ke keadaan sebelum BEGIN
  await client.query('ROLLBACK');

  // Lempar error ke atas supaya bisa ditangani di level yang lebih tinggi
  throw error;

} finally {
  // "finally" = selalu dijalankan, baik berhasil (try) maupun gagal (catch)
  // "client.release()" = WAJIB! Kembalikan koneksi ke pool supaya bisa dipakai oleh request lain
  // Kalau lupa ini, lama-lama pool koneksi habis dan aplikasi tidak bisa konek ke DB!
  client.release();
}
```

>  **Jangan lupa `client.release()`!** Kalau tidak, koneksi tidak pernah kembali ke pool dan lama-lama pool koneksinya habis.

---

---

## Part 2: Keamanan Database 

## Apa itu SQL Injection?

SQL Injection adalah **serangan** di mana penyerang menyisipkan perintah SQL jahat melalui input yang kamu terima dari user.

### Contoh Serangan:

Misalnya kamu punya kode seperti ini (**JANGAN PERNAH LAKUKAN INI!**):

```javascript
//  SANGAT BERBAHAYA! Jangan pernah gabungkan input user langsung ke string SQL!

// Misalnya user mengetik ini di form login:
const email = req.body.email; // Input: admin@example.com' OR '1'='1

// Template literal langsung memasukkan nilai email ke dalam SQL tanpa filter apapun
const query = `SELECT * FROM users WHERE email = '${email}'`;

// Query yang SEBENARNYA dijalankan di database:
// SELECT * FROM users WHERE email = 'admin@example.com' OR '1'='1'
//                                                          
//                                 Kondisi ini SELALU TRUE  database return SEMUA user!
// Penyerang bisa login tanpa tahu password apapun!
```

Serangan yang lebih berbahaya lagi:

```sql
-- Kalau input user: '; DROP TABLE users; --
-- Maka query yang dijalankan jadi:
SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
--                                                      
--                          perintah kedua: hapus         -- = komentar SQL, abaikan sisanya
--                          SELURUH tabel users!
--  Semua data user HILANG selamanya!
```

### Solusi: Parameterized Query

```javascript
//  CARA YANG BENAR DAN AMAN

// Input berbahaya yang sama:
const email = req.body.email; // Input: admin@example.com' OR '1'='1

const result = await pool.query(
  // SQL dengan $1 sebagai PLACEHOLDER  bukan string biasa yang disambung
  // Library pg akan memisahkan SQL dan data secara ketat
  'SELECT * FROM users WHERE email = $1',

  // Nilai asli dikirim TERPISAH dari SQL-nya, dalam bentuk array
  // Library secara otomatis "escape" semua karakter berbahaya
  [email]
);

// Query yang SEBENARNYA dijalankan di database (setelah di-escape):
// SELECT * FROM users WHERE email = 'admin@example.com'' OR ''1''=''1'
//                                    
//                   Tanda kutip berbahaya di-escape jadi '' (2 kutip = karakter kutip literal)
//                   Seluruh input dianggap string biasa, bukan SQL command!
//  Tidak ada user yang ditemukan (email tidak cocok), serangan GAGAL!
```

**Aturan Emas**: **TIDAK PERNAH** memasukkan input user langsung ke dalam string SQL. Selalu gunakan parameterized query (`$1`, `$2`, ...).

---

## Prinsip Keamanan Database Lainnya

### 1. Jangan Simpan Password Plain Text!

```javascript
//  BERBAHAYA  kalau database bocor, semua password langsung terbaca!
await pool.query(
  'INSERT INTO users (password) VALUES ($1)',
  [password]  // password = "rahasia123"  tersimpan apa adanya di DB
);

//  AMAN  hash dulu sebelum disimpan
// "bcrypt.hash(password, 10)"
//   = enkripsi password menggunakan algoritma bcrypt
//   Angka 10 = "cost factor" / jumlah iterasi  semakin besar, semakin lambat di-crack
//   Hasilnya: "$2b$10$AbCdEfGhIjKlMnOpQrStUv..." (string acak yang tidak bisa di-decode balik)
const hashedPassword = await bcrypt.hash(password, 10);

await pool.query(
  'INSERT INTO users (password) VALUES ($1)',
  [hashedPassword]  // Yang disimpan adalah hash-nya, bukan password asli
);
// Cara verifikasi saat login: bcrypt.compare(inputPassword, hashedPassword)
```

### 2. Prinsip Least Privilege (Izin Minimum)

Database user yang dipakai aplikasi sebaiknya hanya punya izin yang **dia butuhkan saja**:

```sql
-- "CREATE USER" = buat user baru di PostgreSQL (berbeda dari tabel users aplikasi kita!)
-- Ini adalah user untuk login ke database server itu sendiri
CREATE USER app_user WITH PASSWORD 'strong_password';

-- "GRANT ... ON ... TO ..." = berikan izin/hak akses
-- Izin yang diberikan: SELECT, INSERT, UPDATE, DELETE (operasi data biasa)
-- Tidak ada CREATE, DROP, ALTER (operasi struktur database)  itu hanya untuk admin!
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Dengan begini:
--   Kalau aplikasi kena hack, penyerang TIDAK BISA hapus tabel atau buat tabel baru
--   Kerusakan yang bisa dilakukan jauh lebih terbatas
```

### 3. Validasi Input Sebelum ke Database

```javascript
// Validasi di layer APLIKASI (bukan hanya mengandalkan constraint di database)
// Tujuannya: berikan pesan error yang jelas ke user SEBELUM menyentuh database
function validateCreateTask(input) {

  // Cek apakah title ada dan tidak kosong (setelah di-trim/hilangkan spasi)
  // "!" = NOT, "||" = OR
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Title tidak boleh kosong');
  }

  // Cek panjang maksimal title (sesuai definisi kolom VARCHAR(500) di schema.sql)
  if (input.title.length > 500) {
    throw new Error('Title maksimal 500 karakter');
  }

  // Cek apakah nilai status valid (sesuai dengan ENUM task_status di database)
  const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  // "&&" = AND  cek hanya kalau status diisi, kalau tidak diisi lewati (pakai default)
  // "!validStatuses.includes()" = status tidak ada dalam daftar yang valid
  if (input.status && !validStatuses.includes(input.status)) {
    throw new Error('Status tidak valid');
  }
  // Tambah validasi lain sesuai kebutuhan...
}
```

---

## Checklist Bab Ini

- [ ] Paham kenapa transaksi penting (ACID, atomicity)
- [ ] Bisa tulis `BEGIN`, `COMMIT`, dan `ROLLBACK`
- [ ] Tahu cara implementasi transaksi di kode aplikasi
- [ ] Paham apa itu SQL Injection dan cara mencegahnya
- [ ] Selalu pakai parameterized query, tidak pernah string concatenation
- [ ] Tidak pernah simpan password plain text

---

## Lanjut ke Bab Berikutnya

 [Bab 07: Best Practices & Monitoring](../07-best-practices-dan-monitoring/README.md)  Tips-tips pro untuk membuat kode database kamu lebih bersih, mudah diuji, dan mudah dipantau di production!
