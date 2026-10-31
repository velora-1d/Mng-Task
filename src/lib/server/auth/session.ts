import { createHash, randomBytes } from 'node:crypto';
import { dev } from '$app/env';
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from '$app/env/private';
import type { Cookies } from '@sveltejs/kit';
import { eq, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { sessions, users } from '../db/schema';
import type { UserRole } from '#lib/types';

export const SESSION_COOKIE = SESSION_COOKIE_NAME;

const DAY_MS = 86_400_000;
const TTL_DAYS = Number(SESSION_TTL_DAYS) > 0 ? Number(SESSION_TTL_DAYS) : 7;
export const SESSION_TTL_MS = TTL_DAYS * DAY_MS;

export type SessionUser = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	mustChangePassword: boolean;
};

export const cookieOptions = (expires?: Date) => ({
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev,
	expires
});

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function newSessionId(): string {
	return `ses_${randomBytes(9).toString('base64url')}`;
}

export async function createSession(
	userId: string,
	meta: { ip?: string | null; userAgent?: string | null } = {}
) {
	const token = randomBytes(32).toString('base64url');
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

	await db.insert(sessions).values({
		id: newSessionId(),
		userId,
		tokenHash: hashToken(token),
		expiresAt: expiresAt.toISOString(),
		ip: meta.ip ?? null,
		userAgent: meta.userAgent ?? null,
		createdAt: now.toISOString()
	});

	return { token, expiresAt };
}

export function toSessionUser(row: {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	mustChangePassword: boolean;
}): SessionUser {
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		role: row.role,
		mustChangePassword: row.mustChangePassword
	};
}

/**
 * Validasi token sesi. Mengembalikan null kalau token tidak dikenal, kedaluwarsa,
 * atau user sudah dinonaktifkan. `renewed` menandakan expiry sudah diperpanjang.
 */
export async function validateSessionToken(token: string) {
	const rows = await db
		.select({
			sessionId: sessions.id,
			expiresAt: sessions.expiresAt,
			userId: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			mustChangePassword: users.mustChangePassword,
			isActive: users.isActive
		})
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.tokenHash, hashToken(token)))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	const expiresAt = new Date(row.expiresAt);
	if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
		await db.delete(sessions).where(eq(sessions.id, row.sessionId));
		return null;
	}

	if (!row.isActive) return null;

	let renewed = false;
	let nextExpiry = expiresAt;
	if (expiresAt.getTime() - Date.now() < SESSION_TTL_MS / 2) {
		nextExpiry = new Date(Date.now() + SESSION_TTL_MS);
		await db
			.update(sessions)
			.set({ expiresAt: nextExpiry.toISOString() })
			.where(eq(sessions.id, row.sessionId));
		renewed = true;
	}

	return {
		sessionId: row.sessionId,
		user: toSessionUser({
			id: row.userId,
			name: row.name,
			email: row.email,
			role: row.role,
			mustChangePassword: row.mustChangePassword
		}),
		expiresAt: nextExpiry,
		renewed
	};
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
	const rows = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
	for (const row of rows) {
		if (row.id !== exceptSessionId) await db.delete(sessions).where(eq(sessions.id, row.id));
	}
}

/** Bersihkan sesi kedaluwarsa; dipanggil dari hook secara berkala. */
export async function purgeExpiredSessions(): Promise<void> {
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}
