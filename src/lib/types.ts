/** Tipe & konstanta yang dipakai server maupun client. */

export const USER_ROLES = ['OWNER', 'USER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const REMINDER_STATUSES = ['PENDING', 'DONE'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export const REPORT_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
	TODO: 'Belum',
	IN_PROGRESS: 'Dikerjakan',
	BLOCKED: 'Terhambat',
	DONE: 'Selesai'
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
	LOW: 'Rendah',
	MEDIUM: 'Sedang',
	HIGH: 'Tinggi',
	URGENT: 'Urgent'
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
	DAILY: 'Harian',
	WEEKLY: 'Mingguan',
	MONTHLY: 'Bulanan'
};

export type ChipTone =
	| 'todo'
	| 'progress'
	| 'blocked'
	| 'done'
	| 'low'
	| 'medium'
	| 'high'
	| 'urgent'
	| 'neutral'
	| 'success'
	| 'warning'
	| 'danger';

export function isTaskStatus(value: string): value is TaskStatus {
	return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
	return (TASK_PRIORITIES as readonly string[]).includes(value);
}

export function statusTone(status: TaskStatus): ChipTone {
	return {
		TODO: 'todo',
		IN_PROGRESS: 'progress',
		BLOCKED: 'blocked',
		DONE: 'done'
	}[status] as ChipTone;
}

export function priorityTone(priority: TaskPriority): ChipTone {
	return {
		LOW: 'low',
		MEDIUM: 'medium',
		HIGH: 'high',
		URGENT: 'urgent'
	}[priority] as ChipTone;
}

const ACTIVITY_LABEL: Record<string, string> = {
	'task.create': 'membuat task',
	'task.update': 'memperbarui task',
	'task.status': 'mengubah status',
	'task.delete': 'menghapus task',
	'reminder.create': 'membuat pengingat',
	'reminder.update': 'memperbarui pengingat',
	'reminder.delete': 'menghapus pengingat',
	'user.create': 'menambah pengguna',
	'user.update': 'memperbarui pengguna',
	'user.reset_password': 'mereset kata sandi',
	'user.deactivate': 'menonaktifkan pengguna',
	'settings.update': 'mengubah pengaturan'
};

export function activityLabel(action: string): string {
	return ACTIVITY_LABEL[action] ?? action;
}
