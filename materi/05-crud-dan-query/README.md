# Bab 05: CRUD & Query Lanjutan

> **Tujuan Bab Ini**: Kamu bisa melakukan operasi **Create, Read, Update, Delete** pada database, plus teknik query yang lebih canggih seperti filtering, sorting, dan pagination.

---

## Apa itu CRUD?

CRUD adalah 4 operasi dasar yang hampir selalu ada di setiap aplikasi:

| Huruf | Operasi | SQL | HTTP Method |
|-------|---------|-----|-------------|
| **C** | Create (Buat) | `INSERT` | POST |
| **R** | Read (Baca) | `SELECT` | GET |
| **U** | Update (Ubah) | `UPDATE` | PUT / PATCH |
| **D** | Delete (Hapus) | `DELETE` | DELETE |

---

## CREATE  Buat Data Baru

### Buat task baru

```sql
-- "INSERT INTO nama_tabel (kolom1, kolom2, ...)"
--   = tentukan kolom mana saja yang mau diisi
--   (kolom yang tidak disebutkan akan terisi DEFAULT-nya, misal: id, created_at)
INSERT INTO tasks (title, status, priority, project_id, created_by)

-- "VALUES (...)"
--   = nilai yang akan dimasukkan, urutannya harus sama dengan urutan kolom di atas
--   $1, $2 = placeholder  nilai aslinya dikirim dari aplikasi (aman dari SQL Injection!)
VALUES ('Desain halaman login', 'TODO', 'HIGH', $1, $2)

-- "RETURNING *"
--   = setelah INSERT berhasil, kembalikan SEMUA kolom dari baris yang baru diinsert
--   Tanpa ini: kamu tidak tahu id, created_at, dll yang di-generate otomatis
--   Dengan ini: langsung dapat data lengkap tanpa harus SELECT lagi (lebih efisien!)
RETURNING *;
```

Kenapa pakai `RETURNING *`? Supaya kamu langsung dapat data lengkapnya (termasuk `id` dan `created_at` yang di-generate otomatis) **tanpa harus SELECT lagi** setelahnya. Efisien!

### Buat task sekaligus assign label (transaksi)

```sql
-- Ini akan kita bahas lebih dalam di Bab 06 (Transaksi)

-- "BEGIN" = mulai transaksi  semua perintah setelah ini dianggap 1 kesatuan
BEGIN;

  -- Insert task dulu
  INSERT INTO tasks (id, title, project_id, created_by)
  VALUES ('...', 'Task baru', '...', '...');

  -- Baru insert relasi label-nya
  -- Ini aman karena dalam 1 transaksi  kalau yang ini gagal, INSERT task di atas juga dibatalkan
  INSERT INTO task_labels (task_id, label_id)
  VALUES ('...', '...');

-- "COMMIT" = simpan semua perubahan sekaligus (baru benar-benar tersimpan di database)
COMMIT;
```

---

## READ  Baca Data

### Ambil semua task dalam 1 project

