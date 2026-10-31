# 10. Technical Stack & Integration

## Technical Stack

- Frontend : Svelte 5 + SvelteKit (SSR, file-based routing, responsive web)
- Backend : SvelteKit server-side (`+page.server.js` untuk load & form actions, `+server.js` untuk API route) di atas Node.js
- Database : PostgreSQL (Neon DB)
- Akses Database : `pg` (connection pool) + pola Repository, sesuai materi 01–05
- Hosting/Infra : Vercel, deploy lewat `@sveltejs/adapter-vercel`
- Styling : belum ditentukan (kandidat: Tailwind CSS)

### Alasan memilih SvelteKit (fullstack)

- Frontend dan backend dalam satu codebase, tidak perlu bikin REST API terpisah untuk kebutuhan CRUD internal.
- Form actions + server load mengurangi JavaScript di client dan mempercepat halaman daftar task/report.
- Adapter Vercel resmi, cocok dengan target hosting.
- Bundle lebih kecil dibanding framework frontend populer, bagus untuk akses dari HP.

### Catatan teknis

- Vercel berjalan serverless, jadi koneksi Neon wajib pakai **pooled connection string** (host `-pooler`) supaya tidak kehabisan koneksi.
- Session login disimpan di cookie `httpOnly` + `secure`, divalidasi di `hooks.server.js`.

## Integrasi Pihak Ketiga ( Tidak DIpakai)

- Storage: S3 / Cloudinary / local
- Messaging: WA Gateway (sebutkan provider, misal Fonnte/Wablas) / Telegram Bot API
- Backend service: Firebase (Auth/Firestore/FCM)
- Payment gateway: Midtrans / Xendit / dll
- Email service: SMTP / Sendgrid / Resend
- Maps: Google Maps API (jika ada fitur lokasi)
