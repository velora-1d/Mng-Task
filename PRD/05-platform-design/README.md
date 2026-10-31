# 05. Platform & Design System

## 1. Platform

| Item | Keputusan |
|---|---|
| Platform | **Web only** (responsive) |
| Mobile app | Tidak ada di MVP |
| PWA | P1 |
| Breakpoint | Mobile < 640px, tablet 640–1023px, desktop ≥ 1024px |
| Target utama | Desktop 1366×768 ke atas |
| Browser | Chrome, Edge, Firefox, Safari (2 versi terakhir) |
| Zona waktu | Asia/Jakarta (WIB) |
| Dark mode | Ikut preferensi sistem + toggle manual di topbar (disimpan di `localStorage`) |

### Perilaku Responsive

| Halaman | Desktop | Mobile |
|---|---|---|
| Navigasi | Sidebar 256px | Sidebar jadi drawer + tombol menu |
| Tabel task | Tabel penuh | Kartu per task (stack) |
| Form | Dua kolom untuk field pendek | Satu kolom |
| Dashboard | Grid 4 kartu + 2 panel | Kartu bertumpuk |
| Filter | Baris horizontal | Tombol "Filter" → sheet |

---

## 2. Design System

Mengadopsi **Ember Studio** ([designmd.ai/chef/ember-studio](https://designmd.ai/chef/ember-studio), lisensi MIT) — sistem desain untuk aplikasi manajemen proyek dengan nuansa hangat, tenang, dan premium.

File acuan:
- `design/EMBER-STUDIO.md` — sumber asli
- `design/tokens.css` — token hasil adaptasi (light + dark)
- `design/preview.html` — mockup dashboard untuk review visual

**Arah**: hangat dan tenang, bukan korporat biru yang generik. Warna tanah (terracotta + stone) membuat aplikasi nyaman dipakai berjam-jam, sementara aksen amber hanya dipakai untuk hal yang butuh perhatian.

---

## 3. Warna

### 3.1 Light Mode

| Token | Nilai | Pemakaian |
|---|---|---|
| Canvas | `#FAFAF9` | Background halaman |
| Surface | `#F5F5F4` | Card, panel, input |
| Surface raised | `#E7E5E4` | Hover, baris terpilih, tab aktif |
| Border | `#D6D3D1` | Garis card, divider, input |
| Text primary | `#1C1917` | Judul, body |
| Text secondary | `#57534E` | Deskripsi, caption |
| Text muted | `#78716C` | Placeholder, timestamp |
| Primary | `#C2410C` | CTA, link, focus ring, progres |
| Primary hover | `#9A3412` | Hover CTA |
| Accent | `#F59E0B` | Badge, notifikasi, penanda |
| Success | `#16A34A` | Task selesai |
| Warning | `#D97706` | Deadline dekat |
| Error | `#DC2626` | Overdue, aksi destruktif |

### 3.2 Dark Mode

| Token | Nilai |
|---|---|
| Canvas | `#1C1917` |
| Surface | `#292524` |
| Surface raised | `#44403C` |
| Border | `#44403C` |
| Text primary | `#FAFAF9` |
| Text secondary | `#D6D3D1` |
| Text muted | `#A8A29E` |
| Primary | `#EA580C` |
| Accent | `#FBBF24` |

Aturan: jangan pakai hitam/putih murni. Selalu pakai nilai warm palette di atas.

### 3.3 Warna Status

| Status | Teks | Background |
|---|---|---|
| `TODO` | `#78716C` | `#F5F5F4` |
| `IN_PROGRESS` | `#C2410C` | `#FFF7ED` |
| `BLOCKED` | `#DC2626` | `#FEF2F2` |
| `DONE` | `#16A34A` | `#F0FDF4` |

### 3.4 Warna Prioritas

| Prioritas | Teks | Background |
|---|---|---|
| `LOW` | `#78716C` | `#F5F5F4` |
| `MEDIUM` | `#B45309` | `#FFFBEB` |
| `HIGH` | `#C2410C` | `#FFF7ED` |
| `URGENT` | `#B91C1C` | `#FEF2F2` |

Status dan prioritas **wajib disertai teks**, tidak boleh hanya warna.

---

## 4. Tipografi

| Peran | Font | Ukuran | Berat |
|---|---|---|---|
| Display (landing) | Playfair Display | 48–64px | 700 |
| H1 halaman | Playfair Display | 36px | 700 |
| H2 section | Playfair Display | 28px | 700 |
| H3 card | Source Sans 3 | 20px | 600 |
| Body | Source Sans 3 | 16px | 400 |
| Body small / tabel | Source Sans 3 | 14px | 400/600 |
| Caption | Source Sans 3 | 12px | 500 |
| Overline | Source Sans 3 | 11px | 700, uppercase `0.09em` |

- Judul memakai letter-spacing `-0.02em`.
- Angka memakai `font-variant-numeric: tabular-nums`.
- Maksimal 2 weight per layar: 400 + 600/700.
- Font dimuat dari Google Fonts; sediakan fallback sistem.

---

## 5. Spacing, Radius, Elevation

### Spacing
- Base 4px.
- Skala: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- Padding komponen: 8×12 (kecil), 12×16 (sedang), 16×24 (besar).
- Jarak antar section: 24px mobile, 32px tablet, 48px desktop.
- Container max-width 1200px.

### Radius
| Nilai | Pemakaian |
|---|---|
| 4px | Badge kecil, inline code |
| 8px | Button, input, select, dropdown |
| 12px | Card, panel, modal, popover |
| 9999px | Avatar, chip, progress bar |

Jangan mencampur radius: button 8px, card 12px, chip pill.

### Elevation
- Card datar dengan border 1px; shadow hanya saat hover: `0 4px 16px rgba(28,25,23,0.06)`.
- Primary button hover: glow `0 4px 12px rgba(194,65,12,0.25)`.
- Modal: `0 24px 48px rgba(28,25,23,0.12)` + backdrop blur.
- Jangan pakai shadow untuk tabel.

---

## 6. Komponen

| Komponen | Ketentuan |
|---|---|
| **Button primary** | Fill terracotta, teks putih, radius 8px, tinggi 40px, weight 600 |
| **Button secondary** | Transparan, border 1px stone, teks warm |
| **Button ghost** | Tanpa border, teks sekunder, hover surface |
| **Button destructive** | Merah, hanya untuk aksi hapus |
| **Card** | Surface + border 1px + radius 12px + padding 16px |
| **Input** | Border 1px, radius 8px, tinggi 40px; focus border terracotta + ring 3px |
| **Chip** | Pill, padding 3×10, font 12px 600 |
| **Table** | Header uppercase 11px, row hover surface; tanpa shadow |
| **Sidebar** | 256px, border kanan; item aktif = aksen kiri 3px + background `primary-soft` |
| **Avatar** | Bulat 32px; inisial di atas warna hangat |
| **Tabs** | Underline; aktif terracotta 2px |
| **Progress bar** | Tinggi 4px, track stone, fill terracotta, transisi 300ms |
| **Toast** | Pojok kanan bawah, auto-hilang 3 detik |

**Aturan CTA**: maksimal **satu tombol primary per layar/section**. Aksi sekunder memakai outline/ghost.

---

## 7. Layout

### 7.1 Shell Aplikasi

```
┌────────────┬──────────────────────────────────────────┐
│ Sidebar    │ Topbar: search · theme · notif · avatar   │
│ 256px      ├──────────────────────────────────────────┤
│            │                                          │
│ Dashboard  │   Konten (max-width 1200px)              │
│ Tugas      │                                          │
│ Laporan    │                                          │
│ Pengingat  │                                          │
│ Pengguna*  │                                          │
│ Pengaturan │                                          │
└────────────┴──────────────────────────────────────────┘
* hanya Owner
```

- Sidebar bisa collapse jadi 64px (P1).
- Navigasi mobile memakai drawer dengan overlay.
- Topbar sticky dengan backdrop blur + border bawah saat scroll.

### 7.2 Halaman Daftar

1. Overline tanggal/kategori (opsional).
2. Judul halaman (Playfair) + subjudul.
3. Tombol aksi utama di kanan.
4. Baris filter + search.
5. Tabel/kartu.
6. Pagination.

---

## 8. State Wajib

| State | Perilaku |
|---|---|
| Loading | Skeleton untuk tabel/kartu; tombol disabled + spinner saat submit |
| Empty | Ikon + penjelasan + CTA ("Belum ada task. Buat task pertama.") |
| Error | Pesan jelas + tombol "Coba lagi"; tanpa stack trace |
| Sukses | Toast 3 detik |
| Gagal validasi | Pesan di bawah field + ringkasan di atas form |
| 403/404 | Halaman khusus + tautan ke dashboard |

---

## 9. Aksesibilitas (WCAG 2.1 AA)

- Kontras teks minimal 4.5:1; teks besar 3:1.
- Semua elemen bisa dijangkau keyboard; focus ring 2px terlihat.
- Setiap input punya `<label>`.
- Ikon dekoratif `aria-hidden="true"`; ikon aksi punya `aria-label`.
- Status tidak hanya dibedakan warna — selalu ada teks.
- Dialog mengunci focus dan bisa ditutup `Esc`.
- Hormati `prefers-reduced-motion` (transisi ≤ 150ms untuk UI).
- Tabel: gunakan `<th scope="col">`, dukung navigasi keyboard.

---

## 10. Copywriting

- Bahasa Indonesia, sapaan netral.
- Tombol memakai kata kerja: "Simpan", "Buat Task", "Hapus", "Export CSV".
- Error menjelaskan tindakan: "Deadline tidak boleh tanggal yang sudah lewat."
- Konfirmasi destruktif menyebut objek: "Hapus task 'Desain banner'? Tindakan ini tidak bisa dibatalkan."
- Hindari istilah teknis di UI (contoh: "Assignee" → "Penanggung jawab").

---

## 11. Referensi

- **Ember Studio** — sumber token & komponen utama.
- Linear — kerapian daftar dan navigasi.
- Todoist — kesederhanaan input.
- Height — kejelasan status.

Yang diambil adalah prinsip, bukan menyalin tampilan.

---

## 12. Acceptance Criteria Design

- [ ] Token `design/tokens.css` dipakai konsisten (tidak ada warna hardcoded di komponen).
- [ ] Light & dark mode sama-sama terbaca (kontras lolos).
- [ ] Semua halaman P0 punya tampilan desktop & mobile.
- [ ] Tidak ada horizontal scroll di lebar 360px.
- [ ] Semua state (loading, empty, error, sukses) ada.
- [ ] Maksimal satu tombol primary per layar.
- [ ] Navigasi keyboard bisa menyelesaikan alur buat task tanpa mouse.
