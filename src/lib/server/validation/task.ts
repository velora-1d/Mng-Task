import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '#lib/types';
import { todayWib } from '#lib/utils/date';

/** Ubah ZodError menjadi peta field -> pesan pertama. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = issue.path[0];
		if (typeof key === 'string' && !out[key]) out[key] = issue.message;
	}
	return out;
}

const optionalText = (max: number, message: string) =>
	z
		.string()
		.trim()
		.max(max, message)
		.optional()
		.transform((value) => (value ? value : null));

const dateField = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid.')
	.optional()
	.or(z.literal(''))
	.transform((value) => (value ? value : null));

const timeField = z
	.string()
	.trim()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam tidak valid (HH:mm).')
	.optional()
	.or(z.literal(''))
	.transform((value) => (value ? value : null));

export const taskInputSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(3, 'Judul harus 3–200 karakter.')
			.max(200, 'Judul harus 3–200 karakter.'),
		description: optionalText(5000, 'Deskripsi maksimal 5.000 karakter.'),
		status: z.enum(TASK_STATUSES, { message: 'Status tidak valid.' }),
		priority: z.enum(TASK_PRIORITIES, { message: 'Prioritas tidak valid.' }),
		startDate: dateField,
		startTime: timeField,
		dueDate: dateField,
		dueTime: timeField,
		assigneeId: z
			.string()
			.trim()
			.optional()
			.transform((value) => (value ? value : null))
	})
	.refine(
		(data) => {
			if (data.startDate && data.dueDate) {
				if (data.dueDate < data.startDate) return false;
				if (data.dueDate === data.startDate && data.startTime && data.dueTime) {
					return data.dueTime >= data.startTime;
				}
			}
			return true;
		},
		{
			message: 'Tenggat akhir tidak boleh mendahului waktu awal tugas.',
			path: ['dueDate']
		}
	);

export type TaskInput = z.infer<typeof taskInputSchema>;

/** Deadline tidak boleh tanggal yang sudah lewat saat membuat task baru. */
export function dueDateInPast(dueDate: string | null): boolean {
	if (!dueDate) return false;
	return dueDate < todayWib();
}

export const statusTransition: Record<string, string[]> = {
	TODO: ['IN_PROGRESS', 'DONE'],
	IN_PROGRESS: ['TODO', 'BLOCKED', 'DONE'],
	BLOCKED: ['IN_PROGRESS', 'DONE'],
	DONE: ['TODO', 'IN_PROGRESS']
};

export function canTransition(from: string, to: string): boolean {
	if (from === to) return true;
	return statusTransition[from]?.includes(to) ?? false;
}
