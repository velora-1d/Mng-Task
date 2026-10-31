# Bab 03: Skema & Relasi Tabel

> **Tujuan Bab Ini**: Kamu bisa merancang struktur tabel yang **tepat dan rapi** untuk aplikasi Task Management  termasuk hubungan antar tabel dan pemilihan tipe data yang benar.

---

## Kenapa Desain Skema Itu Penting?

Skema database itu seperti **fondasi rumah**. Kalau fondasi kamu miring dari awal, susah banget dibenerin nanti.

Desain yang buruk bisa menyebabkan:
-  Query lambat karena struktur tidak optimal
-  Data duplikat dan tidak konsisten
-  Susah tambah fitur baru karena tabel terlalu kaku

---

## Entitas Utama di Task Management

Ini adalah tabel-tabel inti yang kita butuhkan:

```
users           Siapa yang punya akun?
projects        Wadah kumpulan tasks (seperti "folder proyek")
tasks           Task/tugas itu sendiri
labels          Kategori/tag untuk task (bisa banyak per task)
task_labels     Tabel penghubung antara tasks & labels (many-to-many)
comments        Komentar di dalam sebuah task
```

---

## Struktur Tabel Lengkap

### Tabel `users`

```sql
-- "CREATE TABLE" = perintah untuk membuat tabel baru
-- Di dalam tanda kurung () adalah daftar kolom + aturannya
CREATE TABLE users (

  -- UUID   = ID unik berformat: 550e8400-e29b-41d4-a716-446655440000
  --          Tidak bisa ditebak urutannya (beda dari angka 1,2,3...)
  -- PRIMARY KEY         = kolom ini adalah "nomor KTP"-nya tabel  wajib unik & tidak boleh kosong
  -- DEFAULT gen_random_uuid() = otomatis buat UUID baru tiap kali INSERT data baru
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- VARCHAR(255) = teks dengan panjang MAKSIMAL 255 karakter
  -- NOT NULL     = kolom ini WAJIB diisi, tidak boleh kosong/NULL
  name        VARCHAR(255) NOT NULL,

  -- UNIQUE   = tidak boleh ada 2 baris dengan nilai email yang sama
  --            Database otomatis tolak jika email sudah terdaftar
  email       VARCHAR(255) UNIQUE NOT NULL,

  --  PENTING: Selalu hash password sebelum disimpan! (pakai bcrypt/argon2)
  --             Jangan pernah simpan plain text seperti "password123"
  password    VARCHAR(255) NOT NULL,

  -- TIMESTAMPTZ = Timestamp WITH Time Zone (tanggal + jam + info timezone)
  -- DEFAULT NOW() = otomatis isi dengan waktu SEKARANG saat data di-INSERT
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- updated_at perlu di-update MANUAL di kode setiap kali data diubah
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Tabel `projects`

```sql
CREATE TABLE projects (

  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  name        VARCHAR(255) NOT NULL,

  -- TEXT    = teks TANPA batas panjang (bisa ribuan karakter)
  --           Cocok untuk deskripsi yang panjang
  -- Tanpa NOT NULL = kolom ini BOLEH kosong/NULL (opsional)
  description TEXT,

  -- REFERENCES users(id) = FOREIGN KEY  kolom ini "menunjuk" ke kolom id di tabel users
  --   Artinya: setiap project WAJIB punya owner yang ada di tabel users
  --   Database TOLAK jika kita isi owner_id dengan UUID yang tidak ada
  --
  -- ON DELETE CASCADE = kalau user (pemilik) dihapus dari tabel users,
  --   maka semua project miliknya IKUT TERHAPUS otomatis
  owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Tabel `tasks`

```sql
-- =============================================
-- APA ITU "CREATE TYPE ... AS ENUM"?
-- =============================================
-- ENUM (Enumeration) = tipe data dengan nilai yang TERBATAS pada pilihan tertentu
--   Mirip seperti dropdown di form: hanya boleh pilih dari opsi yang ada
--   Database otomatis TOLAK nilai lain selain yang terdaftar di ENUM
--
-- Keuntungan ENUM vs VARCHAR biasa:
--    Validasi otomatis di level database (tidak bisa salah ketik nilai)
--    Lebih hemat storage
--    Kalau mau tambah nilai baru, butuh ALTER TYPE (perlu migration)

-- Buat tipe ENUM untuk status task  hanya 4 pilihan yang valid:
CREATE TYPE task_status AS ENUM (
  'TODO',         -- Belum mulai dikerjakan
  'IN_PROGRESS',  -- Sedang dikerjakan
  'IN_REVIEW',    -- Menunggu di-review / di-approve
  'DONE'          -- Selesai!
);

-- Buat tipe ENUM untuk prioritas task:
CREATE TYPE task_priority AS ENUM (
  'LOW',    -- Tidak mendesak
  'MEDIUM', -- Normal (nilai default)
  'HIGH',   -- Penting
  'URGENT'  -- Harus segera dikerjakan!
);

CREATE TABLE tasks (

  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Judul task, bisa sampai 500 karakter
  title        VARCHAR(500)  NOT NULL,

  -- Deskripsi panjang task (boleh kosong)
  description  TEXT,

  -- Memakai tipe ENUM "task_status" yang baru saja kita buat di atas
  -- DEFAULT 'TODO' = kalau tidak diisi saat INSERT, otomatis 'TODO'
  status       task_status   NOT NULL DEFAULT 'TODO',

  -- Memakai tipe ENUM "task_priority"
  priority     task_priority NOT NULL DEFAULT 'MEDIUM',

  -- DATE = hanya tanggal (YYYY-MM-DD), TANPA informasi jam
  --        Berbeda dengan TIMESTAMP yang menyimpan tanggal + jam
  -- Boleh NULL = task belum punya deadline
  due_date     DATE,

  -- Setiap task WAJIB berada di dalam sebuah project
  -- ON DELETE CASCADE = kalau project dihapus, semua task-nya ikut terhapus
  project_id   UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- assignee_id = siapa yang ditugaskan mengerjakan task ini
  -- "assign" = menugaskan / menetapkan tugas ke orang
  -- "assignee" = orang yang menerima tugas tersebut
  -- Boleh NULL = task belum di-assign (belum ada yang ngerjain)
  -- ON DELETE SET NULL = kalau user yang ditugaskan dihapus akunnya,
  --   kolom ini jadi NULL (task tetap ada, cuma jadi belum ada yang ngerjain)
  assignee_id  UUID          REFERENCES users(id) ON DELETE SET NULL,

  -- Siapa yang membuat task  WAJIB diisi
  -- Tidak pakai ON DELETE  default perilaku adalah RESTRICT
  --   (user tidak bisa dihapus kalau masih ada task yang dia buat)
  created_by   UUID          NOT NULL REFERENCES users(id),

  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Tabel `labels`

```sql
CREATE TABLE labels (

  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nama label, misal: "Bug", "Feature", "Perlu Diskusi"
  name       VARCHAR(100) NOT NULL,

  -- Warna label dalam format HEX: #RRGGBB (Merah-Hijau-Biru)
  --   VARCHAR(7) = cukup untuk 1 '#' + 6 karakter hex
  --   Contoh: '#EF4444' = merah, '#3B82F6' = biru, '#10B981' = hijau
  --   DEFAULT '#3B82F6' = warna biru kalau tidak diisi
  color      VARCHAR(7)   NOT NULL DEFAULT '#3B82F6',

  -- Label hanya milik 1 project tertentu, bukan global
  project_id UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- UNIQUE(name, project_id) = COMPOSITE UNIQUE CONSTRAINT
  --   Artinya kombinasi name + project_id harus unik
  --    Boleh: label "Bug" di project A DAN label "Bug" di project B
  --    Tidak boleh: 2 label "Bug" di project yang SAMA
  UNIQUE(name, project_id)
);
```

### Tabel `task_labels` (Penghubung Many-to-Many)

```sql
-- APA ITU JUNCTION TABLE / PIVOT TABLE?
-- =======================================
-- Dibutuhkan untuk relasi MANY-TO-MANY (banyak ke banyak):
--   Satu task bisa punya BANYAK label
--   Satu label bisa dipasang ke BANYAK task
--
-- Cara kerjanya: tabel ini menyimpan PASANGAN (task_id, label_id)
--   Misal: task A punya label "Bug" dan "Urgent"  ada 2 baris di sini
--          { task_id: A, label_id: Bug }, { task_id: A, label_id: Urgent }

CREATE TABLE task_labels (

  -- Kolom ini menunjuk ke tabel tasks
  -- ON DELETE CASCADE = kalau task dihapus, semua relasi label-nya di sini juga dihapus
  task_id  UUID NOT NULL REFERENCES tasks(id)  ON DELETE CASCADE,

  -- Kolom ini menunjuk ke tabel labels
  -- ON DELETE CASCADE = kalau label dihapus, semua relasinya ke task juga dihapus
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,

  -- PRIMARY KEY (task_id, label_id) = COMPOSITE PRIMARY KEY (kunci gabungan)
  --   Menggunakan 2 kolom sekaligus sebagai primary key
  --   Efeknya: tidak bisa ada 2 baris dengan task_id DAN label_id yang sama persis
  --    Mencegah label yang sama dipasang 2x ke task yang sama
  PRIMARY KEY (task_id, label_id)
);
```

### Tabel `comments`

```sql
CREATE TABLE comments (

  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Isi komentar  pakai TEXT karena tidak ada batasan panjang
  content    TEXT        NOT NULL,

  -- Komentar ini ada di task mana
  -- ON DELETE CASCADE = kalau task dihapus, semua komentarnya ikut terhapus
  task_id    UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Siapa yang nulis komentar ini
  author_id  UUID        NOT NULL REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Memahami Relasi Antar Tabel

### One-to-Many (Satu ke Banyak)

Satu **Project** bisa punya banyak **Task**.

```
projects < tasks
(1 project)     (banyak tasks)
```

Cara implementasinya: kolom `project_id` di tabel `tasks` **menunjuk ke** tabel `projects`.

### Many-to-Many (Banyak ke Banyak)

Satu **Task** bisa punya banyak **Label**, dan satu **Label** bisa dipasang ke banyak **Task**.

```
tasks >< labels
         
    task_labels
  (tabel penghubung)
```

Cara implementasinya: butuh **tabel ketiga** (junction table) bernama `task_labels`.

---

## Pilihan Tipe Data: UUID vs Auto-increment

Kita pakai **UUID** untuk semua primary key. Kenapa?

| Aspek | UUID | Auto-increment (1, 2, 3...) |
|-------|------|------------------------------|
| **Keamanan** |  Tidak mudah ditebak |  Mudah ditebak (`/tasks/1`, `/tasks/2`) |
| **Distribusi** |  Bisa dibuat di sisi client |  Harus nunggu insert ke DB |
| **Keterbacaan** |  Panjang & susah dihafal |  Simpel & berurutan |

---

## Tentang `ON DELETE CASCADE` vs `SET NULL`

Ini menentukan **apa yang terjadi kalau data parent dihapus**:

| Opsi | Artinya | Contoh Penggunaan |
|------|---------|-------------------|
| `CASCADE` | Hapus juga data anaknya | Hapus project  semua tasks-nya ikut terhapus |
| `SET NULL` | Isi kolom dengan NULL | Hapus user  task yang di-assign tetap ada, `assignee_id` jadi NULL |
| `RESTRICT` | **Larang** penghapusan kalau masih ada anak | Tidak bisa hapus user yang masih punya project |

---

## ERD (Entity Relationship Diagram)

```
users < projects
                        
   (assignee)           
  < tasks >
                
                < comments
                
                < task_labels >< labels
```

---

## Indexing: Jangan Lupa!

Index adalah seperti **daftar isi buku**  tanpanya, database harus baca semua baris satu per satu.

```sql
-- "CREATE INDEX nama_index ON nama_tabel(nama_kolom)"
-- Konvensi: idx_[nama_tabel]_[nama_kolom]

CREATE INDEX idx_tasks_project_id  ON tasks(project_id);   -- Untuk filter: "tampilkan task di project X"
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);  -- Untuk filter: "tampilkan task milik user X"
CREATE INDEX idx_tasks_status      ON tasks(status);       -- Untuk filter: "tampilkan task yang TODO"
CREATE INDEX idx_tasks_created_at  ON tasks(created_at DESC); -- DESC = urutkan terbaru dulu
CREATE INDEX idx_comments_task_id  ON comments(task_id);   -- Untuk: "tampilkan semua komentar di task X"
```

> **Tips**: Index yang bagus = kolom yang sering dipakai di klausa `WHERE`, `ORDER BY`, atau `JOIN`.

---

## Cara Menjalankan schema.sql ke Database Pakai .env

Tabel-tabel di atas masih sebatas rencana di kertas kalau file `schema.sql` belum dikirim ke database.
Biar ga ribet buka aplikasi lain, kita bikin script Node.js kecil yang tugasnya nyedot connection string di file `.env` terus langsung bikin tabelnya di database PostgreSQL kamu.

File script-nya udah disiapin di folder ini: [run-schema.js](run-schema.js).

### 1. Pasang Dulu Paket yang Dibutuhin
Buka terminal di root project (folder paling luar), terus ketik:

```bash
npm init -y
npm install pg dotenv
```

- `pg` = supir penghubung antara kode JavaScript kita sama database PostgreSQL.
- `dotenv` = alat buat ngebaca file `.env` biar link database rahasia kita bisa kepake di kode.

### 2. Cara Kerja Script run-schema.js

Isi kodenya santai dan gampang dipahami per baris:

```javascript
// path = alat bantu bawaan Node.js buat nyambung alamat folder biar rapi (ga error di Windows/Linux)
const path = require('path');

// fs = kependekan dari File System, alat buat ngebuka dan baca isi file di komputer
const fs = require('fs');

// dotenv = alat buat nyedot isi file .env (yang ada password DB) supaya masuk ke kodingan
// path.resolve(...) di sini tujuannya nyari file .env yang ada di folder paling luar (root)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Pool = ibarat loket antrian, disiapin buat ngobrol bolak-balik sama PostgreSQL
const { Pool } = require('pg');

// Cek dulu: ada ga link databasenya?
// Kalau di file .env belum ada DATABASE_URL, ya ga bakal bisa konek, langsung stop aja
if (!process.env.DATABASE_URL) {
  console.error('Waduh, DATABASE_URL di file .env belum ada atau masih kosong bro!');
  process.exit(1);
}

// Bikin jalur koneksi ke database pakai link yang barusan diambil dari .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Lagi baca file schema.sql...');

  // Cari lokasi file schema.sql yang ada di sebelah script ini
  const schemaFile = path.join(__dirname, 'schema.sql');

  // Comot dan baca semua tulisan SQL yang ada di dalam file schema.sql
  const sql = fs.readFileSync(schemaFile, 'utf8');

  console.log('Lagi nyambung ke database dan bikin tabel-tabelnya...');

  try {
    // Kirim seluruh perintah SQL (bikin tabel, enum, index) sekaligus ke database
    // await = tungguin sampai database selesai ngerjain semuanya, baru lanjut ke bawah
    await pool.query(sql);

    console.log('Beres! Semua tabel, tipe data, dan index berhasil dibikin di database.');
  } catch (err) {
    // Kalau ada nama tabel yang bentrok atau syntax salah, munculnya di sini
    console.error('Gagal nih bro pas bikin tabel:');
    console.error(err.message);
  } finally {
    // Udah selesai urusan, tutup jalur koneksinya biar terminalnya ga bengong/gantung
    await pool.end();
  }
}

// Langsung jalanin fungsi di atas
main();
```

### 3. Perintah Eksekusi di Terminal

Buka terminal di root project (folder utama), ini perintah-perintah yang bisa kamu pakai:

#### A. Bikin Semua Tabel (Eksekusi Schema)
```bash
node materi/03-skema-dan-relasi/run-schema.js
```
Tunggu beberapa detik sampai muncul tulisan `Beres!`. Pas dicek, semua tabel (`users`, `projects`, `tasks`, `labels`, `task_labels`, `comments`), tipe data ENUM, dan index-nya udah nongol di database.

#### B. Hapus / Reset Semua Tabel (Kalau Mau Praktek Ulang)
```bash
node materi/03-skema-dan-relasi/reset-schema.js
```
Perintah ini bakal ngebersihin semua tabel dan tipe data yang udah dibikin, jadi database kamu kosong lagi dan siap buat dipraktekin ulang kapan aja.

---

## Checklist Bab Ini

- [ ] Paham struktur 6 tabel utama di proyek ini
- [ ] Mengerti apa itu UUID, VARCHAR, TEXT, TIMESTAMPTZ, DATE
- [ ] Mengerti apa itu ENUM dan kapan memakainya
- [ ] Mengerti perbedaan relasi One-to-Many dan Many-to-Many
- [ ] Tahu kapan pakai `ON DELETE CASCADE` vs `SET NULL`
- [ ] Mengerti kenapa kita butuh index
- [ ] Tahu cara menjalankan schema.sql ke database via script Node.js dan .env

---

## Lanjut ke Bab Berikutnya

[Bab 04: Migrasi & Seeding](../04-migrasi-dan-seeding/README.md) - Cara kelola perubahan skema database tanpa panik dan tanpa kehilangan data!
