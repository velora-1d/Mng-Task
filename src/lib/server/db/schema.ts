/**
 * Skema database Mng-Task (SQLite).
 * Sumber kebenaran: file ini. `PRD/10-technical-stack/schema.sql` adalah turunannya.
 *
 * Konvensi:
 * - Waktu disimpan TEXT ISO-8601 UTC (contoh 2026-10-31T06:00:00.000Z).
 * - Tanggal tanpa jam disimpan TEXT 'YYYY-MM-DD' (zona WIB).
 * - Email selalu disimpan lowercase; keunikan dijaga unique index.
 */
import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { ReminderStatus, ReportType, TaskPriority, TaskStatus, UserRole } from '#lib/types';

export * from '#lib/types';

const timestamps = {
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
};

export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		role: text('role').$type<UserRole>().notNull().default('USER'),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		mustChangePassword: integer('must_change_password', { mode: 'boolean' })
			.notNull()
			.default(false),
		lastSeenAt: text('last_seen_at'),
		...timestamps
	},
	(t) => [
		uniqueIndex('idx_users_email').on(t.email),
		index('idx_users_role_active').on(t.role, t.isActive),
		check('users_role_check', sql`${t.role} in ('OWNER', 'USER')`),
		check('users_is_active_check', sql`${t.isActive} in (0, 1)`)
	]
);

/** Token asli hanya ada di cookie; yang disimpan hash SHA-256. */
export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: text('expires_at').notNull(),
		ip: text('ip'),
		userAgent: text('user_agent'),
		createdAt: text('created_at').notNull()
	},
	(t) => [
		uniqueIndex('idx_sessions_token_hash').on(t.tokenHash),
		index('idx_sessions_user').on(t.userId),
		index('idx_sessions_expires').on(t.expiresAt)
	]
);

export const tasks = sqliteTable(
	'tasks',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description'),
		status: text('status').$type<TaskStatus>().notNull().default('TODO'),
		priority: text('priority').$type<TaskPriority>().notNull().default('MEDIUM'),
		/** Tanggal tenggat 'YYYY-MM-DD' (WIB). */
		dueDate: text('due_date'),
		assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
		createdBy: text('created_by')
			.notNull()
			.references(() => users.id),
		completedAt: text('completed_at'),
		...timestamps,
		deletedAt: text('deleted_at')
	},
	(t) => [
		index('idx_tasks_assignee_status').on(t.assigneeId, t.status),
		index('idx_tasks_created_by').on(t.createdBy),
		index('idx_tasks_due_date').on(t.dueDate),
		index('idx_tasks_status_due').on(t.status, t.dueDate),
		index('idx_tasks_deleted').on(t.deletedAt),
		check(
			'tasks_status_check',
			sql`${t.status} in ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')`
		),
		check(
			'tasks_priority_check',
			sql`${t.priority} in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')`
		)
	]
);

/** Reminder manual. Reminder otomatis dihitung dari tasks, tidak disimpan di sini. */
export const reminders = sqliteTable(
	'reminders',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		note: text('note'),
		/** ISO-8601 UTC. */
		remindAt: text('remind_at').notNull(),
		status: text('status').$type<ReminderStatus>().notNull().default('PENDING'),
		...timestamps
	},
	(t) => [
		index('idx_reminders_user_status').on(t.userId, t.status),
		index('idx_reminders_remind_at').on(t.remindAt),
		index('idx_reminders_task').on(t.taskId),
		check('reminders_status_check', sql`${t.status} in ('PENDING', 'DONE')`)
	]
);

/** Snapshot laporan; tidak boleh berubah saat task diubah. */
export const reports = sqliteTable(
	'reports',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').$type<ReportType>().notNull(),
		periodStart: text('period_start').notNull(),
		periodEnd: text('period_end').notNull(),
		notes: text('notes'),
		statsJson: text('stats_json').notNull(),
		generatedAt: text('generated_at').notNull(),
		createdAt: text('created_at').notNull()
	},
	(t) => [
		index('idx_reports_user_period').on(t.userId, t.periodStart),
		index('idx_reports_type').on(t.type),
		check('reports_type_check', sql`${t.type} in ('DAILY', 'WEEKLY', 'MONTHLY')`)
	]
);

export const auditLogs = sqliteTable(
	'audit_logs',
	{
		id: text('id').primaryKey(),
		actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
		action: text('action').notNull(),
		entityType: text('entity_type').notNull(),
		entityId: text('entity_id'),
		beforeJson: text('before_json'),
		afterJson: text('after_json'),
		ip: text('ip'),
		userAgent: text('user_agent'),
		createdAt: text('created_at').notNull()
	},
	(t) => [
		index('idx_audit_entity').on(t.entityType, t.entityId),
		index('idx_audit_actor').on(t.actorId),
		index('idx_audit_created').on(t.createdAt)
	]
);

export const loginAttempts = sqliteTable(
	'login_attempts',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull(),
		ip: text('ip'),
		success: integer('success', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at').notNull()
	},
	(t) => [
		index('idx_login_attempts_email_time').on(t.email, t.createdAt),
		index('idx_login_attempts_ip_time').on(t.ip, t.createdAt)
	]
);

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	valueJson: text('value_json').notNull(),
	updatedAt: text('updated_at').notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
