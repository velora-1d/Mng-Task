# 11. Security Requirements

## 1. Prinsip

1. **Deny by default** — semua route butuh login kecuali landing & login.
2. **Server-side authorization** — sembunyikan tombol bukan kontrol; cek ulang di server.
3. **Least privilege** — user hanya mengakses data miliknya.
4. **Fail closed** — error tidak membuka akses.
5. **Minimal data** — simpan hanya yang dibutuhkan (nama, email, task).

---

## 2. Model Ancaman (ringkas)

| Ancaman | Dampak | Kontrol |
|---|---|---|
| Tebak password | Akun diambil alih | Argon2id + rate limit + pesan error umum |
| IDOR (akses data orang lain) | Kebocoran data | Cek kepemilikan di setiap query |
| SQL Injection | Seluruh database terbaca | Prepared statement / Drizzle |
| XSS | Session dicuri | Escaping Svelte + CSP + cookie httpOnly |
| CSRF | Aksi tidak diinginkan | Origin check SvelteKit + SameSite=Lax |
| Session hijacking | Akun diambil alih | Cookie secure, token acak, rotasi saat password berubah |
| Brute force | Beban server | Rate limit per email+IP |
| Akses file `.db` | Data bocor | File di luar `static/`, permission ketat |
| Bocor `.env` | Kredensial bocor | `.gitignore`, secret manager |
| Dependency berbahaya | RCE/supply chain | Lockfile, audit, update rutin |

---

## 3. Autentikasi

| Item | Ketentuan |
|---|---|
| Algoritma password | **Argon2id** (memory 19 MiB, iterations 2, parallelism 1) |
| Panjang password | Minimal 8 karakter, maksimal 128 |
| Password awal | Dibuat Owner, wajib diganti saat login pertama |
| Pesan gagal login | Selalu "Email atau password salah." |
| Timing | Verifikasi tetap dijalankan walau email tidak ada (dummy hash) |
| Rate limit | 5 gagal / 15 menit per email+IP → blokir sementara |
| Session ID | 32 byte acak, disimpan sebagai hash SHA-256 |
| Masa berlaku | 7 hari, sliding |
| Rotasi | Token baru dibuat saat login; session lama user dihapus saat ganti password |
| Logout | Hapus baris session + cookie |

**Tidak ada di MVP**: 2FA, SSO, OAuth, magic link, reset password via email.

---

## 4. Otorisasi

- `hooks.server.js` memuat session → `locals.user`.
- Guard di `+layout.server.js` untuk grup route.
- Setiap query data user wajib menambahkan filter:
  - `tasks`: `created_by = :userId OR assignee_id = :userId` (kecuali Owner).
  - `reports`, `reminders`: `user_id = :userId`.
- Aksi owner-only (`/users`, pengaturan aplikasi) dicek role di server.
- ID dari URL tidak dipercaya; selalu cek kepemilikan setelah fetch.
- Akses lintas data → **404** (bukan 403) agar tidak membocorkan keberadaan data.

---

## 5. Proteksi Web

### 5.1 Header Keamanan

Diterapkan lewat `hooks.server.js`:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains  (produksi)
```

- `script-src 'self'` mengharuskan tidak ada inline script. SvelteKit mendukung nonce otomatis lewat `kit.csp.mode = 'auto'` di `svelte.config.js`.
- `style-src 'unsafe-inline'` ditoleransi untuk Tailwind; review ulang jika memungkinkan.

### 5.2 Cookie Session

```
session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

- `Secure` wajib di produksi.
- Jangan simpan data sensitif di cookie selain token.
- Cookie dihapus saat logout.

### 5.3 CSRF

- SvelteKit memeriksa `Origin` untuk form actions secara default — **jangan dimatikan**.
- Semua mutasi memakai POST/PUT/DELETE, bukan GET.
- `SameSite=Lax` sebagai lapisan kedua.

### 5.4 XSS

- Svelte meng-escape output secara default.
- Dilarang memakai `{@html}` untuk data user.
- Deskripsi task ditampilkan sebagai teks (bukan HTML).
- CSP membatasi script.

