<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import QuickStatus from '#lib/components/tasks/QuickStatus.svelte';
	import { PRIORITY_LABEL, STATUS_LABEL, activityLabel, priorityTone, statusTone } from '#lib/types';
	import { dueLabel, formatDateLong, formatDateShort, formatDateTime, todayWib } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const task = $derived(data.task);
	const today = todayWib();
	let deleteOpen = $state(false);
	let deleting = $state(false);

	function statusSummary(beforeJson: string | null, afterJson: string | null): string | null {
		if (!beforeJson || !afterJson) return null;
		try {
			const before = JSON.parse(beforeJson) as { status?: string };
			const after = JSON.parse(afterJson) as { status?: string };
			if (before.status && after.status && before.status !== after.status) {
				const from = STATUS_LABEL[before.status as keyof typeof STATUS_LABEL] ?? before.status;
				const to = STATUS_LABEL[after.status as keyof typeof STATUS_LABEL] ?? after.status;
				return `${from} → ${to}`;
			}
		} catch {
			/* json lama tidak terbaca; abaikan */
		}
		return null;
	}

	function submitDelete() {
		deleting = true;
		return async ({ result }: { result: any }) => {
			deleting = false;
			if (result.type === 'failure') deleteOpen = false;
			await applyAction(result);
		};
	}
</script>

<svelte:head>
	<title>{task.title} — Mng-Task</title>
</svelte:head>

<nav class="mb-3 flex items-center gap-1.5 text-[13px] text-ink-muted" aria-label="Breadcrumb">
	<a href="/tasks" class="hover:text-ink">Tugas</a>
	<Icon name="chevronRight" size={13} />
	<span class="truncate text-ink-secondary">{task.title}</span>
</nav>

