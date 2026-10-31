// File: materi/03-skema-dan-relasi/run-schema.js
// Script ini tugasnya cuma satu: baca schema.sql terus kirim ke database
// biar semua tabel kita langsung jadi otomatis tanpa repot klik-klik aplikasi lain.

// path = alat bawaan Node.js buat nyambung alamat folder biar rapi (ga error di Windows/Linux)
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
