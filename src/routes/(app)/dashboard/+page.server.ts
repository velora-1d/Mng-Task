import { requireUser } from '#lib/server/auth/guards';
import { completedTrend, dashboardCounts, upcomingTasks } from '#lib/server/queries/tasks';
import { recentActivity } from '#lib/server/queries/activity';
import { formatDateLong, todayWib } from '#lib/utils/date';

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
