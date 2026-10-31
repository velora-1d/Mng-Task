<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Avatar from '../ui/Avatar.svelte';
	import Icon from '../ui/Icon.svelte';
	import type { IconName } from '../icons/icons';
	import type { UserRole } from '#lib/types';

	type Props = {
		user: { name: string; role: UserRole };
		reminderCount?: number;
		switchableUsers?: { id: string; name: string; email: string; role: string }[];
		onmenu?: () => void;
	};

	let { user, reminderCount = 0, switchableUsers = [], onmenu }: Props = $props();

	let moreOpen = $state(false);
	let theme = $state<'light' | 'dark'>('light');
	let switchingId = $state<string | null>(null);

	onMount(() => {
		theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('mngtask-theme', theme);
		} catch {
			/* localStorage aman */
		}
	}

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
			moreOpen = false;
		}
	}

	type NavItem = {
		href: string;
		label: string;
		icon: IconName;
		badge?: number;
	};

	const navItems = $derived<NavItem[]>([
		{ href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/tasks', label: 'Tugas', icon: 'tasks' },
		{ href: '/reminders', label: 'Pengingat', icon: 'bell', badge: reminderCount },
		{ href: '/reports', label: 'Laporan', icon: 'report' }
	]);

	const path = $derived(page.url.pathname);
	const isActive = (href: string) =>
		path === href || (href !== '/dashboard' && path.startsWith(`${href}/`));
	const isSecondaryActive = $derived(
		path.startsWith('/users') || path.startsWith('/settings')
	);
</script>

<!-- Bottom Navigation Bar (Maksimal 5 item: 4 Menu Utama + 1 Menu Garis 3 'Lainnya') -->
<nav
	class="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-border-base bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md shadow-lg lg:hidden"
	aria-label="Navigasi Bawah Mobile"
>
	{#each navItems as item (item.href)}
		{@const active = isActive(item.href)}
		<a
			href={item.href}
			class={[
				'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors active:scale-95',
				active ? 'text-primary font-bold' : 'text-ink-secondary hover:text-ink font-medium'
			].join(' ')}
			aria-current={active ? 'page' : undefined}
		>
			<div class="relative">
				<Icon name={item.icon} size={20} class={active ? 'stroke-[2.2]' : ''} />
				{#if item.badge && item.badge > 0}
					<span
						class="absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#451a03]"
					>
						{item.badge}
					</span>
				{/if}
			</div>
			<span class="text-[11px] leading-tight tracking-tight">{item.label}</span>
			{#if active}
				<span class="absolute bottom-0.5 h-0.5 w-6 rounded-full bg-primary" aria-hidden="true"></span>
			{/if}
		</a>
	{/each}

	<!-- Menu ke-5: Garis 3 (Lainnya) -->
	<button
		type="button"
		class={[
			'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors active:scale-95',
			moreOpen || isSecondaryActive ? 'text-primary font-bold' : 'text-ink-secondary hover:text-ink font-medium'
		].join(' ')}
		onclick={() => (moreOpen = !moreOpen)}
		aria-expanded={moreOpen}
		aria-label="Menu lainnya"
	>
		<div class="relative">
			<Icon name="menu" size={20} class={moreOpen || isSecondaryActive ? 'stroke-[2.2]' : ''} />
		</div>
		<span class="text-[11px] leading-tight tracking-tight">Lainnya</span>
		{#if isSecondaryActive}
			<span class="absolute bottom-0.5 h-0.5 w-6 rounded-full bg-primary" aria-hidden="true"></span>
		{/if}
	</button>
</nav>

<!-- Popup / Bottom Sheet Menu Lainnya -->
{#if moreOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-[rgba(28,25,23,0.5)] backdrop-blur-xs transition-opacity lg:hidden"
		onclick={() => (moreOpen = false)}
		aria-hidden="true"
	></div>

	<!-- Bottom Sheet Content -->
	<div
		class="fixed bottom-0 inset-x-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border-base bg-surface p-4 shadow-2xl backdrop-blur-xl lg:hidden pb-[calc(1.2rem+env(safe-area-inset-bottom))]"
		role="dialog"
		aria-label="Menu Lainnya"
	>
		<!-- Drag Pill Handle -->
		<div class="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong/40"></div>

		<!-- Profil Singkat Pengguna -->
		<div class="mb-4 flex items-center justify-between border-b border-border-base/50 pb-3">
			<div class="flex items-center gap-3">
				<Avatar name={user.name} size="md" />
				<div class="min-w-0">
					<p class="truncate font-semibold text-ink">{user.name}</p>
					<span class="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
						{user.role === 'OWNER' ? 'Owner / Admin' : 'Anggota'}
					</span>
				</div>
			</div>
			<button
				type="button"
				class="grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-raised hover:text-ink"
				onclick={() => (moreOpen = false)}
				aria-label="Tutup"
			>
				<Icon name="x" size={18} />
			</button>
		</div>

		<!-- Daftar Menu Tambahan -->
		<div class="flex flex-col gap-1">
			{#if user.role === 'OWNER'}
				<a
					href="/users"
					class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-raised active:bg-surface-hover"
					onclick={() => (moreOpen = false)}
				>
					<div class="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-primary">
						<Icon name="users" size={18} />
					</div>
					<div class="flex-1">
						<p class="font-semibold text-ink">Kelola Pengguna</p>
						<p class="text-xs text-ink-muted">Akses & anggota tim</p>
					</div>
				</a>
			{/if}

			<a
				href="/settings"
				class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-raised active:bg-surface-hover"
				onclick={() => (moreOpen = false)}
			>
				<div class="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<Icon name="settings" size={18} />
				</div>
				<div class="flex-1">
					<p class="font-semibold text-ink">Pengaturan Akun</p>
					<p class="text-xs text-ink-muted">Profil, nama, email & kata sandi</p>
				</div>
			</a>

			<!-- Switch User (Jika ada user lain) -->
			{#if switchableUsers.length > 0}
				<div class="my-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
					<div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
						<Icon name="switchUser" size={14} />
						<span>Beralih Akun Cepat:</span>
					</div>
					<div class="flex flex-col gap-1 max-h-36 overflow-y-auto">
						{#each switchableUsers as u (u.id)}
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded-lg bg-surface/80 px-2.5 py-1.5 text-left text-xs transition hover:bg-surface-raised disabled:opacity-50"
								disabled={switchingId === u.id}
								onclick={() => doSwitch(u.id)}
							>
								<Avatar name={u.name} size="sm" />
								<span class="truncate font-medium text-ink">{u.name}</span>
								<span class="ml-auto text-[10px] text-ink-muted">({u.role})</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Aksi Kontrol (Ganti Tema & Logout) -->
			<div class="mt-2 grid grid-cols-2 gap-2 border-t border-border-base/50 pt-3">
				<button
					type="button"
					class="flex items-center justify-center gap-2 rounded-xl border border-border-base bg-surface-raised/50 py-2.5 text-xs font-semibold text-ink hover:bg-surface-raised active:scale-95 transition"
					onclick={toggleTheme}
				>
					<Icon name={theme === 'dark' ? 'moon' : 'sun'} size={16} />
					<span>{theme === 'dark' ? 'Tema Gelap' : 'Tema Terang'}</span>
				</button>

				<form method="POST" action="/logout" class="w-full">
					<button
						type="submit"
						class="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 py-2.5 text-xs font-semibold text-danger hover:bg-danger/20 active:scale-95 transition"
					>
						<Icon name="logout" size={16} />
						<span>Keluar</span>
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
