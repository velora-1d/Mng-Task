<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Button from '#lib/components/ui/Button.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import Textarea from '#lib/components/ui/Textarea.svelte';
	import { PRIORITY_LABEL, STATUS_LABEL, priorityTone, statusTone } from '#lib/types';
	import { formatDateTime, todayWib } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let activeTab = $state<'auto' | 'manual'>('auto');

	let createOpen = $state(false);
	let title = $state('');
	let note = $state('');
	let remindAtDate = $state(todayWib());
	let remindAtTime = $state('09:00');
	let taskId = $state('');

	// Edit & Detail & Delete states
	let selectedReminder = $state<any>(null);
	let detailOpen = $state(false);
	let editOpen = $state(false);

	let editId = $state('');
	let editTitle = $state('');
	let editNote = $state('');
	let editDate = $state(todayWib());
	let editTime = $state('09:00');
	let editTaskId = $state('');

	let reminderToDelete = $state<any>(null);
	let singleDeleteDialogOpen = $state(false);
	let bulkDeleteDialogOpen = $state(false);
	let singleDeleting = $state(false);

	// Bulk selection untuk reminder manual
	let selectedManualIds = $state<string[]>([]);
	let bulkBusy = $state(false);

	$effect(() => {
		data.manualReminders;
		selectedManualIds = [];
	});

	const allManualSelected = $derived(
		data.manualReminders.length > 0 && selectedManualIds.length === data.manualReminders.length
	);
	const someManualSelected = $derived(
		selectedManualIds.length > 0 && selectedManualIds.length < data.manualReminders.length
	);

	function toggleAllManual() {
		if (allManualSelected) {
			selectedManualIds = [];
		} else {
			selectedManualIds = data.manualReminders.map((r) => r.id);
		}
	}

	function toggleOneManual(id: string) {
		if (selectedManualIds.includes(id)) {
			selectedManualIds = selectedManualIds.filter((item) => item !== id);
		} else {
			selectedManualIds = [...selectedManualIds, id];
		}
	}

	function openEditReminder(r: any) {
		selectedReminder = r;
		editId = r.id;
		editTitle = r.title;
		editNote = r.note ?? '';

		try {
			const d = new Date(r.remindAt);
			const wibMs = d.getTime() + 7 * 3600 * 1000;
			const wibDate = new Date(wibMs);
			editDate = wibDate.toISOString().slice(0, 10);
			editTime = wibDate.toISOString().slice(11, 16);
		} catch {
			editDate = todayWib();
			editTime = '09:00';
		}

		editTaskId = r.taskId ?? '';
		editOpen = true;
	}

	const taskOptions = $derived([
		{ value: '', label: 'Tidak terhubung ke task' },
		...data.tasks.map((t) => ({ value: t.id, label: t.title }))
	]);

	function urgencyTone(urgency: string) {
		switch (urgency) {
			case 'overdue':
				return 'danger';
			case 'today':
				return 'warning';
			case 'h1':
				return 'warning';
			default:
				return 'neutral';
		}
	}
</script>

<svelte:head>
	<title>Pengingat — Mng-Task</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="overline">Notifikasi & Tenggat</p>
		<h1 class="page-title">Pengingat</h1>
		<p class="page-sub">Pantau deadline otomatis tugas dan atur catatan pengingat harianmu.</p>
	</div>
	<div class="flex gap-2">
		<Button variant="primary" onclick={() => (createOpen = true)}>
			<Icon name="plus" size={16} />
			Buat pengingat manual
		</Button>
	</div>
</div>

<!-- Tab Navigation Bar -->
<div class="mb-4 flex items-center justify-between gap-3 border-b border-border-base pb-px">
	<div class="flex items-center gap-2">
		<button
			type="button"
			class={['flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold transition-colors',
				activeTab === 'auto'
					? 'border-primary text-primary'
					: 'border-transparent text-ink-muted hover:text-ink'].join(' ')}
			onclick={() => (activeTab = 'auto')}
		>
			<Icon name="alert" size={15} />
			<span>Deadline Tugas Otomatis</span>
			<span class="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-bold text-ink">
				{data.autoReminders.length}
			</span>
		</button>

		<button
			type="button"
			class={['flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold transition-colors',
				activeTab === 'manual'
					? 'border-primary text-primary'
					: 'border-transparent text-ink-muted hover:text-ink'].join(' ')}
			onclick={() => (activeTab = 'manual')}
		>
			<Icon name="bell" size={15} />
			<span>Pengingat Manual</span>
			<span class="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-bold text-ink">
				{data.manualReminders.length}
			</span>
		</button>
	</div>
</div>

