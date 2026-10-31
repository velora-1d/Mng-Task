<script lang="ts">
	import QuickStatus from './QuickStatus.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import {
		TASK_STATUSES,
		STATUS_LABEL,
		PRIORITY_LABEL,
		priorityTone
	} from '#lib/types';
	import { dueLabel, todayWib } from '#lib/utils/date';

	type TaskItem = {
		id: string;
		title: string;
		description: string | null;
		status: (typeof TASK_STATUSES)[number];
		priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
		startDate?: string | null;
		startTime?: string | null;
		dueDate: string | null;
		dueTime?: string | null;
		assigneeName: string | null;
	};

	type Props = {
		tasks: TaskItem[];
		currentPath: string;
		ondelete: (task: TaskItem) => void;
	};

	let { tasks, currentPath, ondelete }: Props = $props();
	const today = todayWib();

	function tasksByStatus(status: (typeof TASK_STATUSES)[number]) {
		return tasks.filter((t) => t.status === status);
	}

	function dueClass(dueDate: string | null, status: string): string {
		if (!dueDate || status === 'DONE') return 'text-ink-secondary';
		if (dueDate < today) return 'text-danger font-semibold';
		if (dueDate === today) return 'text-warning font-semibold';
		return 'text-ink-secondary';
	}

	const columnHeaderTone: Record<(typeof TASK_STATUSES)[number], string> = {
		TODO: 'border-t-zinc-400 bg-zinc-500/5',
		IN_PROGRESS: 'border-t-sky-500 bg-sky-500/5',
		BLOCKED: 'border-t-amber-500 bg-amber-500/5',
		DONE: 'border-t-emerald-500 bg-emerald-500/5'
	};
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each TASK_STATUSES as status (status)}
		{@const colTasks = tasksByStatus(status)}
		<section
			class="flex flex-col rounded-xl border border-border-base bg-surface-raised/40 {columnHeaderTone[status]} border-t-2 p-3 shadow-xs"
			aria-label={`Kolom ${STATUS_LABEL[status]}`}
		>
			<header class="mb-3 flex items-center justify-between px-1">
				<div class="flex items-center gap-2">
					<h3 class="text-xs font-bold tracking-wider text-ink uppercase">
						{STATUS_LABEL[status]}
					</h3>
					<span class="grid h-5 min-w-5 place-items-center rounded-full bg-border-base px-1.5 text-[11px] font-bold text-ink-secondary">
						{colTasks.length}
					</span>
				</div>
			</header>

			<div class="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-[120px]">
				{#if colTasks.length === 0}
					<div class="grid flex-1 place-items-center rounded-lg border border-border-base/40 bg-surface/40 p-4 text-center text-xs text-ink-muted">
						Tidak ada tugas
					</div>
				{:else}
					{#each colTasks as task (task.id)}
						<article class="group relative flex flex-col justify-between gap-3 rounded-lg border border-border-base bg-surface p-3.5 shadow-xs transition hover:border-border-strong hover:shadow-sm">
							<div>
								<div class="flex items-start justify-between gap-2">
									<a
										href={`/tasks/${task.id}`}
										class="font-semibold text-sm text-ink hover:text-primary transition line-clamp-2"
									>
										{task.title}
									</a>
									<div class="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
										<a
											href={`/tasks/${task.id}/edit`}
											class="grid size-7 place-items-center rounded text-ink-muted hover:text-ink hover:bg-surface-raised"
											title="Ubah"
										>
											<Icon name="edit" size={13} />
										</a>
										<button
											type="button"
											class="grid size-7 place-items-center rounded text-ink-muted hover:text-danger hover:bg-danger/10"
											title="Hapus"
											onclick={() => ondelete(task)}
										>
											<Icon name="trash" size={13} />
										</button>
									</div>
								</div>
								{#if task.description}
									<p class="mt-1 text-xs text-ink-muted line-clamp-2">
										{task.description}
									</p>
								{/if}
							</div>

							<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-border-base/60 pt-2.5 text-xs">
								<div class="flex items-center gap-1.5">
									<QuickStatus id={task.id} status={task.status} next={currentPath} />
									<Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip>
								</div>
								<div class="flex items-center gap-2">
									{#if task.dueDate}
										<span class={['text-[11px]', dueClass(task.dueDate, task.status)].join(' ')}>
											{dueLabel(task.dueDate, today)}{task.dueTime ? ` (${task.dueTime})` : ''}
										</span>
									{:else if task.startDate}
										<span class="text-[11px] text-ink-muted">
											{task.startDate}{task.startTime ? ` (${task.startTime})` : ''}
										</span>
									{/if}
									{#if task.assigneeName}
										<Avatar name={task.assigneeName} size="sm" />
									{/if}
								</div>
							</footer>
						</article>
					{/each}
				{/if}
			</div>
		</section>
	{/each}
</div>
