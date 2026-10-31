# 01. Project Overview / Product Vision

## 1. Identitas Produk

| Item | Nilai |
|---|---|
| Nama resmi | **Mng-Task** (Management Tugas) |
| Kategori | Aplikasi web manajemen tugas & pelaporan |
| Model | Single tenant — 1 instalasi untuk 1 organisasi/tim |
| Platform | Web responsive (desktop & mobile browser) |
| Bahasa | Indonesia |
| Status | MVP |

---

## 2. Ringkasan Produk

Mng-Task adalah aplikasi web untuk mencatat, mengatur, dan memantau tugas harian sebuah tim kecil. Setiap tugas punya judul, deskripsi, prioritas, deadline, status, dan penanggung jawab. Owner bisa melihat seluruh pekerjaan, sementara User fokus pada tugas miliknya.

Selain tugas, Mng-Task menyediakan **laporan otomatis** harian, mingguan, dan bulanan yang dihitung dari data task, serta **pengingat** untuk deadline yang mendekat atau sudah lewat. Semua pengingat tampil di dalam aplikasi, tanpa perlu layanan email atau WhatsApp.

---

## 3. Latar Belakang

Saat ini banyak tim kecil mencatat tugas secara tersebar:

- Chat WhatsApp yang tenggelam oleh pesan lain.
- Buku catatan atau sticky notes yang mudah hilang.
- Spreadsheet yang tidak konsisten formatnya.
- To-do list pribadi yang tidak terlihat oleh atasan/rekan.

Akibatnya deadline terlewat, status pekerjaan tidak jelas, dan laporan harian/bulanan harus direkap manual dari beberapa sumber. Proses rekap manual memakan waktu dan rawan salah.

Mng-Task menyatukan pencatatan, pemantauan, pengingat, dan pelaporan dalam satu tempat.

---

## 4. Visi Produk

> Menjadi tempat kerja tunggal yang membuat tim kecil tahu **apa yang harus dikerjakan, kapan batasnya, dan sejauh mana progresnya** — tanpa ribet.

---

## 5. Target Pengguna

### 5.1 Primer

- **Tim kecil 2–20 orang** (agensi, studio, toko, organisasi, komunitas) yang butuh pembagian tugas sederhana.
- **Owner/lead** yang perlu memantau pekerjaan anggota tanpa meeting harian.
- **Anggota tim** yang butuh daftar tugas dan deadline yang jelas.

### 5.2 Sekunder

- **Individu/freelancer** yang ingin mencatat tugas pribadi dan membuat rekap bulanan untuk klien.

### 5.3 Bukan Target

- Perusahaan enterprise dengan kebutuhan multi-cabang, multi-tenant, SSO, atau audit compliance ketat.
- Manajemen proyek kompleks (Gantt chart, resource leveling, dependency antar-task).
- Aplikasi kolaborasi real-time (chat, komentar, mention).

---

## 6. Model Produk

- Satu instalasi melayani **satu organisasi**.
- Satu organisasi punya **satu atau lebih Owner** dan **banyak User**.
- Owner membuat akun User; tidak ada registrasi publik.
- Data task/report/reminder dimiliki oleh user pembuatnya. Owner dapat melihat semua data.
- Tidak ada billing, langganan, atau pembatasan jumlah user di MVP.

---

## 7. Prinsip Produk

1. **Cepat** — membuat task maksimal 30 detik, tanpa langkah berlebihan.
2. **Jelas** — status dan deadline terlihat tanpa harus membuka detail.
3. **Ringkas** — satu layar untuk tahu pekerjaan hari ini.
4. **Otomatis** — laporan dihitung sistem, bukan rekap manual.
5. **Sederhana** — fitur yang tidak dipakai 80% user tidak masuk MVP.

---

## 8. Definisi Istilah

| Istilah | Arti |
|---|---|
| **Task** | Pekerjaan dengan judul, status, prioritas, deadline, dan penanggung jawab |
| **Report** | Rekap task pada periode tertentu (harian/mingguan/bulanan) |
| **Reminder** | Pengingat deadline, otomatis dari task atau dibuat manual |
| **Owner** | Role dengan akses penuh, termasuk mengelola user |
| **User** | Role anggota, fokus pada task miliknya |
| **Overdue** | Task yang deadline-nya sudah lewat tetapi status belum `DONE` |
| **Assignee** | User yang ditugaskan mengerjakan sebuah task |

---

## 9. Kriteria Sukses Produk (ringkas)

- User bisa mencatat task baru dalam < 30 detik.
- Deadline yang mendekat muncul sebagai reminder tanpa dicari manual.
- Laporan bulanan bisa dibuat dalam < 1 menit (satu klik + export).
- Owner bisa melihat status seluruh tim dari satu dashboard.

Detail angka target ada di [`02-problem-goals`](../02-problem-goals/README.md) dan [`13-kpi-metrics`](../13-kpi-metrics/README.md).
