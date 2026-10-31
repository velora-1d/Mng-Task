import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { reports, tasks, users } from '../db/schema';
import type { SessionUser } from '../auth/session';
import type { ReportType } from '#lib/types';
import { endOfMonth, shiftDate, startOfMonth, startOfWeek, todayWib } from '#lib/utils/date';

export type ReportStats = {
	total: number;
	done: number;
	active: number;
	overdue: number;
	byStatus: Record<string, number>;
	byPriority: Record<string, number>;
};

export function resolvePeriod(type: ReportType, referenceDate: string = todayWib()) {
	if (type === 'DAILY') {
		return { start: referenceDate, end: referenceDate };
	}
	if (type === 'WEEKLY') {
		const start = startOfWeek(referenceDate);
		const end = shiftDate(start, 6);
		return { start, end };
	}
	if (type === 'MONTHLY') {
		const start = startOfMonth(referenceDate);
		const end = endOfMonth(referenceDate);
		return { start, end };
	}
	return { start: referenceDate, end: referenceDate };
}

export async function computeStats(
	periodStart: string,
	periodEnd: string,
	targetUserId?: string | null
): Promise<ReportStats> {
	const today = todayWib();
	const conditions = [
		sql`${tasks.deletedAt} is null`,
		sql`${tasks.createdAt} <= ${periodEnd}T23:59:59.999Z`
	];

	if (targetUserId) {
		conditions.push(sql`(${tasks.createdBy} = ${targetUserId} or ${tasks.assigneeId} = ${targetUserId})`);
	}

	const where = and(...conditions);
	const rows = await db
		.select({
			id: tasks.id,
			status: tasks.status,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			completedAt: tasks.completedAt
		})
		.from(tasks)
		.where(where);

	let done = 0;
	let active = 0;
	let overdue = 0;

	const byStatus: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 };
	const byPriority: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };

	for (const t of rows) {
		byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
		byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;

		if (t.status === 'DONE') {
			done++;
		} else {
			active++;
			if (t.dueDate && t.dueDate < today) {
				overdue++;
			}
		}
	}

	return {
		total: rows.length,
		done,
		active,
		overdue,
		byStatus,
		byPriority
	};
}

export async function listReports(user: Pick<SessionUser, 'id' | 'role'>) {
	const where = user.role === 'OWNER' ? undefined : eq(reports.userId, user.id);

	return db
		.select({
			id: reports.id,
			userId: reports.userId,
			userName: users.name,
			type: reports.type,
			periodStart: reports.periodStart,
			periodEnd: reports.periodEnd,
			notes: reports.notes,
			statsJson: reports.statsJson,
			generatedAt: reports.generatedAt
		})
		.from(reports)
		.leftJoin(users, eq(users.id, reports.userId))
		.where(where)
		.orderBy(desc(reports.generatedAt))
		.limit(100);
}

export async function createReport(
	user: Pick<SessionUser, 'id' | 'role'>,
	data: {
		type: ReportType;
		periodStart: string;
		periodEnd: string;
		notes?: string | null;
		targetUserId?: string | null;
	}
) {
	// User hanya boleh generate datanya sendiri
	const effectiveTargetUser = user.role === 'OWNER' ? data.targetUserId : user.id;
	const stats = await computeStats(data.periodStart, data.periodEnd, effectiveTargetUser);

	const now = new Date().toISOString();
	const id = `rep_${crypto.randomUUID()}`;

	await db.insert(reports).values({
		id,
		userId: user.id,
		type: data.type,
		periodStart: data.periodStart,
		periodEnd: data.periodEnd,
		notes: data.notes || null,
		statsJson: JSON.stringify(stats),
		generatedAt: now,
		createdAt: now
	});

	return id;
}

export async function updateReportNotes(id: string, user: Pick<SessionUser, 'id' | 'role'>, notes: string) {
	const where =
		user.role === 'OWNER' ? eq(reports.id, id) : and(eq(reports.id, id), eq(reports.userId, user.id));

	await db.update(reports).set({ notes }).where(where);
}

export async function deleteReport(id: string, user: Pick<SessionUser, 'id' | 'role'>) {
	const where =
		user.role === 'OWNER' ? eq(reports.id, id) : and(eq(reports.id, id), eq(reports.userId, user.id));

	await db.delete(reports).where(where);
}

export async function bulkDeleteReports(ids: string[], user: Pick<SessionUser, 'id' | 'role'>) {
	if (ids.length === 0) return 0;
	const where =
		user.role === 'OWNER'
			? inArray(reports.id, ids)
			: and(inArray(reports.id, ids), eq(reports.userId, user.id));

	await db.delete(reports).where(where);
	return ids.length;
}
