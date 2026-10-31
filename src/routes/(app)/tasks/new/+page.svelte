<script lang="ts">
	import TaskForm from '#lib/components/tasks/TaskForm.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const fallback = {
		title: '',
		description: '',
		status: 'TODO' as const,
		priority: 'MEDIUM' as const,
		dueDate: '',
		assigneeId: ''
	};

	const values = $derived(form?.values ?? fallback);
	const errors = $derived(form?.errors ?? {});
</script>

<svelte:head>
	<title>Buat task — Mng-Task</title>
</svelte:head>

<nav class="mb-3 flex items-center gap-1.5 text-[13px] text-ink-muted" aria-label="Breadcrumb">
	<a href="/tasks" class="hover:text-ink">Tugas</a>
	<Icon name="chevronRight" size={13} />
	<span class="text-ink-secondary">Buat task</span>
</nav>

<div class="page-head">
	<div>
		<h1 class="page-title">Buat task</h1>
		<p class="page-sub">Isi detail pekerjaan, lalu tentukan siapa yang mengerjakan.</p>
	</div>
</div>

<TaskForm
	{values}
	{errors}
	statusOptions={['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']}
	assignees={data.assignees}
	canAssignOthers={data.isOwner}
	submitLabel="Simpan task"
	cancelHref="/tasks"
	minDueDate={data.today}
/>
