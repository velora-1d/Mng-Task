import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/client';
import { users } from '#lib/server/db/schema';
import { DUMMY_HASH, verifyPassword } from '#lib/server/auth/password';
import { createSession, setSessionCookie } from '#lib/server/auth/session';
import { isRateLimited, recordLoginAttempt } from '#lib/server/auth/rate-limit';
import { recordAudit } from '#lib/server/audit';
import { safeNext } from '#lib/server/auth/guards';

const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'Username atau email wajib diisi.'),
	password: z.string().min(1, 'Kata sandi wajib diisi.')
});

const GENERIC_ERROR = 'Username/email atau kata sandi salah.';

export const load = ({ locals, url }) => {
	if (locals.user) {
		redirect(303, safeNext(url.searchParams.get('next')));
	}
	return { next: url.searchParams.get('next') ?? '' };
};

export const actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(data.get('password') ?? '');
		const next = safeNext(url.searchParams.get('next') ?? String(data.get('next') ?? ''));

		const parsed = loginSchema.safeParse({ email, password });
		if (!parsed.success) {
			return fail(400, {
				email,
				error: parsed.error.issues[0]?.message ?? 'Data login tidak valid.'
			});
		}

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent');

		if (await isRateLimited(parsed.data.email, ip)) {
			await recordAudit({
				action: 'login_rate_limited',
				entityType: 'session',
				ip,
				userAgent
			});
			return fail(429, {
				email,
				error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'
			});
		}

		const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
		const user = rows[0];

		// Tetap verifikasi hash palsu agar waktu respons tidak membocorkan keberadaan email.
		const passwordOk = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, parsed.data.password);

		if (!user || !passwordOk || !user.isActive) {
			await recordLoginAttempt(parsed.data.email, ip, false);
			await recordAudit({
				actorId: user?.id ?? null,
				action: user ? 'login_failed' : 'login_unknown_email',
				entityType: 'session',
				ip,
				userAgent
			});
			return fail(400, { email, error: GENERIC_ERROR });
		}

		await recordLoginAttempt(parsed.data.email, ip, true);

		const { token, expiresAt } = await createSession(user.id, { ip, userAgent });
		setSessionCookie(cookies, token, expiresAt);

		const now = new Date().toISOString();
		await db.update(users).set({ lastSeenAt: now }).where(eq(users.id, user.id));
		await recordAudit({
			actorId: user.id,
			action: 'login',
			entityType: 'session',
			ip,
			userAgent
		});

		redirect(303, next);
	}
};
