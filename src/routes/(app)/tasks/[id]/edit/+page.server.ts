import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import { recordAudit } from '#lib/server/audit';
import { activeAssignees, canEdit, getTaskForUser, updateTaskForUser } from '#lib/server/queries/tasks';
import { canTransition, fieldErrors, taskInputSchema } from '#lib/server/validation/task';
import { TASK_STATUSES, type TaskStatus } from '#lib/types';

export const load = async ({ locals, params, url }) => {
	const user = requireUser(locals, url);
	const task = await getTaskForUser(params.id, user);
	if (!task) error(404, 'Task tidak ditemukan.');
	if (!canEdit(user, task)) error(403, 'Kamu tidak punya akses mengubah task ini.');

	const statusOptions = TASK_STATUSES.filter(
		(status) => status === task.status || canTransition(task.status, status)
	) as TaskStatus[];

	return {
		task,
		statusOptions,
		assignees: user.role === 'OWNER' ? await activeAssignees() : [],
		isOwner: user.role === 'OWNER'
	};
};

export const actions = {
	default: async ({ request, locals, params, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const existing = await getTaskForUser(params.id, user);
		if (!existing) error(404, 'Task tidak ditemukan.');
		if (!canEdit(user, existing)) error(403, 'Kamu tidak punya akses mengubah task ini.');

		const data = await request.formData();
		const raw = {
			title: String(data.get('title') ?? ''),
			description: String(data.get('description') ?? ''),
			status: String(data.get('status') ?? existing.status),
			priority: String(data.get('priority') ?? existing.priority),
			startDate: String(data.get('startDate') ?? ''),
			startTime: String(data.get('startTime') ?? ''),
			dueDate: String(data.get('dueDate') ?? ''),
			dueTime: String(data.get('dueTime') ?? ''),
			assigneeId: String(data.get('assigneeId') ?? '')
		};

		const parsed = taskInputSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { values: raw, errors: fieldErrors(parsed.error) });
		}

		const result = await updateTaskForUser(params.id, parsed.data, user);
		if (!result.ok) {
			return fail(400, { values: raw, errors: { status: result.message } });
		}

		await recordAudit({
			actorId: user.id,
			action: 'task.update',
			entityType: 'task',
			entityId: params.id,
			before: {
				title: existing.title,
				status: existing.status,
				priority: existing.priority,
				startDate: existing.startDate,
				startTime: existing.startTime,
				dueDate: existing.dueDate,
				dueTime: existing.dueTime,
				assigneeId: existing.assigneeId
			},
			after: {
				title: parsed.data.title,
				status: parsed.data.status,
				priority: parsed.data.priority,
				startDate: parsed.data.startDate,
				startTime: parsed.data.startTime,
				dueDate: parsed.data.dueDate,
				dueTime: parsed.data.dueTime,
				assigneeId: parsed.data.assigneeId
			},
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, `/tasks/${params.id}?saved=1`);
	}
};
