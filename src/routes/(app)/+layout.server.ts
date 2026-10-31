import { requireUser } from '#lib/server/auth/guards';
import { countActiveReminders } from '#lib/server/queries/reminders';

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const reminderCount = await countActiveReminders(user);
	return { user, reminderCount };
};
