import { and, asc, count, desc, eq, isNull, like, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/client';
import { tasks, users } from '../db/schema';
import type { SessionUser } from '../auth/session';
import type { TaskPriority, TaskStatus } from '#lib/types';
import { shiftDate, todayWib } from '#lib/utils/date';
import { canTransition } from '../validation/task';

export const PER_PAGE_OPTIONS = [20, 50, 100] as const;
export const DEFAULT_PER_PAGE = 20;

export type TaskSort = 'due_asc' | 'due_desc' | 'priority' | 'title' | 'created' | 'updated';

export type TaskFilters = {
	q?: string;
	status?: TaskStatus | '';
	priority?: TaskPriority | '';
	assignee?: string;
	due?: '' | 'overdue' | 'today' | 'week';
	sort?: TaskSort;
	page?: number;
	perPage?: number;
};

const SORT_ORDER: Record<TaskSort, SQL[]> = {
	due_asc: [sql`${tasks.dueDate} is null`, asc(tasks.dueDate)],
	due_desc: [sql`${tasks.dueDate} is null`, desc(tasks.dueDate)],
	priority: [
		sql`case ${tasks.priority} when 'URGENT' then 0 when 'HIGH' then 1 when 'MEDIUM' then 2 else 3 end`
	],
	title: [asc(tasks.title)],
	created: [desc(tasks.createdAt)],
	updated: [desc(tasks.updatedAt)]
};

export function taskScope(user: Pick<SessionUser, 'id' | 'role'>): SQL | undefined {
	if (user.role === 'OWNER') return undefined;
	return or(eq(tasks.createdBy, user.id), eq(tasks.assigneeId, user.id));
}

export const notDeleted = () => isNull(tasks.deletedAt);

export function scopedWhere(user: Pick<SessionUser, 'id' | 'role'>): SQL {
	const scope = taskScope(user);
	return scope ? and(notDeleted(), scope)! : notDeleted();
}

function escapeLike(value: string): string {
	return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function buildFilters(user: Pick<SessionUser, 'id' | 'role'>, filters: TaskFilters): SQL {
	const today = todayWib();
	const conditions: (SQL | undefined)[] = [scopedWhere(user)];

	if (filters.q) {
		const pattern = `%${escapeLike(filters.q)}%`;
		conditions.push(
			or(like(tasks.title, pattern), like(tasks.description, pattern)) as SQL
		);
	}
	if (filters.status) conditions.push(eq(tasks.status, filters.status));
	if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));

	if (filters.assignee === 'none') {
		conditions.push(isNull(tasks.assigneeId));
	} else if (filters.assignee) {
		conditions.push(eq(tasks.assigneeId, filters.assignee));
	}

	if (filters.due === 'overdue') {
		conditions.push(sql`${tasks.status} <> 'DONE'`);
		conditions.push(sql`${tasks.dueDate} is not null and ${tasks.dueDate} < ${today}`);
	}
	if (filters.due === 'today') {
		conditions.push(eq(tasks.dueDate, today));
	}
	if (filters.due === 'week') {
		conditions.push(sql`${tasks.dueDate} between ${today} and ${shiftDate(today, 7)}`);
	}

	return and(...conditions.filter(Boolean))!;
}

export type TaskListItem = {
	id: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string | null;
	assigneeId: string | null;
	assigneeName: string | null;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
};

export async function listTasks(
	user: Pick<SessionUser, 'id' | 'role'>,
	filters: TaskFilters = {}
): Promise<{
	items: TaskListItem[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}> {
	const perPage = PER_PAGE_OPTIONS.includes((filters.perPage ?? DEFAULT_PER_PAGE) as never)
		? (filters.perPage ?? DEFAULT_PER_PAGE)
		: DEFAULT_PER_PAGE;
	const where = buildFilters(user, filters);

	const [{ total }] = await db.select({ total: count() }).from(tasks).where(where);

	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

	const rows = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			status: tasks.status,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			assigneeId: tasks.assigneeId,
			assigneeName: users.name,
			createdBy: tasks.createdBy,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			completedAt: tasks.completedAt
		})
		.from(tasks)
		.leftJoin(users, eq(users.id, tasks.assigneeId))
		.where(where)
		.orderBy(...SORT_ORDER[filters.sort ?? 'created'])
		.limit(perPage)
		.offset((page - 1) * perPage);

	return { items: rows, total, page, perPage, totalPages };
}

export type TaskDetail = TaskListItem & {
	assigneeEmail: string | null;
	creatorName: string | null;
	deletedAt: string | null;
};

export async function getTaskForUser(
	id: string,
	user: Pick<SessionUser, 'id' | 'role'>
): Promise<TaskDetail | null> {
	const rows = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			status: tasks.status,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			assigneeId: tasks.assigneeId,
			assigneeName: users.name,
			assigneeEmail: users.email,
			createdBy: tasks.createdBy,
			creatorName: sql<string | null>`(select name from users where users.id = ${tasks.createdBy})`,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			completedAt: tasks.completedAt,
			deletedAt: tasks.deletedAt
		})
		.from(tasks)
		.leftJoin(users, eq(users.id, tasks.assigneeId))
		.where(and(eq(tasks.id, id), notDeleted()))
		.limit(1);

	const row = rows[0];
	if (!row) return null;
	if (!canView(user, row)) return null;
	return row;
}

