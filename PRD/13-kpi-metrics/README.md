# 13. KPI / Metrics

## 1. North Star Metric

> **Jumlah task selesai per user aktif per minggu.**

Mengukur apakah aplikasi benar-benar membantu pekerjaan selesai, bukan sekadar dibuka.

---

## 2. KPI Produk

| ID | Metric | Definisi | Target 30 hari | Target 90 hari | Sumber |
|---|---|---|---|---|---|
| K-01 | Activation | % user baru yang membuat/menyelesaikan ≥ 1 task dalam 7 hari | ≥ 70% | ≥ 85% | `tasks`, `users` |
| K-02 | WAU/MAU | Rasio user aktif mingguan terhadap bulanan | ≥ 50% | ≥ 60% | `last_seen_at` |
| K-03 | Task per user aktif | Rata-rata task dibuat per user per minggu | ≥ 5 | ≥ 8 | `tasks` |
| K-04 | Completion rate | Task `DONE` / total task pada periode | ≥ 70% | ≥ 80% | `tasks` |
| K-05 | Overdue rate | Task overdue / task aktif | ≤ 15% | ≤ 10% | `tasks` |
| K-06 | Reminder engagement | % user yang membuka halaman Pengingat per minggu | ≥ 50% | ≥ 60% | `audit_logs`/event |
| K-07 | Report usage | % user yang generate/export laporan per bulan | ≥ 60% | ≥ 75% | `reports` |
| K-08 | Time to create | Median waktu buka form → task tersimpan | ≤ 30 detik | ≤ 20 detik | event |
| K-09 | Retention W1 | % user aktif di minggu berikutnya | ≥ 70% | ≥ 80% | `last_seen_at` |
| K-10 | Zero-result search | % pencarian tanpa hasil | ≤ 20% | ≤ 10% | event search |

---

## 3. KPI Teknis

| ID | Metric | Target | Sumber |
|---|---|---|---|
| T-01 | Uptime | ≥ 99,5% / bulan | monitoring |
| T-02 | Error rate (5xx) | ≤ 1% | log |
| T-03 | p95 response halaman daftar | ≤ 800ms | log |
| T-04 | p95 simpan task | ≤ 500ms | log |
| T-05 | Backup sukses | 100% | cron log |
| T-06 | Restore test | Lulus 1x sebelum launch | manual |
| T-07 | Vulnerability high/critical | 0 | `npm audit` |
| T-08 | Lighthouse performance (desktop) | ≥ 90 | Lighthouse |
| T-09 | Lighthouse accessibility | ≥ 95 | Lighthouse |

---

## 4. Event yang Perlu Dicatat

| Event | Kapan | Data |
|---|---|---|
| `login_success` | Login berhasil | user_id, timestamp |
| `login_failed` | Login gagal | email_hash/ip, timestamp |
| `task_created` | Task dibuat | user_id, task_id, duration_ms (opsional) |
| `task_status_changed` | Status berubah | task_id, from, to |
| `task_completed` | Status → DONE | task_id, duration_days |
| `reminder_viewed` | Halaman pengingat dibuka | user_id |
| `report_generated` | Laporan dibuat | report_id, type |
| `report_exported` | CSV diunduh | report_id |

MVP: sebagian event diambil dari `audit_logs`; event khusus (duration, search) ditambahkan sebagai tabel `events` bila diperlukan (P1).

---

## 5. Cara Menghitung (contoh SQL)

**Completion rate 30 hari terakhir**

```sql
SELECT
  ROUND(
    100.0 * SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) / COUNT(*),
    1
  ) AS completion_rate
FROM tasks
WHERE deleted_at IS NULL
  AND created_at >= datetime('now', '-30 days');
```

**Overdue rate**

```sql
SELECT
  ROUND(
    100.0 * SUM(CASE WHEN due_date < date('now') AND status <> 'DONE' THEN 1 ELSE 0 END)
    / NULLIF(COUNT(*), 0),
    1
  ) AS overdue_rate
FROM tasks
WHERE deleted_at IS NULL
  AND status <> 'DONE';
```

**Task selesai per minggu (north star)**

```sql
SELECT
  strftime('%Y-%W', completed_at) AS week,
  COUNT(*) AS completed
FROM tasks
WHERE completed_at IS NOT NULL
  AND deleted_at IS NULL
GROUP BY week
ORDER BY week DESC
LIMIT 12;
```

---

## 6. Review & Pelaporan

| Aktivitas | Frekuensi | PIC |
|---|---|---|
| Cek error & uptime | Harian | Developer |
| Review KPI teknis | Mingguan | Developer |
| Review KPI produk | Bulanan | Owner |
| Evaluasi target | Setelah 90 hari | Owner + Developer |

Jika target tidak tercapai 2 periode berturut-turut, lakukan:
1. Cek data (apakah pencatatan benar).
2. Wawancara 3 user.
3. Tentukan perbaikan (UX, fitur, atau target).