```sql
-- "SELECT kolom1, kolom2, ..."
--   = pilih kolom mana saja yang mau ditampilkan
-- "t.id" artinya kolom "id" dari tabel yang di-alias "t" (yaitu tabel tasks)
-- Ini penting kalau ada kolom dengan nama sama di 2 tabel yang di-JOIN
SELECT
  t.id,           -- ID task
  t.title,        -- Judul task
  t.status,       -- Status task (TODO/IN_PROGRESS/dll)
  t.priority,     -- Prioritas task
  t.due_date,     -- Tanggal deadline
  u.name AS assignee_name  -- Nama assignee dari tabel users
  --             
  -- "AS assignee_name" = beri nama alias untuk kolom ini di hasil query
  -- Tanpa alias, hasilnya hanya "name"  bisa membingungkan karena tasks juga punya field name

-- "FROM tasks t" = ambil data dari tabel tasks, beri alias "t" supaya lebih singkat
FROM tasks t

-- "LEFT JOIN users u ON ..."
--   = gabungkan dengan tabel users (alias "u")
--   Kondisi penggabungan: assignee_id di tasks harus sama dengan id di users
--
-- "LEFT JOIN" vs "JOIN" (INNER JOIN):
--   LEFT JOIN  = tampilkan SEMUA baris dari tabel kiri (tasks), walau tidak ada pasangan di tabel kanan (users)
--                 Task yang belum di-assign (assignee_id = NULL) tetap muncul, assignee_name-nya NULL
--   INNER JOIN = hanya tampilkan baris yang PUNYA PASANGAN di kedua tabel
--                 Task yang belum di-assign tidak akan muncul sama sekali (hilang dari hasil!)
LEFT JOIN users u ON t.assignee_id = u.id

-- "WHERE" = filter, hanya ambil task yang project_id-nya sama dengan $1
-- $1 = nilai yang dikirim dari aplikasi (ID project yang mau ditampilkan)
WHERE t.project_id = $1

-- "ORDER BY t.created_at DESC" = urutkan berdasarkan waktu dibuat
-- DESC = descending = terbaru dulu (kalau mau terlama dulu, ganti dengan ASC)
ORDER BY t.created_at DESC;
```

>  `LEFT JOIN` dipakai karena `assignee_id` bisa NULL  kita tetap mau tampilkan task walau belum ada yang di-assign.

### Ambil detail 1 task beserta labels dan komentar

```sql
-- Query 1: Ambil task + info assignee
SELECT
  t.*,                    -- Semua kolom dari tabel tasks
  u.name  AS assignee_name,  -- Nama user yang di-assign (bisa NULL)
  u.email AS assignee_email  -- Email user yang di-assign (bisa NULL)
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
WHERE t.id = $1;          -- $1 = ID task yang dicari


-- Query 2: Ambil label-label yang dipasang ke task ini
SELECT
  l.id,    -- ID label
  l.name,  -- Nama label (misal: "Bug", "Feature")
  l.color  -- Warna label dalam format hex (#RRGGBB)
FROM labels l
-- "JOIN" (INNER JOIN) di sini karena kita memang hanya mau label yang terhubung ke task ini
JOIN task_labels tl ON l.id = tl.label_id   -- Hubungkan labels dengan junction table
WHERE tl.task_id = $1;   -- Filter: hanya label yang terhubung ke task ini


-- Query 3: Ambil komentar-komentar di task ini
SELECT
  c.*,                    -- Semua kolom dari tabel comments
  u.name AS author_name   -- Nama user yang menulis komentar
FROM comments c
JOIN users u ON c.author_id = u.id   -- Gabungkan dengan users untuk dapat nama author
WHERE c.task_id = $1     -- Filter: hanya komentar untuk task ini
ORDER BY c.created_at ASC; -- ASC = terlama dulu (komentar pertama tampil paling atas)
```

---

## Filtering & Sorting (Query Lanjutan)

Ini yang bikin aplikasi kamu terasa profesional  bisa filter dan urutkan data sesuai kebutuhan user.

### Filter multi-kriteria

```sql
SELECT * FROM tasks
WHERE
  -- Filter 1: task harus ada di project yang diminta
  project_id = $1

  -- "AND" = kondisi tambahan  SEMUA kondisi harus terpenuhi
  AND status = 'TODO'    -- Filter 2: hanya task yang belum dikerjakan

  AND priority = 'HIGH'  -- Filter 3: hanya task dengan prioritas tinggi

  -- "NOW()" = waktu sekarang
  -- "INTERVAL '7 days'" = durasi 7 hari
  -- "NOW() + INTERVAL '7 days'" = 7 hari dari sekarang
  -- "<=" = kurang dari atau sama dengan
  -- Jadi: due_date harus sebelum atau tepat 7 hari dari sekarang
  AND due_date <= NOW() + INTERVAL '7 days'

  AND assignee_id = $2   -- Filter 4: hanya task yang di-assign ke user tertentu

-- ORDER BY bisa pakai banyak kolom, dipisah koma
-- priority DESC = yang paling urgent muncul duluan
-- due_date ASC  = di antara yang sama prioritasnya, yang deadlinenya paling dekat duluan
ORDER BY priority DESC, due_date ASC;
```

