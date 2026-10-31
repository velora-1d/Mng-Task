import { fail, redirect } from '@sveltejs/kit';
import { requireOwner, requireUser } from '#lib/server/auth/guards';
import {
	changeUserPassword,
	getSettingsMap,
	updateProfileEmail,
	updateProfileName,
	updateSetting
} from '#lib/server/queries/settings';
import { invalidateUserSessions } from '#lib/server/auth/session';
import { recordAudit } from '#lib/server/audit';
import { z } from 'zod';

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const appSettings = await getSettingsMap();

	return {
		user,
		isOwner: user.role === 'OWNER',
		settings: appSettings,
		saved: url.searchParams.get('saved') === '1'
	};
};

export const actions = {
	updateName: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();

		if (name.length < 2 || name.length > 100) {
			return fail(400, { form: 'name', error: 'Nama harus 2–100 karakter.' });
		}

		await updateProfileName(user.id, name);

		await recordAudit({
			actorId: user.id,
			action: 'user.update_profile',
			entityType: 'user',
			entityId: user.id,
			after: { name },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/settings?saved=1');
	},

	updateEmail: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		const emailParsed = z.string().email('Format email tidak valid.').safeParse(email);
		if (!emailParsed.success) {
			return fail(400, { form: 'email', error: emailParsed.error.issues[0]?.message });
		}

		const res = await updateProfileEmail(user.id, email, password);
		if (!res.ok) {
			return fail(400, { form: 'email', error: res.message });
		}

		await recordAudit({
			actorId: user.id,
			action: 'user.update_email',
			entityType: 'user',
			entityId: user.id,
			after: { email },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/settings?saved=1');
	},

	changePassword: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const currentPassword = String(data.get('currentPassword') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (newPassword.length < 8) {
			return fail(400, { form: 'password', error: 'Password baru minimal 8 karakter.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { form: 'password', error: 'Konfirmasi password tidak cocok.' });
		}

		const res = await changeUserPassword(user.id, currentPassword, newPassword);
		if (!res.ok) {
			return fail(400, { form: 'password', error: res.message });
		}

		// Cabut sesi lain kecuali sesi sekarang
		await invalidateUserSessions(user.id, locals.sessionId ?? undefined);

		await recordAudit({
			actorId: user.id,
			action: 'user.change_password',
			entityType: 'user',
			entityId: user.id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/settings?saved=1');
	},

	logoutOtherDevices: async ({ locals, url, getClientAddress, request }) => {
		const user = requireUser(locals, url);
		await invalidateUserSessions(user.id, locals.sessionId ?? undefined);

		await recordAudit({
			actorId: user.id,
			action: 'user.logout_all_devices',
			entityType: 'session',
			entityId: user.id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/settings?saved=1');
	},

	updateOrg: async ({ request, locals, url, getClientAddress }) => {
		const owner = requireOwner(locals, url);
		const data = await request.formData();
		const orgName = String(data.get('orgName') ?? '').trim();

		if (orgName.length < 2 || orgName.length > 100) {
			return fail(400, { form: 'org', error: 'Nama organisasi harus 2–100 karakter.' });
		}

		await updateSetting('org_name', orgName);

		await recordAudit({
			actorId: owner.id,
			action: 'settings.update_org',
			entityType: 'settings',
			after: { orgName },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/settings?saved=1');
	}
};