export function canView(
	user: Pick<SessionUser, 'id' | 'role'>,
	task: { createdBy: string; assigneeId: string | null }
): boolean {
	if (user.role === 'OWNER') return true;
	return task.createdBy === user.id || task.assigneeId === user.id;
}

export function canEdit(
	user: Pick<SessionUser, 'id' | 'role'>,
	task: { createdBy: string; assigneeId: string | null }
): boolean {
	if (user.role === 'OWNER') return true;
	return task.createdBy === user.id || task.assigneeId === user.id;
}

export function canDelete(
	user: Pick<SessionUser, 'id' | 'role'>,
	task: { createdBy: string }
): boolean {
	if (user.role === 'OWNER') return true;
	return task.createdBy === user.id;
}

export async function assigneeExists(id: string): Promise<boolean> {
	const rows = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.id, id), eq(users.isActive, true)))
		.limit(1);
	return rows.length > 0;
}

export async function activeAssignees(): Promise<{ id: string; name: string }[]> {
	return db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(eq(users.isActive, true))
		.orderBy(asc(users.name));
}

/** Semua baris yang cocok filter, tanpa pagination. Dipakai export CSV (batas 5.000). */
export async function listTasksForExport(
	user: Pick<SessionUser, 'id' | 'role'>,
	filters: TaskFilters = {}
): Promise<TaskListItem[]> {
	const where = buildFilters(user, filters);
	return db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			status: tasks.status,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			assigneeId: tasks.assigneeId,
			assigneeName: users.name,
			createdBy: tasks.createdBy,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			completedAt: tasks.completedAt
		})
		.from(tasks)
		.leftJoin(users, eq(users.id, tasks.assigneeId))
		.where(where)
		.orderBy(...SORT_ORDER[filters.sort ?? 'created'])
		.limit(5000);
}

export type MutationResult = { ok: true; id: string } | { ok: false; message: string };

export async function createTaskForUser(
	input: {
		title: string;
		description: string | null;
		status: TaskStatus;
		priority: TaskPriority;
		dueDate: string | null;
		assigneeId: string | null;
	},
	user: Pick<SessionUser, 'id' | 'role'>
): Promise<MutationResult> {
	let assigneeId = input.assigneeId;

	if (user.role !== 'OWNER') {
		if (assigneeId && assigneeId !== user.id) {
			return { ok: false, message: 'Hanya Owner yang boleh menugaskan ke user lain.' };
		}
		assigneeId = user.id;
	} else if (assigneeId && !(await assigneeExists(assigneeId))) {
		return { ok: false, message: 'User tidak ditemukan atau nonaktif.' };
	}

	const now = new Date().toISOString();
	const id = `tsk_${crypto.randomUUID()}`;

	await db.insert(tasks).values({
		id,
		title: input.title,
		description: input.description,
		status: input.status,
		priority: input.priority,
		dueDate: input.dueDate,
		assigneeId,
		createdBy: user.id,
		completedAt: input.status === 'DONE' ? now : null,
		createdAt: now,
		updatedAt: now
	});

	return { ok: true, id };
}

export async function updateTaskForUser(
	id: string,
	input: {
		title: string;
		description: string | null;
		status: TaskStatus;
		priority: TaskPriority;
		dueDate: string | null;
		assigneeId: string | null;
	},
	user: Pick<SessionUser, 'id' | 'role'>
): Promise<MutationResult> {
	const rows = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, id), notDeleted()))
		.limit(1);
	const existing = rows[0];

	if (!existing) return { ok: false, message: 'Task tidak ditemukan.' };
	if (!canEdit(user, existing)) {
		return { ok: false, message: 'Kamu tidak punya akses mengubah task ini.' };
	}

	if (!canTransition(existing.status, input.status)) {
		return {
			ok: false,
			message: `Status tidak bisa diubah dari ${existing.status} ke ${input.status}.`
		};
	}

	let assigneeId = input.assigneeId;
	if (user.role !== 'OWNER') {
		if (assigneeId && assigneeId !== existing.assigneeId && assigneeId !== user.id) {
			return { ok: false, message: 'Hanya Owner yang boleh menugaskan ke user lain.' };
		}
		assigneeId = existing.assigneeId === user.id ? user.id : existing.assigneeId;
	} else if (assigneeId && !(await assigneeExists(assigneeId))) {
		return { ok: false, message: 'User tidak ditemukan atau nonaktif.' };
	}

	const now = new Date().toISOString();
	let completedAt = existing.completedAt;
	if (input.status === 'DONE' && existing.status !== 'DONE') completedAt = now;
	if (input.status !== 'DONE') completedAt = null;

	await db
		.update(tasks)
		.set({
			title: input.title,
			description: input.description,
			status: input.status,
			priority: input.priority,
			dueDate: input.dueDate,
			assigneeId,
			completedAt,
			updatedAt: now
		})
		.where(eq(tasks.id, id));

	return { ok: true, id };
}