### Filter dinamis (kondisional)

Kadang user mungkin tidak memilih semua filter. Cara aman menangani ini:

```sql
SELECT * FROM tasks
WHERE
  -- Filter project selalu aktif (wajib)
  project_id = $1

  -- Trik filter opsional: "$2::task_status IS NULL OR status = $2"
  -- Cara bacanya:
  --   Kalau $2 bernilai NULL (user tidak pilih filter status)  kondisi selalu TRUE  filter diabaikan
  --   Kalau $2 ada nilainya (misal 'TODO')                    cek apakah status = 'TODO'
  --
  -- "$2::task_status" = cast/konversi $2 ke tipe ENUM task_status
  --   Ini diperlukan agar PostgreSQL tahu tipe data $2 yang diharapkan
  AND ($2::task_status   IS NULL OR status      = $2)   -- Filter status (opsional)
  AND ($3::task_priority IS NULL OR priority    = $3)   -- Filter priority (opsional)
  AND ($4::UUID          IS NULL OR assignee_id = $4);  -- Filter assignee (opsional)
```

---

## Pagination: Membagi Data Jadi Halaman

Kalau ada ribuan task, kita tidak mau load semua sekaligus  lemot!

### Cara 1: Offset Pagination (Klasik)

```sql
-- Halaman 1: ambil 10 data pertama
SELECT * FROM tasks WHERE project_id = $1
ORDER BY created_at DESC
-- "LIMIT 10"  = maksimal 10 baris yang dikembalikan
-- "OFFSET 0"  = lewati 0 baris dari awal (mulai dari baris pertama)
LIMIT 10 OFFSET 0;

-- Halaman 2: ambil 10 data berikutnya (lewati 10 pertama)
SELECT * FROM tasks WHERE project_id = $1
ORDER BY created_at DESC
LIMIT 10 OFFSET 10; -- Lewati 10 baris pertama (yang sudah tampil di halaman 1)

-- Formula untuk halaman ke-N:
-- OFFSET = (nomor_halaman - 1) * jumlah_per_halaman
-- Halaman 3: OFFSET = (3-1) * 10 = 20
```

**Kekurangan**: Kalau ada data baru masuk di tengah pagination, urutan bisa kacau.

### Cara 2: Cursor Pagination (Modern, Direkomendasikan)

```sql
-- Halaman pertama  sama seperti biasa
SELECT * FROM tasks WHERE project_id = $1
ORDER BY created_at DESC
LIMIT 10;
-- Setelah ini: simpan "cursor" = nilai created_at dari item TERAKHIR yang ditampilkan

-- Halaman berikutnya: pakai cursor sebagai "titik sambung"
SELECT * FROM tasks
WHERE
  project_id = $1
  -- Ambil task yang created_at-nya LEBIH LAMA dari task terakhir yang sudah ditampilkan
  -- "<" = lebih kecil dari (karena kita ORDER BY DESC, yang lebih kecil = yang lebih lama)
  -- $2  = cursor (nilai created_at dari item terakhir di halaman sebelumnya)
  AND created_at < $2
ORDER BY created_at DESC
LIMIT 10;
-- Ulangi: simpan cursor baru dari item terakhir, gunakan untuk halaman berikutnya
```

**Keunggulan**: Tidak kacau walau ada data baru, dan lebih cepat untuk tabel yang besar.

---

## UPDATE  Ubah Data

### Update status task

```sql
-- "UPDATE nama_tabel" = perbarui data di tabel tersebut
UPDATE tasks

-- "SET kolom = nilai" = tentukan kolom mana yang mau diubah dan nilai barunya
SET
  status = $2,        -- $2 = status baru yang dikirim dari aplikasi
  updated_at = NOW()  -- Selalu update timestamp ini saat ada perubahan data!

-- "WHERE id = $1" = WAJIB ADA! Tanpa WHERE, semua baris di tabel akan ikut ter-update!
-- $1 = ID task yang mau diupdate
WHERE id = $1

-- Sama seperti INSERT, RETURNING * mengembalikan data terbaru setelah diupdate
-- Supaya kamu langsung dapat data terkini tanpa harus SELECT lagi
RETURNING *;
```

