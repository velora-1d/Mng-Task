import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import { safeNext } from '#lib/server/auth/guards';
import { recordAudit } from '#lib/server/audit';
import {
	canDelete,
	canEdit,
	getTaskForUser,
	setTaskStatus,
	softDeleteTask
} from '#lib/server/queries/tasks';
import { entityActivity } from '#lib/server/queries/activity';
import { isTaskStatus } from '#lib/types';

export const load = async ({ locals, params, url }) => {
	const user = requireUser(locals, url);
	const task = await getTaskForUser(params.id, user);
	if (!task) error(404, 'Task tidak ditemukan atau bukan milikmu.');

	return {
		task,
		activity: await entityActivity('task', task.id),
		canEdit: canEdit(user, task),
		canDelete: canDelete(user, task),
		saved: url.searchParams.get('saved') === '1'
	};
};

export const actions = {
	setStatus: async ({ request, locals, params, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const status = String(data.get('status') ?? '');
		const next = safeNext(String(data.get('next') ?? ''), `/tasks/${params.id}`);

		if (!isTaskStatus(status)) {
			return fail(400, { actionError: 'Status tidak valid.' });
		}

		const before = await getTaskForUser(params.id, user);
		if (!before) error(404, 'Task tidak ditemukan.');

		const result = await setTaskStatus(params.id, status, user);
		if (!result.ok) return fail(400, { actionError: result.message });

		if (before.status !== status) {
			await recordAudit({
				actorId: user.id,
				action: 'task.status',
				entityType: 'task',
				entityId: params.id,
				before: { status: before.status },
				after: { status },
				ip: getClientAddress(),
				userAgent: request.headers.get('user-agent')
			});
		}

		redirect(303, next);
	},

	delete: async ({ request, locals, params, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const task = await getTaskForUser(params.id, user);
		if (!task) error(404, 'Task tidak ditemukan.');

		const result = await softDeleteTask(params.id, user);
		if (!result.ok) return fail(400, { actionError: result.message });

		await recordAudit({
			actorId: user.id,
			action: 'task.delete',
			entityType: 'task',
			entityId: params.id,
			before: { title: task.title, status: task.status },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/tasks?deleted=1');
	}
};
