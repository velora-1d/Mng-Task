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
	import { PRIORITY_LABEL, priorityTone } from '#lib/types';
	import { formatDateTime, todayWib } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let createOpen = $state(false);
	let title = $state('');
	let note = $state('');
	let remindAtDate = $state(todayWib());
	let remindAtTime = $state('09:00');
	let taskId = $state('');

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
		<p class="page-sub">Pantau deadline otomatis dan atur catatan pengingat pribadimu.</p>
	</div>
	<div class="flex gap-2">
		<Button variant="primary" onclick={() => (createOpen = true)}>
			<Icon name="plus" size={16} />
			Buat pengingat
		</Button>
	</div>
</div>

<div class="grid gap-6 lg:grid-cols-2">
	<!-- Kolom 1: Reminder Otomatis dari Task -->
	<div class="stack">
		<Card
			title="Pengingat Otomatis"
			subtitle="Berdasarkan tenggat waktu task (Overdue, Hari H, H-1, H-3)"
		>
			{#if data.autoReminders.length === 0}
				<EmptyState
					icon="bell"
					title="Tidak ada tenggat mendesak"
					description="Semua tugas dalam jadwal aman atau sudah diselesaikan."
				/>
			{:else}
				<ul class="divide-y divide-border-base">
					{#each data.autoReminders as auto (auto.id)}
						<li class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
							<div class="min-w-0">
								<a
									href={`/tasks/${auto.taskId}`}
									class="block font-semibold text-ink hover:text-primary"
								>
									{auto.title}
								</a>
								<div class="mt-1 flex flex-wrap items-center gap-2">
									<Chip tone={urgencyTone(auto.urgency)}>{auto.urgencyLabel}</Chip>
									<Chip tone={priorityTone(auto.priority)}>{PRIORITY_LABEL[auto.priority]}</Chip>
									<span class="text-xs text-ink-muted">Deadline: {auto.dueDate}</span>
								</div>
							</div>
							<a href={`/tasks/${auto.taskId}`} class="btn btn-secondary btn-sm shrink-0">
								Buka
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>

	<!-- Kolom 2: Reminder Manual Pribadi -->
	<div class="stack">
		<Card title="Pengingat Manual" subtitle="Catatan dan pengingat yang kamu buat sendiri">
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
				<ul class="divide-y divide-border-base">
					{#each data.manualReminders as item (item.id)}
						<li class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<form method="POST" action="?/toggle" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="status" value={item.status} />
										<button
											type="submit"
											class="grid size-5 place-items-center rounded border {item.status ===
											'DONE'
												? 'border-success bg-success text-white'
												: 'border-border-base bg-surface text-transparent hover:border-primary'}"
											aria-label={item.status === 'DONE' ? 'Tandai belum selesai' : 'Tandai selesai'}
										>
											<Icon name="check" size={12} />
										</button>
									</form>
									<span
										class="font-semibold {item.status === 'DONE'
											? 'text-ink-muted line-through'
											: 'text-ink'}"
									>
										{item.title}
									</span>
								</div>

								{#if item.note}
									<p class="mt-1 text-xs text-ink-secondary">{item.note}</p>
								{/if}

								<div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
									<span>Waktu: {formatDateTime(item.remindAt)}</span>
									{#if item.taskTitle}
										<span>· Task: {item.taskTitle}</span>
									{/if}
								</div>
							</div>

							<form method="POST" action="?/delete" use:enhance class="shrink-0">
								<input type="hidden" name="id" value={item.id} />
								<button
									type="submit"
									class="grid size-7 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-danger"
									aria-label="Hapus pengingat"
								>
									<Icon name="trash" size={14} />
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>
</div>

<!-- Modal Buat Reminder -->
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
