import { fail, redirect } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '#lib/server/db/client';
import { users } from '#lib/server/db/schema';
import { hashPassword } from '#lib/server/auth/password';
import { createSession, setSessionCookie } from '#lib/server/auth/session';
import { recordAudit } from '#lib/server/audit';
import type { UserRole } from '#lib/types';

const registerSchema = z
	.object({
		name: z.string().trim().min(2, 'Nama lengkap minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
		email: z
			.string()
			.trim()
			.min(3, 'Username atau email minimal 3 karakter')
			.max(100, 'Username atau email maksimal 100 karakter')
			.toLowerCase(),
		password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
		confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Konfirmasi kata sandi tidak cocok',
		path: ['confirmPassword']
	});

export const load = ({ locals }) => {
	if (locals.user) {
		redirect(303, '/dashboard');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		const parsed = registerSchema.safeParse({ name, email, password, confirmPassword });
		if (!parsed.success) {
			return fail(400, {
				name,
				email,
				error: parsed.error.issues[0]?.message ?? 'Data registrasi tidak valid.'
			});
		}

		// Periksa apakah username / email sudah terdaftar
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, parsed.data.email))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, {
				name,
				email,
				error: 'Username atau email tersebut sudah terdaftar. Silakan gunakan yang lain.'
			});
		}

		// Jika belum ada user / owner sama sekali, jadikan pendaftar pertama sebagai OWNER
		const [{ total }] = await db.select({ total: count() }).from(users);
		const role: UserRole = total === 0 ? 'OWNER' : 'USER';

		const passwordHash = await hashPassword(parsed.data.password);
		const newUserId = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
		const now = new Date().toISOString();

		await db.insert(users).values({
			id: newUserId,
			name: parsed.data.name,
			email: parsed.data.email,
			passwordHash,
			role,
			isActive: true,
			mustChangePassword: false,
			createdAt: now,
			updatedAt: now
		});

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent');

		await recordAudit({
			actorId: newUserId,
			action: 'user.register',
			entityType: 'user',
			entityId: newUserId,
			after: { name: parsed.data.name, email: parsed.data.email, role },
			ip,
			userAgent
		});

		// Auto login setelah registrasi
		const session = await createSession(newUserId, { ip, userAgent });
		setSessionCookie(cookies, session.token, session.expiresAt);

		redirect(303, '/dashboard');
	}
};