### Update partial (hanya kolom yang berubah)

```sql
-- Teknik ini berguna untuk endpoint PATCH (update sebagian field)
-- User mungkin hanya mau update title saja, atau priority saja
UPDATE tasks
SET
  -- "COALESCE(nilai_baru, nilai_lama)"
  --   = ambil nilai_baru kalau tidak NULL, kalau NULL ambil nilai_lama (tidak berubah)
  --
  -- Cara kerjanya:
  --   Kalau $2 ada isinya (misal: "Judul baru")  title = "Judul baru"
  --   Kalau $2 = NULL (user tidak mau ubah title)  title = title (nilai lama, tidak berubah)
  title       = COALESCE($2, title),       -- Update title jika $2 tidak NULL
  description = COALESCE($3, description), -- Update description jika $3 tidak NULL
  priority    = COALESCE($4, priority),    -- Update priority jika $4 tidak NULL
  due_date    = COALESCE($5, due_date),    -- Update due_date jika $5 tidak NULL
  updated_at  = NOW()                      -- Selalu update waktu perubahan
WHERE id = $1   -- Hanya update task dengan ID ini
RETURNING *;    -- Kembalikan data terbaru setelah diupdate
```

---

## DELETE  Hapus Data

### Soft Delete vs Hard Delete

**Hard Delete**  Data benar-benar dihapus dari database:

```sql
-- "DELETE FROM nama_tabel WHERE ..."
--  HATI-HATI: Tanpa WHERE, SEMUA data di tabel akan terhapus!
-- Data yang di-DELETE tidak bisa dikembalikan (kecuali dari backup)
DELETE FROM tasks WHERE id = $1; -- $1 = ID task yang mau dihapus
```

**Soft Delete**  Data tidak dihapus, hanya ditandai sebagai "terhapus":

```sql
-- Langkah 1: Tambah kolom deleted_at ke tabel tasks (lewat migration!)
-- "ALTER TABLE" = ubah struktur tabel yang sudah ada
-- "ADD COLUMN deleted_at TIMESTAMPTZ" = tambah kolom baru, boleh NULL (belum dihapus = NULL)
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ;

-- Langkah 2: "Hapus" task  sebenarnya cuma tandai dengan waktu penghapusan
-- Ini UPDATE biasa, bukan DELETE! Data aslinya masih ada di database.
UPDATE tasks
SET deleted_at = NOW() -- Isi kolom deleted_at dengan waktu sekarang sebagai tanda "terhapus"
WHERE id = $1;

-- Langkah 3: SETIAP query SELECT harus ditambah filter ini!
-- "deleted_at IS NULL" = hanya ambil data yang BELUM ditandai terhapus
SELECT * FROM tasks
WHERE
  deleted_at IS NULL  --  Filter ini WAJIB ada di setiap query, jangan sampai lupa!
  AND project_id = $1;
```

**Kapan pakai Soft Delete?**
-  Kalau user mungkin mau kembalikan data yang terhapus (fitur "Trash")
-  Kalau butuh audit trail (siapa menghapus apa dan kapan)
-  Kalau data memang tidak perlu dikembalikan dan tabel sudah sangat besar

---

## Checklist Bab Ini

- [ ] Bisa tulis query INSERT dengan `RETURNING *`
- [ ] Bisa tulis SELECT dengan JOIN untuk data yang berelasi
- [ ] Paham cara kerja filter dinamis
- [ ] Mengerti perbedaan Offset Pagination vs Cursor Pagination
- [ ] Tahu perbedaan Soft Delete vs Hard Delete

---

## Lanjut ke Bab Berikutnya

 [Bab 06: Transaksi & Keamanan](../06-transaksi-dan-keamanan/README.md)  Pastikan operasi database kamu aman dari kegagalan di tengah jalan dan dari ancaman SQL Injection!
