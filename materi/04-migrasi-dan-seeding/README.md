# Bab 04: Migrasi & Seeding

> **Tujuan Bab Ini**: Kamu bisa mengubah struktur database secara **aman & terkontrol** tanpa kehilangan data  dan bisa mengisi database dengan data dummy untuk keperluan development.

---

## Kenapa Kita Butuh Migrasi?

Coba bayangkan ini:

1. Kamu bikin tabel `tasks` hari ini.
2. Minggu depan, klien minta fitur baru: tambah kolom `priority`.
3. Gimana cara kamu tambah kolom itu ke database yang sudah ada, **tanpa menghapus data yang sudah ada**?

Jawabannya: **Database Migration**.

Migration adalah seperti **riwayat perubahan** untuk database kamu  sama seperti Git menyimpan riwayat perubahan kode. Setiap perubahan skema (tambah tabel, tambah kolom, hapus kolom) dicatat dalam file migrasi.

---

## Struktur File Migrasi

Setiap perubahan skema = 1 file migrasi baru. File diberi nama berurutan:

```
migrations/
 001_create_users.sql             Migrasi pertama: buat tabel users
 002_create_projects.sql          Migrasi kedua: buat tabel projects
 003_create_tasks.sql             Migrasi ketiga: buat tabel tasks
 004_add_priority_to_tasks.sql    Migrasi keempat: tambah kolom priority (perubahan baru)
 005_add_comments_table.sql       Migrasi kelima: tambah tabel comments (perubahan baru lagi)
```

>  Nomor di depan nama file memastikan migrasi dijalankan **secara berurutan** dari yang paling awal.

---

## Konsep Up & Down Migration

Setiap file migrasi punya **2 bagian**:

- **UP**: Jalankan perubahan ke depan (tambah tabel, tambah kolom).
- **DOWN**: Kembalikan perubahan (rollback) jika ada yang salah.

### Contoh: Menambah kolom `priority` ke tabel `tasks`

```sql
-- File: 004_add_priority_to_tasks.sql

-- ===== UP (Jalankan perubahan) =====
-- "ALTER TABLE" = ubah struktur tabel yang sudah ada
-- "ADD COLUMN"  = tambahkan kolom baru ke tabel yang sudah ada
--   Kolom baru ini: nama "priority", tipe ENUM "task_priority", wajib diisi, default 'MEDIUM'
ALTER TABLE tasks
ADD COLUMN priority task_priority NOT NULL DEFAULT 'MEDIUM';
-- Catatan: semua data LAMA yang sudah ada akan otomatis terisi 'MEDIUM' untuk kolom priority ini

-- ===== DOWN (Rollback kalau ada masalah) =====
-- Bagian ini dikomentari supaya tidak sengaja dijalankan
-- Aktifkan (hapus tanda --) HANYA kalau kamu benar-benar ingin rollback ke versi sebelumnya
-- "DROP COLUMN" = hapus kolom dari tabel (data di kolom itu akan HILANG permanen!)
-- ALTER TABLE tasks DROP COLUMN priority;
```

>  **Tips**: Bagian DOWN biasanya dikomentari supaya tidak tidak sengaja dijalankan. Aktifkan hanya kalau kamu memang mau rollback.

---

## Aturan Emas Migration (JANGAN Dilanggar!)

### Jangan ubah skema langsung di database (tanpa file migrasi)

Kenapa berbahaya?
- Developer lain tidak akan tahu perubahan itu ada
- Database di server production tidak ikut berubah
- Kalau database server direset, perubahan kamu hilang

### Selalu buat file migrasi baru untuk setiap perubahan

Dengan begini:
-  Semua perubahan tercatat di Git
-  Tim lain bisa "replay" semua perubahan dari awal
-  Bisa rollback kalau ada yang salah

---

## Apa itu Seeding?

Seeding adalah proses **mengisi database dengan data awal** untuk keperluan development atau testing.

Tanpa seeding, kamu harus isi data secara manual setiap kali database direset  membosankan!

### Contoh data seed untuk proyek Task Management:

