# 14. Timeline / Roadmap

## 1. Ringkasan

| Item | Nilai |
|---|---|
| Mulai | Senin, 2 November 2026 |
| Target selesai | Jumat, 27 November 2026 |
| Buffer kontingensi | s/d Senin, 30 November 2026 |
| Total hari kerja | 20 hari |
| Tim | 1 fullstack developer |
| Metode | Incremental, demo tiap akhir fase |

---

## 2. Fase Pengerjaan

| Fase | Tanggal | Durasi | Fokus | Deliverable |
|---|---|---|---|---|
| **F0** | 2–3 Nov | 2 hari | Finalisasi PRD, setup repo, skema SQLite, seed | PRD final, project jalan, DB terbentuk |
| **F1** | 4–6 Nov | 3 hari | Design system, layout shell, halaman publik & login (UI) | Komponen dasar, landing, login tampil |
| **F2** | 9–11 Nov | 3 hari | Auth backend, session, guard role, user management | Login berfungsi, Owner bisa kelola user |
| **F3** | 12–13, 16–18 Nov | 5 hari | Task CRUD, assign, filter/search/sort, pagination, dashboard | Modul task & dashboard selesai |
| **F4** | 19–20, 23–24 Nov | 4 hari | Reminder, laporan + export CSV, profil & pengaturan | Modul reminder & laporan selesai |
| **F5** | 25–26 Nov | 2 hari | QA, keamanan, aksesibilitas, perbaikan bug | Semua test P0 lulus |
| **F6** | 27 Nov | 1 hari | Deploy, backup, dokumentasi, handover | Aplikasi live + serah terima |

---

## 3. Milestone

| Milestone | Tanggal | Kriteria |
|---|---|---|
| M0 — Fondasi | 3 Nov | Repo jalan, migrasi & seed berhasil, PRD disetujui |
| M1 — UI siap | 6 Nov | Landing + login + shell bisa dilihat di desktop & mobile |
| M2 — Auth & user | 11 Nov | Owner bisa login, tambah user; user bisa login |
| M3 — Task & dashboard | 18 Nov | CRUD task, assign, filter, dashboard berfungsi |
| M4 — Reminder & laporan | 24 Nov | Reminder otomatis + laporan + export CSV |
| M5 — Siap rilis | 26 Nov | UAT P0 lulus, tidak ada bug kritis |
| M6 — Live | 27 Nov | Deploy produksi, backup aktif, handover |

---

## 4. Rincian per Fase

### F0 — Setup (2 hari)
- Finalisasi PRD & keputusan terbuka.
- Init SvelteKit + TypeScript + Tailwind + shadcn-svelte.
- Setup Drizzle + libSQL + migrasi awal.
- Seed Owner & data demo.
- Struktur folder & konvensi kode.
- **Output**: `npm run dev` jalan, DB terbentuk.

### F1 — Design (3 hari)
- Token warna, tipografi, spacing.
- Layout shell (sidebar, topbar, drawer mobile).
- Komponen: button, input, select, table, badge, dialog, toast.
- Landing page + halaman login.
- **Output**: tampilan konsisten, responsive.

### F2 — Auth & User (3 hari)
- Hash argon2id, session, cookie, hooks guard.
- Login/logout, rate limit, ganti password paksa.
- CRUD user (Owner), aktif/nonaktif, reset password.
- Audit log dasar.
- **Output**: akses terkontrol.

### F3 — Task & Dashboard (5 hari)
- CRUD task + detail + assign.
- Filter, search, sorting, pagination.
- Ubah status cepat + transisi.
- Dashboard (kartu, grafik 7 hari, deadline terdekat, aktivitas).
- Export CSV task.
- **Output**: inti produk selesai.

### F4 — Reminder, Laporan, Pengaturan (4 hari)
- Reminder otomatis H-3/H-1/H/overdue.
- Reminder manual + tandai selesai.
- Generate laporan + snapshot + catatan.
- Export CSV laporan + riwayat.
- Profil, ganti password, pengaturan aplikasi.
- **Output**: nilai produk lengkap.

### F5 — QA & Hardening (2 hari)
- Jalankan seluruh test case P0 (section 15).
- Uji IDOR, rate limit, header keamanan.
- Uji aksesibilitas & responsive.
- Perbaikan bug.
- **Output**: siap rilis.

### F6 — Deploy & Handover (1 hari)
- Setup VPS/volume atau Turso.
- Konfigurasi env, HTTPS, backup cron.
- Uji asap di produksi.
- Dokumentasi & demo ke Owner.
- **Output**: aplikasi live.

---

## 5. Dependensi

| Dependensi | Dibutuhkan pada | Risiko jika terlambat |
|---|---|---|
| Keputusan final PRD | F0 | Semua fase bergeser |
| Akses server/domain | F6 | Tidak bisa deploy |
| Akun Turso (jika pilih Vercel) | F4 | Deploy tertunda |
| Data user contoh | F2 | UAT kurang realistis |
| Review Owner | Akhir tiap fase | Umpan balik menumpuk |

---

## 6. Risiko Jadwal

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Scope bertambah | Tinggi | Tinggi | Out of scope dikunci di section 04 |
| Bug SQLite/concurrency | Sedang | Sedang | WAL + busy_timeout + test beban |
| Desain revisi berulang | Sedang | Sedang | Review di akhir F1, bukan di akhir |
| Deploy bermasalah | Sedang | Tinggi | Uji deploy di F4 (staging) |
| Developer sakit/izin | Rendah | Tinggi | Buffer 1 hari + dokumentasi harian |

---

## 7. Di Luar Timeline

Tidak dikerjakan pada 20 hari ini:

- Kanban board, PDF, attachment, komentar, sub-task.
- Notifikasi email/WA/push.
- Multi-tenant & billing.
- Mobile app.
- Import data.

Fitur tersebut masuk roadmap P1 setelah MVP stabil.
