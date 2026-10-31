import { and, count, eq, gte, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { loginAttempts } from '../db/schema';

export const MAX_FAILED_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60_000;

function windowStart(): string {
	return new Date(Date.now() - WINDOW_MS).toISOString();
}

/** True kalau email atau IP sudah gagal login terlalu sering dalam 15 menit terakhir. */
export async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
	const since = windowStart();

	const byEmail = await db
		.select({ total: count() })
		.from(loginAttempts)
		.where(
			and(
				eq(loginAttempts.email, email),
				eq(loginAttempts.success, false),
				gte(loginAttempts.createdAt, since)
			)
		);

	if ((byEmail[0]?.total ?? 0) >= MAX_FAILED_ATTEMPTS) return true;

	if (ip) {
		const byIp = await db
			.select({ total: count() })
			.from(loginAttempts)
			.where(
				and(
					eq(loginAttempts.ip, ip),
					eq(loginAttempts.success, false),
					gte(loginAttempts.createdAt, since)
				)
			);
		if ((byIp[0]?.total ?? 0) >= MAX_FAILED_ATTEMPTS) return true;
	}

	return false;
}

export async function recordLoginAttempt(
	email: string,
	ip: string | null,
	success: boolean
): Promise<void> {
	await db.insert(loginAttempts).values({
		id: `lat_${crypto.randomUUID()}`,
		email,
		ip,
		success,
		createdAt: new Date().toISOString()
	});
}

/** Hapus catatan lama supaya tabel tidak tumbuh tanpa batas. */
export async function purgeOldAttempts(): Promise<void> {
	const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
	await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, cutoff));
}
