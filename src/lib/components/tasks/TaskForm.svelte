<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '#lib/components/ui/Button.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import Textarea from '#lib/components/ui/Textarea.svelte';
	import { PRIORITY_LABEL, STATUS_LABEL, TASK_PRIORITIES, type TaskPriority, type TaskStatus } from '#lib/types';

	type Values = {
		title: string;
		description: string;
		status: string;
		priority: string;
		dueDate: string;
		assigneeId: string;
	};

	type Props = {
		values: Values;
		errors?: Record<string, string>;
		statusOptions: TaskStatus[];
		assignees: { id: string; name: string }[];
		canAssignOthers: boolean;
		assigneeName?: string;
		submitLabel: string;
		cancelHref: string;
		action?: string;
		minDueDate?: string;
	};

	let {
		values,
		errors = {},
		statusOptions,
		assignees,
		canAssignOthers,
		assigneeName,
		submitLabel,
		cancelHref,
		action,
		minDueDate
	}: Props = $props();

	let title = $state('');
	let description = $state('');
	let status = $state<string>('TODO');
	let priority = $state<string>('MEDIUM');
	let dueDate = $state('');
	let assigneeId = $state('');
	let submitting = $state(false);
	let localErrors = $state<Record<string, string>>({});

	$effect(() => {
		title = values.title;
		description = values.description;
		status = values.status;
		priority = values.priority;
		dueDate = values.dueDate;
		assigneeId = values.assigneeId;
	});

	const shownErrors = $derived({ ...errors, ...localErrors });

	function handle() {
		localErrors = {};
		if (title.trim().length < 3) {
			localErrors = { title: 'Judul harus 3–200 karakter.' };
			return;
		}
		submitting = true;
		return async ({ result }: { result: { type: string } }) => {
			submitting = false;
			if (result.type === 'failure') {
				// Pesan dari server muncul lewat prop `errors`.
			}
		};
	}

	const statusSelect = $derived(statusOptions.map((value) => ({ value, label: STATUS_LABEL[value] })));
	const prioritySelect = $derived(
		TASK_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABEL[value] }))
	);
	const assigneeSelect = $derived([
		{ value: '', label: 'Belum ditugaskan' },
		...assignees.map((person) => ({ value: person.id, label: person.name }))
	]);
</script>

<form
	method="POST"
	{action}
	use:enhance={handle}
	class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]"
	novalidate
	aria-busy={submitting}
>
	<div class="surface-card stack p-4 md:p-5">
		<Input
			label="Judul"
			name="title"
			required
			maxlength={200}
			bind:value={title}
			error={shownErrors.title}
			placeholder="Contoh: Finalisasi proposal klien"
		/>

		<Textarea
			label="Deskripsi"
			name="description"
			rows={8}
			maxlength={5000}
			bind:value={description}
			error={shownErrors.description}
			hint="Opsional. Maksimal 5.000 karakter."
			placeholder="Konteks, langkah kerja, atau tautan referensi…"
		/>
	</div>

	<div class="stack">
		<div class="surface-card stack p-4 md:p-5">
			<Select
				label="Status"
				name="status"
				options={statusSelect}
				bind:value={status}
				error={shownErrors.status}
			/>

			<Select
				label="Prioritas"
				name="priority"
				options={prioritySelect}
				bind:value={priority}
				error={shownErrors.priority}
			/>

			<Input
				label="Deadline"
				name="dueDate"
				type="date"
				bind:value={dueDate}
				min={minDueDate}
				error={shownErrors.dueDate}
				hint="Kosongkan kalau belum ada tenggat."
			/>
		</div>

		<div class="surface-card stack p-4 md:p-5">
			{#if canAssignOthers}
				<Select
					label="Penanggung jawab"
					name="assigneeId"
					options={assigneeSelect}
					bind:value={assigneeId}
					error={shownErrors.assigneeId}
				/>
			{:else}
				<div class="flex flex-col gap-1.5">
					<span class="text-[13px] font-semibold text-ink-secondary">Penanggung jawab</span>
					<p class="text-sm text-ink">{assigneeName ?? 'Kamu'}</p>
					<p class="text-xs text-ink-muted">Task pribadi otomatis ditugaskan ke kamu.</p>
				</div>
			{/if}
		</div>

		<div class="flex flex-wrap justify-end gap-2">
			<a href={cancelHref} class="btn btn-secondary">Batal</a>
			<Button type="submit" loading={submitting}>{submitLabel}</Button>
		</div>
	</div>
</form>
