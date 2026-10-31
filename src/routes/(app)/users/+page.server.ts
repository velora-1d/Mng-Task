import { fail, redirect } from '@sveltejs/kit';
import { requireOwner } from '#lib/server/auth/guards';
import {
	createUser,
	getUserById,
	listUsers,
	resetUserPassword,
	toggleUserActive,
	updateUser,
	type UserFilters
} from '#lib/server/queries/users';
import { recordAudit } from '#lib/server/audit';
import { z } from 'zod';
import type { UserRole } from '#lib/types';

const userCreateSchema = z.object({
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Maksimal 100 karakter'),
	email: z.string().trim().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter'),
	role: z.enum(['OWNER', 'USER'])
});

const userUpdateSchema = z.object({
	id: z.string().min(1),
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Maksimal 100 karakter'),
	email: z.string().trim().email('Format email tidak valid'),
	role: z.enum(['OWNER', 'USER'])
});

export const load = async ({ locals, url }) => {
	requireOwner(locals, url);

	const params = url.searchParams;
	const filters: UserFilters = {
		q: params.get('q')?.trim() ?? '',
		role: (params.get('role') as UserRole) || '',
		status: (params.get('status') as 'active' | 'inactive') || '',
		page: Number(params.get('page') ?? 1),
		perPage: 10
	};

	const result = await listUsers(filters);

	return {
		...result,
		filters
	};
};

export const actions = {
	create: async ({ request, locals, url, getClientAddress }) => {
		const owner = requireOwner(locals, url);
		const data = await request.formData();

		const raw = {
			name: String(data.get('name') ?? ''),
			email: String(data.get('email') ?? ''),
			password: String(data.get('password') ?? ''),
			role: String(data.get('role') ?? 'USER')
		};

		const parsed = userCreateSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				action: 'create',
				values: raw,
				error: parsed.error.issues[0]?.message ?? 'Input tidak valid'
			});
		}

		const res = await createUser({
			name: parsed.data.name,
			email: parsed.data.email,
			passwordPlain: parsed.data.password,
			role: parsed.data.role
		});

		if (!res.ok) {
			return fail(400, { action: 'create', values: raw, error: res.message });
		}

		await recordAudit({
			actorId: owner.id,
			action: 'user.create',
			entityType: 'user',
			entityId: res.id,
			after: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/users?created=1');
	},

	update: async ({ request, locals, url, getClientAddress }) => {
		const owner = requireOwner(locals, url);
		const data = await request.formData();

		const raw = {
			id: String(data.get('id') ?? ''),
			name: String(data.get('name') ?? ''),
			email: String(data.get('email') ?? ''),
			role: String(data.get('role') ?? 'USER')
		};

		const parsed = userUpdateSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				action: 'update',
				values: raw,
				error: parsed.error.issues[0]?.message ?? 'Input tidak valid'
			});
		}

		const before = await getUserById(parsed.data.id);
		const res = await updateUser(parsed.data.id, {
			name: parsed.data.name,
			email: parsed.data.email,
			role: parsed.data.role
		});

		if (!res.ok) {
			return fail(400, { action: 'update', values: raw, error: res.message });
		}

		await recordAudit({
			actorId: owner.id,
			action: 'user.update',
			entityType: 'user',
			entityId: parsed.data.id,
			before: { name: before?.name, email: before?.email, role: before?.role },
			after: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/users?updated=1');
	},

	toggleActive: async ({ request, locals, url, getClientAddress }) => {
		const owner = requireOwner(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const activate = data.get('active') === 'true';

		const res = await toggleUserActive(id, activate);
		if (!res.ok) {
			return fail(400, { error: res.message });
		}

		await recordAudit({
			actorId: owner.id,
			action: activate ? 'user.activate' : 'user.deactivate',
			entityType: 'user',
			entityId: id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/users');
	},

	bulkToggleActive: async ({ request, locals, url, getClientAddress }) => {
		const owner = requireOwner(locals, url);
		const data = await request.formData();
		const rawIds = data.getAll('ids').map(String);
		const ids = rawIds
			.flatMap((v) => {
				try {
					const parsed = JSON.parse(v);
					return Array.isArray(parsed) ? parsed : [v];
				} catch {
					return [v];
				}
			})
			.filter(Boolean);
		const activate = data.get('active') === 'true';

		let successCount = 0;
		for (const id of ids) {
			const res = await toggleUserActive(id, activate);
			if (res.ok) successCount++;
		}

		await recordAudit({
			actorId: owner.id,
			action: activate ? 'user.bulk_activate' : 'user.bulk_deactivate',
			entityType: 'user',
			after: { activate, count: successCount, ids },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		return { success: true, count: successCount };
	},

	resetPassword: async ({ request, locals, url, getClientAddress }) => {
		const owner = requireOwner(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const password = String(data.get('newPassword') ?? '');

		if (password.length < 8) {
			return fail(400, { action: 'resetPassword', error: 'Password baru minimal 8 karakter' });
		}

		const res = await resetUserPassword(id, password);
		if (!res.ok) {
			return fail(400, { action: 'resetPassword', error: res.message });
		}

		await recordAudit({
			actorId: owner.id,
			action: 'user.reset_password',
			entityType: 'user',
			entityId: id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/users?reset=1');
	}
};
