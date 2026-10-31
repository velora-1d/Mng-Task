# 15. UAT & Maintenance

## 1. Lingkungan UAT

| Item | Nilai |
|---|---|
| URL | staging / lokal |
| Database | SQLite terpisah (`data/uat.db`) |
| Data | Seed: 1 Owner, 3 User, 12 task, 3 reminder |
| Browser | Chrome & Firefox desktop; Chrome mobile |
| Pelaksana | Owner project + developer |
| Durasi | 2 hari (25–26 Nov 2026) |

**Akun uji**

| Role | Email | Password |
|---|---|---|
| Owner | `owner@mngtask.test` | `Owner#2026` |
| User | `budi@mngtask.test` | `User#2026` |
| User | `sari@mngtask.test` | `User#2026` |

> Password hanya untuk lingkungan UAT, bukan produksi.

---

## 2. UAT Checklist — Auth

| ID | Skenario | Langkah | Hasil yang Diharapkan | Prioritas |
|---|---|---|---|---|
| TC-AUTH-01 | Login valid | Isi email & password benar → Masuk | Masuk ke dashboard | P0 |
| TC-AUTH-02 | Password salah | Isi password salah | Pesan "Email atau password salah." | P0 |
| TC-AUTH-03 | Email tidak terdaftar | Isi email acak | Pesan sama seperti TC-AUTH-02 | P0 |
| TC-AUTH-04 | Akun nonaktif | Nonaktifkan user, coba login | Ditolak, pesan umum | P0 |
| TC-AUTH-05 | Rate limit | Salah password 6x | Percobaan ke-6 diblokir sementara | P0 |
| TC-AUTH-06 | Route terproteksi | Buka `/dashboard` tanpa login | Redirect ke `/login?next=/dashboard` | P0 |
| TC-AUTH-07 | Redirect setelah login | Login dari `next=/tasks` | Kembali ke `/tasks` | P0 |
| TC-AUTH-08 | Logout | Klik logout | Session terhapus, kembali ke login | P0 |
| TC-AUTH-09 | Ganti password paksa | Login user baru | Diarahkan ke form ganti password | P0 |
| TC-AUTH-10 | Session habis | Hapus cookie / tunggu expiry | Redirect ke login | P1 |

---

## 3. UAT Checklist — User Management (Owner)

| ID | Skenario | Langkah | Hasil | Prioritas |
|---|---|---|---|---|
| TC-USER-01 | Tambah user | Isi form valid → Simpan | User muncul di daftar | P0 |
| TC-USER-02 | Email duplikat | Tambah dengan email yang ada | Error "Email sudah digunakan." | P0 |
| TC-USER-03 | Email case-insensitive | Daftar `Budi@...` saat `budi@...` ada | Ditolak | P0 |
| TC-USER-04 | Edit user | Ubah nama & role | Perubahan tersimpan | P0 |
| TC-USER-05 | Nonaktifkan user | Klik nonaktifkan | User tidak bisa login | P0 |
| TC-USER-06 | Owner terakhir | Coba nonaktifkan satu-satunya Owner | Ditolak dengan pesan | P0 |
| TC-USER-07 | Turunkan Owner terakhir | Ubah role Owner → User | Ditolak | P0 |
| TC-USER-08 | Reset password | Owner reset password user | Session user lama dicabut, password baru berlaku | P0 |
| TC-USER-09 | User buka /users | Login sebagai User, akses `/users` | 403 / redirect | P0 |
| TC-USER-10 | Search & filter user | Cari nama, filter role/status | Hasil sesuai | P1 |
| TC-USER-11 | Audit log | Lihat audit setelah tambah user | Aksi tercatat | P0 |

---

## 4. UAT Checklist — Task

