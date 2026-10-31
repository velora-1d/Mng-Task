# 03. User Personas, Role & Hak Akses

## 1. Ringkasan Role

| Role | Jumlah | Deskripsi | Cakupan Data |
|---|---|---|---|
| **Owner** | 1–3 orang | Pemilik/pengelola aplikasi dan user | Semua data |
| **User** | 1–20 orang | Anggota yang mengerjakan task | Data miliknya sendiri |

Tidak ada role lain di MVP. Tidak ada role "guest"; halaman publik hanya landing page dan login.

---

## 2. Persona

### 2.1 Owner — "Rina, Lead Tim"

- **Siapa**: pemilik usaha kecil / lead tim / admin organisasi.
- **Tujuan**: memastikan semua pekerjaan tim terbagi dan selesai tepat waktu.
- **Kebutuhan utama**:
  - Melihat seluruh task dan statusnya.
  - Menambah/menonaktifkan user.
  - Melihat laporan semua user.
  - Mengubah task yang salah input.
- **Frustrasi**: harus bertanya "sudah sampai mana?" setiap hari.

### 2.2 User — "Budi, Anggota Tim"

- **Siapa**: staf/anggota yang mengerjakan task.
- **Tujuan**: tahu apa yang harus dikerjakan hari ini dan tidak melewatkan deadline.
- **Kebutuhan utama**:
  - Melihat task yang ditugaskan kepadanya.
  - Membuat task pribadi.
  - Mengubah status dan menambahkan catatan progres.
  - Melihat reminder deadline.
- **Frustrasi**: tugas tersebar di chat dan lupa deadline.

---

## 3. Matriks Hak Akses

Keterangan: **L** = lihat, **T** = tambah, **U** = ubah, **H** = hapus, **–** = tidak boleh.

| Menu / Aksi | Owner | User |
|---|---|---|
| Landing page | L | L |
| Login / logout | L | L |
| Dashboard | L (semua data) | L (data sendiri) |
| Task — lihat | L semua | L miliknya / yang di-assign |
| Task — tambah | T | T |
| Task — ubah | U semua | U miliknya / yang di-assign |
| Task — hapus | H semua | H miliknya sendiri (bukan task orang lain) |
| Task — assign ke user lain | Ya | Tidak |
| Laporan — lihat | L semua | L miliknya |
| Laporan — buat/export | T semua user | T miliknya |
| Reminder — lihat | L semua | L miliknya |
| Reminder — tambah/ubah/hapus | Ya | Miliknya |
| Pengguna — lihat | L semua | – |
| Pengguna — tambah/ubah/nonaktifkan | Ya | – |
| Pengguna — ubah role | Ya | – |
| Pengaturan aplikasi | Ya | – |
| Profil sendiri (nama, password) | Ya | Ya |
| Audit log | L | – |

---

## 4. Aturan Kepemilikan Data

1. **Task**
   - `created_by` = pembuat task.
   - `assignee_id` = user yang ditugaskan (opsional).
   - User boleh melihat task jika `created_by = dirinya` **atau** `assignee_id = dirinya`.
   - User boleh mengubah task jika ia pembuat **atau** assignee.
   - User hanya boleh menghapus task yang ia buat sendiri.
   - Owner boleh melihat/mengubah/menghapus semua task.
2. **Report**
   - Report terikat ke `user_id`.
   - User hanya melihat report miliknya; Owner melihat semua.
3. **Reminder**
   - Reminder manual terikat ke `user_id`.
   - Reminder otomatis diturunkan dari task yang boleh dilihat user.
4. **User**
   - Hanya Owner yang boleh mengelola akun.
   - User tidak bisa mengubah role dirinya sendiri.

---

## 5. Aturan Role & Akun

| Aturan | Detail |
|---|---|
| Jumlah Owner minimal | 1. Owner terakhir tidak boleh dihapus/diturunkan |
| Menambah Owner | Hanya Owner yang boleh menaikkan role User → Owner |
| Menurunkan Owner | Hanya Owner lain; tidak boleh menurunkan diri sendiri jika ia Owner terakhir |
| Hapus akun | Gunakan **nonaktifkan** (`is_active = 0`), bukan hapus permanen |
| User nonaktif | Tidak bisa login; task yang di-assign tetap ada dan bisa dipindahkan Owner |
| Ganti password user | Owner bisa reset; user wajib ganti saat login berikutnya |
| Registrasi publik | Tidak ada |
| Akun Owner pertama | Dibuat lewat seeding/CLI saat instalasi |

---

## 6. Skenario Izin (contoh)

| Skenario | Hasil |
|---|---|
| Budi membuka `/users` | 403 / diarahkan ke dashboard |
| Budi mengubah task milik Rina | Ditolak (403) |
| Budi menghapus task yang di-assign Rina kepadanya | Ditolak — hanya pembuat yang boleh hapus |
| Rina menghapus task Budi | Diizinkan |
| User nonaktif mencoba login | Ditolak dengan pesan umum "Email atau password salah" |
| Owner menurunkan dirinya saat masih ada Owner lain | Diizinkan |
| Owner menurunkan dirinya saat ia satu-satunya Owner | Ditolak |

---

## 7. Acceptance Criteria Role

- [ ] Setiap route dan form action melakukan pengecekan role **di server**, bukan hanya menyembunyikan tombol.
- [ ] Query data user selalu difilter `user_id`/`assignee_id` sesuai aturan kepemilikan.
- [ ] Percobaan akses lintas data mengembalikan 403 atau 404, bukan data orang lain.
- [ ] Tidak mungkin menghapus/menonaktifkan Owner terakhir.
