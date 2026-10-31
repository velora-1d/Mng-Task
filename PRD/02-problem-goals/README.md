# 02. Problem Statement & Goals

## 1. Problem Statement

### P-1: Catatan tugas tersebar
Tugas dicatat di WhatsApp, buku, dan spreadsheet sekaligus. Tidak ada satu sumber kebenaran, sehingga tugas mudah terlewat atau dikerjakan dua orang.

### P-2: Deadline tidak terpantau
Tidak ada pengingat otomatis. Deadline baru disadari setelah lewat, dan tidak ada cara cepat melihat tugas yang paling mendesak.

### P-3: Laporan dibuat manual
Rekap harian/bulanan dikerjakan dengan menyalin data dari beberapa tempat. Prosesnya memakan waktu 30–60 menit per periode dan rawan salah hitung.

### P-4: Owner tidak punya visibilitas
Owner tidak tahu siapa mengerjakan apa dan sejauh mana progresnya tanpa bertanya satu per satu.

### Dampak jika tidak diselesaikan

| Masalah | Dampak |
|---|---|
| P-1 | Pekerjaan duplikat, tugas hilang, waktu terbuang untuk koordinasi |
| P-2 | Deadline terlewat, kualitas pekerjaan menurun, reputasi tim terganggu |
| P-3 | Waktu rekap membengkak, laporan tidak konsisten, keputusan berbasis data salah |
| P-4 | Owner lambat mengambil keputusan, beban kerja tim tidak seimbang |

---

## 2. Goals

| ID | Goal | Terukur? |
|---|---|---|
| G-1 | Menyediakan satu tempat untuk mencatat dan mengelola task | Ya |
| G-2 | Mengurangi jumlah deadline yang terlewat | Ya |
| G-3 | Menghilangkan rekap laporan manual | Ya |
| G-4 | Memberi Owner visibilitas progres tim | Ya |
| G-5 | Menjaga input task tetap cepat (< 30 detik) | Ya |

---

## 3. Success Metrics

Target dihitung setelah **30 hari pemakaian** oleh minimal 5 user aktif.

| ID | Metric | Definisi | Target |
|---|---|---|---|
| M-1 | Task ber-deadline | % task yang punya `due_date` | ≥ 80% |
| M-2 | Kecepatan input | Median waktu dari buka form sampai task tersimpan | ≤ 30 detik |
| M-3 | Task ter-update | % task yang statusnya pernah diubah dari `TODO` | ≥ 90% |
| M-4 | Overdue rate | % task `OVERDUE` dibanding total task aktif | ≤ 15% |
| M-5 | Pemakaian laporan | % user yang membuka/mengexport laporan minimal 1x/bulan | ≥ 60% |
| M-6 | Waktu buat laporan | Dari klik "Buat Laporan" sampai file terunduh | ≤ 60 detik |
| M-7 | Retensi mingguan | % user yang aktif di minggu berikutnya | ≥ 70% |
| M-8 | Error rate | Request yang gagal (5xx) | ≤ 1% |

### Cara Mengukur

- M-1, M-3, M-4, M-5 dihitung lewat query SQL ke tabel `tasks`, `reports`, dan `audit_logs`.
- M-2 diukur lewat event `task_created` (timestamp form dibuka vs disimpan).
- M-6 diukur dari durasi request generate + download.
- M-7 dihitung dari `last_seen_at` di tabel `users`.
- M-8 dari log platform hosting.

---

## 4. Non-Goals (MVP)

- Bukan pengganti aplikasi chat tim.
- Bukan tools manajemen proyek dengan Gantt/dependency.
- Bukan aplikasi mobile native.
- Bukan produk multi-tenant yang dijual per sekolah/perusahaan pada MVP.
- Bukan sistem absensi, payroll, atau keuangan.

---

## 5. Asumsi

1. Tim berukuran kecil (≤ 20 user aktif), sehingga SQLite cukup.
2. Semua user punya email aktif, tetapi email **tidak** dipakai untuk notifikasi pada MVP.
3. Perangkat utama adalah browser desktop; mobile hanya untuk cek dan update status.
4. Data task bukan data rahasia tingkat tinggi; tetap disimpan dengan kontrol akses yang benar.

---

## 6. Risiko Awal

| Risiko | Dampak | Mitigasi |
|---|---|---|
| User malas update status | Laporan tidak akurat | Update status 1 klik dari daftar task; reminder harian in-app |
| SQLite tidak cocok untuk serverless | Data hilang saat deploy | Gunakan Turso/libSQL atau VPS dengan volume persisten (lihat section 10) |
| Scope melebar (chat, attachment) | MVP tidak selesai | Out of scope ditulis eksplisit di section 04 |
| Laporan dianggap "tidak lengkap" | User kembali ke Excel | Sediakan catatan manual pada laporan + export CSV |
