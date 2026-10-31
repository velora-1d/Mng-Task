import { requireUser } from '#lib/server/auth/guards';
import { listTasksForExport, type TaskFilters } from '#lib/server/queries/tasks';
import { isTaskPriority, isTaskStatus, PRIORITY_LABEL, STATUS_LABEL, type TaskPriority, type TaskStatus } from '#lib/types';
import { todayWib } from '#lib/utils/date';

function escapeCsv(field: string | null | undefined): string {
	if (field === null || field === undefined) return '""';
	const str = String(field);
	// Escape formula injection
	const safeStr = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
	return `"${safeStr.replace(/"/g, '""')}"`;
}

export const GET = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const params = url.searchParams;

	const status = params.get('status') ?? '';
	const priority = params.get('priority') ?? '';
	const due = params.get('due') ?? '';

	const filters: TaskFilters = {
		q: params.get('q')?.trim() ?? '',
		status: isTaskStatus(status) ? (status as TaskStatus) : undefined,
		priority: isTaskPriority(priority) ? (priority as TaskPriority) : undefined,
		assignee: params.get('assignee') ?? undefined,
		due: ['overdue', 'today', 'week'].includes(due) ? (due as TaskFilters['due']) : undefined
	};

	const items = await listTasksForExport(user, filters);

	const headers = [
		'ID',
		'Judul',
		'Deskripsi',
		'Status',
		'Prioritas',
		'Tanggal Mulai',
		'Jam Mulai',
		'Tanggal Tenggat',
		'Jam Tenggat',
		'Penanggung Jawab',
		'Dibuat',
		'Selesai'
	];
	const rows = items.map((t) => [
		escapeCsv(t.id),
		escapeCsv(t.title),
		escapeCsv(t.description),
		escapeCsv(STATUS_LABEL[t.status] ?? t.status),
		escapeCsv(PRIORITY_LABEL[t.priority] ?? t.priority),
		escapeCsv(t.startDate ?? '-'),
		escapeCsv(t.startTime ?? '-'),
		escapeCsv(t.dueDate ?? '-'),
		escapeCsv(t.dueTime ?? '-'),
		escapeCsv(t.assigneeName ?? 'Belum ditugaskan'),
		escapeCsv(t.createdAt.slice(0, 10)),
		escapeCsv(t.completedAt ? t.completedAt.slice(0, 10) : '-')
	]);

	const csv = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

	const filename = `mng-task-export-${todayWib()}.csv`;

	return new Response('\uFEFF' + csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
