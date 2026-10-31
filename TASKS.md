# TASKS — Mng-Task MVP

Breakdown task implementasi dari PRD (scope **P0 saja**). Satu task = satu unit kerja yang bisa selesai dan diverifikasi dalam sekali duduk.

- Total: **54 task**
- Estimasi: **± 224 jam kerja**
- Stack: SvelteKit 3 + Svelte 5, SQLite (Drizzle + libSQL), Tailwind v4, Ember Studio tokens
- Baseline desain: `design/preview.html`

---

## 1. Ringkasan

| Modul | FE | BE | FS | QA | DevOps/Docs | Total task | Jam |
|---|---:|---:|---:|---:|---:|---:|---:|
| F — Fondasi | 3 | 2 | 1 | 0 | 0 | **6** | 29 |
| A — Auth & Session | 1 | 3 | 1 | 1 | 0 | **6** | 25 |
| U — User Management | 3 | 3 | 0 | 0 | 0 | **6** | 23 |
| T — Task | 4 | 4 | 2 | 1 | 0 | **11** | 51 |
| D — Dashboard | 1 | 1 | 1 | 0 | 0 | **3** | 13 |
| R — Reminder | 2 | 2 | 0 | 0 | 0 | **4** | 14 |
| P — Report | 1 | 2 | 1 | 1 | 0 | **5** | 23 |
| S — Settings | 2 | 2 | 0 | 0 | 0 | **4** | 12 |
| X — Security & QA | 2 | 1 | 0 | 2 | 0 | **5** | 19 |
| Z — Deploy & Docs | 0 | 0 | 0 | 0 | 4 | **4** | 15 |
| **Total** | **19** | **20** | **6** | **5** | **4** | **54** | **224** |

Keterangan: **FS** = fullstack (UI + action dalam satu alur), **QA** = testing/hardening, **DevOps** = infra & dokumen.

### Realitas timeline

| Skenario | Kapasitas | Perkiraan selesai |
|---|---|---|
| Manual, 1 dev, 8 jam/hari | 40 jam/minggu | ± 28 hari kerja (5,5 minggu) |
| Dengan bantuan AI coding (efektif ± 1,4×) | ± 56 jam/minggu | ± 20 hari kerja (4 minggu) |
| 2 dev (FE/BE split per modul) | ± 80 jam/minggu | ± 14–16 hari kerja |

Timeline PRD (20 hari) **hanya realistis** dengan bantuan AI atau 2 developer. Kalau manual, perlu mundur ke 4 Desember 2026.

---

## 2. F — Fondasi (6 task, 29 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| F-01 | Scaffold SvelteKit 3 + TS, struktur folder, env, scripts (`dev/build/db:*`), `.gitignore` | FS | – | 3 | `npm run dev` jalan; `.env.example` lengkap |
| F-02 | Pasang Tailwind v4 + `tokens.css` + font + `@theme inline` | FE | F-01 | 4 | Utility `bg-canvas`, `text-ink`, `border-border-base` bisa dipakai |
| F-03 | Schema Drizzle 8 tabel + migrasi awal + koneksi libSQL + pragma | BE | F-01 | 6 | `npm run db:migrate` membuat `data/mngtask.db`; `schema.sql` cocok |
| F-04 | Seed Owner, 3 user, 12 task, 3 reminder | BE | F-03 | 3 | Seed idempoten; akun UAT bisa login |
| F-05 | App shell: sidebar 256px, topbar, drawer mobile, menu aktif, badge | FE | F-02 | 5 | Sama seperti `design/preview.html`; responsif 360px |
| F-06 | UI primitives: button, input, select, chip, card, table, dialog, toast + halaman 403/404/500 | FE | F-02 | 8 | Semua state (loading/empty/error) tersedia; fokus keyboard |

---

## 3. A — Auth & Session (6 task, 25 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| A-01 | Library auth: hash argon2id, buat/verifikasi session, cookie flags, sliding expiry | BE | F-03 | 4 | Token disimpan sebagai hash; cookie `httpOnly/Secure/SameSite=Lax` |
| A-02 | Halaman login: form, toggle password, error umum, loading state | FE | F-05, F-06 | 4 | Sesuai desain; error tidak membocorkan email terdaftar |
| A-03 | Form action login + rate limit 5/15 menit + audit login | BE | A-01 | 5 | Percobaan ke-6 diblokir; login sukses/gagal tercatat |
| A-04 | `hooks.server.js`: muat session, `locals.user`, guard grup route `(app)`/`(owner)` | BE | A-01 | 4 | Route tanpa login redirect; User tidak bisa buka `/users` |
| A-05 | Logout, logout semua perangkat, ganti password paksa (`must_change_password`) | FS | A-04 | 5 | Session lain tercabut setelah ganti password |
| A-06 | Test auth: unit session + E2E login/logout/rate limit | QA | A-03, A-05 | 3 | Test lulus di CI lokal |

---