{#if data.saved}
	<div
		class="mb-4 flex items-start gap-2 rounded-lg border border-success/30 bg-[var(--success-soft)] px-3 py-2.5 text-[13px] text-success"
		role="status"
	>
		<Icon name="check" size={16} class="mt-0.5 shrink-0" />
		<span>Perubahan tersimpan.</span>
	</div>
{/if}

{#if form?.actionError}
	<div
		class="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-[var(--error-soft)] px-3 py-2.5 text-[13px] text-danger"
		role="alert"
	>
		<Icon name="alert" size={16} class="mt-0.5 shrink-0" />
		<span>{form.actionError}</span>
	</div>
{/if}

<div class="page-head">
	<div class="min-w-0">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<Chip tone={statusTone(task.status)}>{STATUS_LABEL[task.status]}</Chip>
			<Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip>
			{#if task.startDate || task.dueDate}
				<div class="flex items-center gap-1.5 text-xs text-ink-muted">
					<Icon name="calendar" size={13} class="text-primary" />
					{#if task.startDate}
						<span>Mulai: {formatDateShort(task.startDate)}{task.startTime ? ` (${task.startTime})` : ''}</span>
					{/if}
					{#if task.startDate && task.dueDate}
						<span class="text-border-strong/40">→</span>
					{/if}
					{#if task.dueDate}
						<span
							class={task.status !== 'DONE' && task.dueDate < today
								? 'text-danger font-semibold'
								: task.dueDate === today
									? 'text-warning font-semibold'
									: 'text-ink-secondary'}
						>
							Tenggat: {dueLabel(task.dueDate, today)}{task.dueTime ? ` (${task.dueTime})` : ''}
						</span>
					{/if}
				</div>
			{/if}
		</div>
		<h1 class="page-title break-words">{task.title}</h1>
		<p class="page-sub">
			Dibuat oleh {task.creatorName ?? 'pengguna'} · {formatDateTime(task.createdAt)}
		</p>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<QuickStatus id={task.id} status={task.status} next={`/tasks/${task.id}`} />
		{#if data.canEdit}
			<a href={`/tasks/${task.id}/edit`} class="btn btn-secondary btn-sm">
				<Icon name="edit" size={15} />
				Ubah
			</a>
		{/if}
		{#if data.canDelete}
			<Button variant="ghost" size="sm" onclick={() => (deleteOpen = true)}>
				<Icon name="trash" size={15} />
				Hapus
			</Button>
		{/if}
	</div>
</div>

<div class="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
	<div class="stack">
		<Card title="Deskripsi">
			{#if task.description}
				<p class="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
					{task.description}
				</p>
			{:else}
				<p class="text-sm text-ink-muted">Tidak ada deskripsi.</p>
			{/if}
		</Card>

		<Card title="Aktivitas" subtitle="Riwayat perubahan task ini">
			{#if data.activity.length === 0}
				<p class="py-2 text-sm text-ink-muted">Belum ada aktivitas tercatat.</p>
			{:else}
				<ol class="flex flex-col">
					{#each data.activity as item, index (item.id)}
						<li class="relative flex gap-3 pb-4 last:pb-0">
							{#if index < data.activity.length - 1}
								<span class="absolute top-8 bottom-0 left-[13px] w-px bg-border-base" aria-hidden="true"
								></span>
							{/if}
							<span
								class="relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-raised text-ink-muted"
							>
								<Icon name="check" size={13} />
							</span>
							<div class="min-w-0">
								<p class="text-[13px] text-ink">
									<span class="font-semibold">{item.actorName ?? 'Sistem'}</span>
									{activityLabel(item.action)}
									{#if statusSummary(item.beforeJson, item.afterJson)}
										<span class="font-medium text-ink-secondary">
											· {statusSummary(item.beforeJson, item.afterJson)}
										</span>
									{/if}
								</p>
								<p class="mt-0.5 text-xs text-ink-muted">{formatDateTime(item.createdAt)}</p>
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</Card>
	</div>

	<aside class="stack">
		<Card title="Detail">
			<dl class="flex flex-col gap-3 text-sm">
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-muted">Status</dt>
					<dd><Chip tone={statusTone(task.status)}>{STATUS_LABEL[task.status]}</Chip></dd>
				</div>
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-muted">Prioritas</dt>
					<dd><Chip tone={priorityTone(task.priority)}>{PRIORITY_LABEL[task.priority]}</Chip></dd>
				</div>
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-muted">Mulai</dt>
					<dd class="text-right text-ink">
						{#if task.startDate}
							{formatDateLong(task.startDate)}{task.startTime ? ` pukul ${task.startTime} WIB` : ''}
						{:else}
							<span class="text-ink-muted">—</span>
						{/if}
					</dd>
				</div>
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-muted">Tenggat</dt>
					<dd class="text-right text-ink">
						{#if task.dueDate}
							{formatDateLong(task.dueDate)}{task.dueTime ? ` pukul ${task.dueTime} WIB` : ''}
						{:else}
							<span class="text-ink-muted">Tanpa deadline</span>
						{/if}
					</dd>
				</div>
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-muted">Penanggung jawab</dt>
					<dd class="text-right">
						{#if task.assigneeName}
							<span class="inline-flex items-center gap-1.5 text-ink">
								<Avatar name={task.assigneeName} size="sm" />
								{task.assigneeName}
							</span>
						{:else}
							<span class="text-ink-muted">Belum ditugaskan</span>
						{/if}
					</dd>
				</div>
				{#if task.completedAt}
					<div class="flex items-start justify-between gap-3">
						<dt class="text-ink-muted">Diselesaikan</dt>
						<dd class="text-right text-ink">{formatDateTime(task.completedAt)}</dd>
					</div>
				{/if}
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-muted">Terakhir diubah</dt>
					<dd class="text-right text-ink">{formatDateTime(task.updatedAt)}</dd>
				</div>
			</dl>
		</Card>
	</aside>
</div>

<Dialog bind:open={deleteOpen} title="Hapus task?" description="Task akan disembunyikan dari daftar.">
	<p class="text-sm text-ink-secondary">
		Task <span class="font-semibold text-ink">{task.title}</span> tidak akan tampil lagi di daftar,
		laporan, maupun pengingat.
	</p>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (deleteOpen = false)} disabled={deleting}>Batal</Button>
		<form method="POST" action="?/delete" use:enhance={submitDelete}>
			<Button type="submit" variant="danger" loading={deleting}>Hapus task</Button>
		</form>
	{/snippet}
</Dialog>
