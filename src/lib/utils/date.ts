/** Utilitas tanggal. Semua logika bisnis memakai zona Asia/Jakarta (WIB, UTC+7). */

export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tanggal hari ini di WIB dalam format 'YYYY-MM-DD'. */
export function todayWib(now: Date = new Date()): string {
	return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Geser tanggal 'YYYY-MM-DD' sebanyak n hari (boleh negatif). */
export function shiftDate(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00.000Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

/** Selisih hari antara dua tanggal 'YYYY-MM-DD' (b - a). */
export function diffDays(a: string, b: string): number {
	const ms = Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`);
	return Math.round(ms / 86_400_000);
}

/** Awal minggu (Senin) untuk tanggal tertentu. */
export function startOfWeek(date: string): string {
	const dow = new Date(`${date}T00:00:00.000Z`).getUTCDay();
	return shiftDate(date, dow === 0 ? -6 : 1 - dow);
}

export function startOfMonth(date: string): string {
	return `${date.slice(0, 7)}-01`;
}

export function endOfMonth(date: string): string {
	const [y, m] = date.split('-').map(Number);
	const last = new Date(Date.UTC(y, m, 0));
	return last.toISOString().slice(0, 10);
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** '2026-10-31' -> '31 Okt' */
export function formatDateShort(date: string): string {
	const [, m, d] = date.split('-').map(Number);
	return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** '2026-10-31' -> 'Jumat, 31 Oktober 2026' */
export function formatDateLong(date: string): string {
	const d = new Date(`${date}T00:00:00.000Z`);
	const months = [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember'
	];
	const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
	return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function weekdayShort(date: string): string {
	return DAYS_SHORT[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
}

/** Label ramah untuk deadline: 'Terlambat 2 hari', 'Hari ini', 'Besok', '3 Nov'. */
export function dueLabel(dueDate: string, today: string = todayWib()): string {
	const delta = diffDays(today, dueDate);
	if (delta === 0) return 'Hari ini';
	if (delta === 1) return 'Besok';
	if (delta === -1) return 'Terlambat 1 hari';
	if (delta < -1) return `Terlambat ${Math.abs(delta)} hari`;
	return formatDateShort(dueDate);
}

/** ISO timestamp sekarang (UTC). */
export function nowIso(): string {
	return new Date().toISOString();
}

/** ISO timestamp -> '31 Okt 2026, 14.05' (WIB). */
export function formatDateTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Asia/Jakarta'
	}).format(date);
}
