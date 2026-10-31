# Bab 02: Strategi Akses Data

> **Tujuan Bab Ini**: Kamu paham perbedaan antara **Raw SQL**, **Query Builder**, dan **ORM** dan bisa memilih mana yang paling cocok untuk proyekmu.

---

## Masalahnya Apa?

Setelah berhasil konek ke database, sekarang muncul pertanyaan baru:

> *"Gimana cara aplikasi kita 'ngobrol' sama database?"*

Ada **3 cara populer**, masing-masing punya kelebihan dan kekurangan. Kita bahas satu per satu dengan bahasa yang gampang!

---

## Pilihan 1 - Raw SQL (Nulis SQL Langsung)

Kamu nulis perintah SQL mentah langsung di dalam kode aplikasi.

```javascript
// const = bikin variabel baru, namanya "result"
//   kenapa const bukan let? karena nilainya ga akan diganti-ganti setelah ini
//
// result = nama variabelnya, bebas mau dinamain apa
//   nanti isinya adalah data yang balik dari database
//   result.rows = isi datanya (array of object, tiap object = 1 baris data)
//
// await = "tunggu dulu sampai selesai baru lanjut ke baris berikutnya"
//   tanpa await, kode lanjut terus padahal data belum balik dari DB
//   hasilnya result jadi kosong, bug deh
//
// db.query() = fungsi buat kirim SQL ke database
const result = await db.query(

  // ini SQL-nya, dikirim sebagai string
  // SELECT * = ambil semua kolom, jangan pilih-pilih
  // WHERE = filter, kayak "tampilkan yang ini doang"
  // $1 dan $2 = placeholder, nilai aslinya ada di array di bawah
  //   kenapa ga langsung tulis nilainya di sini?
  //   karena kalau langsung disambung ke string, bisa kena SQL Injection!
  //   pakai $1 $2 ini, library yang handle escape-nya, kita aman
  'SELECT * FROM tasks WHERE user_id = $1 AND status = $2',

  // ini nilai buat $1 dan $2, urutannya harus sama
  // $1 = userId = siapa yang lagi login
  // $2 = 'TODO' = filter hanya task yang belum dikerjain
  [userId, 'TODO']
);
// setelah ini, result.rows isinya array task yang ketemu
```

### Kelebihannya:
- **Full kontrol** - kamu yang pegang kemudi, query persis seperti yang kamu tulis.
- **Performa maksimal** - tidak ada lapisan tambahan yang memperlambat.
- **Mudah debug** - kamu bisa copy-paste query-nya langsung ke database client.

### Kekurangannya:
- **Rawan typo** - salah ketik nama kolom baru ketahuan saat runtime, bukan saat nulis kode.
- **Tidak ada type-safety** - kalau skema tabel berubah, kompilator tidak akan peringatkan kamu.
- **Repetitif** - CRUD yang sama harus ditulis berulang kali.

**Cocok untuk**: Proyek kecil, query kompleks & custom, atau ketika performa adalah prioritas utama.

---

## Pilihan 2 - Query Builder (Bangun Query Pakai Function)

Query Builder itu library yang bantu kamu **susun SQL pakai function JavaScript** — lebih aman dan lebih rapi dari raw SQL.

```javascript
// ini pakai Kysely, salah satu Query Builder paling keren buat TypeScript
const tasks = await db

  // .selectFrom('tasks') = "aku mau query dari tabel tasks"
  // kayak nulis FROM tasks di SQL
  .selectFrom('tasks')

  // .where() = tambah filter
  // argumen: (nama kolom, operator, nilai yang dicari)
  // ini hasilnya nanti kayak: WHERE user_id = userId di SQL
  .where('user_id', '=', userId)

  // .where() bisa ditumpuk, otomatis jadi AND
  // hasilnya: AND status = 'TODO'
  .where('status', '=', 'TODO')

  // .orderBy() = urutkan hasilnya
  // 'desc' = dari yang paling baru (terbesar) ke yang paling lama (terkecil)
  // 'asc'  = sebaliknya, dari yang paling lama ke yang paling baru
  .orderBy('created_at', 'desc')

  // .selectAll() = ambil semua kolom, sama kayak SELECT * di SQL
  // mau pilih kolom tertentu? pakai .select(['id', 'title']) aja
  .selectAll()

  // .execute() = baru di sini query-nya beneran dikirim ke database
  // sebelum ini, kamu cuma "ngerakit" query-nya, belum dieksekusi
  .execute();
// tasks sekarang isinya array of object, tiap object = 1 baris task
```

