<script lang="ts">
	import { enhance } from '$app/forms';
	import { STATUS_LABEL, TASK_STATUSES, type TaskStatus } from '#lib/types';

	type Props = {
		id: string;
		status: TaskStatus;
		next: string;
		label?: string;
	};

	let { id, status, next, label = 'Ubah status' }: Props = $props();
</script>

<form method="POST" action={`/tasks/${id}?/setStatus`} use:enhance class="inline-flex">
	<input type="hidden" name="next" value={next} />
	<select
		name="status"
		value={status}
		onchange={(event) => event.currentTarget.form?.requestSubmit()}
		class="h-7 cursor-pointer rounded-full border border-border-base bg-surface pr-6 pl-2.5 text-xs font-semibold text-ink-secondary hover:bg-surface-raised"
		aria-label={`${label} untuk task`}
	>
		{#each TASK_STATUSES as option (option)}
			<option value={option}>{STATUS_LABEL[option]}</option>
		{/each}
	</select>
	<noscript>
		<button type="submit" class="ml-1 text-xs text-primary underline">Simpan</button>
	</noscript>
</form>
