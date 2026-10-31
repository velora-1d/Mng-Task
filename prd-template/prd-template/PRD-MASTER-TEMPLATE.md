# 1. Project Overview / Product Vision

- Nama project
- Deskripsi singkat aplikasi (1-2 paragraf)
- Latar belakang / konteks kenapa project ini dibuat
- Target user utama
# 2. Problem Statement & Goals

## Problem Statement
- Masalah apa yang dialami user/bisnis saat ini
- Dampak masalah tersebut kalau tidak diselesaikan

## Goals
- Tujuan utama aplikasi (bullet, terukur)
- Success metric (definisi "berhasil" untuk project ini)
# 3. User Personas / Roles

Untuk tiap role, isi:
- Nama role (contoh: Admin, Guru BK, Agent, Super Admin)
- Deskripsi singkat siapa mereka
- Hak akses / batasan akses role ini
- Tujuan utama role ini menggunakan aplikasi
# 4. Scope & Deliverables (MVP Scope)

## In Scope
- List fitur/modul yang termasuk dalam project ini

## Out of Scope
- List fitur/modul yang eksplisit TIDAK termasuk (biar gak scope creep)

## Deliverables
- Apa saja yang diserahkan ke client (source code, dokumentasi, deployment, dll)
# 5. Platform & Design

## Platform
- Web only / Mobile only / Web + Mobile / Dashboard + Mobile

## Mobile Approach (jika ada)
- Flutter (native performance, 1 codebase iOS+Android) atau
- Capacitor (wrap web app existing, lebih cepat kalau web sudah ada)

## Design Theme / Style
- Mood: modern minimalis / korporat / playful / dark-light mode
- Warna & font referensi
- Referensi aplikasi kompetitor/inspirasi (jika ada)
# 6. Menu & Features List

Untuk tiap role, breakdown per menu:

## [Nama Role]
### Menu: [Nama Menu]
- Fitur yang ada di menu ini (list, create, edit, delete, export, import, dll)
- Filter/search yang tersedia (tanggal, status, kategori, dll)
- Sorting yang tersedia
# 7. User Flow / Workflow

- Diagram/step-by-step alur pemakaian aplikasi per role
- Alur proses bisnis (misal: pengajuan → approval → eksekusi)
# 8. Functional Requirements

## Authentication
- Ada login/tidak
- Metode login (email/password, OTP, SSO, dll)
- Role & permission mapping per menu

## Validasi
- Validasi input per form penting

## Notifikasi
- In-app / Email / Push / WA
# 9. Business Process

- Proses bisnis yang diotomasi oleh sistem
- Approval flow (siapa approve apa, urutannya)
- Audit trail yang dibutuhkan
# 10. Technical Stack & Integration

## Technical Stack
- Frontend
- Backend
- Database
- Hosting/Infra (VPS, Dokploy, dll)

## Integrasi Pihak Ketiga
- Storage: S3 / Cloudinary / local
- Messaging: WA Gateway (sebutkan provider, misal Fonnte/Wablas) / Telegram Bot API
- Backend service: Firebase (Auth/Firestore/FCM)
- Payment gateway: Midtrans / Xendit / dll
- Email service: SMTP / Sendgrid / Resend
- Maps: Google Maps API (jika ada fitur lokasi)
# 11. Security Requirements

- Enkripsi data sensitif
- Rate limiting / proteksi API
- Backup & recovery policy
- Compliance yang perlu diikuti (jika ada)
# 12. Monetization

- Model bisnis (subscription, freemium, transaction fee, dll)
- Pricing tier (jika ada)
# 13. KPI / Metrics

- Metric yang dipantau (active user, retention, conversion, dll)
- Target angka per metric
# 14. Timeline / Roadmap

- Fase pengerjaan (milestone)
- Estimasi durasi per fase
- Tanggal target selesai
# 15. UAT & Maintenance

- Skenario testing utama (UAT checklist)
- Periode support pasca-launch
- SLA maintenance (jika ada)