### Kelebihannya:
- **Type-safe** - editor langsung tahu kalau kamu salah ketik nama kolom.
- **Mudah dikombinasi** - bisa tambah `.where()` atau `.orderBy()` secara kondisional.
- **Tetap dekat dengan SQL** - kamu masih "merasakan" SQL-nya, tidak terlalu abstrak.

### Kekurangannya:
- **Perlu belajar API-nya** - ada kurva belajar untuk sintaks Query Builder-nya.
- **Kurang cocok untuk query super kompleks** - kadang lebih mudah langsung tulis Raw SQL.

**Cocok untuk**: Proyek menengah ke atas yang butuh type-safety tapi tidak mau terlalu abstrak.

---

## Pilihan 3 - ORM (Ga Perlu Nulis SQL Sama Sekali)

ORM itu kayak "penerjemah" antara kode JavaScript kamu sama database. Tabel jadi object, kolom jadi properti. Nulis SQL? Ga perlu.

```javascript
// ini pakai Prisma, ORM paling populer buat Node.js sekarang
// prisma.task = Prisma otomatis bikin ini dari skema database kita
//   "task" = nama tabel "tasks" tapi versi singular (tanpa s)
// .findMany() = ambil banyak baris sekaligus
//   ada juga .findFirst() kalau cuma mau 1 baris
//   ada juga .findUnique() kalau mau cari by ID
const tasks = await prisma.task.findMany({

  // where = kondisi filter, kayak WHERE di SQL
  where: {
    userId: userId,   // filter: hanya punya user ini
    status: 'TODO',   // filter: hanya yang belum dikerjain
  },

  // orderBy = urutkan hasilnya
  orderBy: {
    // nama properti = nama kolom, nilainya 'asc' atau 'desc'
    createdAt: 'desc', // terbaru duluan
  },
});
// tasks sekarang isinya array of object Task
// Prisma udah tau tipe datanya dari schema.prisma, jadi auto complete jalan!
```

### Kelebihannya:
- **Produktivitas tinggi** - CRUD bisa dibuat dalam hitungan menit.
- **Type-safety penuh** - auto-generate types dari skema database.
- **Terintegrasi dengan migration** - tools seperti Prisma sekalian mengelola skema.

### Kekurangannya:
- **"Magic" yang membingungkan** - query yang dihasilkan ORM kadang tidak efisien.
- **Berat untuk query kompleks** - ORM sering kewalahan dengan JOIN banyak tabel atau aggregasi yang rumit.
- **Ketergantungan tinggi** - upgrade versi ORM bisa breaking change.

**Cocok untuk**: Proyek yang prioritaskan kecepatan development, tim yang lebih besar, atau yang baru mulai belajar.

---

## Perbandingan Cepat

| Aspek | Raw SQL | Query Builder | ORM |
|-------|---------|---------------|-----|
| **Kontrol Query** | Penuh | Lumayan | Terbatas |
| **Type Safety** | Tidak ada | Ada | Lengkap |
| **Kecepatan Dev** | Lambat | Sedang | Cepat |
| **Performa Query** | Terbaik | Bagus | Bisa boros |
| **Kurva Belajar** | Mudah (SQL saja) | Sedang | Sedang |

---

## Rekomendasi untuk Proyek Ini

Untuk proyek **Task Management** ini, kita akan pakai kombinasi:

> **Query Builder (Kysely atau Knex)** untuk sebagian besar query + **Raw SQL** untuk query kompleks (laporan, aggregasi).

Kenapa? Karena proyek ini butuh:
- Type-safety untuk menghindari bug
- Fleksibilitas untuk query filter yang bervariasi
- Performa yang baik tanpa overhead berlebih dari ORM

---

## Checklist Bab Ini

- [ ] Paham perbedaan Raw SQL, Query Builder, dan ORM
- [ ] Tahu kapan pakai masing-masing pendekatan
- [ ] Sudah memutuskan strategi akses data untuk proyekmu

---

## Lanjut ke Bab Berikutnya

[Bab 03: Skema & Relasi Tabel](../03-skema-dan-relasi/README.md) - Sekarang kita desain tabel-tabel yang dibutuhkan untuk aplikasi Task Management!