## 4. U — User Management (6 task, 23 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| U-01 | Query daftar user: search, filter role/status, pagination, sorting | BE | A-04 | 3 | Hanya Owner; query < 100ms untuk 100 user |
| U-02 | Halaman Pengguna: tabel, filter bar, pagination, empty state | FE | F-06, U-01 | 4 | Tabel desktop, kartu di mobile |
| U-03 | Action tambah user + validasi email unik + audit | BE | U-01 | 4 | Email case-insensitive; password awal di-hash |
| U-04 | Dialog tambah/edit user + validasi client | FE | U-02 | 4 | Error per field; submit ganda dicegah |
| U-05 | Action edit role, reset password, aktif/nonaktif + cabut session + aturan Owner terakhir | BE | U-03 | 5 | Owner terakhir tidak bisa diturunkan/dinonaktifkan |
| U-06 | UI aksi user: menu baris, konfirmasi, dialog reset password | FE | U-04, U-05 | 3 | Aksi destruktif pakai AlertDialog |

---

## 5. T — Task Management (11 task, 51 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| T-01 | Query task + filter kepemilikan + util overdue/format tanggal | BE | A-04 | 6 | User hanya melihat miliknya; Owner semua |
| T-02 | Halaman Tugas: tabel desktop, kartu mobile, pagination, empty state | FE | F-06, T-01 | 6 | Sesuai preview; tidak ada scroll horizontal di 360px |
| T-03 | Filter search/status/prioritas/assignee/deadline + sorting + pagination di server | BE | T-01 | 4 | Semua kombinasi filter konsisten; whitelist kolom sort |
| T-04 | Filter bar + search debounce + state di URL | FE | T-02, T-03 | 4 | Reload halaman mempertahankan filter |
| T-05 | Form create/edit task + validasi + datepicker + assignee picker | FE | F-06 | 6 | Deadline masa lalu ditolak saat create; field error jelas |
| T-06 | Action create/update task + validasi Zod + audit + aturan assign | BE | T-03 | 6 | Hanya Owner bisa assign ke user lain; audit tercatat |
| T-07 | Halaman detail task: info, tab aktivitas, tombol edit/hapus | FE | T-05 | 4 | Data lengkap; aksi sesuai role |
| T-08 | Action hapus + ubah status cepat + aturan transisi + `completed_at` | FS | T-06, T-07 | 5 | DONE mengisi completed_at; dibuka mengosongkan |
| T-09 | Assignee picker (Owner) + penanganan assignee nonaktif | FS | T-06 | 3 | Task assignee nonaktif bisa dipindahkan |
| T-10 | Export CSV task sesuai filter aktif | BE | T-03 | 3 | File terbuka di spreadsheet; escaping benar |
| T-11 | Test task: ownership, filter, transisi status, export | QA | T-08, T-10 | 4 | Uji IDOR lulus |

---

## 6. D — Dashboard (3 task, 13 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| D-01 | Query KPI: total aktif, selesai minggu ini, due today, overdue, grafik 7 hari | BE | T-01 | 5 | Angka cocok dengan data seed; cakupan per role |
| D-02 | UI 4 KPI card + grafik batang 7 hari + skeleton | FE | F-06, D-01 | 5 | Sama seperti preview; klik kartu membawa filter |
| D-03 | Panel deadline terdekat + aktivitas terbaru | FS | D-01 | 3 | Maks 5 item; tautan ke task terkait |

---

## 7. R — Reminder (4 task, 14 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| R-01 | Logika reminder otomatis H-3/H-1/H/overdue + query badge | BE | T-01 | 3 | Task DONE tidak muncul; zona waktu WIB |
| R-02 | Halaman Pengingat tab otomatis: grup, filter, tautan task | FE | F-06, R-01 | 4 | Kosong jika tidak ada deadline dekat |
| R-03 | CRUD reminder manual + tandai selesai + audit | BE | A-04 | 3 | Hanya milik sendiri |
| R-04 | UI reminder manual: list, dialog, aksi selesai + badge sidebar | FE | R-02, R-03 | 4 | Badge angka sesuai item aktif |

---

## 8. P — Report (5 task, 23 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| P-01 | Query statistik laporan + periode harian/mingguan/bulanan (WIB) | BE | T-01 | 5 | Angka cocok dengan data; periode Senin–Minggu |
| P-02 | UI pilih tipe/periode + tampilan ringkasan + catatan | FE | F-06, P-01 | 6 | Generate dan hasil tampil tanpa reload penuh |
| P-03 | Action generate + simpan snapshot `stats_json` + catatan + audit | BE | P-01 | 4 | Snapshot tidak berubah saat task diubah |
| P-04 | Riwayat laporan + hapus + export CSV | FS | P-03 | 5 | Maks 100 riwayat; CSV sesuai snapshot |
| P-05 | Test perhitungan statistik (unit) + ekspor | QA | P-03, P-04 | 3 | Test boundary: periode kosong, task DONE di luar periode |

---

