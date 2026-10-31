# 06. Menu & Features List

## 1. Peta Navigasi

| Menu | Route | Akses | Prioritas |
|---|---|---|---|
| Landing | `/` | Publik | P0 |
| Login | `/login` | Publik | P0 |
| Dashboard | `/dashboard` | Owner, User | P0 |
| Tugas | `/tasks` | Owner, User | P0 |
| Detail / Form Tugas | `/tasks/new`, `/tasks/[id]` | Owner, User | P0 |
| Laporan | `/reports` | Owner, User | P0 |
| Pengingat | `/reminders` | Owner, User | P0 |
| Pengguna | `/users` | Owner | P0 |
| Pengaturan | `/settings` | Owner (aplikasi), semua (profil) | P0 |

---

## 2. Landing Page (`/`)

**Tujuan**: menjelaskan produk dalam 10 detik dan mengarahkan ke login.

**Fitur**
- Hero: judul, subjudul, CTA "Masuk".
- 3 kartu fitur: Catat tugas, Pantau deadline, Laporan otomatis.
- Bagian "Cara kerja" 3 langkah.
- Footer: nama produk, tahun, tautan login.

**Aturan**
- Tidak ada form registrasi.
- Jika user sudah login dan membuka `/`, arahkan ke `/dashboard`.
- Tidak menampilkan data internal apa pun.

**Acceptance**
- [ ] CTA mengarah ke `/login`.
- [ ] Halaman bisa dibuka tanpa login.

---

## 3. Login (`/login`)

**Tujuan**: autentikasi email + password.

**Fitur**
- Form email, password, tombol "Masuk".
- Toggle lihat password.
- Pesan error umum: "Email atau password salah."
- Info "Lupa password? Hubungi Owner."

**Aturan**
- Rate limit 5 percobaan / 15 menit per email+IP.
- User nonaktif tidak bisa login.
- Setelah login: Owner & User diarahkan ke `/dashboard`.
- Session berlaku 7 hari (sliding).

**Acceptance**
- [ ] Kredensial benar → masuk.
- [ ] Kredensial salah → pesan umum, tidak membocorkan email terdaftar.
- [ ] Percobaan berlebih → ditolak sementara.

---

## 4. Dashboard (`/dashboard`)

**Tujuan**: jawab "apa yang harus saya kerjakan hari ini?"

**Fitur**
- 4 kartu ringkasan:
  - Total task aktif
  - Selesai minggu ini
  - Deadline hari ini
  - Overdue
- Grafik batang 7 hari terakhir (task selesai per hari).
- Panel "Deadline terdekat" (maks 5).
- Panel "Aktivitas terbaru" (maks 5, dari audit log).
- Tombol cepat "Buat Task".

**Cakupan data**
- User: hanya task miliknya/di-assign.
- Owner: seluruh organisasi + filter per user.

**Empty state**: "Belum ada task. Mulai dengan membuat task pertama."

**Acceptance**
- [ ] Angka kartu sesuai query database.
- [ ] Klik kartu/preset membuka daftar task dengan filter yang sesuai.
- [ ] Data user tidak menampilkan task orang lain.

---

## 5. Tugas (`/tasks`)

**Tujuan**: daftar utama pekerjaan.

**Kolom tabel**: Judul, Status, Prioritas, Assignee, Deadline, Pembuat, Aksi.

**Fitur**
- Tambah task (`/tasks/new`).
- Lihat/edit detail (`/tasks/[id]`).
- Hapus dengan konfirmasi.
- Ubah status cepat dari baris tabel (dropdown).
- Assign task ke user lain (khusus Owner).
- Export CSV sesuai filter aktif.

**Filter/search**
- Search judul & deskripsi (debounce 300ms).
- Status: semua / `TODO` / `IN_PROGRESS` / `BLOCKED` / `DONE`.
- Prioritas: semua / `LOW` / `MEDIUM` / `HIGH` / `URGENT`.
- Assignee (Owner): semua / per user / belum di-assign.
- Deadline: semua / hari ini / 7 hari ke depan / overdue.
- Rentang tanggal dibuat.

**Sorting**: deadline (default), prioritas, judul, dibuat, diubah. Naik/turun.

**Pagination**: 20 per halaman; pilihan 20/50/100.

**Aturan**
- User hanya melihat task miliknya/di-assign.
- User tidak bisa assign ke orang lain saat edit; hanya Owner.
- Default filter untuk User: "Tugas saya" aktif.
- Deadline lewat + belum `DONE` otomatis berstatus tampilan **Overdue** (bukan status tersimpan).

**Empty state**: bedakan "belum ada task" vs "tidak ada hasil filter" (sertakan tombol reset filter).

---

## 6. Form & Detail Tugas (`/tasks/new`, `/tasks/[id]`)

**Field**

| Field | Wajib | Catatan |
|---|---|---|
| Judul | Ya | 3–200 karakter |
| Deskripsi | Tidak | Maks 5.000 karakter |
| Status | Ya | Default `TODO` |
| Prioritas | Ya | Default `MEDIUM` |
| Deadline | Tidak | Tanggal; tidak boleh masa lalu saat membuat |
| Assignee | Tidak | Hanya Owner yang bisa memilih user lain |

