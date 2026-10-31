# 📋 PRD Mng-Task — Management Tugas

Dokumen spesifikasi produk untuk aplikasi manajemen tugas **Mng-Task**.
Disusun 15 section, masing-masing punya folder sendiri.

| No | Sub-Folder | Dokumen | Deskripsi |
| :---: | :--- | :--- | :--- |
| **01** | [`01-overview-vision/`](./01-overview-vision/README.md) | `README.md` | Project Overview & Product Vision |
| **02** | [`02-problem-goals/`](./02-problem-goals/README.md) | `README.md` | Problem Statement & Success Goals |
| **03** | [`03-user-roles/`](./03-user-roles/README.md) | `README.md` | User Personas, Role & Hak Akses |
| **04** | [`04-scope-deliverables/`](./04-scope-deliverables/README.md) | `README.md` | Scope MVP & Deliverables |
| **05** | [`05-platform-design/`](./05-platform-design/README.md) | `README.md` | Platform & Design System |
| **06** | [`06-menu-features/`](./06-menu-features/README.md) | `README.md` | Breakdown Menu & Fitur |
| **07** | [`07-user-flow/`](./07-user-flow/README.md) | `README.md` | Alur Workflow Aplikasi |
| **08** | [`08-functional-requirements/`](./08-functional-requirements/README.md) | `README.md` | Kebutuhan Fungsional & Validasi |
| **09** | [`09-business-process/`](./09-business-process/README.md) | `README.md` | Proses Bisnis & Audit Trail |
| **10** | [`10-technical-stack/`](./10-technical-stack/README.md) | `README.md`, `schema.sql` | Arsitektur Teknis, Stack & Data Model |
| **11** | [`11-security-requirements/`](./11-security-requirements/README.md) | `README.md` | Keamanan & Perlindungan Data |
| **12** | [`12-monetization/`](./12-monetization/README.md) | `README.md` | Model Bisnis (N/A untuk MVP) |
| **13** | [`13-kpi-metrics/`](./13-kpi-metrics/README.md) | `README.md` | KPI Produk & Target |
| **14** | [`14-timeline-roadmap/`](./14-timeline-roadmap/README.md) | `README.md` | Timeline & Roadmap |
| **15** | [`15-uat-maintenance/`](./15-uat-maintenance/README.md) | `README.md` | UAT Checklist & Maintenance |

---

## Metadata Dokumen

| Item | Nilai |
|---|---|
| Produk | Mng-Task |
| Versi PRD | 1.0 |
| Tanggal | 31 Oktober 2026 |
| Status | Final draft untuk MVP |
| Pemilik produk | Owner project |
| Bahasa produk | Indonesia |

---

## Keputusan Produk yang Sudah Dikunci

Keputusan di bawah ini dipakai konsisten di seluruh section. Kalau berubah, update tabel ini dulu.

| ID | Keputusan | Alasan |
|---|---|---|
| D-01 | Database **SQLite** untuk MVP | Ringan, tanpa server, cukup untuk 1 organisasi & puluhan user |
| D-02 | Fullstack **SvelteKit** (Svelte 5) | Satu codebase frontend + backend, SSR, form actions |
| D-03 | Hanya **2 role**: Owner & User | Menghindari kompleksitas RBAC yang tidak dibutuhkan MVP |
| D-04 | **1 instalasi = 1 organisasi** (single tenant) | Multi-tenant tidak masuk scope MVP |
| D-05 | Registrasi publik **tidak ada**; Owner dibuat lewat seeding/CLI | Mencegah orang luar membuat akun sendiri |
| D-06 | User baru dibuat oleh Owner | Owner yang mengontrol akses |
| D-07 | **Laporan digenerate otomatis** dari data task per periode, bukan input manual | Menjawab masalah "laporan harian/bulanan sulit dibuat" |
| D-08 | Reminder hanya **in-app** (badge, dashboard, halaman pengingat) | Email/WA/push butuh layanan pihak ketiga & biaya |
| D-09 | Attachment, komentar, chat **tidak ada** di MVP | Di luar scope, menjaga MVP selesai |
| D-10 | Styling **Tailwind CSS v4 + shadcn-svelte** | Cepat, konsisten, aksesibel |
| D-13 | Design system **Ember Studio** (designmd.ai, MIT) | Warm terracotta, tidak generik, sudah ada token lengkap |
| D-11 | Zona waktu aplikasi **Asia/Jakarta (WIB)** | Target user Indonesia |
| D-12 | Bahasa UI **Indonesia** | Target user Indonesia |

---

## Cara Membaca

1. Baca `01`–`04` untuk memahami produk dan batas scope.
2. Baca `05`–`07` untuk memahami tampilan dan alur.
3. Baca `08`–`10` sebelum menulis kode (requirement, proses, arsitektur, skema).
4. Baca `11`–`15` untuk keamanan, target, jadwal, dan kriteria selesai.

## Aturan Perubahan

- Perubahan scope wajib update `04-scope-deliverables` dan tabel keputusan di atas.
- Perubahan skema wajib update `10-technical-stack/schema.sql` **dan** file migrasi.
- Requirement baru diberi ID (`FR-xxx-nn`) supaya bisa dilacak di UAT.
