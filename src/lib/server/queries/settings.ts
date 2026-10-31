import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { settings, users } from '../db/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { invalidateUserSessions } from '../auth/session';

export async function getSettingsMap(): Promise<Record<string, any>> {
	const rows = await db.select().from(settings);
	const map: Record<string, any> = {};
	for (const row of rows) {
		try {
			map[row.key] = JSON.parse(row.valueJson);
		} catch {
			map[row.key] = row.valueJson;
		}
	}
	return map;
}

export async function updateSetting(key: string, value: any): Promise<void> {
	const now = new Date().toISOString();
	await db
		.insert(settings)
		.values({
			key,
			valueJson: JSON.stringify(value),
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: settings.key,
			set: {
				valueJson: JSON.stringify(value),
				updatedAt: now
			}
		});
}

export async function updateProfileName(userId: string, name: string): Promise<void> {
	const now = new Date().toISOString();
	await db.update(users).set({ name, updatedAt: now }).where(eq(users.id, userId));
}

export async function updateProfileEmail(
	userId: string,
	newEmail: string,
	passwordPlain: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const user = rows[0];
	if (!user) return { ok: false, message: 'User tidak ditemukan' };

	const match = await verifyPassword(user.passwordHash, passwordPlain);
	if (!match) return { ok: false, message: 'Kata sandi saat ini salah' };

	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, newEmail.toLowerCase()))
		.limit(1);

	if (existing.length > 0 && existing[0].id !== userId) {
		return { ok: false, message: 'Email sudah dipakai pengguna lain' };
	}

	const now = new Date().toISOString();
	await db
		.update(users)
		.set({ email: newEmail.toLowerCase(), updatedAt: now })
		.where(eq(users.id, userId));

	return { ok: true };
}

export async function changeUserPassword(
	userId: string,
	currentPasswordPlain: string,
	newPasswordPlain: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const user = rows[0];
	if (!user) return { ok: false, message: 'User tidak ditemukan' };

	const match = await verifyPassword(user.passwordHash, currentPasswordPlain);
	if (!match) return { ok: false, message: 'Kata sandi saat ini salah' };

	const passwordHash = await hashPassword(newPasswordPlain);
	const now = new Date().toISOString();

	await db
		.update(users)
		.set({
			passwordHash,
			mustChangePassword: false,
			updatedAt: now
		})
		.where(eq(users.id, userId));

	return { ok: true };
}
