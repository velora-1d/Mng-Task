import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import { recordAudit } from '#lib/server/audit';
import { activeAssignees, createTaskForUser } from '#lib/server/queries/tasks';
import { dueDateInPast, fieldErrors, taskInputSchema } from '#lib/server/validation/task';
import { todayWib } from '#lib/utils/date';

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	return {
		assignees: user.role === 'OWNER' ? await activeAssignees() : [],
		isOwner: user.role === 'OWNER',
		today: todayWib()
	};
};

export const actions = {
	default: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();

		const raw = {
			title: String(data.get('title') ?? ''),
			description: String(data.get('description') ?? ''),
			status: String(data.get('status') ?? 'TODO'),
			priority: String(data.get('priority') ?? 'MEDIUM'),
			dueDate: String(data.get('dueDate') ?? ''),
			assigneeId: String(data.get('assigneeId') ?? '')
		};

		const parsed = taskInputSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { values: raw, errors: fieldErrors(parsed.error) });
		}

		if (dueDateInPast(parsed.data.dueDate)) {
			return fail(400, {
				values: raw,
				errors: { dueDate: 'Deadline tidak boleh tanggal yang sudah lewat.' }
			});
		}

		const result = await createTaskForUser(parsed.data, user);
		if (!result.ok) {
			return fail(400, { values: raw, errors: { assigneeId: result.message } });
		}

		await recordAudit({
			actorId: user.id,
			action: 'task.create',
			entityType: 'task',
			entityId: result.id,
			after: {
				title: parsed.data.title,
				status: parsed.data.status,
				priority: parsed.data.priority,
				dueDate: parsed.data.dueDate,
				assigneeId: parsed.data.assigneeId
			},
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, `/tasks/${result.id}?saved=1`);
	}
};
