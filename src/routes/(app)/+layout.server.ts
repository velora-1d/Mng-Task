import { requireUser } from '#lib/server/auth/guards';
import { countActiveReminders } from '#lib/server/queries/reminders';

export const load = async ({ locals, url, cookies }) => {
	const user = requireUser(locals, url);

	// Jika pengguna membuka halaman pengingat, catat bahwa pengingat telah dilihat
	if (url.pathname.startsWith('/reminders')) {
		cookies.set('mngtask_reminders_seen', new Date().toISOString(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});
	}

	const seenAt = cookies.get('mngtask_reminders_seen');
	const reminderCount = await countActiveReminders(user, seenAt);
	return { user, reminderCount };
};
