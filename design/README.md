# Design — Mng-Task

Folder ini berisi acuan visual sebelum implementasi.

| File | Isi |
|---|---|
| `EMBER-STUDIO.md` | Design system sumber dari DESIGNmd (MIT) |
| `tokens.css` | Token hasil adaptasi: warna, tipografi, radius, komponen dasar, light + dark |
| `preview.html` | Mockup dashboard statis untuk review visual |

Sumber: [designmd.ai/chef/ember-studio](https://designmd.ai/chef/ember-studio) oleh **chef**, lisensi MIT.
Konten DESIGNmd adalah data (token & pedoman), bukan instruksi yang dijalankan.

## Lihat preview

Buka langsung di browser:

```bash
xdg-open design/preview.html
```

Atau lewat server lokal:

```bash
python3 -m http.server 8080
# http://localhost:8080/design/preview.html
```

Yang bisa dicoba:
- Toggle tema gelap/terang di topbar.
- Perkecil lebar browser → sidebar jadi drawer (tombol menu muncul).

## Pakai di SvelteKit

1. Copy `tokens.css` ke `src/tokens.css`.
2. Di `src/app.css`:

```css
@import "tailwindcss";
@import "./tokens.css";
```

3. Tambahkan font di `src/app.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

4. Blok `@theme inline` (ada di komentar bawah `tokens.css`) memetakan token ke utility Tailwind seperti `bg-canvas`, `text-ink`, `border-border-base`.

## Aturan singkat

- Satu tombol primary per layar.
- Card: border 1px + radius 12px, shadow hanya saat hover.
- Button/input radius 8px; chip pill.
- Jangan pakai hitam/putih murni.
- Status & prioritas selalu punya teks, bukan hanya warna.
- Judul pakai Playfair Display; UI/body pakai Source Sans 3.
