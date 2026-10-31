import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth/guards';
import {
	createReport,
	deleteReport,
	listReports,
	resolvePeriod,
	updateReportNotes
} from '#lib/server/queries/reports';
import { activeAssignees } from '#lib/server/queries/tasks';
import { recordAudit } from '#lib/server/audit';
import type { ReportType } from '#lib/types';
import { todayWib } from '#lib/utils/date';

export const load = async ({ locals, url }) => {
	const user = requireUser(locals, url);

	const [reportsList, assignees] = await Promise.all([
		listReports(user),
		user.role === 'OWNER' ? activeAssignees() : []
	]);

	return {
		reports: reportsList,
		assignees,
		isOwner: user.role === 'OWNER',
		today: todayWib()
	};
};

export const actions = {
	generate: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();

		const type = String(data.get('type') ?? 'WEEKLY') as ReportType;
		const targetUserId = String(data.get('targetUserId') ?? '') || null;
		const notes = String(data.get('notes') ?? '');
		const referenceDate = String(data.get('referenceDate') ?? '') || todayWib();

		const { start, end } = resolvePeriod(type, referenceDate);

		const reportId = await createReport(user, {
			type,
			periodStart: start,
			periodEnd: end,
			notes,
			targetUserId
		});

		await recordAudit({
			actorId: user.id,
			action: 'report.generate',
			entityType: 'report',
			entityId: reportId,
			after: { type, periodStart: start, periodEnd: end },
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/reports?generated=1');
	},

	updateNotes: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const notes = String(data.get('notes') ?? '');

		await updateReportNotes(id, user, notes);

		await recordAudit({
			actorId: user.id,
			action: 'report.update_notes',
			entityType: 'report',
			entityId: id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/reports');
	},

	delete: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');

		await deleteReport(id, user);

		await recordAudit({
			actorId: user.id,
			action: 'report.delete',
			entityType: 'report',
			entityId: id,
			ip: getClientAddress(),
			userAgent: request.headers.get('user-agent')
		});

		redirect(303, '/reports?deleted=1');
	}
};