export async function setTaskStatus(
	id: string,
	status: TaskStatus,
	user: Pick<SessionUser, 'id' | 'role'>
): Promise<MutationResult> {
	const existing = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, id), notDeleted()))
		.limit(1);
	const task = existing[0];

	if (!task) return { ok: false, message: 'Task tidak ditemukan.' };
	if (!canEdit(user, task)) {
		return { ok: false, message: 'Kamu tidak punya akses mengubah task ini.' };
	}
	if (!canTransition(task.status, status)) {
		return { ok: false, message: `Status tidak bisa diubah dari ${task.status} ke ${status}.` };
	}

	const now = new Date().toISOString();
	await db
		.update(tasks)
		.set({
			status,
			completedAt: status === 'DONE' ? now : null,
			updatedAt: now
		})
		.where(eq(tasks.id, id));

	return { ok: true, id };
}

export async function softDeleteTask(
	id: string,
	user: Pick<SessionUser, 'id' | 'role'>
): Promise<MutationResult> {
	const rows = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, id), notDeleted()))
		.limit(1);
	const task = rows[0];

	if (!task) return { ok: false, message: 'Task tidak ditemukan.' };
	if (!canDelete(user, task)) {
		return { ok: false, message: 'Hanya pembuat task atau Owner yang boleh menghapus.' };
	}

	const now = new Date().toISOString();
	await db.update(tasks).set({ deletedAt: now, updatedAt: now }).where(eq(tasks.id, id));

	return { ok: true, id };
}

export async function dashboardCounts(user: Pick<SessionUser, 'id' | 'role'>) {
	const today = todayWib();
	const weekAgo = shiftDate(today, -7);
	const scope = scopedWhere(user);

	const [active] = await db
		.select({ total: count() })
		.from(tasks)
		.where(and(scope, ne(tasks.status, 'DONE')));

	const [doneThisWeek] = await db
		.select({ total: count() })
		.from(tasks)
		.where(and(scope, eq(tasks.status, 'DONE'), sql`${tasks.completedAt} >= ${weekAgo}`));

	const [overdue] = await db
		.select({ total: count() })
		.from(tasks)
		.where(and(scope, ne(tasks.status, 'DONE'), sql`${tasks.dueDate} < ${today}`));

	const [dueToday] = await db
		.select({ total: count() })
		.from(tasks)
		.where(and(scope, ne(tasks.status, 'DONE'), eq(tasks.dueDate, today)));

	return {
		active: active?.total ?? 0,
		doneThisWeek: doneThisWeek?.total ?? 0,
		dueToday: dueToday?.total ?? 0,
		overdue: overdue?.total ?? 0
	};
}

export type UpcomingTask = {
	id: string;
	title: string;
	dueDate: string | null;
	priority: TaskPriority;
	status: TaskStatus;
	assigneeName: string | null;
};

/** 5 deadline terdekat yang belum selesai. */
export async function upcomingTasks(user: Pick<SessionUser, 'id' | 'role'>): Promise<UpcomingTask[]> {
	const scope = scopedWhere(user);
	return db
		.select({
			id: tasks.id,
			title: tasks.title,
			dueDate: tasks.dueDate,
			priority: tasks.priority,
			status: tasks.status,
			assigneeName: users.name
		})
		.from(tasks)
		.leftJoin(users, eq(users.id, tasks.assigneeId))
		.where(and(scope, ne(tasks.status, 'DONE'), sql`${tasks.dueDate} is not null`))
		.orderBy(asc(tasks.dueDate))
		.limit(5);
}

/** Hitungan selesai 7 hari terakhir (hari ini mundur 6 hari). */
export async function completedTrend(user: Pick<SessionUser, 'id' | 'role'>): Promise<{ date: string; day: string; count: number }[]> {
	const today = todayWib();
	const scope = scopedWhere(user);

	const days = Array.from({ length: 7 }, (_, i) => shiftDate(today, i - 6));
	const minDate = days[0];

	const rows = await db
		.select({
			day: sql<string>`substr(${tasks.completedAt}, 1, 10)`,
			total: count()
		})
		.from(tasks)
		.where(and(scope, eq(tasks.status, 'DONE'), sql`${tasks.completedAt} >= ${minDate}`))
		.groupBy(sql`substr(${tasks.completedAt}, 1, 10)`);

	const map = new Map(rows.map((r) => [r.day, r.total]));
	const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

	return days.map((date) => {
		const d = new Date(`${date}T00:00:00.000Z`);
		return {
			date,
			day: dayNames[d.getUTCDay()],
			count: map.get(date) ?? 0
		};
	});
}
