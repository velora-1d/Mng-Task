/**
 * Seed data awal. Idempoten: kalau tabel users sudah terisi, seed dilewati.
 * Jalankan: npm run db:seed
 */
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { reminders, settings, tasks, users } from './schema';
import { nowIso, shiftDate, todayWib } from '#lib/utils/date';
import { hashPassword } from '#lib/server/auth/password';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL wajib diset');

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

const today = todayWib();
const now = nowIso();
const at = (days: number, hour = 9) =>
	`${shiftDate(today, days)}T${String(hour).padStart(2, '0')}:00:00.000Z`;

async function main() {
	const existing = await db.select({ id: users.id }).from(users).limit(1);
	if (existing.length > 0) {
		console.log('Data sudah ada — seed dilewati. Pakai `npm run db:reset` untuk mulai ulang.');
		return;
	}

	const [ownerPw, userPw] = await Promise.all([
		hashPassword('admin123'),
		hashPassword('user123')
	]);

	await db.insert(users).values([
		{
			id: 'usr_owner',
			name: 'Admin Owner',
			email: 'admin',
			passwordHash: ownerPw,
			role: 'OWNER',
			isActive: true,
			createdAt: at(-60),
			updatedAt: at(-60)
		},
		{
			id: 'usr_budi',
			name: 'User',
			email: 'user',
			passwordHash: userPw,
			role: 'USER',
			isActive: true,
			createdAt: at(-45),
			updatedAt: at(-45)
		},
		{
			id: 'usr_sari',
			name: 'Sari Amelia',
			email: 'sari@mngtask.test',
			passwordHash: userPw,
			role: 'USER',
			isActive: true,
			createdAt: at(-40),
			updatedAt: at(-40)
		},
		{
			id: 'usr_dina',
			name: 'Dina Nur',
			email: 'dina@mngtask.test',
			passwordHash: userPw,
			role: 'USER',
			isActive: true,
			createdAt: at(-30),
			updatedAt: at(-30)
		}
	]);

	await db.insert(tasks).values([
		{
			id: 'tsk_001', title: 'Finalisasi proposal klien',
			description: 'Revisi scope & anggaran sebelum dikirim.',
			status: 'IN_PROGRESS', priority: 'HIGH',
			dueDate: shiftDate(today, -2), assigneeId: 'usr_budi', createdBy: 'usr_owner',
			createdAt: at(-10), updatedAt: at(-1)
		},
		{
			id: 'tsk_002', title: 'Desain halaman laporan',
			description: 'Mockup desktop & mobile.',
			status: 'TODO', priority: 'MEDIUM',
			dueDate: today, assigneeId: 'usr_owner', createdBy: 'usr_owner',
			createdAt: at(-8), updatedAt: at(-2)
		},
		{
			id: 'tsk_003', title: 'Migrasi data task lama',
			description: 'Validasi 1.240 baris sebelum import.',
			status: 'BLOCKED', priority: 'URGENT',
			dueDate: shiftDate(today, 1), assigneeId: 'usr_sari', createdBy: 'usr_owner',
			createdAt: at(-12), updatedAt: at(-1)
		},
		{
			id: 'tsk_004', title: 'Review copy landing page',
			description: 'Tone & CTA.',
			status: 'DONE', priority: 'LOW',
			dueDate: shiftDate(today, -1), assigneeId: 'usr_budi', createdBy: 'usr_owner',
			completedAt: at(-1, 15), createdAt: at(-9), updatedAt: at(-1, 15)
		},
		{
			id: 'tsk_005', title: 'Siapkan laporan bulanan',
			description: 'Rekap Oktober 2026.',
			status: 'IN_PROGRESS', priority: 'MEDIUM',
			dueDate: shiftDate(today, 3), assigneeId: 'usr_dina', createdBy: 'usr_owner',
			createdAt: at(-7), updatedAt: at(-1)
		},
		{
			id: 'tsk_006', title: 'Audit akses pengguna',
			description: 'Cek akun nonaktif dan sesi menggantung.',
			status: 'TODO', priority: 'HIGH',
			dueDate: shiftDate(today, 2), assigneeId: 'usr_owner', createdBy: 'usr_owner',
			createdAt: at(-6), updatedAt: at(-6)
		},
		{
			id: 'tsk_007', title: 'Perbaiki form tambah tugas',
			description: 'Validasi deadline di sisi server.',
			status: 'TODO', priority: 'MEDIUM',
			dueDate: shiftDate(today, 4), assigneeId: 'usr_sari', createdBy: 'usr_owner',
			createdAt: at(-5), updatedAt: at(-5)
		},
		{
			id: 'tsk_008', title: 'Rapikan notifikasi pengingat',
			description: 'Badge sidebar meleset satu angka.',
			status: 'IN_PROGRESS', priority: 'HIGH',
			dueDate: shiftDate(today, 5), assigneeId: 'usr_budi', createdBy: 'usr_owner',
			createdAt: at(-4), updatedAt: at(-2)
		},
		{
			id: 'tsk_009', title: 'Dokumentasi alur UAT',
			description: 'Panduan untuk tim operasional.',
			status: 'TODO', priority: 'LOW',
			dueDate: shiftDate(today, 7), assigneeId: 'usr_dina', createdBy: 'usr_owner',
			createdAt: at(-4), updatedAt: at(-4)
		},
		{
			id: 'tsk_010', title: 'Optimasi query daftar tugas',
			description: 'Target di bawah 1 detik untuk 5.000 baris.',
			status: 'DONE', priority: 'MEDIUM',
			dueDate: shiftDate(today, -3), assigneeId: 'usr_sari', createdBy: 'usr_owner',
			completedAt: at(-3, 11), createdAt: at(-10), updatedAt: at(-3, 11)
		},
		{
			id: 'tsk_011', title: 'Setup backup harian',
			description: 'Retensi 7 hari, uji restore.',
			status: 'DONE', priority: 'HIGH',
			dueDate: shiftDate(today, -4), assigneeId: 'usr_budi', createdBy: 'usr_owner',
			completedAt: at(-4, 16), createdAt: at(-11), updatedAt: at(-4, 16)
		},
		{
			id: 'tsk_012', title: 'Kurangi ukuran bundel frontend',
			description: 'Pecah route berat dengan dynamic import.',
			status: 'TODO', priority: 'MEDIUM',
			dueDate: shiftDate(today, 9), assigneeId: 'usr_dina', createdBy: 'usr_owner',
			createdAt: at(-2), updatedAt: at(-2)
		}
	]);

	await db.insert(reminders).values([
		{
			id: 'rem_001', userId: 'usr_owner', taskId: 'tsk_002',
			title: 'Tunjukkan mockup laporan ke klien', note: 'Bawa versi mobile juga.',
			remindAt: at(0, 14), status: 'PENDING', createdAt: at(-2), updatedAt: at(-2)
		},
		{
			id: 'rem_002', userId: 'usr_owner', taskId: 'tsk_003',
			title: 'Cek progres migrasi data', note: null,
			remindAt: at(1, 9), status: 'PENDING', createdAt: at(-2), updatedAt: at(-2)
		},
		{
			id: 'rem_003', userId: 'usr_budi', taskId: 'tsk_001',
			title: 'Kirim proposal sebelum jam 5', note: 'Sudah revisi anggaran?',
			remindAt: at(0, 10), status: 'PENDING', createdAt: at(-1), updatedAt: at(-1)
		}
	]);

	await db
		.insert(settings)
		.values([
			{ key: 'org_name', valueJson: '"Rina Studio"', updatedAt: now },
			{ key: 'timezone', valueJson: '"Asia/Jakarta"', updatedAt: now },
			{ key: 'reminder_days', valueJson: '[3, 1, 0]', updatedAt: now }
		])
		.onConflictDoNothing();

	console.log(`Seed selesai: 4 user, 12 task, 3 reminder. Login admin / admin123 atau user / user123`);
}

try {
	await main();
} catch (error) {
	console.error('Seed gagal:', error);
	process.exitCode = 1;
} finally {
	await pool.end();
}