```sql
-- ==============================================
-- File: seeds/001_seed_users.sql
-- ==============================================

-- "INSERT INTO nama_tabel (kolom1, kolom2, ...)"
--   = perintah untuk memasukkan data baru ke dalam tabel
-- "VALUES (...), (...)"
--   = kita bisa INSERT banyak baris sekaligus, pisahkan dengan koma
INSERT INTO users (id, name, email, password) VALUES
  -- Baris 1: User Alice
  -- ID pakai UUID yang "gampang diingat" untuk keperluan seed (mudah di-debug)
  -- Password berformat "$2b$10$..." = sudah di-hash dengan bcrypt (bukan plain text!)
  ('11111111-0000-0000-0000-000000000001', 'Alice Johnson',  'alice@example.com',  '$2b$10$hashedpassword1'),

  -- Baris 2: User Bob
  ('11111111-0000-0000-0000-000000000002', 'Bob Smith',      'bob@example.com',    '$2b$10$hashedpassword2'),

  -- Baris 3: User Carol
  ('11111111-0000-0000-0000-000000000003', 'Carol Williams', 'carol@example.com',  '$2b$10$hashedpassword3');
-- Tanda ";" di akhir = akhir dari satu perintah SQL


-- ==============================================
-- File: seeds/002_seed_projects.sql
-- ==============================================

-- INSERT project  kita referensikan owner_id ke UUID user yang sudah kita insert di atas
INSERT INTO projects (id, name, description, owner_id) VALUES
  (
    '22222222-0000-0000-0000-000000000001', -- ID project
    'Website Redesign',                      -- Nama project
    'Proyek redesign website utama perusahaan', -- Deskripsi
    '11111111-0000-0000-0000-000000000001'   -- owner_id = Alice (dari seed users di atas)
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'Mobile App v2',
    'Pengembangan fitur baru untuk aplikasi mobile',
    '11111111-0000-0000-0000-000000000002'   -- owner_id = Bob
  );


-- ==============================================
-- File: seeds/003_seed_tasks.sql
-- ==============================================

-- INSERT banyak task sekaligus
-- Perhatikan: NULL dipakai untuk assignee_id yang belum ada yang handle
INSERT INTO tasks (title, status, priority, project_id, assignee_id, created_by) VALUES
  --  judul task        status         prioritas  project mana?                          siapa assignee-nya?                     siapa yang buat?
  ('Desain halaman landing', 'IN_PROGRESS', 'HIGH',   '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
  ('Setup CI/CD pipeline',  'TODO',        'MEDIUM',  '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
  ('Implementasi login',    'DONE',        'URGENT',  '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002'),
  ('Optimasi performa DB',  'IN_REVIEW',   'HIGH',    '22222222-0000-0000-0000-000000000002', NULL,                                  '11111111-0000-0000-0000-000000000002');
  --                                                                                           
  --                                                              NULL di sini artinya task belum di-assign ke siapapun
```

---

## Alur Kerja Sehari-Hari

```
1. Buat file migrasi baru
    migrations/005_add_column_xyz.sql

2. Tulis bagian UP (dan DOWN untuk jaga-jaga)

3. Jalankan migrasi
    npm run migrate (atau perintah yang sesuai tools-mu)

4. Verifikasi: pastikan perubahan sudah ada di database

5. Commit file migrasi ke Git   JANGAN LUPA INI!
    git add migrations/005_add_column_xyz.sql
    git commit -m "feat: add xyz column to table_abc"
```

---

## Tools Migrasi Populer

| Tools | Bahasa | Keterangan |
|-------|--------|-----------|
| **Flyway** | Semua (file SQL) | Simpel, populer di enterprise |
| **golang-migrate** | Go | Ringan, support banyak DB |
| **Prisma Migrate** | Node.js/TypeScript | Terintegrasi ORM Prisma |
| **Knex.js migrations** | Node.js | Terintegrasi dengan Query Builder Knex |
| **Alembic** | Python | Standar untuk SQLAlchemy |

---

## Checklist Bab Ini

- [ ] Paham kenapa kita butuh migration (bukan ubah DB langsung)
- [ ] Mengerti konsep UP dan DOWN migration
- [ ] Tahu cara struktur folder migration yang rapi
- [ ] Paham kegunaan seeding untuk data development

---

## Lanjut ke Bab Berikutnya

 [Bab 05: CRUD & Query Lanjutan](../05-crud-dan-query/README.md)  Sekarang saatnya praktek: tambah, baca, edit, dan hapus data, plus teknik filter dan pagination yang proper!
