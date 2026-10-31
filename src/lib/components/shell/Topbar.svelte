<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import Avatar from '../ui/Avatar.svelte';

	type Props = {
		user: { name: string };
		reminderCount?: number;
		onmenu: () => void;
	};

	let { user, reminderCount = 0, onmenu }: Props = $props();

	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('mngtask-theme', theme);
		} catch {
			/* localStorage bisa diblokir */
		}
	}
</script>

<header
	class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border-base bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] px-4 backdrop-blur-md md:px-6"
>
	<button
		type="button"
		class="grid size-9 place-items-center rounded-md border border-border-base bg-surface text-ink-secondary hover:bg-surface-raised lg:hidden"
		onclick={onmenu}
		aria-label="Buka menu"
	>
		<Icon name="menu" size={18} />
	</button>

	<a href="/dashboard" class="flex items-center gap-2 lg:hidden">
		<span class="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-white">M</span>
		<span class="font-[family-name:var(--font-display)] font-bold text-ink">Mng-Task</span>
	</a>

	<form action="/tasks" method="get" class="hidden w-full max-w-[360px] sm:block" role="search">
		<label class="flex h-9 items-center gap-2 rounded-lg border border-border-base bg-surface px-3 text-ink-muted">
			<Icon name="search" size={16} />
			<input
				type="search"
				name="q"
				placeholder="Cari tugas…"
				aria-label="Cari tugas"
				class="h-full flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
			/>
		</label>
	</form>

	<div class="ml-auto flex items-center gap-2">
		<button
			type="button"
			class="grid size-9 place-items-center rounded-md border border-border-base bg-surface text-ink-secondary hover:bg-surface-raised hover:text-ink"
			onclick={toggleTheme}
			aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
			title="Ganti tema"
		>
			<Icon name={theme === 'dark' ? 'moon' : 'sun'} size={17} />
		</button>

		<a
			href="/reminders"
			class="relative hidden size-9 place-items-center rounded-md border border-border-base bg-surface text-ink-secondary hover:bg-surface-raised hover:text-ink sm:grid"
			aria-label={`Pengingat${reminderCount > 0 ? `, ${reminderCount} aktif` : ''}`}
		>
			<Icon name="bell" size={17} />
			{#if reminderCount > 0}
				<span
					class="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#451a03]"
				>
					{reminderCount}
				</span>
			{/if}
		</a>

		<a href="/settings" class="rounded-full" aria-label="Buka pengaturan profil">
			<Avatar name={user.name} />
		</a>
	</div>
</header>
