-- ============================================================
-- SCHEMA TASK MANAGEMENT
-- File ini berisi DDL (Data Definition Language) lengkap
-- untuk membuat semua tabel dari awal di PostgreSQL
--
-- DDL = perintah SQL untuk MENDEFINISIKAN struktur database
--       (CREATE, ALTER, DROP) — berbeda dari DML yang untuk
--       memanipulasi data (INSERT, UPDATE, DELETE)
-- ============================================================


-- ============================================================
-- LANGKAH 1: Aktifkan ekstensi pgcrypto
-- ============================================================

-- "CREATE EXTENSION" = mengaktifkan fitur tambahan di PostgreSQL
-- "IF NOT EXISTS"    = abaikan kalau ekstensi sudah aktif (tidak error)
-- "pgcrypto"         = ekstensi yang menyediakan fungsi kriptografi,
--                      termasuk gen_random_uuid() untuk buat UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- LANGKAH 2: Buat ENUM (tipe data pilihan tetap)
-- ============================================================

-- APA ITU ENUM?
-- ENUM (Enumeration) = tipe data yang nilainya HANYA boleh dari
-- daftar pilihan yang sudah ditentukan. Seperti dropdown/radio button.
--
-- Keuntungan ENUM dibanding VARCHAR biasa:
--   - Database otomatis validasi nilai — tidak bisa masuk nilai lain
--   - Lebih hemat storage dibanding VARCHAR
--   - Kekurangan: susah tambah nilai baru di production (butuh migration)
--
-- "CREATE TYPE" = perintah untuk membuat tipe data kustom baru di PostgreSQL
-- "AS ENUM"     = jenis tipe data yang dibuat adalah enumeration

-- Enum untuk status task — hanya boleh salah satu dari 4 nilai ini:
CREATE TYPE task_status AS ENUM (
  'TODO',         -- Belum dikerjakan
  'IN_PROGRESS',  -- Sedang dikerjakan
  'IN_REVIEW',    -- Selesai dikerjakan, menunggu review
  'DONE'          -- Sudah selesai & disetujui
);

-- Enum untuk tingkat prioritas task:
CREATE TYPE task_priority AS ENUM (
  'LOW',    -- Prioritas rendah, tidak mendesak
  'MEDIUM', -- Prioritas normal (ini default)
  'HIGH',   -- Prioritas tinggi
  'URGENT'  -- Darurat, harus segera diselesaikan
);


-- ============================================================
-- LANGKAH 3: Buat Tabel users
-- ============================================================

-- "CREATE TABLE nama_tabel (...)" = perintah membuat tabel baru
-- Di dalam kurung () adalah daftar kolom beserta tipe & aturannya

