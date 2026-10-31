<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { page } from '$app/state';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import QuickStatus from '#lib/components/tasks/QuickStatus.svelte';
import KanbanBoard from '#lib/components/tasks/KanbanBoard.svelte';
	import {
		PRIORITY_LABEL,
		TASK_PRIORITIES,
		TASK_STATUSES,
		STATUS_LABEL,
		priorityTone,
		statusTone
	} from '#lib/types';
	import { dueLabel, todayWib } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const today = todayWib();
	const currentPath = $derived(page.url.pathname + page.url.search);

	let selectedIds = $state<string[]>([]);
	let bulkBusy = $state(false);

	let taskToDelete = $state<any>(null);
	let singleDeleteDialogOpen = $state(false);
	let bulkDeleteDialogOpen = $state(false);
	let singleDeleting = $state(false);
	let viewMode = $state<'list' | 'kanban'>('list');

	$effect(() => {
		// Reset pilihan saat halaman atau filter berubah
		data.items;
		selectedIds = [];
	});

	const allSelected = $derived(data.items.length > 0 && selectedIds.length === data.items.length);
	const someSelected = $derived(selectedIds.length > 0 && selectedIds.length < data.items.length);

	function toggleAll() {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = data.items.map((t) => t.id);
		}
	}

	function toggleOne(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((item) => item !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function hrefForPage(target: number): string {
		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('page', String(target));
		return `?${params.toString()}`;
	}

	function resetHref(): string {
		return page.url.pathname;
	}

	function dueClass(dueDate: string | null, status: string): string {
		if (!dueDate || status === 'DONE') return 'text-ink-secondary';
		if (dueDate < today) return 'text-danger font-semibold';
		if (dueDate === today) return 'text-warning font-semibold';
		return 'text-ink-secondary';
	}

	const hasFilter = $derived(
		Boolean(
			data.filters.q ||
				data.filters.status ||
				data.filters.priority ||
				data.filters.assignee ||
				data.filters.due
		)
	);
</script>

<svelte:head>
	<title>Tugas — Mng-Task</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Tugas</h1>
		<p class="page-sub">
			{data.total} task{data.isOwner ? '' : ' milikmu'} · {data.items.length} ditampilkan
		</p>
	</div>
	<div class="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2">
		<div class="flex items-center rounded-lg border border-border-base bg-surface p-0.5" role="group" aria-label="Mode tampilan">
			<button
				type="button"
				class={['flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition', viewMode === 'list' ? 'bg-primary text-white shadow-xs' : 'text-ink-secondary hover:text-ink'].join(' ')}
				onclick={() => (viewMode = 'list')}
				aria-pressed={viewMode === 'list'}
			>
				<Icon name="list" size={14} />
				<span>List</span>
			</button>
			<button
				type="button"
				class={['flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition', viewMode === 'kanban' ? 'bg-primary text-white shadow-xs' : 'text-ink-secondary hover:text-ink'].join(' ')}
				onclick={() => (viewMode = 'kanban')}
				aria-pressed={viewMode === 'kanban'}
			>
				<Icon name="kanban" size={14} />
				<span>Board</span>
			</button>
		</div>

		<a
			href={`/tasks/export.csv${page.url.search}`}
			class="btn btn-secondary px-2.5 py-1.5 text-xs min-h-[36px]"
			title="Export CSV"
		>
			<Icon name="download" size={15} />
			<span class="hidden sm:inline">Export CSV</span>
		</a>

		<a href="/tasks/new" class="btn btn-primary px-3 py-1.5 text-xs min-h-[36px] ml-auto sm:ml-0">
			<Icon name="plus" size={15} />
			Buat task
		</a>
	</div>
</div>

<form
	method="GET"
	class="mb-4 rounded-xl border border-border-base bg-surface p-3"
	aria-label="Filter tugas"
>
	<div class="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
		<label class="col-span-2 md:col-span-1 flex h-10 items-center gap-2 rounded-lg border border-border-base bg-canvas px-3">
			<Icon name="search" size={16} class="text-ink-muted" />
			<span class="sr-only">Cari tugas</span>
			<input
				type="search"
				name="q"
				value={data.filters.q}
				placeholder="Cari judul atau deskripsi…"
				class="h-full flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
			/>
		</label>

		<select name="status" class="input" aria-label="Filter status" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
			<option value="">Semua status</option>
			{#each TASK_STATUSES as status (status)}
				<option value={status} selected={data.filters.status === status}>{STATUS_LABEL[status]}</option>
			{/each}
		</select>

		<select
			name="priority"
			class="input"
			aria-label="Filter prioritas"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			<option value="">Semua prioritas</option>
			{#each TASK_PRIORITIES as priority (priority)}
				<option value={priority} selected={data.filters.priority === priority}>
					{PRIORITY_LABEL[priority]}
				</option>
			{/each}
		</select>

		<select
			name="due"
			class="input"
			aria-label="Filter deadline"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			<option value="">Semua deadline</option>
			<option value="overdue" selected={data.filters.due === 'overdue'}>Terlambat</option>
			<option value="today" selected={data.filters.due === 'today'}>Hari ini</option>
			<option value="week" selected={data.filters.due === 'week'}>7 hari ke depan</option>
		</select>

		{#if data.isOwner}
			<select
				name="assignee"
				class="input"
				aria-label="Filter penanggung jawab"
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			>
				<option value="">Semua orang</option>
				<option value="none" selected={data.filters.assignee === 'none'}>Belum ditugaskan</option>
				{#each data.assignees as person (person.id)}
					<option value={person.id} selected={data.filters.assignee === person.id}>
						{person.name}
					</option>
				{/each}
			</select>
		{:else}
			<input type="hidden" name="assignee" value={data.filters.assignee} />
		{/if}
	</div>

	<!-- Baris Opsi Lanjutan: Urutan, Limit, dan Aksi Terapkan/Reset -->
	<div class="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
		<select
			name="sort"
			class="h-9 w-full rounded-md border border-border-base bg-canvas px-2 text-xs text-ink sm:w-auto"
			aria-label="Urutkan"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			<option value="created" selected={data.filters.sort === 'created'}>Terbaru dibuat</option>
			<option value="due_asc" selected={data.filters.sort === 'due_asc'}>Deadline terdekat</option>
			<option value="due_desc" selected={data.filters.sort === 'due_desc'}>Deadline terlama</option>
			<option value="priority" selected={data.filters.sort === 'priority'}>Prioritas tertinggi</option>
			<option value="title" selected={data.filters.sort === 'title'}>Judul A–Z</option>
			<option value="updated" selected={data.filters.sort === 'updated'}>Terakhir diubah</option>
		</select>

		<select
			name="perPage"
			class="h-9 w-full rounded-md border border-border-base bg-canvas px-2 text-xs text-ink sm:w-auto"
			aria-label="Baris per halaman"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			{#each data.perPageOptions as option (option)}
				<option value={option} selected={data.filters.perPage === option}>{option} / halaman</option>
			{/each}
		</select>

		<button type="submit" class="btn btn-secondary btn-sm h-9 w-full sm:w-auto">
			Terapkan
		</button>

		{#if hasFilter}
			<a href={resetHref()} class="btn btn-ghost btn-sm h-9 w-full text-center sm:w-auto">
				Reset filter
			</a>
		{/if}
	</div>
</form>

{#if data.items.length === 0}
	<div class="surface-card">
		<EmptyState
			icon="tasks"
			title={hasFilter ? 'Tidak ada task yang cocok' : 'Belum ada task'}
			description={hasFilter
				? 'Coba ubah atau reset filter untuk melihat task lain.'
				: 'Buat task pertama untuk mulai membagi pekerjaan tim.'}
		>
			{#snippet action()}
				{#if hasFilter}
					<a href={resetHref()} class="btn btn-secondary btn-sm">Reset filter</a>
				{:else}
					<a href="/tasks/new" class="btn btn-primary btn-sm">Buat task pertama</a>
				{/if}
			{/snippet}
		</EmptyState>
	</div>
{:else if viewMode === 'kanban'}
	<KanbanBoard
		tasks={data.items}
		{currentPath}
		ondelete={(t) => {
			taskToDelete = t;
			singleDeleteDialogOpen = true;
		}}
	/>
{:else}
	<div class="surface-card overflow-hidden">
		<!-- Desktop -->
		<div class="hidden overflow-x-auto md:block">
			<table class="data-table">
				<thead>
					<tr>
						<th class="w-10 text-center" scope="col">
							<input
								type="checkbox"
								checked={allSelected}
								indeterminate={someSelected}
								onchange={toggleAll}
								class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
								aria-label="Pilih semua tugas"
							/>
						</th>
						<th class="w-12 text-center" scope="col">No</th>
						<th scope="col">Tugas</th>
						<th scope="col">Status</th>
						<th scope="col">Prioritas</th>
						<th scope="col">Deadline</th>
						<th scope="col">Penanggung jawab</th>
						<th scope="col"><span class="sr-only">Aksi</span></th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as task, index (task.id)}
						<tr class={selectedIds.includes(task.id) ? 'bg-primary-soft/40' : ''}>
							<td class="text-center">
								<input
									type="checkbox"
									checked={selectedIds.includes(task.id)}
									onchange={() => toggleOne(task.id)}
									class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
									aria-label={`Pilih ${task.title}`}
								/>
							</td>
							<td class="text-center font-mono text-xs text-ink-muted">
								{(data.page - 1) * data.perPage + index + 1}
							</td>
							<td class="max-w-[320px]">
								<a href={`/tasks/${task.id}`} class="font-semibold text-ink hover:text-primary">
									{task.title}
								</a>
								{#if task.description}
									<p class="mt-0.5 truncate text-xs text-ink-muted">{task.description}</p>
								{/if}
							</td>
							<td><QuickStatus id={task.id} status={task.status} next={currentPath} /></td>
							<td><Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip></td>
							<td class={dueClass(task.dueDate, task.status)}>
								{#if task.dueDate}
									<div class="flex flex-col">
										<span>{dueLabel(task.dueDate, today)}</span>
										{#if task.dueTime}
											<span class="text-[11px] font-normal text-ink-muted">{task.dueTime} WIB</span>
										{/if}
									</div>
								{:else if task.startDate}
									<div class="flex flex-col text-ink-muted">
										<span class="text-xs">Mulai: {task.startDate}</span>
										{#if task.startTime}
											<span class="text-[11px]">{task.startTime} WIB</span>
										{/if}
									</div>
								{:else}
									—
								{/if}
							</td>
							<td>
								{#if task.assigneeName}
									<span class="flex items-center gap-2 text-[13px] text-ink-secondary">
										<Avatar name={task.assigneeName} size="sm" />
										{task.assigneeName}
									</span>
								{:else}
									<span class="text-xs text-ink-muted">Belum ditugaskan</span>
								{/if}
							</td>
							<td class="text-right">
								<div class="flex items-center justify-end gap-1">
									<a
										href={`/tasks/${task.id}`}
										class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-primary"
										title="Lihat detail tugas"
										aria-label={`Lihat detail ${task.title}`}
									>
										<Icon name="eye" size={15} />
									</a>
									<a
										href={`/tasks/${task.id}/edit`}
										class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
										title="Ubah tugas"
										aria-label={`Ubah ${task.title}`}
									>
										<Icon name="edit" size={15} />
									</a>
									<button
										type="button"
										class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-danger"
										title="Hapus tugas"
										aria-label={`Hapus ${task.title}`}
										onclick={() => {
											taskToDelete = task;
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

		<!-- Mobile -->
		<ul class="divide-y divide-border-base md:hidden">
			{#each data.items as task, index (task.id)}
				<li class={['p-4 flex items-start gap-3', selectedIds.includes(task.id) ? 'bg-primary-soft/40' : ''].join(' ')}>
					<input
						type="checkbox"
						checked={selectedIds.includes(task.id)}
						onchange={() => toggleOne(task.id)}
						class="mt-1 size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
						aria-label={`Pilih ${task.title}`}
					/>
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5 min-w-0">
								<span class="font-mono text-xs text-ink-muted">#{(data.page - 1) * data.perPage + index + 1}</span>
								<a href={`/tasks/${task.id}`} class="block font-semibold text-ink truncate">{task.title}</a>
							</div>
							<div class="flex items-center gap-0.5 shrink-0">
								<a
									href={`/tasks/${task.id}`}
									class="grid size-7 place-items-center rounded text-ink-muted hover:text-primary"
									title="Lihat detail"
								>
									<Icon name="eye" size={14} />
								</a>
								<a
									href={`/tasks/${task.id}/edit`}
									class="grid size-7 place-items-center rounded text-ink-muted hover:text-ink"
									title="Ubah"
								>
									<Icon name="edit" size={14} />
								</a>
								<button
									type="button"
									class="grid size-7 place-items-center rounded text-ink-muted hover:text-danger"
									title="Hapus"
									onclick={() => {
										taskToDelete = task;
										singleDeleteDialogOpen = true;
									}}
								>
									<Icon name="trash" size={14} />
								</button>
							</div>
						</div>
						{#if task.description}
							<p class="mt-0.5 line-clamp-2 text-xs text-ink-muted">{task.description}</p>
						{/if}
						<div class="mt-2 flex flex-wrap items-center gap-2">
							<QuickStatus id={task.id} status={task.status} next={currentPath} />
							<Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip>
							<span class={['text-xs', dueClass(task.dueDate, task.status)].join(' ')}>
								{#if task.dueDate}
									{dueLabel(task.dueDate, today)}{task.dueTime ? ` · ${task.dueTime}` : ''}
								{:else if task.startDate}
									Mulai {task.startDate}{task.startTime ? ` · ${task.startTime}` : ''}
								{:else}
									Tanpa deadline
								{/if}
							</span>
						</div>
						{#if task.assigneeName}
							<div class="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
								<Avatar name={task.assigneeName} size="sm" />
								{task.assigneeName}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<Pagination
			page={data.page}
			totalPages={data.totalPages}
			total={data.total}
			hrefFor={hrefForPage}
		/>
	</div>
{/if}

{#if selectedIds.length > 0}
	<div
		class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-4 py-2.5 shadow-2xl backdrop-blur-md"
		role="toolbar"
		aria-label="Aksi masal tugas"
	>
		<span class="text-xs font-bold text-ink">
			{selectedIds.length} tugas terpilih
		</span>

		<div class="h-4 w-px bg-border-base"></div>

		<!-- Form Ubah Status Masal -->
		<form
			method="POST"
			action="?/bulkStatus"
			use:enhance={() => {
				bulkBusy = true;
				return async ({ result }) => {
					bulkBusy = false;
					if (result.type === 'success' || result.type === 'redirect') {
						selectedIds = [];
					}
					await applyAction(result);
				};
			}}
			class="flex items-center gap-1.5"
		>
			{#each selectedIds as id}
				<input type="hidden" name="ids" value={id} />
			{/each}
			<select
				name="status"
				disabled={bulkBusy}
				class="input h-8 py-0 pl-2 pr-6 text-xs"
				onchange={(e) => {
					if (e.currentTarget.value) e.currentTarget.form?.requestSubmit();
				}}
			>
				<option value="" disabled selected>Ubah status…</option>
				{#each TASK_STATUSES as s}
					<option value={s}>{STATUS_LABEL[s]}</option>
				{/each}
			</select>
		</form>

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
			onclick={() => (selectedIds = [])}
		>
			Batal
		</button>
	</div>
{/if}

<!-- Hidden Form for Bulk Delete -->
<form
	id="bulkDeleteForm"
	method="POST"
	action="?/bulkDelete"
	class="hidden"
	use:enhance={() => {
		bulkBusy = true;
		return async ({ result }) => {
			bulkBusy = false;
			bulkDeleteDialogOpen = false;
			if (result.type === 'success' || result.type === 'redirect') {
				selectedIds = [];
			}
			await applyAction(result);
		};
	}}
>
	{#each selectedIds as id}
		<input type="hidden" name="ids" value={id} />
	{/each}
</form>

<!-- Hidden Form for Single Delete -->
<form
	id="singleDeleteForm"
	method="POST"
	action="?/delete"
	class="hidden"
	use:enhance={() => {
		singleDeleting = true;
		return async ({ result }) => {
			singleDeleting = false;
			singleDeleteDialogOpen = false;
			taskToDelete = null;
			await applyAction(result);
		};
	}}
>
	<input type="hidden" name="id" value={taskToDelete?.id} />
</form>

<!-- Modal Konfirmasi Hapus Single (Custom Estetik) -->
<ConfirmDialog
	bind:open={singleDeleteDialogOpen}
	title="Hapus tugas?"
	message={`Tugas "${taskToDelete?.title ?? ''}" akan disembunyikan dari daftar pekerjaan tim.`}
	confirmLabel="Ya, hapus tugas"
	cancelLabel="Batal"
	variant="danger"
	loading={singleDeleting}
	onconfirm={() => {
		const formEl = document.getElementById('singleDeleteForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Konfirmasi Hapus Masal (Custom Estetik) -->
<ConfirmDialog
	bind:open={bulkDeleteDialogOpen}
	title="Hapus tugas terpilih?"
	message={`Apakah kamu yakin ingin menghapus ${selectedIds.length} tugas yang dipilih? Tugas akan disembunyikan dari daftar.`}
	confirmLabel={`Ya, hapus ${selectedIds.length} tugas`}
	cancelLabel="Batal"
	variant="danger"
	loading={bulkBusy}
	onconfirm={() => {
		const formEl = document.getElementById('bulkDeleteForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>
