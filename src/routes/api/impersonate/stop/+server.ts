import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	SESSION_COOKIE,
	setSessionCookie,
	validateSessionToken,
	invalidateSession
} from '#lib/server/auth/session';
import { recordAudit } from '#lib/server/audit';

const IMPERSONATE_COOKIE = 'mngtask_impersonate';

/** Stop impersonation, restore original owner session */
export const POST: RequestHandler = async ({ locals, cookies, getClientAddress, request }) => {
	const originalToken = cookies.get(IMPERSONATE_COOKIE);
	if (!originalToken) {
		error(400, 'Tidak sedang dalam mode impersonasi.');
	}

	// Validate original owner session still exists
	const ownerSession = await validateSessionToken(originalToken);
	if (!ownerSession) {
		cookies.delete(IMPERSONATE_COOKIE, { path: '/' });
		error(401, 'Sesi owner sudah kedaluwarsa. Silakan login ulang.');
	}

	// Invalidate current impersonated session
	if (locals.sessionId) {
		await invalidateSession(locals.sessionId);
	}

	// Restore owner session cookie
	setSessionCookie(cookies, originalToken, ownerSession.expiresAt);
	cookies.delete(IMPERSONATE_COOKIE, { path: '/' });

	await recordAudit({
		actorId: ownerSession.user.id,
		action: 'user.impersonate_stop',
		entityType: 'user',
		entityId: locals.user?.id ?? null,
		ip: getClientAddress(),
		userAgent: request.headers.get('user-agent')
	});

	return json({ ok: true });
};