CREATE TABLE users (

  -- "UUID" = Universally Unique Identifier
  --   Format: 550e8400-e29b-41d4-a716-446655440000 (32 karakter hex + 4 strip)
  --   Keuntungan: unik secara global, tidak bisa ditebak urutannya
  --   Berbeda dengan angka biasa (1,2,3) yang mudah ditebak
  --
  -- "PRIMARY KEY" = kolom ini adalah identitas unik tiap baris (tidak boleh duplikat & tidak boleh NULL)
  -- "DEFAULT gen_random_uuid()" = otomatis buat UUID baru kalau tidak diisi saat INSERT
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- "VARCHAR(255)" = teks variabel maksimal 255 karakter
  --   Berbeda dengan CHAR(255) yang selalu pakai 255 karakter walau isinya pendek
  -- "NOT NULL" = kolom ini WAJIB diisi, tidak boleh kosong
  name        VARCHAR(255) NOT NULL,

  -- "UNIQUE" = nilai di kolom ini tidak boleh sama antar baris
  --   Database otomatis tolak kalau ada email yang sudah terdaftar
  email       VARCHAR(255) UNIQUE NOT NULL,

  -- Password WAJIB di-hash sebelum disimpan! (pakai bcrypt/argon2)
  -- Jangan pernah simpan password dalam bentuk plain text
  password    VARCHAR(255) NOT NULL,

  -- "TIMESTAMPTZ" = Timestamp WITH Time Zone
  --   Menyimpan tanggal + waktu + informasi timezone
  --   Lebih aman dari TIMESTAMP biasa untuk aplikasi multi-region
  -- "DEFAULT NOW()" = otomatis isi dengan waktu saat INSERT dilakukan
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- updated_at harus di-update MANUAL setiap kali data diubah
  -- (biasanya lewat kode aplikasi atau trigger database)
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LANGKAH 4: Buat Tabel projects
-- ============================================================

CREATE TABLE projects (

  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  name        VARCHAR(255) NOT NULL,

  -- "TEXT" = teks tanpa batas panjang (bisa ribuan karakter)
  --   Berbeda dengan VARCHAR yang ada batas maksimalnya
  --   Tanpa NOT NULL = kolom ini boleh kosong/NULL (opsional)
  description TEXT,

  -- "REFERENCES users(id)" = FOREIGN KEY — kolom ini menunjuk ke kolom id di tabel users
  --   Artinya: setiap project HARUS punya owner yang terdaftar sebagai user
  --   Database akan TOLAK jika kita isi owner_id dengan UUID yang tidak ada di tabel users
  --
  -- "ON DELETE CASCADE" = kalau user (pemilik) dihapus, semua project-nya IKUT terhapus otomatis
  owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LANGKAH 5: Buat Tabel tasks (tabel utama)
-- ============================================================

CREATE TABLE tasks (

  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Judul task, maksimal 500 karakter (lebih panjang dari nama project)
  title        VARCHAR(500)  NOT NULL,

  description  TEXT, -- Deskripsi detail task (boleh kosong)

  -- Memakai ENUM task_status yang sudah dibuat di atas
  -- "DEFAULT 'TODO'" = kalau tidak diisi, otomatis statusnya TODO
  status       task_status   NOT NULL DEFAULT 'TODO',

  -- Memakai ENUM task_priority yang sudah dibuat di atas
  priority     task_priority NOT NULL DEFAULT 'MEDIUM',

  -- "DATE" = hanya menyimpan tanggal (YYYY-MM-DD), tanpa waktu
  --   Berbeda dengan TIMESTAMP yang menyimpan tanggal + jam
  --   Tanpa NOT NULL = due_date boleh NULL (task tanpa deadline)
  due_date     DATE,

  -- Setiap task WAJIB ada di dalam sebuah project
  -- ON DELETE CASCADE = kalau project dihapus, semua task di dalamnya ikut terhapus
  project_id   UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- assignee_id = orang yang ditugaskan mengerjakan task ini
  -- "assign" = menugaskan / memberikan tugas ke seseorang
  -- "assignee" = orang yang dikasih tugas
  -- Tanpa NOT NULL = boleh kosong / NULL (artinya task belum ada yang megang)
  -- ON DELETE SET NULL = kalau akun user yang ditugaskan dihapus, kolom ini berubah jadi NULL
  --   (task-nya tetap aman tersimpan, cuma statusnya jadi belum ada yang ngerjain)
  assignee_id  UUID          REFERENCES users(id) ON DELETE SET NULL,

  -- Siapa yang membuat task ini — wajib diisi, tidak boleh NULL
  -- Tidak ada ON DELETE CASCADE: kalau creator dihapus, kita LARANG (RESTRICT otomatis)
  created_by   UUID          NOT NULL REFERENCES users(id),

  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LANGKAH 6: Buat Tabel labels
-- ============================================================

CREATE TABLE labels (

  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nama label, maksimal 100 karakter (misal: "Bug", "Feature", "Urgent")
  name       VARCHAR(100) NOT NULL,

  -- Warna label dalam format HEX (#RRGGBB)
  --   VARCHAR(7) = cukup untuk 7 karakter: # + 6 digit hex
  --   Contoh: '#EF4444' (merah), '#3B82F6' (biru), '#10B981' (hijau)
  --   DEFAULT = warna biru kalau tidak diisi
  color      VARCHAR(7)   NOT NULL DEFAULT '#3B82F6',

  -- Label hanya berlaku di dalam project tertentu (bukan global)
  project_id UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- "UNIQUE(name, project_id)" = COMPOSITE UNIQUE CONSTRAINT
  --   Artinya: kombinasi name + project_id harus unik
  --   Boleh ada label "Bug" di project A DAN label "Bug" di project B
  --   Tapi TIDAK BOLEH ada 2 label "Bug" di project yang sama
  UNIQUE(name, project_id)
);


-- ============================================================
-- LANGKAH 7: Buat Tabel task_labels (Junction / Pivot Table)
-- ============================================================

-- APA ITU JUNCTION TABLE?
-- Dibutuhkan untuk relasi MANY-TO-MANY (banyak ke banyak)
-- Contoh: 1 task bisa punya banyak label, 1 label bisa dipasang ke banyak task
-- Tabel ini menjadi "jembatan" penghubung antara tasks dan labels

CREATE TABLE task_labels (

  -- FOREIGN KEY ke tabel tasks
  -- ON DELETE CASCADE = kalau task dihapus, semua entry label-nya di sini ikut terhapus
  task_id  UUID NOT NULL REFERENCES tasks(id)  ON DELETE CASCADE,

  -- FOREIGN KEY ke tabel labels
  -- ON DELETE CASCADE = kalau label dihapus, semua relasi ke task juga terhapus
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,

  -- "PRIMARY KEY (task_id, label_id)" = COMPOSITE PRIMARY KEY
  --   Menggunakan 2 kolom sekaligus sebagai primary key
  --   Ini mencegah duplikat: tidak bisa pasang label yang sama 2x ke task yang sama
  PRIMARY KEY (task_id, label_id)
);


-- ============================================================
-- LANGKAH 8: Buat Tabel comments
-- ============================================================

CREATE TABLE comments (

  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Isi komentar, pakai TEXT karena tidak ada batas panjang
  content    TEXT        NOT NULL,

  -- Komentar ini ada di task mana
  -- ON DELETE CASCADE = kalau task dihapus, semua komentarnya ikut terhapus
  task_id    UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Siapa yang menulis komentar ini
  author_id  UUID        NOT NULL REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LANGKAH 9: Buat INDEX untuk performa query
-- ============================================================

-- APA ITU INDEX?
-- Index = "daftar isi" untuk database, seperti indeks di belakang buku
-- Tanpa index: database harus baca SEMUA baris satu per satu (lambat!)
-- Dengan index: database langsung loncat ke baris yang dicari (cepat!)
--
-- Kapan perlu buat index?
--   - Kolom yang sering dipakai di WHERE (filter)
--   - Kolom yang sering dipakai di ORDER BY (sorting)
--   - Kolom FOREIGN KEY (untuk mempercepat JOIN)
--   - Jangan index semua kolom! Index memperlambat INSERT/UPDATE

-- "CREATE INDEX nama_index ON nama_tabel(nama_kolom)"
-- Konvensi penamaan: idx_[nama_tabel]_[nama_kolom]

CREATE INDEX idx_projects_owner_id  ON projects(owner_id);    -- Cepat cari semua project milik user X
CREATE INDEX idx_tasks_project_id   ON tasks(project_id);     -- Cepat cari semua task di project X
CREATE INDEX idx_tasks_assignee_id  ON tasks(assignee_id);    -- Cepat cari semua task yang di-assign ke user X
CREATE INDEX idx_tasks_status       ON tasks(status);         -- Cepat filter task berdasarkan status
CREATE INDEX idx_tasks_priority     ON tasks(priority);       -- Cepat filter task berdasarkan prioritas
CREATE INDEX idx_tasks_due_date     ON tasks(due_date);       -- Cepat cari task yang mendekati deadline
CREATE INDEX idx_tasks_created_at   ON tasks(created_at DESC); -- DESC = diurutkan terbaru dulu (untuk default sorting)
CREATE INDEX idx_comments_task_id   ON comments(task_id);     -- Cepat ambil semua komentar di task X
CREATE INDEX idx_labels_project_id  ON labels(project_id);   -- Cepat ambil semua label di project X
