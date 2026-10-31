<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import QuickStatus from '#lib/components/tasks/QuickStatus.svelte';
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
		<p class="overline">Manajemen tugas</p>
		<h1 class="page-title">Tugas</h1>
		<p class="page-sub">
			{data.total} task{data.isOwner ? '' : ' milikmu'} · {data.items.length} ditampilkan
		</p>
	</div>
	<div class="flex flex-wrap gap-2">
		<a href={`/tasks/export.csv${page.url.search}`} class="btn btn-secondary">
			<Icon name="download" size={16} />
			Export CSV
		</a>
		<a href="/tasks/new" class="btn btn-primary">
			<Icon name="plus" size={16} />
			Buat task
		</a>
	</div>
</div>

<form
	method="GET"
	class="mb-4 rounded-xl border border-border-base bg-surface p-3"
	aria-label="Filter tugas"
>
	<div class="grid gap-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
		<label class="flex h-10 items-center gap-2 rounded-lg border border-border-base bg-canvas px-3">
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

	<div class="mt-2 flex flex-wrap items-center gap-2">
		<select name="sort" class="h-8 rounded-md border border-border-base bg-canvas px-2 text-xs" aria-label="Urutkan">
			<option value="created" selected={data.filters.sort === 'created'}>Terbaru dibuat</option>
			<option value="due_asc" selected={data.filters.sort === 'due_asc'}>Deadline terdekat</option>
			<option value="due_desc" selected={data.filters.sort === 'due_desc'}>Deadline terlama</option>
			<option value="priority" selected={data.filters.sort === 'priority'}>Prioritas tertinggi</option>
			<option value="title" selected={data.filters.sort === 'title'}>Judul A–Z</option>
			<option value="updated" selected={data.filters.sort === 'updated'}>Terakhir diubah</option>
		</select>

		<select name="perPage" class="h-8 rounded-md border border-border-base bg-canvas px-2 text-xs" aria-label="Baris per halaman">
			{#each data.perPageOptions as option (option)}
				<option value={option} selected={data.filters.perPage === option}>{option} / halaman</option>
			{/each}
		</select>

		<button type="submit" class="btn btn-secondary btn-sm">Terapkan</button>
		{#if hasFilter}
			<a href={resetHref()} class="btn btn-ghost btn-sm">Reset filter</a>
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
{:else}
	<div class="surface-card overflow-hidden">
		<!-- Desktop -->
		<div class="hidden overflow-x-auto md:block">
			<table class="data-table">
				<thead>
					<tr>
						<th scope="col">Tugas</th>
						<th scope="col">Status</th>
						<th scope="col">Prioritas</th>
						<th scope="col">Deadline</th>
						<th scope="col">Penanggung jawab</th>
						<th scope="col"><span class="sr-only">Aksi</span></th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as task (task.id)}
						<tr>
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
								{task.dueDate ? dueLabel(task.dueDate, today) : '—'}
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
								<a
									href={`/tasks/${task.id}/edit`}
									class="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
									aria-label={`Ubah ${task.title}`}
								>
									<Icon name="edit" size={15} />
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile -->
		<ul class="divide-y divide-border-base md:hidden">
			{#each data.items as task (task.id)}
				<li class="p-4">
					<a href={`/tasks/${task.id}`} class="block font-semibold text-ink">{task.title}</a>
					{#if task.description}
						<p class="mt-0.5 line-clamp-2 text-xs text-ink-muted">{task.description}</p>
					{/if}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<QuickStatus id={task.id} status={task.status} next={currentPath} />
						<Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip>
						<span class={['text-xs', dueClass(task.dueDate, task.status)].join(' ')}>
							{task.dueDate ? dueLabel(task.dueDate, today) : 'Tanpa deadline'}
						</span>
					</div>
					{#if task.assigneeName}
						<div class="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
							<Avatar name={task.assigneeName} size="sm" />
							{task.assigneeName}
						</div>
					{/if}
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
