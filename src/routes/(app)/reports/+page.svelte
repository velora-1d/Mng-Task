<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import Textarea from '#lib/components/ui/Textarea.svelte';
	import { REPORT_TYPE_LABEL, type ReportType } from '#lib/types';
	import { formatDateTime, todayWib } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let generateOpen = $state(false);
	let viewOpen = $state(false);
	let selectedReport = $state<any>(null);
	let editNotes = $state('');

	let selectedReportIds = $state<string[]>([]);
	let bulkBusy = $state(false);

	let reportToDelete = $state<any>(null);
	let singleDeleteDialogOpen = $state(false);
	let bulkDeleteDialogOpen = $state(false);
	let singleDeleting = $state(false);
	let editNotesModalOpen = $state(false);

	$effect(() => {
		data.reports;
		selectedReportIds = [];
	});

	const allReportsSelected = $derived(
		data.reports.length > 0 && selectedReportIds.length === data.reports.length
	);
	const someReportsSelected = $derived(
		selectedReportIds.length > 0 && selectedReportIds.length < data.reports.length
	);

	function toggleAllReports() {
		if (allReportsSelected) {
			selectedReportIds = [];
		} else {
			selectedReportIds = data.reports.map((r) => r.id);
		}
	}

	function toggleOneReport(id: string) {
		if (selectedReportIds.includes(id)) {
			selectedReportIds = selectedReportIds.filter((item) => item !== id);
		} else {
			selectedReportIds = [...selectedReportIds, id];
		}
	}

	// Form values
	let type = $state<ReportType>('WEEKLY');
	let referenceDate = $state(todayWib());
	let targetUserId = $state('');
	let notes = $state('');

	const typeOptions = [
		{ value: 'DAILY', label: 'Harian' },
		{ value: 'WEEKLY', label: 'Mingguan' },
		{ value: 'MONTHLY', label: 'Bulanan' }
	];

	const targetUserOptions = $derived([
		{ value: '', label: 'Semua Pengguna' },
		...data.assignees.map((a) => ({ value: a.id, label: a.name }))
	]);

	function openDetail(r: any) {
		selectedReport = r;
		editNotes = r.notes ?? '';
		viewOpen = true;
	}

	function parseStats(jsonStr: string) {
		try {
			return JSON.parse(jsonStr);
		} catch {
			return null;
		}
	}
</script>

<svelte:head>
	<title>Laporan — Mng-Task</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Laporan</h1>
		<p class="page-sub">Generate snapshot laporan progres tim dan unduh riwayatnya.</p>
	</div>
	<div class="flex gap-2">
		<Button variant="primary" onclick={() => (generateOpen = true)}>
			<Icon name="plus" size={16} />
			Generate laporan
		</Button>
	</div>
</div>

