import { randomUUID } from 'node:crypto';
import { db } from './db/client';
import { auditLogs } from './db/schema';

export type AuditInput = {
	actorId?: string | null;
	action: string;
	entityType: string;
	entityId?: string | null;
	before?: unknown;
	after?: unknown;
	ip?: string | null;
	userAgent?: string | null;
};

/**
 * Catat aksi penting. Kegagalan audit tidak boleh menggagalkan aksi utama,
 * tapi tetap dilaporkan ke log server.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
	try {
		await db.insert(auditLogs).values({
			id: `aud_${randomUUID()}`,
			actorId: input.actorId ?? null,
			action: input.action,
			entityType: input.entityType,
			entityId: input.entityId ?? null,
			beforeJson: input.before === undefined ? null : JSON.stringify(input.before),
			afterJson: input.after === undefined ? null : JSON.stringify(input.after),
			ip: input.ip ?? null,
			userAgent: input.userAgent ?? null,
			createdAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('[audit] gagal mencatat', input.action, error);
	}
}
