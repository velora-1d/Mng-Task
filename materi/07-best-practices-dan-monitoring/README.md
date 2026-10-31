# Bab 07: Best Practices & Monitoring

> **Tujuan Bab Ini**: Kamu punya kode database yang **bersih, mudah diuji, dan bisa dipantau**  ciri khas developer yang sudah siap production!

---

## Part 1: Repository Pattern  Kode yang Rapi 

## Masalah Tanpa Repository Pattern

Bayangkan kamu punya 10 endpoint berbeda yang semuanya langsung nulis query SQL di dalam route handler-nya masing-masing:

```javascript
//  Contoh BURUK: Query SQL tersebar di mana-mana

// Di file routes/tasks.js
// "async (req, res) =>" = arrow function async untuk handle HTTP request
app.get('/tasks', async (req, res) => {
  // Query langsung ditulis di dalam route handler
  const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1', [...]);
  res.json(result.rows); // Kirim data sebagai JSON response
});

// Di file routes/projects.js  file yang BERBEDA!
app.get('/projects/:id/tasks', async (req, res) => {
  // Query yang SAMA ditulis lagi di sini! Copy-paste!
  const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1', [...]);
  res.json(result.rows);
});
// Kalau nama kolom "project_id" berubah jadi "proj_id",
// kamu harus cari dan ganti di SEMUA file yang punya query ini. Rawan ketinggalan!
```

Masalahnya:
-  Query yang sama ditulis berulang di banyak tempat
-  Kalau nama kolom berubah, harus cari & ganti di semua tempat
-  Susah di-unit test karena logic bisnis bercampur dengan query DB

---

## Solusi: Repository Pattern

Repository Pattern adalah cara **memisahkan semua query database ke dalam satu kelas khusus**.

```javascript
//  Contoh BAIK: Semua query task ada di 1 file khusus

// File: repositories/taskRepository.js
// "class" = template untuk membuat objek yang punya method (fungsi) dan data bersama
class TaskRepository {

  // "constructor" = fungsi yang dijalankan saat objek baru dibuat
  // "db" = koneksi database yang diinjeksi dari luar (dependency injection)
  // Keuntungan: di unit test, bisa ganti "db" dengan mock/tiruan database
  constructor(db) {
    this.db = db; // Simpan referensi database di dalam objek ini
  }

  // Method untuk cari task berdasarkan project
  // "async" = fungsi ini asinkron (perlu di-await saat dipanggil)
  // "filters = {}" = parameter opsional dengan default nilai object kosong
  async findByProjectId(projectId, filters = {}) {
    // Destructuring: ambil properti status, priority, assigneeId dari object filters
    const { status, priority, assigneeId } = filters;

    return this.db.query(
      // Backtick = template literal, bisa tulis SQL multi-baris
      `SELECT t.*, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = $1
         AND ($2::task_status   IS NULL OR t.status      = $2)
         AND ($3::task_priority IS NULL OR t.priority     = $3)
         AND ($4::UUID          IS NULL OR t.assignee_id  = $4)
       ORDER BY t.created_at DESC`,
      // "|| null" = kalau nilai undefined/falsy, kirim null (supaya filter diabaikan)
      [projectId, status || null, priority || null, assigneeId || null]
    );
  }

  // Method untuk cari 1 task berdasarkan ID
  async findById(taskId) {
    const result = await this.db.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );
    // ".rows[0]" = baris pertama dari hasil query
    // "|| null" = kalau tidak ditemukan (rows kosong), return null bukan undefined
    return result.rows[0] || null;
  }

  // Method untuk membuat task baru
  // "data" = object berisi semua kolom yang mau diisi
  async create(data) {
    const result = await this.db.query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, // Kembalikan data lengkap yang baru diinsert
      // Urutan nilai harus sama dengan urutan kolom di atas ($1=$2=... )
      [data.title, data.description, data.status, data.priority,
       data.projectId, data.assigneeId, data.createdBy]
    );
    return result.rows[0]; // Kembalikan 1 baris data task yang baru dibuat
  }

  // Method untuk update status task
  async updateStatus(taskId, newStatus) {
    const result = await this.db.query(
      // $1 = taskId (di WHERE), $2 = newStatus (di SET)
      'UPDATE tasks SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [taskId, newStatus]
    );
    return result.rows[0];
  }

  // Method untuk hapus task
  async delete(taskId) {
    // Tidak pakai RETURNING karena tidak butuh data task yang dihapus
    await this.db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  }
}

// "module.exports" = ekspor class ini supaya bisa di-import di file lain
module.exports = TaskRepository;
```