| ID | Skenario | Langkah | Hasil | Prioritas |
|---|---|---|---|---|
| TC-TASK-01 | Buat task minimal | Isi judul → Simpan | Task tersimpan, status `TODO` | P0 |
| TC-TASK-02 | Validasi judul | Judul kosong / 2 karakter | Error di bawah field | P0 |
| TC-TASK-03 | Deadline masa lalu | Isi deadline kemarin saat create | Ditolak | P0 |
| TC-TASK-04 | Deadline opsional | Buat tanpa deadline | Tersimpan | P0 |
| TC-TASK-05 | Assign (Owner) | Owner assign ke user | Task muncul di daftar user | P0 |
| TC-TASK-06 | Assign (User) | User coba assign ke orang lain | Tidak ada opsi / ditolak | P0 |
| TC-TASK-07 | Ubah status cepat | Dropdown baris → `IN_PROGRESS` | Status berubah + toast | P0 |
| TC-TASK-08 | Selesai | Ubah ke `DONE` | `completed_at` terisi, hilang dari reminder | P0 |
| TC-TASK-09 | Buka kembali | `DONE` → `TODO` | `completed_at` kosong | P0 |
| TC-TASK-10 | Overdue | Task deadline kemarin, status `TODO` | Ditandai overdue di daftar | P0 |
| TC-TASK-11 | Isolasi data | User A buka task user B via URL | 404 | P0 |
| TC-TASK-12 | Hapus task sendiri | Konfirmasi hapus | Task hilang, audit tercatat | P0 |
| TC-TASK-13 | Hapus task orang lain (User) | Coba hapus task orang lain | Ditolak | P0 |
| TC-TASK-14 | Hapus task (Owner) | Owner hapus task user | Berhasil | P0 |
| TC-TASK-15 | Search | Cari kata di judul/deskripsi | Hasil sesuai | P0 |
| TC-TASK-16 | Filter status/prioritas | Terapkan filter | Hasil sesuai | P0 |
| TC-TASK-17 | Kombinasi filter | Filter + search + sorting | Konsisten | P0 |
| TC-TASK-18 | Pagination | Buat > 20 task, pindah halaman | Data benar, tidak duplikat | P0 |
| TC-TASK-19 | Empty filter | Filter tanpa hasil | Empty state + reset filter | P0 |
| TC-TASK-20 | Export CSV | Klik export dengan filter | File sesuai filter, bisa dibuka | P0 |
| TC-TASK-21 | Submit ganda | Klik Simpan 2x cepat | Hanya 1 task dibuat | P0 |

---

## 5. UAT Checklist — Dashboard

| ID | Skenario | Hasil | Prioritas |
|---|---|---|---|
| TC-DASH-01 | Kartu ringkasan | Angka sesuai data | P0 |
| TC-DASH-02 | Due today | Task deadline hari ini terhitung | P0 |
| TC-DASH-03 | Overdue | Task lewat deadline terhitung | P0 |
| TC-DASH-04 | Grafik 7 hari | Menampilkan task selesai per hari | P0 |
| TC-DASH-05 | Deadline terdekat | Maks 5 task terurut | P0 |
| TC-DASH-06 | Cakupan User | Tidak menampilkan data orang lain | P0 |
| TC-DASH-07 | Klik kartu | Membuka daftar terfilter | P0 |

---

## 6. UAT Checklist — Reminder

| ID | Skenario | Hasil | Prioritas |
|---|---|---|---|
| TC-REM-01 | H-3 | Task deadline 3 hari lagi muncul | P0 |
| TC-REM-02 | H-1 | Muncul di kelompok H-1 | P0 |
| TC-REM-03 | Hari H | Muncul di kelompok hari ini | P0 |
| TC-REM-04 | Overdue | Muncul di kelompok overdue | P0 |
| TC-REM-05 | Task selesai | `DONE` tidak muncul | P0 |
| TC-REM-06 | Reminder manual | Buat reminder → muncul | P0 |
| TC-REM-07 | Tandai selesai | Status jadi `DONE`, hilang dari aktif | P0 |
| TC-REM-08 | Isolasi | User tidak melihat reminder orang lain | P0 |
| TC-REM-09 | Badge sidebar | Angka sesuai jumlah aktif | P0 |

---

## 7. UAT Checklist — Laporan

| ID | Skenario | Hasil | Prioritas |
|---|---|---|---|
| TC-REPORT-01 | Laporan harian | Angka sesuai task hari itu | P0 |
| TC-REPORT-02 | Laporan mingguan | Periode Senin–Minggu | P0 |
| TC-REPORT-03 | Laporan bulanan | Tanggal 1–akhir bulan | P0 |
| TC-REPORT-04 | Snapshot | Ubah task setelah generate | Laporan lama tidak berubah | P0 |
| TC-REPORT-05 | Catatan | Tambah catatan → simpan | Catatan tersimpan | P0 |
| TC-REPORT-06 | Export CSV | Unduh file | Format benar, terbuka di spreadsheet | P0 |
| TC-REPORT-07 | Periode kosong | Generate tanpa data | Angka 0, tidak error | P0 |
| TC-REPORT-08 | Cakupan Owner | Pilih semua user | Statistik gabungan | P0 |
| TC-REPORT-09 | Isolasi User | User generate laporan orang lain | Tidak bisa | P0 |
| TC-REPORT-10 | Riwayat | Daftar laporan lama tampil | Bisa dibuka/dihapus | P1 |

---

## 8. UAT Checklist — Pengaturan

