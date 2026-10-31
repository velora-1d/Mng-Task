# 08. Functional Requirements

## 1. Authentication & Session

| ID | Requirement | Prioritas |
|---|---|---|
| FR-AUTH-01 | User login dengan email + password | P0 |
| FR-AUTH-02 | Email dicocokkan case-insensitive | P0 |
| FR-AUTH-03 | Password diverifikasi dengan hash argon2id | P0 |
| FR-AUTH-04 | Session disimpan di tabel `sessions`; cookie `httpOnly`, `secure`, `SameSite=Lax` | P0 |
| FR-AUTH-05 | Session berlaku 7 hari, diperpanjang otomatis saat aktif | P0 |
| FR-AUTH-06 | Logout menghapus session aktif | P0 |
| FR-AUTH-07 | User nonaktif tidak bisa login | P0 |
| FR-AUTH-08 | Login dibatasi 5 percobaan / 15 menit per email+IP | P0 |
| FR-AUTH-09 | User wajib ganti password jika `must_change_password = 1` | P0 |
| FR-AUTH-10 | Ganti password menghapus semua session lain | P0 |

**Catatan**: tidak ada registrasi publik, OTP, SSO, atau reset password mandiri.

---

## 2. User Management (Owner)

| ID | Requirement | Prioritas |
|---|---|---|
| FR-USER-01 | Owner melihat daftar user dengan pagination | P0 |
| FR-USER-02 | Owner menambah user (nama, email, password awal, role) | P0 |
| FR-USER-03 | Email unik, case-insensitive | P0 |
| FR-USER-04 | Owner mengubah nama/email/role user | P0 |
| FR-USER-05 | Owner mereset password user | P0 |
| FR-USER-06 | Owner mengaktifkan/menonaktifkan user | P0 |
| FR-USER-07 | Sistem menolak menonaktifkan Owner terakhir | P0 |
| FR-USER-08 | Sistem menolak menurunkan role Owner terakhir | P0 |
| FR-USER-09 | User nonaktif kehilangan semua session | P0 |
| FR-USER-10 | Search nama/email + filter role/status | P0 |
| FR-USER-11 | Aksi Owner pada user dicatat di audit log | P0 |

---

## 3. Task Management