```javascript
// File: routes/tasks.js  Sekarang BERSIH, tidak ada SQL di sini!

// Buat instance dari TaskRepository, berikan koneksi pool sebagai dependency
const taskRepo = new TaskRepository(pool);

// Handler GET /projects/:id/tasks
// ":id" = URL parameter (bisa diakses via req.params.id)
app.get('/projects/:id/tasks', async (req, res) => {
  // Panggil method dari repository  tidak ada SQL di sini!
  // req.query = query string dari URL (?status=TODO&priority=HIGH)
  const tasks = await taskRepo.findByProjectId(req.params.id, req.query);
  res.json(tasks.rows); // Kirim hasilnya sebagai JSON
});

// Handler POST /tasks
app.post('/tasks', async (req, res) => {
  // req.body = data yang dikirim di body request (format JSON)
  const task = await taskRepo.create(req.body);
  // HTTP 201 = Created (lebih tepat dari 200 untuk response setelah INSERT)
  res.status(201).json(task);
});
```

**Keuntungan:**
-  Query cukup ditulis sekali, dipakai berkali-kali
-  Mudah di-unit test (bisa mock repository-nya)
-  Kalau ganti database, yang diubah cukup di dalam repository

---

## Part 2: Logging Query 

## Kenapa Logging Query Penting?

Ketika ada bug atau performa masalah, kamu butuh tahu:
- Query apa yang baru saja dijalankan?
- Butuh berapa lama?
- Apakah ada error?

### Contoh Logging Sederhana

```javascript
// Fungsi wrapper  mengganti pool.query() langsung dengan versi yang ada logging-nya
// Semua query di aplikasi melewati fungsi ini dulu sebelum ke database
async function query(text, params) {

  // "Date.now()" = waktu sekarang dalam milidetik (angka besar, misal: 1700000000000)
  // Kita simpan waktu mulai untuk dihitung durasi nanti
  const start = Date.now();

  try {
    // Jalankan query ke database seperti biasa
    const result = await pool.query(text, params);

    // Hitung berapa lama query selesai (dalam milidetik)
    // "Date.now() - start" = waktu sekarang dikurangi waktu mulai = durasi
    const duration = Date.now() - start;

    // Kalau durasi lebih dari 200ms, ini query lambat! Tampilkan peringatan
    if (duration > 200) {
      // "console.warn" = log peringatan (tampil dengan warna kuning di terminal)
      console.warn('  SLOW QUERY detected!', {
        duration: `${duration}ms`,  // Template literal: tampilkan durasi + satuan
        query: text,                // Query SQL yang dijalankan
        rows: result.rowCount,      // Berapa baris yang dikembalikan/terpengaruh
      });
    } else if (process.env.NODE_ENV === 'development') {
      // "process.env.NODE_ENV" = variabel environment untuk tahu kita sedang di mode apa
      // Hanya log semua query kalau sedang development, bukan production
      // (di production, log terlalu banyak bisa ganggu performa)
      console.log(' DB Query:', { duration: `${duration}ms`, query: text });
    }

    // Kembalikan hasil query (sama seperti pool.query() biasa)
    return result;

  } catch (error) {
    // "console.error" = log error (tampil dengan warna merah di terminal)
    // Catat query yang gagal dan pesan error-nya untuk debugging
    console.error(' DB Query Error:', { query: text, error: error.message });

    // "throw error" = lempar error lagi ke atas supaya bisa ditangani di caller-nya
    throw error;
  }
}
```

---

## Part 3: EXPLAIN ANALYZE  Detektif Query Lambat 

Kalau ada query yang terasa lambat, gunakan `EXPLAIN ANALYZE` untuk melihat "isi perut"-nya.

```sql
-- "EXPLAIN ANALYZE" = tambahkan ini sebelum query untuk melihat rencana eksekusinya
-- PostgreSQL akan menjalankan query-nya DAN menampilkan detail bagaimana ia mengeksekusi
-- Berguna untuk: menemukan kenapa query lambat, apakah index dipakai atau tidak
EXPLAIN ANALYZE
SELECT t.*, u.name
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
WHERE t.project_id = 'some-uuid'
ORDER BY t.created_at DESC;
```

Hasil yang akan kamu lihat:

```
Sort  (cost=234.56..235.06 rows=200) (actual time=1.234..1.456 rows=45)
  -> Hash Left Join  (cost=12.34..225.67 rows=200) (actual time=0.456..1.123 rows=45)
        -> Seq Scan on tasks  (cost=0.00..210.00 rows=200)    INI MASALAHNYA!
```

Cara baca hasilnya:
- `Seq Scan` = **Sequential Scan**  database baca **seluruh tabel** satu per satu dari awal sampai akhir. Ini LAMBAT untuk tabel besar!
- `Index Scan` = database pakai index untuk langsung loncat ke data yang dicari. Ini CEPAT!
- `cost=X..Y` = perkiraan "biaya" komputasi (semakin kecil semakin baik)
- `actual time=X..Y` = waktu eksekusi nyata dalam milidetik