## 9. S — Settings (4 task, 12 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| S-01 | Action profil: ubah nama, email (konfirmasi password), logout semua | BE | A-04 | 3 | Email unik; session lain tercabut |
| S-02 | UI tab profil + form + validasi | FE | F-06 | 3 | Error per field |
| S-03 | Action pengaturan aplikasi: nama organisasi, zona waktu, ambang reminder + audit | BE | A-04 | 2 | Hanya Owner |
| S-04 | UI pengaturan + dark mode toggle (localStorage) | FE | F-05 | 4 | Preferensi tema bertahan setelah reload |

---

## 10. X — Security & QA (5 task, 19 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| X-01 | Security headers + CSP (`kit.csp`) + cookie flags di produksi | BE | A-04 | 3 | Cek header lolos; tidak ada inline script |
| X-02 | Test IDOR, authorization, rate limit, sesi dicabut | QA | U-05, T-08 | 5 | Semua percobaan lintas data → 403/404 |
| X-03 | Audit aksesibilitas (axe + keyboard) + perbaikan | FE | Semua UI | 4 | WCAG AA; alur buat task selesai tanpa mouse |
| X-04 | QA responsive 360/768/1366 + 4 browser | FE | Semua UI | 4 | Tidak ada layout rusak |
| X-05 | Uji performa dengan 5.000 task + perbaikan index/query | QA | T-01, D-01, P-01 | 3 | Daftar < 1 detik; simpan < 500ms |

---

## 11. Z — Deploy & Docs (4 task, 15 jam)

| ID | Task | Tipe | Depends | Jam | Output / Acceptance |
|---|---|---|---:|---|---|
| Z-01 | Dockerfile + Caddy + volume `data/` + env produksi | DevOps | F-03 | 4 | `docker compose up` jalan; HTTPS aktif |
| Z-02 | Backup harian + retensi 7 hari + uji restore | DevOps | Z-01 | 3 | Restore berhasil, `integrity_check` ok |
| Z-03 | Deploy staging + smoke test alur utama | DevOps | X-05, Z-01 | 3 | Login → task → reminder → laporan → export |
| Z-04 | README setup/deploy, `.env.example`, handover + pendampingan UAT | Docs | Z-03 | 5 | Orang lain bisa setup tanpa bertanya |

---

## 12. Urutan Pengerjaan

### Gelombang 1 — Fondasi (F-01 → F-06)
Tidak ada UI yang bisa diuji sebelum F-03 (DB) dan F-05/F-06 (shell) selesai.

### Gelombang 2 — Auth (A-01 → A-06)
Semua modul lain bergantung pada `locals.user` dan guard. Jangan lanjut sebelum A-04 selesai.

### Gelombang 3 — Task (T-01 → T-11)
Inti produk. Kerjakan query (T-01/T-03) dan UI (T-02/T-04) bergantian, bukan FE semua dulu.

### Gelombang 4 — Turunan task (D, R, P)
Dashboard, reminder, dan report semuanya membaca tabel `tasks`. Bisa dikerjakan paralel kalau ada 2 dev.

### Gelombang 5 — User & Settings (U, S)
Tidak memblokir fitur lain, tapi dibutuhkan sebelum UAT.

### Gelombang 6 — Hardening & Deploy (X, Z)
Baru setelah semua fitur P0 selesai.

### Critical path
`F-01 → F-03 → A-01 → A-04 → T-01 → T-06 → T-08 → P-03 → X-02 → Z-03`

---

## 13. Rencana per Minggu (asumsi AI-assisted, 20 hari)

| Minggu | Tanggal | Task | Jam |
|---|---|---|---:|
| 1 | 2–6 Nov | F-01…F-06, A-01…A-03 | 47 |
| 2 | 9–13 Nov | A-04…A-06, U-01…U-06, T-01 | 47 |
| 3 | 16–20 Nov | T-02…T-11, D-01…D-03 | 64 |
| 4 | 23–27 Nov | R, P, S, X-01…X-03 | 59 |
| 5 (buffer) | 30 Nov–4 Des | X-04, X-05, Z-01…Z-04 | 27 |

Minggu 3–4 di atas kapasitas normal. Kalau tanpa AI, pakai 5,5 minggu (tambah 1,5 minggu).

---

## 14. Definition of Done (semua task)

- [ ] Kode lolos typecheck & lint.
- [ ] Validasi server-side, bukan hanya client.
- [ ] State loading / empty / error / sukses ada.
- [ ] Responsive di 360px dan 1366px.
- [ ] Tidak ada `console.log`/`TODO` tertinggal.
- [ ] Aksi penting tercatat di audit log (jika relevan).
- [ ] Test terkait lulus.
- [ ] Tidak ada data user lain yang bisa diakses (untuk task ber-data).

---

## 15. Yang Tidak Dihitung

Task P1/out-of-scope tidak masuk 54 di atas:

- Kanban board, PDF export, attachment, komentar, subtask.
- Email/WA/push notification.
- Multi-tenant, billing, SSO/2FA.
- Import CSV, PWA, calendar view.
- Mobile app.

Kalau salah satu dimasukkan, tambah 2–6 task per fitur dan perpanjang timeline.
