import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import {
	createManualReminder,
	deleteManualReminder,
	getAutoReminders,
	getManualReminders,
	toggleReminderStatus
} from '#lib/server/queries/reminders';
import { listTasks } from '#lib/server/queries/tasks';
import { recordAudit } from '#lib/server/audit';
import { z } from 'zod';

const reminderSchema = z.object({
	title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(200, 'Maksimal 200 karakter'),
	note: z.string().trim().max(1000, 'Catatan maksimal 1000 karakter').optional(),
	remindAtDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
	remindAtTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu tidak valid'),
	taskId: z.string().optional()
});

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);

	const [autoReminders, manualReminders, userTasks] = await Promise.all([
		getAutoReminders(user),
		getManualReminders(user.id),
		listTasks(user, { perPage: 100 })
	]);

	return {
		autoReminders,
		manualReminders,
		tasks: userTasks.items.map((t) => ({ id: t.id, title: t.title }))
	};
};

export const actions = {
	create: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();

		const raw = {
			title: String(data.get('title') ?? ''),
			note: String(data.get('note') ?? ''),
			remindAtDate: String(data.get('remindAtDate') ?? ''),
			remindAtTime: String(data.get('remindAtTime') ?? ''),
			taskId: String(data.get('taskId') ?? '')
		};

		const parsed = reminderSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				error: parsed.error.issues[0]?.message ?? 'Input tidak valid'
			});
		}

		// Convert local date+time (WIB, UTC+7) to UTC ISO
		const localIsoStr = `${parsed.data.remindAtDate}T${parsed.data.remindAtTime}:00+07:00`;
		const utcDate = new Date(localIsoStr);
		if (isNaN(utcDate.getTime())) {
			return fail(400, { values: raw, error: 'Waktu pengingat tidak valid' });
		}

		const reminderId = await createManualReminder(user.id, {
			title: parsed.data.title,
			note: parsed.data.note,
			remindAt: utcDate.toISOString(),
			taskId: parsed.data.taskId || null
		});

		await recordAudit({
			actorId: user.id,
			action: 'reminder.create',
			entityType: 'reminder',
			entityId: reminderId,
			after: { title: parsed.data.title, remindAt: utcDate.toISOString() },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/reminders?created=1');
	},

	toggle: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const currentStatus = String(data.get('status') ?? 'PENDING');
		const newStatus = currentStatus === 'PENDING' ? 'DONE' : 'PENDING';

		await toggleReminderStatus(id, user.id, newStatus);

		await recordAudit({
			actorId: user.id,
			action: 'reminder.update',
			entityType: 'reminder',
			entityId: id,
			before: { status: currentStatus },
			after: { status: newStatus },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/reminders');
	},

	delete: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');

		await deleteManualReminder(id, user.id);

		await recordAudit({
			actorId: user.id,
			action: 'reminder.delete',
			entityType: 'reminder',
			entityId: id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/reminders?deleted=1');
	}
};
