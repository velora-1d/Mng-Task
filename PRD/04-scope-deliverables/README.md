# 04. Scope & Deliverables (MVP)

## 1. In Scope (P0 — wajib selesai)

| ID | Modul | Isi | Prioritas |
|---|---|---|---|
| M1 | **Auth & Session** | Login, logout, session cookie, proteksi route, ganti password | P0 |
| M2 | **Landing Page** | Halaman publik: hero, fitur singkat, CTA login | P0 |
| M3 | **Dashboard** | Ringkasan task, overdue, due today, progres 7 hari, aktivitas terbaru | P0 |
| M4 | **Task Management** | CRUD task, assign, status, prioritas, deadline, filter, search, sorting, pagination | P0 |
| M5 | **Report Management** | Generate laporan harian/mingguan/bulanan, catatan manual, export CSV, riwayat | P0 |
| M6 | **Reminder** | Reminder otomatis dari deadline + reminder manual, tandai selesai | P0 |
| M7 | **User Management** | CRUD user (khusus Owner), reset password, aktif/nonaktif, ubah role | P0 |
| M8 | **Profil & Pengaturan** | Ubah nama, ganti password, pengaturan aplikasi (Owner) | P0 |
| M9 | **Audit Log** | Catat aksi create/update/delete pada task, user, report | P0 |
| M10 | **Seed & Dokumentasi** | Seed data demo, README setup, panduan deploy | P0 |

### Detail lintas modul (P0)

- Validasi server-side untuk semua form.
- Pesan error dan sukses berbahasa Indonesia.
- Loading state, empty state, error state.
- Responsive di lebar ≥ 360px.
- Pagination default 20 baris.
- Zona waktu Asia/Jakarta.
- Export CSV untuk task dan laporan.

---

## 2. P1 — Ditunda (boleh setelah MVP)

| Fitur | Alasan ditunda |
|---|---|
| Kanban board (drag & drop) | Nice to have; tabel + filter sudah cukup |
| Export PDF | Butuh renderer tambahan; CSV cukup untuk MVP |
| Notifikasi email/WA/push | Butuh layanan pihak ketiga dan biaya |
| Attachment file | Butuh storage & antivirus; di luar scope |
| Komentar pada task | Butuh real-time/kolaborasi |
| Subtask & checklist | Menambah kompleksitas data |
| Recurring task | Bisa ditangani manual dulu |
| Kalender view | P1 setelah task stabil |
| Import CSV | P1 |
| PWA / offline | P1 |
| Dark mode toggle manual | Bisa mengikuti sistem di MVP |

---

## 3. Out of Scope (tidak dikerjakan)

| Fitur | Alasan |
|---|---|
| Chat internal | Bukan produk kolaborasi real-time |
| Video call / meeting | Di luar domain |
| Multi-tenant (banyak organisasi dalam 1 instalasi) | Kompleksitas database & isolasi data |
| Billing / subscription | MVP gratis/internal |
| Mobile app native | Web responsive cukup |
| SSO / OAuth / 2FA | Ditunda sampai ada kebutuhan nyata |
| Gantt chart / dependency task | Bukan target user |
| Time tracking / timesheet | P1/P2 |
| Payroll, absensi, keuangan | Domain berbeda |
| Integrasi Slack/Telegram | Butuh layanan eksternal |

> Fitur di luar scope **tidak boleh** ditambahkan tanpa mengubah dokumen ini dan menyetujui perubahan timeline.

---

## 4. Deliverables

| No | Deliverable | Bentuk | Kriteria terima |
|---|---|---|---|
| D1 | Source code | Repo SvelteKit | Bisa dijalankan dengan `npm install && npm run dev` |
| D2 | Skema database | `schema.sql` + migrasi | `npm run db:migrate` menghasilkan skema bersih |
| D3 | Seed data | Script seed | Berisi 1 Owner, 3 User, 10 task contoh |
| D4 | Dokumentasi | `README.md` | Setup, env, perintah, struktur folder |
| D5 | PRD | Folder `PRD/` | 15 section lengkap |
| D6 | Panduan deploy | Bagian di README | Langkah deploy + catatan SQLite |
| D7 | UAT checklist | Section 15 | Semua test case P0 lulus |
| D8 | Handover | Demo + akun | Owner bisa login dan memakai aplikasi |

---

## 5. Acceptance Criteria MVP

MVP dianggap selesai jika:

- [ ] Owner bisa login dan membuat/menonaktifkan user.
- [ ] User bisa login, membuat task, mengubah status, dan melihat task miliknya.
- [ ] Owner bisa melihat seluruh task dan meng-assign task ke user.
- [ ] Reminder deadline muncul otomatis (H-3, H-1, hari H, overdue).
- [ ] Laporan harian/mingguan/bulanan bisa digenerate dan diexport CSV.
- [ ] Semua route terlindungi; user tidak bisa mengakses data orang lain.
- [ ] Tidak ada error 5xx pada alur utama.
- [ ] Semua test case P0 di section 15 lulus.
- [ ] Data tetap ada setelah aplikasi restart.
- [ ] Dokumentasi setup bisa diikuti orang lain tanpa bertanya.

---

## 6. Asumsi & Dependensi

| Item | Keterangan |
|---|---|
| Database | SQLite (file) untuk MVP |
| Hosting | Vercel (butuh Turso) **atau** VPS dengan volume persisten |
| Email | Tidak dipakai; reset password oleh Owner/CLI |
| Browser | Chrome, Edge, Firefox, Safari versi 2 terakhir |
| Jumlah user | ≤ 20 aktif |
| Volume data | ≤ 50.000 task (SQLite masih nyaman) |
| Developer | 1 fullstack |

---

## 7. Perubahan Scope

Setiap permintaan di luar daftar P0:

1. Dicatat sebagai change request.
2. Dinilai dampaknya ke timeline (section 14).
3. Disetujui Owner project sebelum dikerjakan.
4. Jika disetujui, pindahkan item dari P1/out-of-scope ke P0 dan update dokumen ini.
