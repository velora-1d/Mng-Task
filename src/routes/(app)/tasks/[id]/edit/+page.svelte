<script lang="ts">
	import TaskForm from '#lib/components/tasks/TaskForm.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const task = $derived(data.task);

	const initial = $derived({
		title: task.title,
		description: task.description ?? '',
		status: task.status,
		priority: task.priority,
		dueDate: task.dueDate ?? '',
		assigneeId: task.assigneeId ?? ''
	});

	const values = $derived(form?.values ?? initial);
	const errors = $derived(form?.errors ?? {});
</script>

<svelte:head>
	<title>Ubah task: {task.title} — Mng-Task</title>
</svelte:head>

<nav class="mb-3 flex items-center gap-1.5 text-[13px] text-ink-muted" aria-label="Breadcrumb">
	<a href="/tasks" class="hover:text-ink">Tugas</a>
	<Icon name="chevronRight" size={13} />
	<a href={`/tasks/${task.id}`} class="max-w-[200px] truncate hover:text-ink">{task.title}</a>
	<Icon name="chevronRight" size={13} />
	<span class="text-ink-secondary">Ubah</span>
</nav>

<div class="page-head">
	<div>
		<h1 class="page-title">Ubah task</h1>
		<p class="page-sub">Perbarui status, prioritas, tenggat, atau penanggung jawab.</p>
	</div>
</div>

<TaskForm
	{values}
	{errors}
	statusOptions={data.statusOptions}
	assignees={data.assignees}
	canAssignOthers={data.isOwner}
	assigneeName={task.assigneeName ?? undefined}
	submitLabel="Simpan perubahan"
	cancelHref={`/tasks/${task.id}`}
/>
