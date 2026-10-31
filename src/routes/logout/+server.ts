import { redirect } from '@sveltejs/kit';
import { clearSessionCookie, invalidateSession } from '#lib/server/auth/session';
import { recordAudit } from '#lib/server/audit';

export const POST = async ({ locals, cookies, getClientAddress, request }) => {
	if (locals.sessionId) {
		await invalidateSession(locals.sessionId);
		await recordAudit({
			actorId: locals.user?.id ?? null,
			action: 'logout',
			entityType: 'session',
			entityId: locals.sessionId,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});
	}
	clearSessionCookie(cookies);
	redirect(303, '/login');
};
