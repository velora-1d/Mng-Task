import { fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import {
	activeAssignees,
	bulkDeleteTasks,
	bulkUpdateStatusTasks,
	listTasks,
	PER_PAGE_OPTIONS,
	softDeleteTask,
	type TaskSort
} from '#lib/server/queries/tasks';
import { isTaskPriority, isTaskStatus, type TaskPriority, type TaskStatus } from '#lib/types';
import { recordAudit } from '#lib/server/audit';

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

export const actions = {
	bulkDelete: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const rawIds = data.getAll('ids').map(String);
		const ids = rawIds.flatMap((v) => {
			try {
				const parsed = JSON.parse(v);
				return Array.isArray(parsed) ? parsed : [v];
			} catch {
				return [v];
			}
		}).filter(Boolean);

		if (ids.length === 0) {
			return fail(400, { error: 'Tidak ada tugas yang dipilih.' });
		}

		const { deletedCount, deletedIds } = await bulkDeleteTasks(ids, user);

		await recordAudit({
			actorId: user.id,
			action: 'task.bulk_delete',
			entityType: 'task',
			after: { count: deletedCount, ids: deletedIds },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		return { success: true, count: deletedCount, action: 'bulkDelete' };
	},

	bulkStatus: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const rawIds = data.getAll('ids').map(String);
		const ids = rawIds.flatMap((v) => {
			try {
				const parsed = JSON.parse(v);
				return Array.isArray(parsed) ? parsed : [v];
			} catch {
				return [v];
			}
		}).filter(Boolean);
		const status = String(data.get('status') ?? '') as TaskStatus;

		if (!isTaskStatus(status)) {
			return fail(400, { error: 'Status tugas tidak valid.' });
		}
		if (ids.length === 0) {
			return fail(400, { error: 'Tidak ada tugas yang dipilih.' });
		}

		const { updatedCount, updatedIds } = await bulkUpdateStatusTasks(ids, status, user);

		await recordAudit({
			actorId: user.id,
			action: 'task.bulk_status',
			entityType: 'task',
			after: { status, count: updatedCount, ids: updatedIds },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		return { success: true, count: updatedCount, action: 'bulkStatus' };
	},

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
