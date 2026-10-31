// File: materi/03-skema-dan-relasi/reset-schema.js
// Script ini kebalikan dari run-schema.js: tugasnya buat nghapus semua tabel dan enum
// yang ada di database, biar bersih lagi kalau kamu mau coba praktek dari nol.

const path = require('path');

// dotenv = ambil connection string dari file .env root project
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL di file .env belum ada bro!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reset() {
  console.log('Lagi ngebersihin dan ngehapus semua tabel di database...');

  // Query buat nge-drop semua tabel dan enum sekaligus
  // CASCADE = kalau ada relasi yang nyangkut, ikut dibersihin otomatis
  const dropQuery = `
    DROP TABLE IF EXISTS task_labels, comments, tasks, labels, projects, users CASCADE;
    DROP TYPE IF EXISTS task_status, task_priority CASCADE;
  `;

  try {
    await pool.query(dropQuery);
    console.log('Beres! Semua tabel dan enum udah dihapus, database bersih lagi.');
  } catch (err) {
    console.error('Gagal ngehapus tabel:');
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

reset();
