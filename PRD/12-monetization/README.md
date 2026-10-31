# 12. Monetization

## 1. Status: **N/A untuk MVP**

Mng-Task versi MVP adalah aplikasi **internal/gratis**. Tidak ada model bisnis, pricing tier, payment gateway, atau pembatasan fitur berbayar.

**Alasan**
- Tujuan MVP adalah membuktikan alur kerja (task → reminder → laporan) berjalan.
- Menambah billing memperbesar scope dan menunda peluncuran.
- Belum ada validasi pasar yang cukup untuk menentukan harga.

---

## 2. Biaya Operasional (perkiraan)

| Komponen | Opsi | Biaya |
|---|---|---|
| Hosting | VPS 1 vCPU / 1 GB | ± Rp 50.000–100.000 / bulan |
| Domain | `.id` / `.com` | ± Rp 150.000–200.000 / tahun |
| Database | SQLite (file) | Rp 0 |
| Database alternatif | Turso free tier | Rp 0 (batas kuota) |
| Email/WA | Tidak dipakai | Rp 0 |
| Backup | Volume VPS | Rp 0–20.000 / bulan |

**Total perkiraan**: Rp 50.000–120.000 / bulan.

---

## 3. Jika Nanti Dijual (bukan komitmen MVP)

Hanya sebagai arah, bukan janji:

| Paket | Target | Isi |
|---|---|---|
| Free | 1–5 user | Task, reminder, laporan dasar |
| Pro | 6–20 user | Laporan lanjutan, export PDF, audit log |
| Business | 20+ user | Multi-tenant, SSO, prioritas support |

Syarat sebelum monetisasi:
1. Ada minimal 10 organisasi aktif.
2. Ada permintaan berbayar yang jelas.
3. Multi-tenant & billing sudah dirancang.
4. Dukungan pelanggan siap.

---

## 4. Yang Tidak Dilakukan

- Tidak ada iklan.
- Tidak ada penjualan data user.
- Tidak ada paywall pada fitur yang sudah dijanjikan di MVP.
- Tidak ada biaya tersembunyi untuk export data.

---

## 5. Keputusan

| Item | Nilai |
|---|---|
| Model bisnis MVP | Gratis / internal |
| Payment gateway | Tidak ada |
| Pricing tier | Tidak ada |
| Batas user | Tidak ada (teknis ≤ 20) |
| Evaluasi ulang | Setelah 3 bulan pemakaian |