### 5.5 SQL Injection

- Semua query lewat Drizzle / prepared statement.
- Dilarang menyusun SQL dengan template string dari input user.
- Sorting/filter memakai whitelist kolom.

### 5.6 Rate Limiting

| Aksi | Batas |
|---|---|
| Login | 5 gagal / 15 menit per email+IP |
| Form action umum | 60 request / menit per session |
| Export CSV | 10 / menit per user |

Implementasi MVP: tabel `login_attempts` + hitung jendela waktu.
Jika pindah ke Vercel, gunakan penyimpanan eksternal (Upstash Redis) karena instance tidak berbagi memori.

---

## 6. Perlindungan Data

| Data | Klasifikasi | Perlakuan |
|---|---|---|
| Password | Sangat sensitif | Hanya hash argon2id, tidak pernah di-log |
| Email, nama | Pribadi | Ditampilkan sesuai kebutuhan; tidak diekspos ke publik |
| Task/report | Internal | Akses berbasis role & kepemilikan |
| Audit log | Internal | Read-only dari UI, hanya Owner |
| Session token | Sensitif | Hash di DB, cookie httpOnly |

**Aturan**
- Log aplikasi tidak boleh memuat password, token, atau isi cookie.
- `before_json`/`after_json` pada audit tidak menyertakan `password_hash`.
- Data user nonaktif tetap disimpan (soft deactivate).
- Permintaan penghapusan data: Owner menghapus data task terkait, lalu menonaktifkan akun.

---

## 7. Keamanan Database (SQLite)

- File DB berada di luar `static/` dan tidak bisa diakses lewat HTTP.
- Permission file `600`, direktori `700`.
- `foreign_keys = ON` di setiap koneksi.
- Backup dienkripsi jika disimpan di luar server (opsional untuk MVP).
- Akses shell server dibatasi (SSH key, bukan password).
- Jangan commit `data/*.db` ke git.

---

## 8. Secrets & Dependency

- `.env` tidak di-commit; `.env.example` hanya berisi placeholder.
- `SESSION_SECRET` minimal 32 byte acak, berbeda per lingkungan.
- `npm audit` sebelum rilis; perbaiki vulnerability high/critical.
- Gunakan `package-lock.json` dan `npm ci` di CI/CD.
- Review dependensi baru sebelum ditambahkan.

---

## 9. Audit Log

- Dicatat: login sukses/gagal, perubahan task, perubahan user, reset password, perubahan pengaturan, generate/hapus laporan.
- Tidak bisa diubah/dihapus lewat UI.
- Retensi minimal 1 tahun.
- Hanya Owner yang bisa melihat.

---

## 10. Kepatuhan & Privasi

- Mengacu pada prinsip **UU PDP**: minimalisasi data, tujuan jelas, akses terbatas.
- Tidak ada pelacakan pihak ketiga/analytics eksternal di MVP.
- Tidak ada cookie non-esensial → tidak perlu banner consent.
- Kebijakan privasi singkat disediakan di landing page (P1).
- Data disimpan di server sendiri; tidak dibagikan ke pihak ketiga (kecuali Turso jika dipilih).

---

## 11. Checklist Keamanan Sebelum Launch

- [ ] Semua route aplikasi terlindungi (kecuali landing & login).
- [ ] Uji IDOR: user A tidak bisa membuka task/report/reminder user B.
- [ ] Uji akses `/users` sebagai User → 403.
- [ ] Password tidak pernah muncul di log/response.
- [ ] Cookie memiliki `HttpOnly`, `Secure`, `SameSite`.
- [ ] Rate limit login berfungsi.
- [ ] CSP & header keamanan aktif.
- [ ] `npm audit` tanpa high/critical.
- [ ] File `.db` tidak bisa diakses via URL.
- [ ] Backup & restore sudah diuji.
- [ ] `.env` tidak ada di repository.
- [ ] Halaman error tidak menampilkan stack trace.
- [ ] Owner terakhir tidak bisa dinonaktifkan.
- [ ] Session dicabut setelah ganti password/nonaktif.