<!-- TAB 1: PENGINGAT OTOMATIS (TABEL) -->
{#if activeTab === 'auto'}
	<div class="surface-card overflow-hidden">
		{#if data.autoReminders.length === 0}
			<EmptyState
				icon="bell"
				title="Tidak ada tenggat mendesak"
				description="Semua tugas dalam jadwal aman atau sudah diselesaikan."
			/>
		{:else}
			<div class="overflow-x-auto">
				<table class="data-table">
					<thead>
						<tr>
							<th class="w-12 text-center" scope="col">No</th>
							<th scope="col">Tugas</th>
							<th scope="col">Urgensi</th>
							<th scope="col">Status</th>
							<th scope="col">Prioritas</th>
							<th scope="col">Deadline</th>
							<th scope="col" class="text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.autoReminders as auto, index (auto.id)}
							<tr>
								<td class="text-center font-mono text-xs text-ink-muted">
									{index + 1}
								</td>
								<td class="max-w-[340px]">
									<a
										href={`/tasks/${auto.taskId}`}
										class="font-semibold text-ink hover:text-primary block truncate"
									>
										{auto.title}
									</a>
								</td>
								<td>
									<Chip tone={urgencyTone(auto.urgency)}>{auto.urgencyLabel}</Chip>
								</td>
								<td>
									<Chip tone={statusTone(auto.status)}>{STATUS_LABEL[auto.status]}</Chip>
								</td>
								<td>
									<Chip tone={priorityTone(auto.priority)}>{PRIORITY_LABEL[auto.priority]}</Chip>
								</td>
								<td class="text-xs font-semibold text-ink">
									{auto.dueDate}
								</td>
								<td class="text-right">
									<div class="flex items-center justify-end gap-1">
										<a
											href={`/tasks/${auto.taskId}`}
											class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-primary"
											title="Lihat detail task"
										>
											<Icon name="eye" size={15} />
										</a>
										<a
											href={`/tasks/${auto.taskId}/edit`}
											class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
											title="Ubah task"
										>
											<Icon name="edit" size={15} />
										</a>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

<!-- TAB 2: PENGINGAT MANUAL (TABEL DENGAN CHECKBOX & BULK ACTION) -->
{#if activeTab === 'manual'}
	<div class="surface-card overflow-hidden">
		{#if data.manualReminders.length === 0}
			<EmptyState
				icon="bell"
				title="Belum ada pengingat manual"
				description="Buat pengingat custom untuk mencatat agenda atau follow-up tim."
			>
				{#snippet action()}
					<Button variant="secondary" size="sm" onclick={() => (createOpen = true)}>
						Buat sekarang
					</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<div class="overflow-x-auto">
				<table class="data-table">
					<thead>
						<tr>
							<th class="w-10 text-center" scope="col">
								<input
									type="checkbox"
									checked={allManualSelected}
									indeterminate={someManualSelected}
									onchange={toggleAllManual}
									class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
									aria-label="Pilih semua pengingat"
								/>
							</th>
							<th class="w-12 text-center" scope="col">No</th>
							<th class="w-12 text-center" scope="col">Selesai</th>
							<th scope="col">Pengingat</th>
							<th scope="col">Waktu (WIB)</th>
							<th scope="col">Tautan Task</th>
							<th scope="col" class="text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.manualReminders as item, index (item.id)}
							<tr class={selectedManualIds.includes(item.id) ? 'bg-primary-soft/40' : ''}>
								<td class="text-center">
									<input
										type="checkbox"
										checked={selectedManualIds.includes(item.id)}
										onchange={() => toggleOneManual(item.id)}
										class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
										aria-label={`Pilih ${item.title}`}
									/>
								</td>
								<td class="text-center font-mono text-xs text-ink-muted">
									{index + 1}
								</td>
								<td class="text-center">
									<form method="POST" action="?/toggle" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="status" value={item.status} />
										<button
											type="submit"
											class="mx-auto grid size-5 place-items-center rounded border transition-colors {item.status ===
											'DONE'
												? 'border-success bg-success text-white'
												: 'border-border-base bg-surface text-transparent hover:border-primary'}"
											aria-label={item.status === 'DONE' ? 'Tandai belum selesai' : 'Tandai selesai'}
										>
											<Icon name="check" size={12} />
										</button>
									</form>
								</td>
								<td class="max-w-[320px]">
									<p class="font-semibold text-ink {item.status === 'DONE' ? 'line-through text-ink-muted' : ''}">
										{item.title}
									</p>
									{#if item.note}
										<p class="mt-0.5 truncate text-xs text-ink-secondary">{item.note}</p>
									{/if}
								</td>
								<td class="text-xs text-ink-muted whitespace-nowrap">
									{formatDateTime(item.remindAt)}
								</td>
								<td class="text-xs">
									{#if item.taskId && item.taskTitle}
										<a href={`/tasks/${item.taskId}`} class="font-medium text-primary hover:underline">
											{item.taskTitle}
										</a>
									{:else}
										<span class="text-ink-muted">—</span>
									{/if}
								</td>
								<td class="text-right">
									<div class="flex items-center justify-end gap-1">
										<button
											type="button"
											class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-primary"
											title="Lihat detail pengingat"
											onclick={() => {
												selectedReminder = item;
												detailOpen = true;
											}}
										>
											<Icon name="eye" size={15} />
										</button>
										<button
											type="button"
											class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-ink"
											title="Ubah pengingat"
											onclick={() => openEditReminder(item)}
										>
											<Icon name="edit" size={15} />
										</button>
										<button
											type="button"
											class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-danger"
											title="Hapus pengingat"
											onclick={() => {
												reminderToDelete = item;
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
{/if}

<!-- Bulk Action Bar Pengingat Manual -->
{#if selectedManualIds.length > 0}
	<div
		class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-4 py-2.5 shadow-2xl backdrop-blur-md"
		role="toolbar"
		aria-label="Aksi masal pengingat"
	>
		<span class="text-xs font-bold text-ink">
			{selectedManualIds.length} pengingat terpilih
		</span>

		<div class="h-4 w-px bg-border-base"></div>

		<!-- Tandai Selesai Masal -->
		<form
			method="POST"
			action="?/bulkToggle"
			use:enhance={() => {
				bulkBusy = true;
				return async ({ result }) => {
					bulkBusy = false;
					selectedManualIds = [];
					await applyAction(result);
				};
			}}
		>
			{#each selectedManualIds as id}
				<input type="hidden" name="ids" value={id} />
			{/each}
			<input type="hidden" name="status" value="DONE" />
			<button
				type="submit"
				disabled={bulkBusy}
				class="btn btn-secondary btn-sm text-xs text-success hover:bg-success/10"
			>
				Tandai selesai
			</button>
		</form>

		<!-- Tandai Belum Selesai Masal -->
		<form
			method="POST"
			action="?/bulkToggle"
			use:enhance={() => {
				bulkBusy = true;
				return async ({ result }) => {
					bulkBusy = false;
					selectedManualIds = [];
					await applyAction(result);
				};
			}}
		>
			{#each selectedManualIds as id}
				<input type="hidden" name="ids" value={id} />
			{/each}
			<input type="hidden" name="status" value="PENDING" />
			<button
				type="submit"
				disabled={bulkBusy}
				class="btn btn-secondary btn-sm text-xs"
			>
				Tandai belum
			</button>
		</form>

		<!-- Trigger Modal Hapus Masal -->
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
			onclick={() => (selectedManualIds = [])}
		>
			Batal
		</button>
	</div>
{/if}

<!-- Hidden Form for Bulk Delete -->
<form
	id="bulkDeleteReminderForm"
	method="POST"
	action="?/bulkDelete"
	class="hidden"
	use:enhance={() => {
		bulkBusy = true;
		return async ({ result }) => {
			bulkBusy = false;
			bulkDeleteDialogOpen = false;
			selectedManualIds = [];
			await applyAction(result);
		};
	}}
>
	{#each selectedManualIds as id}
		<input type="hidden" name="ids" value={id} />
	{/each}
</form>

<!-- Hidden Form for Single Delete -->
<form
	id="singleDeleteReminderForm"
	method="POST"
	action="?/delete"
	class="hidden"
	use:enhance={() => {
		singleDeleting = true;
		return async ({ result }) => {
			singleDeleting = false;
			singleDeleteDialogOpen = false;
			reminderToDelete = null;
			await applyAction(result);
		};
	}}
>
	<input type="hidden" name="id" value={reminderToDelete?.id} />
</form>

<!-- Modal Konfirmasi Hapus Single (Custom Estetik) -->
<ConfirmDialog
	bind:open={singleDeleteDialogOpen}
	title="Hapus pengingat?"
	message={`Pengingat "${reminderToDelete?.title ?? ''}" akan dihapus permanen.`}
	confirmLabel="Ya, hapus pengingat"
	cancelLabel="Batal"
	variant="danger"
	loading={singleDeleting}
	onconfirm={() => {
		const formEl = document.getElementById('singleDeleteReminderForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Konfirmasi Hapus Masal (Custom Estetik) -->
<ConfirmDialog
	bind:open={bulkDeleteDialogOpen}
	title="Hapus pengingat terpilih?"
	message={`Apakah kamu yakin ingin menghapus ${selectedManualIds.length} pengingat yang dipilih?`}
	confirmLabel={`Ya, hapus ${selectedManualIds.length} pengingat`}
	cancelLabel="Batal"
	variant="danger"
	loading={bulkBusy}
	onconfirm={() => {
		const formEl = document.getElementById('bulkDeleteReminderForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Detail Pengingat (Custom Estetik) -->
<Dialog
	bind:open={detailOpen}
	title="Detail Pengingat"
	description="Informasi catatan dan tenggat pengingat."
>
	{#if selectedReminder}
		<div class="stack">
			<div class="flex items-center justify-between border-b border-border-base pb-3">
				<div>
					<h3 class="font-bold text-ink">{selectedReminder.title}</h3>
					<span class="text-xs text-ink-muted">Waktu: {formatDateTime(selectedReminder.remindAt)}</span>
				</div>
				<Chip tone={selectedReminder.status === 'DONE' ? 'done' : 'warning'}>
					{selectedReminder.status === 'DONE' ? 'Selesai' : 'Menunggu'}
				</Chip>
			</div>

			{#if selectedReminder.note}
				<div class="rounded-lg bg-surface-raised p-3">
					<p class="text-xs font-semibold text-ink-muted mb-1">Catatan Tambahan</p>
					<p class="text-sm text-ink whitespace-pre-wrap">{selectedReminder.note}</p>
				</div>
			{/if}

			{#if selectedReminder.taskTitle}
				<div class="surface-card p-3 text-xs">
					<span class="text-ink-muted">Tautan Task:</span>
					<a href={`/tasks/${selectedReminder.taskId}`} class="font-semibold text-primary hover:underline ml-1">
						{selectedReminder.taskTitle} →
					</a>
				</div>
			{/if}

			<div class="mt-3 flex justify-end gap-2 border-t border-border-base pt-3">
				<Button variant="secondary" size="sm" onclick={() => (detailOpen = false)}>
					Tutup
				</Button>
				<Button
					variant="primary"
					size="sm"
					onclick={() => {
						detailOpen = false;
						openEditReminder(selectedReminder);
					}}
				>
					<Icon name="edit" size={14} />
					Ubah pengingat
				</Button>
			</div>
		</div>
	{/if}
</Dialog>

<!-- Modal Edit Pengingat (Custom Estetik) -->
<Dialog
	bind:open={editOpen}
	title="Ubah Pengingat"
	description="Perbarui informasi pengingat pribadimu."
>
	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect' || result.type === 'success') {
					editOpen = false;
				}
				await applyAction(result);
			};
		}}
		class="stack"
	>
		<input type="hidden" name="id" value={editId} />

		<Input
			label="Judul pengingat"
			name="title"
			required
			bind:value={editTitle}
		/>

		<Textarea
			label="Catatan tambahan"
			name="note"
			rows={3}
			bind:value={editNote}
		/>

		<div class="grid grid-cols-2 gap-3">
			<Input
				label="Tanggal"
				name="remindAtDate"
				type="date"
				required
				bind:value={editDate}
			/>
			<Input
				label="Waktu (WIB)"
				name="remindAtTime"
				type="time"
				required
				bind:value={editTime}
			/>
		</div>

		<Select
			label="Tautkan ke Task (opsional)"
			name="taskId"
			options={taskOptions}
			bind:value={editTaskId}
		/>

		<div class="mt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (editOpen = false)}>Batal</Button>
			<Button type="submit">Simpan perubahan</Button>
		</div>
	</form>
</Dialog>

<!-- Modal Buat Reminder (Custom Estetik) -->
<Dialog
	bind:open={createOpen}
	title="Buat Pengingat Baru"
	description="Simpan pengingat custom untuk dirimu."
>
	{#if form?.error}
		<div
			class="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-[var(--error-soft)] px-3 py-2 text-xs text-danger"
			role="alert"
		>
			<Icon name="alert" size={14} class="mt-0.5 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect' || result.type === 'success') {
					createOpen = false;
					title = '';
					note = '';
				}
				await applyAction(result);
			};
		}}
		class="stack"
	>
		<Input
			label="Judul pengingat"
			name="title"
			required
			bind:value={title}
			placeholder="Contoh: Follow up email klien"
		/>

		<Textarea
			label="Catatan tambahan"
			name="note"
			rows={3}
			bind:value={note}
			placeholder="Detail atau tautan terkait..."
		/>

		<div class="grid grid-cols-2 gap-3">
			<Input
				label="Tanggal"
				name="remindAtDate"
				type="date"
				required
				bind:value={remindAtDate}
				min={todayWib()}
			/>
			<Input
				label="Waktu (WIB)"
				name="remindAtTime"
				type="time"
				required
				bind:value={remindAtTime}
			/>
		</div>

		<Select
			label="Tautkan ke Task (opsional)"
			name="taskId"
			options={taskOptions}
			bind:value={taskId}
		/>

		<div class="mt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (createOpen = false)}>Batal</Button>
			<Button type="submit">Simpan</Button>
		</div>
	</form>
</Dialog>
