<script lang="ts">
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { activityLabel, PRIORITY_LABEL, priorityTone, STATUS_LABEL, statusTone } from '#lib/types';
	import { dueLabel, formatDateTime } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const kpis = $derived([
		{
			label: 'Task aktif',
			value: data.counts.active,
			meta: 'Perlu dikerjakan',
			href: '/tasks?status=TODO',
			borderClass: 'border-l-primary'
		},
		{
			label: 'Selesai minggu ini',
			value: data.counts.doneThisWeek,
			meta: '7 hari terakhir',
			href: '/tasks?status=DONE',
			borderClass: 'border-l-success'
		},
		{
			label: 'Deadline hari ini',
			value: data.counts.dueToday,
			meta: 'Jatuh tempo',
			href: '/tasks?due=today',
			borderClass: 'border-l-warning'
		},
		{
			label: 'Terlambat',
			value: data.counts.overdue,
			meta: 'Melewati tenggat',
			href: '/tasks?due=overdue',
			borderClass: 'border-l-danger'
		}
	]);

	const maxTrend = $derived(Math.max(...data.trend.map((t) => t.count), 1));
</script>

<svelte:head>
	<title>Dashboard — Mng-Task</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="overline">{data.todayLabel}</p>
		<h1 class="page-title">Dashboard</h1>
		<p class="page-sub">Halo {data.firstName}. Ini ringkasan tugas dan progres tim kamu.</p>
	</div>
	<div class="flex gap-2">
		<a href="/tasks" class="btn btn-secondary">Semua tugas</a>
		<a href="/tasks/new" class="btn btn-primary">
			<Icon name="plus" size={16} />
			Buat task
		</a>
	</div>
</div>

<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan KPI">
	{#each kpis as kpi (kpi.label)}
		<a
			href={kpi.href}
			class={['surface-card block border-l-[3px] p-4 transition-transform hover:-translate-y-0.5', kpi.borderClass].join(' ')}
		>
			<p class="text-xs font-semibold text-ink-muted">{kpi.label}</p>
			<p class="mt-1.5 font-[family-name:var(--font-display)] text-[34px] leading-none font-bold text-ink">
				{kpi.value}
			</p>
			<p class="mt-1.5 text-xs text-ink-secondary">{kpi.meta} →</p>
		</a>
	{/each}
</section>

<!-- Trend & Deadline Terdekat -->
<div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
	<Card title="Task selesai 7 hari" subtitle="Produktivitas harian">
		<div class="flex h-44 items-end justify-between gap-2 pt-6 pb-2">
			{#each data.trend as item (item.date)}
				{@const heightPct = Math.round((item.count / maxTrend) * 100)}
				<div class="flex flex-1 flex-col items-center gap-1.5">
					<span class="text-[11px] font-bold text-ink-secondary">{item.count}</span>
					<div class="flex h-28 w-full items-end justify-center rounded bg-surface-raised">
						<div
							class="w-full max-w-[28px] rounded-t bg-primary transition-all duration-300"
							style:height="{Math.max(heightPct, 6)}%"
							title={`${item.day}: ${item.count} selesai`}
						></div>
					</div>
					<span class="text-[11px] text-ink-muted">{item.day}</span>
				</div>
			{/each}
		</div>
	</Card>

	<Card title="Deadline terdekat" subtitle="Maksimal 5 tugas belum selesai">
		{#snippet action()}
			<a href="/tasks?sort=due_asc" class="text-xs font-semibold text-primary hover:underline">
				Lihat semua
			</a>
		{/snippet}

		{#if data.upcoming.length === 0}
			<EmptyState
				icon="tasks"
				title="Tidak ada deadline terdekat"
				description="Semua tugas beres atau belum ada tenggat waktu yang ditentukan."
			/>
		{:else}
			<ul class="divide-y divide-border-base">
				{#each data.upcoming as task (task.id)}
					<li class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
						<div class="min-w-0">
							<a href={`/tasks/${task.id}`} class="block truncate font-semibold text-ink hover:text-primary">
								{task.title}
							</a>
							<div class="mt-1 flex flex-wrap items-center gap-2">
								<Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip>
								<Chip tone={statusTone(task.status)}>{STATUS_LABEL[task.status]}</Chip>
								{#if task.assigneeName}
									<span class="flex items-center gap-1 text-xs text-ink-muted">
										<Avatar name={task.assigneeName} size="sm" />
										{task.assigneeName}
									</span>
								{/if}
							</div>
						</div>
						<div class="shrink-0 text-right">
							<span
								class="text-xs font-semibold {task.dueDate && task.dueDate < data.today
									? 'text-danger'
									: task.dueDate === data.today
										? 'text-warning'
										: 'text-ink-secondary'}"
							>
								{task.dueDate ? dueLabel(task.dueDate, data.today) : '—'}
							</span>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>
</div>

<!-- Aktivitas Terbaru -->
<div class="mt-4">
	<Card title="Aktivitas terbaru" subtitle="5 pembaruan sistem dan tugas">
		{#if data.activities.length === 0}
			<p class="py-4 text-center text-sm text-ink-muted">Belum ada aktivitas tercatat.</p>
		{:else}
			<ol class="flex flex-col">
				{#each data.activities as item, index (item.id)}
					<li class="relative flex gap-3 pb-3 last:pb-0">
						{#if index < data.activities.length - 1}
							<span class="absolute top-7 bottom-0 left-[13px] w-px bg-border-base" aria-hidden="true"></span>
						{/if}
						<span class="relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-raised text-ink-muted">
							<Icon name="check" size={13} />
						</span>
						<div class="min-w-0">
							<p class="text-[13px] text-ink">
								<span class="font-semibold">{item.actorName ?? 'Sistem'}</span>
								{activityLabel(item.action)}
							</p>
							<p class="text-xs text-ink-muted">{formatDateTime(item.createdAt)}</p>
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</Card>
</div>
