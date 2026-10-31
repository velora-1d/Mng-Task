import type { Handle } from '@sveltejs/kit/hooks';
import {
	SESSION_COOKIE,
	purgeExpiredSessions,
	setSessionCookie,
	validateSessionToken
} from '#lib/server/auth/session';
import { purgeOldAttempts } from '#lib/server/auth/rate-limit';

const PURGE_INTERVAL_MS = 60 * 60_000;
let lastPurge = 0;

function maybePurge(): void {
	if (Date.now() - lastPurge < PURGE_INTERVAL_MS) return;
	lastPurge = Date.now();
	void Promise.allSettled([purgeExpiredSessions(), purgeOldAttempts()]).catch((error) =>
		console.error('[maintenance] gagal membersihkan data lama', error)
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.sessionId = null;

	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = await validateSessionToken(token);
		if (session) {
			event.locals.user = session.user;
			event.locals.sessionId = session.sessionId;
			if (session.renewed) {
				setSessionCookie(event.cookies, token, session.expiresAt);
			}
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const response = await resolve(event);

	// Header keamanan dasar. CSP ditangani lewat konfigurasi sveltekit().
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	if (event.request.method === 'GET') maybePurge();

	return response;
};
