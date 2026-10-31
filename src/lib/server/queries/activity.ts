import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { auditLogs, users } from '../db/schema';

export type ActivityItem = {
	id: string;
	action: string;
	actorName: string | null;
	createdAt: string;
	beforeJson: string | null;
	afterJson: string | null;
};

export async function entityActivity(
	entityType: string,
	entityId: string,
	limit = 12
): Promise<ActivityItem[]> {
	return db
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			actorName: users.name,
			createdAt: auditLogs.createdAt,
			beforeJson: auditLogs.beforeJson,
			afterJson: auditLogs.afterJson
		})
		.from(auditLogs)
		.leftJoin(users, eq(users.id, auditLogs.actorId))
		.where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);
}

export async function recentActivity(limit = 5): Promise<ActivityItem[]> {
	return db
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			actorName: users.name,
			createdAt: auditLogs.createdAt,
			beforeJson: auditLogs.beforeJson,
			afterJson: auditLogs.afterJson
		})
		.from(auditLogs)
		.leftJoin(users, eq(users.id, auditLogs.actorId))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);
}
