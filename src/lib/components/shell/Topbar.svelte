<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import Avatar from '../ui/Avatar.svelte';

	type Props = {
		user: { name: string };
		reminderCount?: number;
		switchableUsers?: { id: string; name: string; email: string }[];
		sidebarCollapsed?: boolean;
		onToggleSidebar?: () => void;
		onmenu?: () => void;
	};

	let {
		user,
		reminderCount = 0,
		switchableUsers = [],
		sidebarCollapsed = false,
		onToggleSidebar,
		onmenu
	}: Props = $props();
	let switchOpen = $state(false);
	let switchingId = $state<string | null>(null);

	async function doSwitch(targetUserId: string) {
		switchingId = targetUserId;
		try {
			const res = await fetch('/api/impersonate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: targetUserId })
			});
			if (res.ok) {
				window.location.href = '/dashboard';
			} else {
				const d = await res.json();
				alert(d.message ?? 'Gagal beralih akun');
			}
		} finally {
			switchingId = null;
			switchOpen = false;
		}
	}

	let theme = $state<'light' | 'dark'>('light');
	let currentDate = $state('');
	let currentTime = $state('');

	function updateClock() {
		const now = new Date();
		const dateOptions: Intl.DateTimeFormatOptions = {
			timeZone: 'Asia/Jakarta',
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		};
		const timeOptions: Intl.DateTimeFormatOptions = {
			timeZone: 'Asia/Jakarta',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		};
		currentDate = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
		currentTime = new Intl.DateTimeFormat('id-ID', timeOptions).format(now);
	}

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		updateClock();
		const timer = setInterval(updateClock, 1000);
		return () => clearInterval(timer);
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
	class="sticky top-0 z-20 flex h-16 items-center gap-2.5 sm:gap-3 border-b border-border-base bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] px-3 sm:px-6 lg:px-8 backdrop-blur-md"
>
	<a href="/dashboard" class="flex items-center gap-2 lg:hidden shrink-0" aria-label="Beranda Mng-Task">
		<span class="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white shadow-xs">M</span>
		<span class="hidden sm:inline font-[family-name:var(--font-display)] font-bold text-ink whitespace-nowrap">Mng-Task</span>
	</a>

	<!-- Toggle Sidebar Collapse (Desktop) -->
	{#if onToggleSidebar}
		<button
			type="button"
			class="hidden lg:grid size-9 place-items-center rounded-lg border border-border-base bg-surface text-ink-secondary hover:bg-surface-raised hover:text-ink transition active:scale-95 shrink-0"
			onclick={onToggleSidebar}
			title={sidebarCollapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
			aria-label={sidebarCollapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
		>
			<Icon name={sidebarCollapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
		</button>
	{/if}

	<form action="/tasks" method="get" class="hidden w-full max-w-[280px] sm:block xl:max-w-[320px]" role="search">
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

	<!-- Live Jam & Tanggal (WIB) -->
	<div
		class="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border-base/70 bg-surface/70 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs text-ink-secondary shadow-2xs backdrop-blur-xs shrink-0"
		title="Waktu Indonesia Barat (WIB)"
	>
		<Icon name="clock" size={14} class="text-primary shrink-0" />
		<div class="flex items-center gap-1 sm:gap-1.5">
			<span class="hidden md:inline font-medium text-ink-secondary">{currentDate}</span>
			<span class="hidden md:inline text-border-strong/40">·</span>
			<span class="tabular-nums font-semibold text-ink text-xs">{currentTime || '00:00:00'}</span>
			<span class="text-[9px] sm:text-[10px] font-bold text-primary uppercase">WIB</span>
		</div>
	</div>

	<div class="ml-auto flex items-center gap-1.5 sm:gap-2">
		{#if switchableUsers.length > 0}
			<div class="relative hidden sm:block">
				<button
					type="button"
					class="flex h-9 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition active:scale-95"
					onclick={() => (switchOpen = !switchOpen)}
					aria-expanded={switchOpen}
					title="Beralih ke akun user lain"
				>
					<Icon name="switchUser" size={14} />
					<span class="hidden sm:inline">Switch User</span>
				</button>

				{#if switchOpen}
					<div
						class="fixed inset-0 z-30"
						onclick={() => (switchOpen = false)}
						aria-hidden="true"
					></div>
					<div class="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-xl border border-border-base bg-surface p-1.5 shadow-lg backdrop-blur-md">
						<div class="px-2 py-1.5 text-[11px] font-bold tracking-wider text-ink-muted uppercase">
							Pilih Akun User:
						</div>
						<div class="max-h-60 overflow-y-auto flex flex-col gap-0.5">
							{#each switchableUsers as u (u.id)}
								<button
									type="button"
									class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-surface-raised disabled:opacity-50"
									disabled={switchingId === u.id}
									onclick={() => doSwitch(u.id)}
								>
									<Avatar name={u.name} size="sm" />
									<div class="min-w-0 flex-1">
										<p class="font-semibold text-ink truncate">{u.name}</p>
										<p class="text-[10px] text-ink-muted truncate">{u.email}</p>
									</div>
									{#if switchingId === u.id}
										<span class="text-[10px] text-amber-600 font-bold">...</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
		<button
			type="button"
			class="hidden sm:grid size-9 place-items-center rounded-md border border-border-base bg-surface text-ink-secondary hover:bg-surface-raised hover:text-ink"
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
					class="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-amber-950"
				>
					{reminderCount}
				</span>
			{/if}
		</a>

		<a href="/settings" class="rounded-full transition active:scale-95" aria-label="Buka pengaturan profil">
			<Avatar name={user.name} />
		</a>

		<form method="POST" action="/logout" class="hidden sm:inline-flex">
			<button
				type="submit"
				class="grid size-9 place-items-center rounded-md border border-border-base bg-surface text-ink-secondary hover:border-danger/30 hover:bg-danger/10 hover:text-danger transition active:scale-95"
				title="Keluar (Logout)"
				aria-label="Keluar"
			>
				<Icon name="logout" size={17} />
			</button>
		</form>
	</div>
</header>
