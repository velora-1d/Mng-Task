import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie, SESSION_COOKIE, hashToken } from '#lib/server/auth/session';
import { db } from '#lib/server/db/client';
import { users, sessions } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { recordAudit } from '#lib/server/audit';

const IMPERSONATE_COOKIE = 'mngtask_impersonate';

/** OWNER impersonates target user */
export const POST: RequestHandler = async ({ request, locals, cookies, getClientAddress }) => {
	if (!locals.user || locals.user.role !== 'OWNER') {
		error(403, 'Hanya Owner yang dapat beralih pengguna.');
	}

	const { userId } = await request.json();
	if (!userId || typeof userId !== 'string') {
		error(400, 'userId wajib diisi.');
	}

	// Don't impersonate self
	if (userId === locals.user.id) {
		error(400, 'Tidak dapat beralih ke akun sendiri.');
	}

	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const target = rows[0];
	if (!target || !target.isActive) {
		error(404, 'Pengguna tidak ditemukan atau nonaktif.');
	}

	// Store current session token hash so we can restore later
	const currentToken = cookies.get(SESSION_COOKIE);
	if (!currentToken) {
		error(401, 'Sesi tidak valid.');
	}

	// Save original owner token in httpOnly cookie
	cookies.set(IMPERSONATE_COOKIE, currentToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // ponytail: match SESSION_COOKIE secure setting; upgrade when ORIGIN is set
		maxAge: 60 * 60 * 4 // 4 hours max impersonation
	});

	// Create session as target user
	const ip = getClientAddress();
	const userAgent = request.headers.get('user-agent');
	const { token, expiresAt } = await createSession(target.id, { ip, userAgent });
	setSessionCookie(cookies, token, expiresAt);

	await recordAudit({
		actorId: locals.user.id,
		action: 'user.impersonate',
		entityType: 'user',
		entityId: target.id,
		after: { targetName: target.name, targetEmail: target.email },
		ip,
		userAgent
	});

	return json({ ok: true, name: target.name });
};
