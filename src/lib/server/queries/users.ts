import { and, asc, count, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';
import type { UserRole } from '#lib/types';
import { hashPassword } from '../auth/password';
import { invalidateUserSessions } from '../auth/session';

export type UserFilters = {
	q?: string;
	role?: UserRole | '';
	status?: 'active' | 'inactive' | '';
	page?: number;
	perPage?: number;
};

export async function listUsers(filters: UserFilters = {}) {
	const page = Math.max(1, filters.page ?? 1);
	const perPage = Math.max(1, filters.perPage ?? 10);

	const conditions: (SQL | undefined)[] = [];

	if (filters.q) {
		const pattern = `%${filters.q.toLowerCase()}%`;
		conditions.push(or(like(users.name, pattern), like(users.email, pattern)) as SQL);
	}

	if (filters.role) {
		conditions.push(eq(users.role, filters.role));
	}

	if (filters.status === 'active') {
		conditions.push(eq(users.isActive, true));
	} else if (filters.status === 'inactive') {
		conditions.push(eq(users.isActive, false));
	}

	const where = conditions.length > 0 ? and(...conditions.filter(Boolean)) : undefined;

	const [{ total }] = await db.select({ total: count() }).from(users).where(where);
	const totalPages = Math.max(1, Math.ceil(total / perPage));

	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			isActive: users.isActive,
			mustChangePassword: users.mustChangePassword,
			lastSeenAt: users.lastSeenAt,
			createdAt: users.createdAt
		})
		.from(users)
		.where(where)
		.orderBy(desc(users.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage);

	return {
		items: rows,
		total,
		page,
		perPage,
		totalPages
	};
}

export async function getUserById(id: string) {
	const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return rows[0] ?? null;
}

export async function countActiveOwners(): Promise<number> {
	const [{ total }] = await db
		.select({ total: count() })
		.from(users)
		.where(and(eq(users.role, 'OWNER'), eq(users.isActive, true)));
	return total;
}

export async function createUser(data: {
	name: string;
	email: string;
	passwordPlain: string;
	role: UserRole;
}) {
	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, data.email.toLowerCase()))
		.limit(1);

	if (existing.length > 0) {
		return { ok: false as const, message: 'Email sudah terdaftar.' };
	}

	const passwordHash = await hashPassword(data.passwordPlain);
	const now = new Date().toISOString();
	const id = `usr_${crypto.randomUUID()}`;

	await db.insert(users).values({
		id,
		name: data.name,
		email: data.email.toLowerCase(),
		passwordHash,
		role: data.role,
		isActive: true,
		mustChangePassword: true,
		createdAt: now,
		updatedAt: now
	});

	return { ok: true as const, id };
}

export async function updateUser(
	id: string,
	data: { name: string; email: string; role: UserRole }
) {
	const target = await getUserById(id);
	if (!target) return { ok: false as const, message: 'User tidak ditemukan.' };

	// Aturan proteksi Owner terakhir
	if (target.role === 'OWNER' && data.role !== 'OWNER') {
		const ownersCount = await countActiveOwners();
		if (ownersCount <= 1) {
			return { ok: false as const, message: 'Tidak dapat menurunkan role satu-satunya Owner aktif.' };
		}
	}

	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.email, data.email.toLowerCase()), sql`${users.id} <> ${id}`))
		.limit(1);

	if (existing.length > 0) {
		return { ok: false as const, message: 'Email sudah dipakai pengguna lain.' };
	}

	const now = new Date().toISOString();
	await db
		.update(users)
		.set({
			name: data.name,
			email: data.email.toLowerCase(),
			role: data.role,
			updatedAt: now
		})
		.where(eq(users.id, id));

	return { ok: true as const, id };
}

export async function toggleUserActive(id: string, activate: boolean) {
	const target = await getUserById(id);
	if (!target) return { ok: false as const, message: 'User tidak ditemukan.' };

	if (!activate && target.role === 'OWNER') {
		const ownersCount = await countActiveOwners();
		if (ownersCount <= 1) {
			return { ok: false as const, message: 'Tidak dapat menonaktifkan satu-satunya Owner aktif.' };
		}
	}

	const now = new Date().toISOString();
	await db.update(users).set({ isActive: activate, updatedAt: now }).where(eq(users.id, id));

	if (!activate) {
		await invalidateUserSessions(id);
	}

	return { ok: true as const };
}

export async function resetUserPassword(id: string, newPasswordPlain: string) {
	const target = await getUserById(id);
	if (!target) return { ok: false as const, message: 'User tidak ditemukan.' };

	const passwordHash = await hashPassword(newPasswordPlain);
	const now = new Date().toISOString();

	await db
		.update(users)
		.set({
			passwordHash,
			mustChangePassword: true,
			updatedAt: now
		})
		.where(eq(users.id, id));

	await invalidateUserSessions(id);

	return { ok: true as const };
}