**Fitur**
- Simpan, batal, hapus (sesuai izin).
- Menampilkan pembuat, tanggal dibuat, terakhir diubah.
- Riwayat perubahan (dari audit log) di tab "Aktivitas".

**Acceptance**
- [ ] Validasi muncul di bawah field.
- [ ] Simpan ganda tidak membuat data ganda (tombol disabled saat submit).
- [ ] Setelah simpan → kembali ke daftar dengan toast sukses.

---

## 7. Laporan (`/reports`)

**Tujuan**: rekap otomatis pekerjaan per periode.

**Fitur**
- Pilih tipe: Harian / Mingguan / Bulanan.
- Pilih periode (default: hari ini / minggu ini / bulan ini).
- Generate laporan (on-demand).
- Ringkasan: total task, selesai, belum selesai, overdue, per status, per prioritas, per assignee.
- Catatan manual (teks bebas) pada laporan.
- Export CSV.
- Riwayat laporan yang pernah dibuat (maks 100 terakhir) + hapus riwayat.

**Cakupan**
- User: laporan dirinya.
- Owner: bisa pilih "semua user" atau user tertentu.

**Aturan**
- Laporan yang sudah digenerate menyimpan snapshot angka (`stats_json`), sehingga tidak berubah saat task diubah kemudian.
- Tidak ada penjadwalan otomatis di MVP (generate manual).

**Empty state**: "Belum ada data pada periode ini."

**Acceptance**
- [ ] Angka laporan sama dengan data task pada periode tersebut.
- [ ] Export CSV bisa dibuka di spreadsheet.
- [ ] Laporan lama tidak berubah saat task baru ditambahkan.

---

## 8. Pengingat (`/reminders`)

**Tujuan**: memastikan deadline tidak terlewat.

**Jenis**
1. **Otomatis** — dihitung dari `tasks.due_date`:
   - H-3, H-1, hari H, dan overdue.
   - Hanya task berstatus belum `DONE`.
2. **Manual** — dibuat user (judul, catatan, waktu pengingat).

**Fitur**
- Tab "Otomatis" dan "Manual".
- Tandai manual reminder sebagai `DONE`.
- Tautan langsung ke task terkait.
- Badge jumlah pengingat aktif di sidebar.
- Filter: hari ini, 3 hari, 7 hari, overdue, selesai.

**Aturan**
- Tidak ada email/WA/push. Semua in-app.
- Reminder otomatis tidak bisa dihapus; hilang saat task selesai atau deadline diubah.
- Reminder manual hanya milik pembuat.

**Empty state**: "Tidak ada pengingat. Semua deadline masih jauh."

---

## 9. Pengguna (`/users`) — Owner

**Fitur**
- Daftar user: Nama, Email, Role, Status, Jumlah task aktif, Dibuat.
- Tambah user (nama, email, password awal, role).
- Edit nama/email/role.
- Reset password.
- Aktif/nonaktifkan user.
- Search nama/email, filter role & status.
- Sorting: nama, dibuat, status.

**Aturan**
- Hanya Owner.
- Tidak bisa menonaktifkan/menghapus Owner terakhir.
- Tidak bisa menurunkan role Owner terakhir.
- Email unik (case-insensitive).
- User nonaktif tidak bisa login; task-nya tetap ada.
- Tidak ada kirim email undangan; password awal diberikan Owner secara langsung.

**Empty state**: "Belum ada user selain Anda."

---

## 10. Pengaturan (`/settings`)

**Tab Profil (semua role)**
- Ubah nama.
- Ubah email (wajib password konfirmasi).
- Ganti password (password lama + baru + konfirmasi).
- Logout dari semua perangkat (hapus semua session).

**Tab Aplikasi (Owner)**
- Nama organisasi (tampil di sidebar/landing).
- Zona waktu (default Asia/Jakarta).
- Ambang reminder otomatis (default H-3, H-1, H).
- Konfirmasi sebelum hapus (selalu aktif, tidak bisa dimatikan di MVP).

**Aturan**
- Perubahan pengaturan aplikasi dicatat di audit log.
- Ganti password menghapus semua session lain.

---

## 11. Matriks Fitur per Role

| Fitur | Owner | User |
|---|---|---|
| Dashboard semua data | ✅ | ❌ |
| Dashboard data sendiri | ✅ | ✅ |
| Buat task | ✅ | ✅ |
| Edit task sendiri | ✅ | ✅ |
| Edit task orang lain | ✅ | ❌ |
| Assign task | ✅ | ❌ |
| Hapus task sendiri | ✅ | ✅ |
| Hapus task orang lain | ✅ | ❌ |
| Buat laporan sendiri | ✅ | ✅ |
| Buat laporan semua user | ✅ | ❌ |
| Reminder manual | ✅ | ✅ |
| Kelola user | ✅ | ❌ |
| Pengaturan aplikasi | ✅ | ❌ |
| Audit log | ✅ | ❌ |
