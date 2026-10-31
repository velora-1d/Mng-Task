<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
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
		<p class="overline">Rekapitulasi & Kinerja</p>
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
						<th>Tipe</th>
						<th>Periode</th>
						<th>Dibuat Oleh</th>
						<th>Ringkasan Progres</th>
						<th>Waktu Generate</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.reports as r (r.id)}
						{@const stats = parseStats(r.statsJson)}
						<tr>
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
									<Button variant="ghost" size="sm" onclick={() => openDetail(r)}>
										Lihat snapshot
									</Button>
									<form method="POST" action="?/delete" use:enhance class="inline-block">
										<input type="hidden" name="id" value={r.id} />
										<button
											type="submit"
											class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-danger"
											title="Hapus laporan"
										>
											<Icon name="trash" size={15} />
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

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