| ID | Requirement | Prioritas |
|---|---|---|
| FR-TASK-01 | User/Owner membuat task dengan judul wajib | P0 |
| FR-TASK-02 | Field: judul, deskripsi, status, prioritas, deadline, assignee | P0 |
| FR-TASK-03 | Status default `TODO`, prioritas default `MEDIUM` | P0 |
| FR-TASK-04 | Status valid: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE` | P0 |
| FR-TASK-05 | Prioritas valid: `LOW`, `MEDIUM`, `HIGH`, `URGENT` | P0 |
| FR-TASK-06 | Deadline opsional; tidak boleh masa lalu saat membuat task baru | P0 |
| FR-TASK-07 | Hanya Owner yang boleh mengubah assignee menjadi user lain | P0 |
| FR-TASK-08 | User hanya melihat task buatan/assign dirinya | P0 |
| FR-TASK-09 | Owner melihat semua task | P0 |
| FR-TASK-10 | Ubah status dari daftar tanpa membuka detail | P0 |
| FR-TASK-11 | `completed_at` diisi saat status jadi `DONE`; dikosongkan saat dibuka | P0 |
| FR-TASK-12 | Task yang deadline-nya lewat & belum `DONE` ditampilkan sebagai Overdue | P0 |
| FR-TASK-13 | Hapus task dengan konfirmasi; hanya pembuat atau Owner | P0 |
| FR-TASK-14 | Search judul/deskripsi, filter status/prioritas/assignee/deadline | P0 |
| FR-TASK-15 | Sorting deadline/prioritas/judul/dibuat/diubah | P0 |
| FR-TASK-16 | Pagination 20/50/100 per halaman | P0 |
| FR-TASK-17 | Export CSV sesuai filter aktif | P0 |
| FR-TASK-18 | Setiap create/update/delete dicatat di audit log | P0 |
| FR-TASK-19 | Soft delete (`deleted_at`) agar data bisa dipulihkan manual | P1 |

**Aturan transisi status**

| Dari | Boleh ke |
|---|---|
| `TODO` | `IN_PROGRESS`, `DONE` |
| `IN_PROGRESS` | `TODO`, `BLOCKED`, `DONE` |
| `BLOCKED` | `IN_PROGRESS`, `DONE` |
| `DONE` | `TODO`, `IN_PROGRESS` |

---

## 4. Report

| ID | Requirement | Prioritas |
|---|---|---|
| FR-REPORT-01 | Generate laporan harian/mingguan/bulanan | P0 |
| FR-REPORT-02 | Periode mengikuti WIB | P0 |
| FR-REPORT-03 | Statistik: total, selesai, belum selesai, overdue, per status, per prioritas | P0 |
| FR-REPORT-04 | User hanya membuat laporan dirinya | P0 |
| FR-REPORT-05 | Owner bisa membuat laporan semua user atau user tertentu | P0 |
| FR-REPORT-06 | Laporan menyimpan snapshot (`stats_json`) | P0 |
| FR-REPORT-07 | Catatan manual bisa ditambah/diubah setelah generate | P0 |
| FR-REPORT-08 | Export CSV | P0 |
| FR-REPORT-09 | Riwayat laporan maksimal 100 terakhir + hapus riwayat | P0 |
| FR-REPORT-10 | Generate laporan dicatat di audit log | P1 |

---

## 5. Reminder

| ID | Requirement | Prioritas |
|---|---|---|
| FR-REM-01 | Reminder otomatis H-3, H-1, hari H, overdue | P0 |
| FR-REM-02 | Hanya untuk task belum `DONE` | P0 |
| FR-REM-03 | Reminder otomatis dihitung saat halaman dimuat | P0 |
| FR-REM-04 | User membuat reminder manual (judul, catatan, waktu) | P0 |
| FR-REM-05 | Reminder manual bisa ditandai `DONE` | P0 |
| FR-REM-06 | Reminder manual hanya milik pembuat | P0 |
| FR-REM-07 | Badge jumlah pengingat aktif di sidebar | P0 |
| FR-REM-08 | Tidak ada email/WA/push di MVP | P0 |

---

## 6. Dashboard

| ID | Requirement | Prioritas |
|---|---|---|
| FR-DASH-01 | Kartu total task aktif, selesai minggu ini, due today, overdue | P0 |
| FR-DASH-02 | Grafik task selesai 7 hari terakhir | P0 |
| FR-DASH-03 | Panel deadline terdekat (maks 5) | P0 |
| FR-DASH-04 | Panel aktivitas terbaru (maks 5) | P0 |
| FR-DASH-05 | Data mengikuti cakupan role | P0 |
| FR-DASH-06 | Klik kartu membuka daftar task terfilter | P0 |

---

## 7. Profil & Pengaturan

| ID | Requirement | Prioritas |
|---|---|---|
| FR-SET-01 | User mengubah nama sendiri | P0 |
| FR-SET-02 | User mengubah email (konfirmasi password) | P0 |
| FR-SET-03 | User mengganti password | P0 |
| FR-SET-04 | User logout dari semua perangkat | P0 |
| FR-SET-05 | Owner mengubah nama organisasi | P0 |
| FR-SET-06 | Owner mengubah zona waktu | P1 |
| FR-SET-07 | Owner mengubah ambang reminder (default 3, 1, 0 hari) | P1 |

---

## 8. Validasi Input

| Form | Field | Aturan | Pesan error |
|---|---|---|---|
| Login | Email | Wajib, format email | "Email tidak valid." |
| Login | Password | Wajib, min 1 | "Password wajib diisi." |
| User | Nama | Wajib, 2–100 karakter | "Nama harus 2–100 karakter." |
| User | Email | Wajib, format email, unik | "Email sudah digunakan." |
| User | Password awal | Wajib, min 8 karakter | "Password minimal 8 karakter." |
| User | Role | Wajib, `OWNER`/`USER` | "Role tidak valid." |
| Task | Judul | Wajib, 3–200 karakter | "Judul harus 3–200 karakter." |
| Task | Deskripsi | Opsional, maks 5.000 | "Deskripsi maksimal 5.000 karakter." |
| Task | Status | Wajib, enum | "Status tidak valid." |
| Task | Prioritas | Wajib, enum | "Prioritas tidak valid." |
| Task | Deadline | Opsional, format `YYYY-MM-DD`, tidak boleh < hari ini saat create | "Deadline tidak boleh tanggal yang sudah lewat." |
| Task | Assignee | Opsional, user aktif | "User tidak ditemukan atau nonaktif." |
| Reminder | Judul | Wajib, 3–150 karakter | "Judul pengingat harus 3–150 karakter." |
| Reminder | Waktu | Wajib, format tanggal+waktu | "Waktu pengingat tidak valid." |
| Report | Tipe | Wajib, `DAILY`/`WEEKLY`/`MONTHLY` | "Tipe laporan tidak valid." |
| Report | Periode | Wajib, awal ≤ akhir | "Periode tidak valid." |
| Profil | Password baru | Min 8 karakter, ≠ password lama | "Password baru minimal 8 karakter." |
| Profil | Konfirmasi | Harus sama | "Konfirmasi password tidak cocok." |

**Aturan umum validasi**
- Validasi dijalankan **di server**; validasi client hanya untuk UX.
- Pesan error ditampilkan di bawah field terkait.
- Input disimpan ulang ke form saat validasi gagal (kecuali password).
- Semua input di-trim; string kosong dianggap tidak diisi.
- Email dinormalisasi ke lowercase.

---

## 9. Notifikasi In-App

| Event | Tipe | Tampil di |
|---|---|---|
| Task dibuat/diubah/dihapus | Toast | Halaman aktif |
| Task di-assign | Badge + aktivitas | Dashboard assignee |
| Deadline H-3/H-1/H/overdue | Badge | Sidebar + halaman Pengingat |
| Gagal login berulang | Pesan error | Halaman login |
| Reset password oleh Owner | Pesan | Halaman login user |

Tidak ada notifikasi eksternal (email, SMS, WA, push).

---

## 10. Penanganan Error

| Kode | Situasi | Perilaku |
|---|---|---|
| 400 | Input tidak valid | Form + pesan per field |
| 401 | Belum login / session habis | Redirect `/login?next=...` |
| 403 | Role tidak berhak | Halaman 403 + tautan dashboard |
| 404 | Data tidak ada / bukan miliknya | Halaman 404 |
| 409 | Email duplikat | Pesan "Email sudah digunakan." |
| 429 | Rate limit | "Terlalu banyak percobaan. Coba lagi dalam 15 menit." |
| 500 | Error server | Halaman error + tombol coba lagi, log detail di server |

---

## 11. Non-Functional Requirements

| ID | Kategori | Target |
|---|---|---|
| NFR-01 | Performa | Halaman daftar termuat < 1 detik (data ≤ 5.000 task) |
| NFR-02 | Performa | Aksi simpan < 500ms (p95) |
| NFR-03 | Skalabilitas | 20 user aktif, 50.000 task |
| NFR-04 | Ketersediaan | 99,5% per bulan |
| NFR-05 | Keamanan | Lihat section 11 |
| NFR-06 | Aksesibilitas | WCAG 2.1 AA |
| NFR-07 | Kompatibilitas | 2 versi terakhir Chrome/Edge/Firefox/Safari |
| NFR-08 | Backup | Harian, retensi 7 hari |
| NFR-09 | Logging | Error + audit aksi penting |
| NFR-10 | Bahasa | UI 100% Indonesia |

---

## 12. Traceability

Setiap FR P0 harus punya minimal satu test case di [`15-uat-maintenance`](../15-uat-maintenance/README.md). Format ID test: `TC-<MODUL>-<nn>`.