Solusinya: tambah index!

```sql
-- Setelah tambah index, query yang sama akan jauh lebih cepat
CREATE INDEX idx_tasks_project_id ON tasks(project_id);

-- Coba EXPLAIN ANALYZE lagi  hasilnya berubah:
-- Index Scan using idx_tasks_project_id on tasks    Pakai index, jauh lebih cepat!
-- "cost" juga turun drastis dibanding sebelumnya
```

---

## Part 4: Error Handling yang Baik 

```javascript
// Fungsi untuk membuat task  dengan error handling yang proper
async function createTask(data) {
  try {
    // Coba jalankan operasi database
    return await taskRepo.create(data);

  } catch (error) {
    // "error.code" = kode error spesifik dari PostgreSQL
    // Setiap jenis error database punya kode uniknya sendiri
    switch (error.code) {

      case '23505': // Kode PostgreSQL untuk "unique_violation"
        // Artinya: ada data yang sama persis yang sudah ada (melanggar UNIQUE constraint)
        // Misal: mencoba buat task dengan judul yang sudah ada di project yang sama
        throw new AppError(409, 'Task dengan judul ini sudah ada di project ini');
        // 409 = HTTP Conflict (standar HTTP untuk data yang sudah ada)

      case '23503': // Kode PostgreSQL untuk "foreign_key_violation"
        // Artinya: nilai foreign key tidak ditemukan di tabel yang dirujuk
        // Misal: project_id yang dikirim tidak ada di tabel projects
        throw new AppError(400, 'Project atau user yang dituju tidak ditemukan');
        // 400 = HTTP Bad Request (data yang dikirim tidak valid)

      case '23502': // Kode PostgreSQL untuk "not_null_violation"
        // Artinya: kolom yang wajib diisi (NOT NULL) tidak diberi nilai
        // "error.column" = nama kolom yang melanggar constraint
        throw new AppError(400, `Field wajib diisi: ${error.column}`);

      default:
        // Error yang tidak dikenal / tidak terduga
        // Log untuk debugging (developer perlu tahu ini terjadi)
        console.error('Unexpected DB error:', error);
        // Jangan expose detail error ke user! Bisa bocorkan info struktur database
        // Kirim pesan generik yang aman
        throw new AppError(500, 'Terjadi kesalahan server, coba lagi nanti');
        // 500 = HTTP Internal Server Error
    }
  }
}
```

**Error Code PostgreSQL yang Sering Muncul:**

| Kode | Nama | Arti |
|------|------|------|
| `23505` | unique_violation | Data duplikat (unique constraint) |
| `23503` | foreign_key_violation | Data parent tidak ada |
| `23502` | not_null_violation | Field wajib tidak diisi |
| `22P02` | invalid_text_representation | Format UUID/Enum salah |

---

## Rangkuman Best Practices

|  Lakukan |  Hindari |
|-----------|-----------|
| Pakai Repository Pattern | Query SQL tersebar di seluruh kode |
| Log query yang lambat (>200ms) | Tidak ada logging sama sekali |
| Gunakan `EXPLAIN ANALYZE` untuk debug | Langsung asumsi "pasti index"-nya |
| Tangkap error DB dengan pesan yang tepat | Expose raw error message ke user |
| Selalu `client.release()` setelah pakai | Membiarkan koneksi "bocor" ke pool |
| Tambah index di kolom yang sering di-WHERE | Index di semua kolom (boros storage & lambat write) |

---

## Checklist Bab Ini (dan Seluruh Materi!)

- [ ] Menerapkan Repository Pattern untuk memisahkan query dari logic bisnis
- [ ] Punya logging untuk slow query
- [ ] Tahu cara pakai `EXPLAIN ANALYZE` untuk debug performa
- [ ] Error database ditangkap dan dikembalikan dengan pesan yang tepat

---

## Selamat! Kamu Sudah Selesai!

Kamu sekarang punya fondasi yang kuat untuk mengintegrasikan database ke proyek apapun:

1.  **Koneksi aman**  pakai `.env` dan connection pool
2.  **Strategi tepat**  pilih tools akses data yang sesuai
3.  **Skema yang rapi**  desain tabel & relasi yang benar
4.  **Migrasi terkontrol**  setiap perubahan tercatat di Git
5.  **CRUD & query handal**  filter, pagination, soft-delete
6.  **Aman & konsisten**  transaksi ACID + anti SQL Injection
7.  **Siap production**  repository pattern, logging, error handling

>  **Next Level**: Setelah ini, kamu bisa eksplorasi: caching dengan Redis, full-text search dengan PostgreSQL, atau replikasi database untuk high availability!

---

*Kembali ke [Halaman Utama Materi](../README.md)*
