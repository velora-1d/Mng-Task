import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { reminders, tasks, users } from '../db/schema';
import type { SessionUser } from '../auth/session';
import { scopedWhere } from './tasks';
import { diffDays, todayWib } from '#lib/utils/date';
import type { TaskPriority, TaskStatus } from '#lib/types';

export type AutoReminder = {
	type: 'auto';
	id: string; // tsk_xxx
	taskId: string;
	title: string;
	dueDate: string;
	status: TaskStatus;
	priority: TaskPriority;
	urgency: 'overdue' | 'today' | 'h1' | 'h3';
	urgencyLabel: string;
};

export type ManualReminder = {
	type: 'manual';
	id: string;
	userId: string;
	taskId: string | null;
	taskTitle: string | null;
	title: string;
	note: string | null;
	remindAt: string;
	status: 'PENDING' | 'DONE';
	createdAt: string;
};

/**
 * Hitung pengingat otomatis dari tugas yang belum selesai:
 * Overdue, Hari H (diff 0), H-1 (diff 1), H-3 (diff 2 atau 3).
 */
export async function getAutoReminders(user: Pick<SessionUser, 'id' | 'role'>): Promise<AutoReminder[]> {
	const today = todayWib();
	const scope = scopedWhere(user);

	const activeTasks = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			dueDate: tasks.dueDate,
			status: tasks.status,
			priority: tasks.priority
		})
		.from(tasks)
		.where(and(scope, ne(tasks.status, 'DONE'), sql`${tasks.dueDate} is not null`))
		.orderBy(tasks.dueDate);

	const autoReminders: AutoReminder[] = [];

	for (const t of activeTasks) {
		if (!t.dueDate) continue;
		const diff = diffDays(today, t.dueDate);

		if (diff < 0) {
			autoReminders.push({
				type: 'auto',
				id: `auto_${t.id}`,
				taskId: t.id,
				title: t.title,
				dueDate: t.dueDate,
				status: t.status,
				priority: t.priority,
				urgency: 'overdue',
				urgencyLabel: `Terlambat ${Math.abs(diff)} hari`
			});
		} else if (diff === 0) {
			autoReminders.push({
				type: 'auto',
				id: `auto_${t.id}`,
				taskId: t.id,
				title: t.title,
				dueDate: t.dueDate,
				status: t.status,
				priority: t.priority,
				urgency: 'today',
				urgencyLabel: 'Hari ini'
			});
		} else if (diff === 1) {
			autoReminders.push({
				type: 'auto',
				id: `auto_${t.id}`,
				taskId: t.id,
				title: t.title,
				dueDate: t.dueDate,
				status: t.status,
				priority: t.priority,
				urgency: 'h1',
				urgencyLabel: 'Besok (H-1)'
			});
		} else if (diff <= 3) {
			autoReminders.push({
				type: 'auto',
				id: `auto_${t.id}`,
				taskId: t.id,
				title: t.title,
				dueDate: t.dueDate,
				status: t.status,
				priority: t.priority,
				urgency: 'h3',
				urgencyLabel: `${diff} hari lagi (H-${diff})`
			});
		}
	}

	return autoReminders;
}

/** Ambil reminder manual milik user */
export async function getManualReminders(userId: string): Promise<ManualReminder[]> {
	const rows = await db
		.select({
			id: reminders.id,
			userId: reminders.userId,
			taskId: reminders.taskId,
			taskTitle: tasks.title,
			title: reminders.title,
			note: reminders.note,
			remindAt: reminders.remindAt,
			status: reminders.status,
			createdAt: reminders.createdAt
		})
		.from(reminders)
		.leftJoin(tasks, eq(tasks.id, reminders.taskId))
		.where(eq(reminders.userId, userId))
		.orderBy(desc(reminders.remindAt));

	return rows.map((r) => ({
		type: 'manual',
		...r
	}));
}

/** Hitung total reminder aktif untuk badge header & sidebar */
export async function countActiveReminders(user: Pick<SessionUser, 'id' | 'role'>): Promise<number> {
	const autos = await getAutoReminders(user);
	const [manualCount] = await db
		.select({ total: sql<number>`count(*)` })
		.from(reminders)
		.where(and(eq(reminders.userId, user.id), eq(reminders.status, 'PENDING')));

	return autos.length + (manualCount?.total ?? 0);
}

export async function createManualReminder(
	userId: string,
	data: { title: string; note?: string | null; remindAt: string; taskId?: string | null }
) {
	const now = new Date().toISOString();
	const id = `rem_${crypto.randomUUID()}`;

	await db.insert(reminders).values({
		id,
		userId,
		taskId: data.taskId || null,
		title: data.title,
		note: data.note || null,
		remindAt: data.remindAt,
		status: 'PENDING',
		createdAt: now,
		updatedAt: now
	});

	return id;
}

export async function toggleReminderStatus(id: string, userId: string, status: 'PENDING' | 'DONE') {
	const now = new Date().toISOString();
	await db
		.update(reminders)
		.set({ status, updatedAt: now })
		.where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

export async function deleteManualReminder(id: string, userId: string) {
	await db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}