| ID | Skenario | Hasil | Prioritas |
|---|---|---|---|
| TC-SET-01 | Ubah nama | Tersimpan & tampil | P0 |
| TC-SET-02 | Ubah email | Validasi unik + konfirmasi password | P0 |
| TC-SET-03 | Ganti password | Password lama salah ditolak | P0 |
| TC-SET-04 | Logout semua perangkat | Session lain tidak valid | P0 |
| TC-SET-05 | Pengaturan aplikasi (Owner) | Nama organisasi berubah | P0 |
| TC-SET-06 | User buka pengaturan aplikasi | Ditolak | P0 |

---

## 9. UAT Non-Fungsional

| ID | Uji | Target | Cara |
|---|---|---|---|
| TC-NFR-01 | Responsive | Tidak ada horizontal scroll di 360px | DevTools |
| TC-NFR-02 | Keyboard | Alur buat task selesai tanpa mouse | Tab/Enter/Esc |
| TC-NFR-03 | Kontras | Lolos WCAG AA | axe / Lighthouse |
| TC-NFR-04 | Performa | Daftar task < 1 detik (5.000 data) | Seed beban |
| TC-NFR-05 | Error 500 | Halaman error ramah | Simulasi |
| TC-NFR-06 | Backup/restore | Data kembali utuh | Restore file backup |
| TC-NFR-07 | SQLite restart | Data tetap ada | Restart service |
| TC-NFR-08 | Concurrent write | 10 simpan bersamaan tidak korup | Script uji |

---

## 10. Severity & SLA Perbaikan

| Severity | Definisi | Target perbaikan |
|---|---|---|
| **S1 — Critical** | Tidak bisa login, data hilang, kebocoran data | ≤ 1×24 jam |
| **S2 — High** | Fitur utama gagal (task/laporan) | ≤ 2×24 jam |
| **S3 — Medium** | Fitur minor/UX terganggu, ada workaround | ≤ 5 hari kerja |
| **S4 — Low** | Kosmetik/typo | Rilis berikutnya |

**Kriteria rilis**: tidak ada S1/S2 terbuka; S3 maksimal 3 dengan workaround.

---

## 11. Sign-off

| Peran | Nama | Tanggal | Tanda |
|---|---|---|---|
| Owner project | | | |
| Developer | | | |
| Penguji (user) | | | |

UAT dinyatakan lulus jika:
- [ ] 100% test case P0 lulus.
- [ ] Tidak ada bug S1/S2.
- [ ] Backup & restore terbukti.
- [ ] Dokumen handover diterima.

---

## 12. Maintenance

### 12.1 Masa Support

| Item | Nilai |
|---|---|
| Garansi bug | 30 hari setelah launch |
| Jam support | Senin–Jumat, 09.00–17.00 WIB |
| Kanal | WhatsApp/email developer |
| Perbaikan bug MVP | Gratis dalam masa garansi |
| Fitur baru | Di luar garansi (change request) |

### 12.2 Rutinitas

| Aktivitas | Frekuensi | PIC |
|---|---|---|
| Backup database | Harian (02.00 WIB) | Cron |
| Cek ukuran DB & disk | Mingguan | Developer |
| Cek log error | Mingguan | Developer |
| Update dependensi | Bulanan | Developer |
| Uji restore backup | 3 bulan | Developer |
| Review akses user | 3 bulan | Owner |

### 12.3 Backup & Recovery

- Backup: `sqlite3 data/mngtask.db ".backup 'backup/mngtask-$(date +%F).db'"`
- Retensi: 7 file terakhir.
- Lokasi: volume terpisah dari aplikasi.
- RTO: ≤ 2 jam. RPO: ≤ 24 jam.
- Prosedur restore:
  1. Hentikan aplikasi.
  2. Salin file backup ke `data/mngtask.db`.
  3. Jalankan `PRAGMA integrity_check;`.
  4. Jalankan migrasi jika versi berbeda.
  5. Nyalakan aplikasi, uji login & daftar task.

### 12.4 Monitoring

- Uptime check tiap 5 menit (HTTP 200 di `/login`).
- Alert jika 3x gagal berturut-turut.
- Log error 5xx dikirim ke penyimpanan log.
- Pantau ukuran DB (alert jika > 500MB).

### 12.5 Handover Checklist

- [ ] Akses server/domain diserahkan.
- [ ] `.env` produksi terdokumentasi (tanpa membocorkan secret).
- [ ] Akun Owner produksi dibuat.
- [ ] Backup cron aktif & teruji.
- [ ] Dokumentasi setup & deploy dibaca ulang.
- [ ] Demo alur utama ke Owner.
- [ ] Daftar bug terbuka diserahkan.
- [ ] Kontak support disepakati.
