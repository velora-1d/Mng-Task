import { requireUser } from '#lib/server/auth/guards';
import { activeAssignees, listTasks, PER_PAGE_OPTIONS, type TaskSort } from '#lib/server/queries/tasks';
import { isTaskPriority, isTaskStatus, type TaskPriority, type TaskStatus } from '#lib/types';

const SORTS: TaskSort[] = ['due_asc', 'due_desc', 'priority', 'title', 'created', 'updated'];
const DUES = ['overdue', 'today', 'week'] as const;

function parseFilters(params: URLSearchParams) {
	const status = params.get('status') ?? '';
	const priority = params.get('priority') ?? '';
	const sort = params.get('sort') ?? '';
	const due = params.get('due') ?? '';
	const perPage = Number(params.get('perPage') ?? 0);
	const page = Number(params.get('page') ?? 1);

	return {
		q: params.get('q')?.trim() ?? '',
		status: isTaskStatus(status) ? (status as TaskStatus) : ('' as const),
		priority: isTaskPriority(priority) ? (priority as TaskPriority) : ('' as const),
		assignee: params.get('assignee') ?? '',
		due: (DUES as readonly string[]).includes(due) ? (due as (typeof DUES)[number]) : ('' as const),
		sort: SORTS.includes(sort as TaskSort) ? (sort as TaskSort) : ('created' as TaskSort),
		page: Number.isFinite(page) && page > 0 ? page : 1,
		perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(perPage) ? perPage : 20
	};
}

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const filters = parseFilters(url.searchParams);
	const result = await listTasks(user, filters);

	return {
		...result,
		filters,
		assignees: user.role === 'OWNER' ? await activeAssignees() : [],
		perPageOptions: PER_PAGE_OPTIONS,
		isOwner: user.role === 'OWNER'
	};
};
