import { fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import { completedTrend, dashboardCounts, softDeleteTask, upcomingTasks } from '#lib/server/queries/tasks';
import { recentActivity } from '#lib/server/queries/activity';
import { formatDateLong, todayWib } from '#lib/utils/date';
import { recordAudit } from '#lib/server/audit';

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);

	const [counts, upcoming, trend, activities] = await Promise.all([
		dashboardCounts(user),
		upcomingTasks(user),
		completedTrend(user),
		recentActivity(5)
	]);

	return {
		counts,
		upcoming,
		trend,
		activities,
		today: todayWib(),
		todayLabel: formatDateLong(todayWib()),
		firstName: user.name.split(' ')[0]
	};
};

export const actions = {
	delete: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');

		const res = await softDeleteTask(id, user);
		if (!res.ok) {
			return fail(400, { error: res.message });
		}

		await recordAudit({
			actorId: user.id,
			action: 'task.delete',
			entityType: 'task',
			entityId: id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		return { success: true };
	}
};