<div class="surface-card overflow-hidden">
	{#if data.reports.length === 0}
		<EmptyState
			icon="report"
			title="Belum ada laporan dibuat"
			description="Buat snapshot laporan harian, mingguan, atau bulanan pertamamu."
		>
			{#snippet action()}
				<Button variant="secondary" size="sm" onclick={() => (generateOpen = true)}>
					Generate sekarang
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="overflow-x-auto">
			<table class="data-table">
				<thead>
					<tr>
						<th class="w-10 text-center">
							<input
								type="checkbox"
								checked={allReportsSelected}
								indeterminate={someReportsSelected}
								onchange={toggleAllReports}
								class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
								aria-label="Pilih semua laporan"
							/>
						</th>
						<th class="w-12 text-center">No</th>
						<th>Tipe</th>
						<th>Periode</th>
						<th>Dibuat Oleh</th>
						<th>Ringkasan Progres</th>
						<th>Waktu Generate</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.reports as r, index (r.id)}
						{@const stats = parseStats(r.statsJson)}
						<tr class={selectedReportIds.includes(r.id) ? 'bg-primary-soft/40' : ''}>
							<td class="text-center">
								<input
									type="checkbox"
									checked={selectedReportIds.includes(r.id)}
									onchange={() => toggleOneReport(r.id)}
									class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
									aria-label={`Pilih laporan ${r.periodStart}`}
								/>
							</td>
							<td class="text-center font-mono text-xs text-ink-muted">
								{index + 1}
							</td>
							<td>
								<Chip tone="progress">{REPORT_TYPE_LABEL[r.type as ReportType] ?? r.type}</Chip>
							</td>
							<td class="font-semibold text-ink">
								{r.periodStart} s/d {r.periodEnd}
							</td>
							<td class="text-xs text-ink-muted">
								{r.userName ?? 'Sistem'}
							</td>
							<td>
								{#if stats}
									<div class="flex items-center gap-2 text-xs">
										<span class="text-ink font-semibold">{stats.total} total</span>
										<span class="text-success font-medium">· {stats.done} selesai</span>
										<span class="text-danger font-medium">· {stats.overdue} overdue</span>
									</div>
								{:else}
									<span class="text-xs text-ink-muted">—</span>
								{/if}
							</td>
							<td class="text-xs text-ink-muted">
								{formatDateTime(r.generatedAt)}
							</td>
							<td class="text-right">
								<div class="flex items-center justify-end gap-1">
									<button
										type="button"
										class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-primary"
										title="Lihat snapshot laporan"
										onclick={() => openDetail(r)}
									>
										<Icon name="eye" size={15} />
									</button>
									<button
										type="button"
										class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-ink"
										title="Ubah catatan laporan"
										onclick={() => {
											selectedReport = r;
											editNotes = r.notes ?? '';
											editNotesModalOpen = true;
										}}
									>
										<Icon name="edit" size={15} />
									</button>
									<button
										type="button"
										class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-danger"
										title="Hapus laporan"
										onclick={() => {
											reportToDelete = r;
											singleDeleteDialogOpen = true;
										}}
									>
										<Icon name="trash" size={15} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if selectedReportIds.length > 0}
	<div
		class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-4 py-2.5 shadow-2xl backdrop-blur-md"
		role="toolbar"
		aria-label="Aksi masal laporan"
	>
		<span class="text-xs font-bold text-ink">
			{selectedReportIds.length} laporan terpilih
		</span>

		<div class="h-4 w-px bg-border-base"></div>

		<!-- Tombol trigger modal Hapus Masal -->
		<button
			type="button"
			disabled={bulkBusy}
			class="btn btn-danger btn-sm text-xs"
			onclick={() => (bulkDeleteDialogOpen = true)}
		>
			<Icon name="trash" size={13} />
			Hapus
		</button>

		<button
			type="button"
			class="btn btn-ghost btn-sm text-xs text-ink-muted hover:text-ink"
			onclick={() => (selectedReportIds = [])}
		>
			Batal
		</button>
	</div>
{/if}

<!-- Hidden Form for Bulk Delete -->
<form
	id="bulkDeleteReportForm"
	method="POST"
	action="?/bulkDelete"
	class="hidden"
	use:enhance={() => {
		bulkBusy = true;
		return async ({ result }) => {
			bulkBusy = false;
			bulkDeleteDialogOpen = false;
			selectedReportIds = [];
			await applyAction(result);
		};
	}}
>
	{#each selectedReportIds as id}
		<input type="hidden" name="ids" value={id} />
	{/each}
</form>

<!-- Hidden Form for Single Delete -->
<form
	id="singleDeleteReportForm"
	method="POST"
	action="?/delete"
	class="hidden"
	use:enhance={() => {
		singleDeleting = true;
		return async ({ result }) => {
			singleDeleting = false;
			singleDeleteDialogOpen = false;
			reportToDelete = null;
			await applyAction(result);
		};
	}}
>
	<input type="hidden" name="id" value={reportToDelete?.id} />
</form>

<!-- Modal Konfirmasi Hapus Single (Custom Estetik) -->
<ConfirmDialog
	bind:open={singleDeleteDialogOpen}
	title="Hapus laporan?"
	message={`Snapshot laporan periode ${reportToDelete?.periodStart ?? ''} s/d ${reportToDelete?.periodEnd ?? ''} akan dihapus secara permanen.`}
	confirmLabel="Ya, hapus laporan"
	cancelLabel="Batal"
	variant="danger"
	loading={singleDeleting}
	onconfirm={() => {
		const formEl = document.getElementById('singleDeleteReportForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Konfirmasi Hapus Masal (Custom Estetik) -->
<ConfirmDialog
	bind:open={bulkDeleteDialogOpen}
	title="Hapus laporan terpilih?"
	message={`Apakah kamu yakin ingin menghapus ${selectedReportIds.length} snapshot laporan yang dipilih?`}
	confirmLabel={`Ya, hapus ${selectedReportIds.length} laporan`}
	cancelLabel="Batal"
	variant="danger"
	loading={bulkBusy}
	onconfirm={() => {
		const formEl = document.getElementById('bulkDeleteReportForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Edit Catatan Laporan Terpisah (Custom Estetik) -->
<Dialog
	bind:open={editNotesModalOpen}
	title="Ubah Catatan Laporan"
	description={`Edit evaluasi/catatan untuk periode ${selectedReport?.periodStart} s/d ${selectedReport?.periodEnd}.`}
>
	{#if selectedReport}
		<form
			method="POST"
			action="?/updateNotes"
			use:enhance={() => {
				return async ({ result }) => {
					editNotesModalOpen = false;
					await applyAction(result);
				};
			}}
			class="stack"
		>
			<input type="hidden" name="id" value={selectedReport.id} />
			<Textarea
				label="Catatan Analisis Laporan"
				name="notes"
				rows={4}
				bind:value={editNotes}
				placeholder="Tuliskan evaluasi kinerja atau catatan penting..."
			/>
			<div class="mt-4 flex justify-end gap-2">
				<Button variant="secondary" onclick={() => (editNotesModalOpen = false)}>Batal</Button>
				<Button type="submit">Simpan catatan</Button>
			</div>
		</form>
	{/if}
</Dialog>

<!-- Modal Generate Laporan -->
<Dialog
	bind:open={generateOpen}
	title="Generate Laporan Baru"
	description="Snapshot performa task akan disimpan permanen."
>
	<form
		method="POST"
		action="?/generate"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect' || result.type === 'success') {
					generateOpen = false;
				}
				await applyAction(result);
			};
		}}
		class="stack"
	>
		<Select label="Tipe Periode" name="type" options={typeOptions} bind:value={type} />

		<Input
			label="Tanggal Acuan (WIB)"
			name="referenceDate"
			type="date"
			required
			bind:value={referenceDate}
			hint="Mingguan akan mencakup Senin-Minggu dari minggu tanggal ini."
		/>

		{#if data.isOwner}
			<Select
				label="Cakupan Pengguna"
				name="targetUserId"
				options={targetUserOptions}
				bind:value={targetUserId}
			/>
		{/if}

		<Textarea
			label="Catatan Awal (opsional)"
			name="notes"
			rows={3}
			bind:value={notes}
			placeholder="Catatan analisis atau kendala tim..."
		/>

		<div class="mt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (generateOpen = false)}>Batal</Button>
			<Button type="submit">Generate sekarang</Button>
		</div>
	</form>
</Dialog>

<!-- Modal Detail Snapshot Laporan -->
<Dialog
	bind:open={viewOpen}
	title={`Detail Snapshot Laporan (${selectedReport?.periodStart} s/d ${selectedReport?.periodEnd})`}
	description="Data di bawah bersifat statis dan merekam kondisi saat laporan dibuat."
	size="lg"
>
	{#if selectedReport}
		{@const stats = parseStats(selectedReport.statsJson)}
		<div class="stack">
			{#if stats}
				<div class="grid grid-cols-4 gap-2">
					<div class="surface-card p-3 text-center">
						<p class="text-xs text-ink-muted">Total Task</p>
						<p class="mt-1 font-bold text-lg text-ink">{stats.total}</p>
					</div>
					<div class="surface-card p-3 text-center border-l-2 border-l-success">
						<p class="text-xs text-ink-muted">Selesai</p>
						<p class="mt-1 font-bold text-lg text-success">{stats.done}</p>
					</div>
					<div class="surface-card p-3 text-center border-l-2 border-l-primary">
						<p class="text-xs text-ink-muted">Aktif</p>
						<p class="mt-1 font-bold text-lg text-primary">{stats.active}</p>
					</div>
					<div class="surface-card p-3 text-center border-l-2 border-l-danger">
						<p class="text-xs text-ink-muted">Overdue</p>
						<p class="mt-1 font-bold text-lg text-danger">{stats.overdue}</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="surface-card p-3">
						<p class="text-xs font-semibold text-ink-muted mb-2">Berdasarkan Status</p>
						<div class="flex flex-col gap-1 text-xs">
							{#each Object.entries(stats.byStatus ?? {}) as [st, count]}
								<div class="flex justify-between">
									<span class="text-ink-secondary">{st}</span>
									<span class="font-bold text-ink">{count}</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="surface-card p-3">
						<p class="text-xs font-semibold text-ink-muted mb-2">Berdasarkan Prioritas</p>
						<div class="flex flex-col gap-1 text-xs">
							{#each Object.entries(stats.byPriority ?? {}) as [pr, count]}
								<div class="flex justify-between">
									<span class="text-ink-secondary">{pr}</span>
									<span class="font-bold text-ink">{count}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Edit Catatan -->
			<form
				method="POST"
				action="?/updateNotes"
				use:enhance={() => {
					return async ({ result }) => {
						viewOpen = false;
						await applyAction(result);
					};
				}}
				class="stack pt-2"
			>
				<input type="hidden" name="id" value={selectedReport.id} />
				<Textarea
					label="Catatan Analisis Laporan"
					name="notes"
					rows={3}
					bind:value={editNotes}
					placeholder="Tuliskan evaluasi kinerja atau catatan penting di sini..."
				/>
				<div class="flex justify-end gap-2">
					<Button variant="secondary" onclick={() => (viewOpen = false)}>Tutup</Button>
					<Button type="submit">Simpan catatan</Button>
				</div>
			</form>
		</div>
	{/if}
</Dialog>
