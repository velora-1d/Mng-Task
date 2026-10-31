<script lang="ts">
	import { page } from '$app/state';
	import Icon from '../ui/Icon.svelte';
	import Avatar from '../ui/Avatar.svelte';
	import type { IconName } from '../icons/icons';
	import type { UserRole } from '#lib/types';

	type Props = {
		user: { name: string; role: UserRole };
		orgName?: string;
		reminderCount?: number;
		open?: boolean;
		impersonating?: boolean;
	};

	let {
	user,
	orgName = 'Mng-Task',
	reminderCount = 0,
	open = $bindable(false),
	impersonating = false
}: Props = $props();

let restoring = $state(false);

async function returnToOwner() {
	restoring = true;
	try {
		const res = await fetch('/api/impersonate/stop', { method: 'POST' });
		if (res.ok) window.location.href = '/dashboard';
	} finally {
		restoring = false;
	}
}

	type NavItem = { href: string; label: string; icon: IconName; badge?: number; ownerOnly?: boolean };

	const mainNav = $derived<NavItem[]>([
		{ href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/tasks', label: 'Tugas', icon: 'tasks' },
		{ href: '/reports', label: 'Laporan', icon: 'report' },
		{ href: '/reminders', label: 'Pengingat', icon: 'bell', badge: reminderCount }
	]);

	const manageNav: NavItem[] = [
		{ href: '/users', label: 'Pengguna', icon: 'users', ownerOnly: true },
		{ href: '/settings', label: 'Pengaturan', icon: 'settings' }
	];

	const visibleManage = $derived(manageNav.filter((item) => !item.ownerOnly || user.role === 'OWNER'));
	const path = $derived(page.url.pathname);
	const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
</script>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-30 bg-[rgba(28,25,23,0.45)] backdrop-blur-[2px] lg:hidden"
		onclick={() => (open = false)}
		aria-label="Tutup menu"
	></button>
{/if}

<aside
	class={[
		'fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-w)] flex-col gap-6 border-r border-border-base bg-surface px-4 py-5 transition-transform duration-200',
		'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
		open ? 'translate-x-0 shadow-[var(--shadow-lg)]' : '-translate-x-full'
	].join(' ')}
	aria-label="Navigasi utama"
>
	<div class="flex items-center gap-2.5 px-2">
		<div
			class="grid size-[34px] place-items-center rounded-[9px] bg-primary font-[family-name:var(--font-display)] text-lg font-bold text-white"
		>
			M
		</div>
		<div class="min-w-0">
			<div class="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.02em] text-ink">
				Mng-Task
			</div>
			<div class="truncate text-[11px] text-ink-muted">{orgName}</div>
		</div>
		<button
			type="button"
			class="ml-auto grid size-8 place-items-center rounded-md text-ink-muted hover:bg-surface-raised lg:hidden"
			onclick={() => (open = false)}
			aria-label="Tutup menu"
		>
			<Icon name="close" size={16} />
		</button>
	</div>

	<nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
		<p class="px-2.5 pb-1.5 text-[11px] font-bold tracking-[0.09em] text-ink-muted uppercase">Menu</p>
		{#each mainNav as item (item.href)}
			<a
				href={item.href}
				class={[
					'relative flex h-[38px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium',
					isActive(item.href)
						? 'bg-primary-soft font-semibold text-primary'
						: 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
				].join(' ')}
				aria-current={isActive(item.href) ? 'page' : undefined}
				onclick={() => (open = false)}
			>
				{#if isActive(item.href)}
					<span class="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary"></span>
				{/if}
				<Icon name={item.icon} />
				{item.label}
				{#if item.badge && item.badge > 0}
					<span
						class="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-[#451a03]"
					>
						{item.badge}
					</span>
				{/if}
			</a>
		{/each}

		<p class="mt-4 px-2.5 pb-1.5 text-[11px] font-bold tracking-[0.09em] text-ink-muted uppercase">
			Kelola
		</p>
		{#each visibleManage as item (item.href)}
			<a
				href={item.href}
				class={[
					'relative flex h-[38px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium',
					isActive(item.href)
						? 'bg-primary-soft font-semibold text-primary'
						: 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
				].join(' ')}
				aria-current={isActive(item.href) ? 'page' : undefined}
				onclick={() => (open = false)}
			>
				{#if isActive(item.href)}
					<span class="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary"></span>
				{/if}
				<Icon name={item.icon} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="mt-auto flex flex-col gap-2">
		{#if impersonating}
			<button
				type="button"
				class="flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition active:scale-95 disabled:opacity-50"
				onclick={returnToOwner}
				disabled={restoring}
			>
				<Icon name="switchUser" size={15} />
				<span>{restoring ? 'Kembali…' : 'Kembali ke Owner'}</span>
			</button>
		{/if}

		<div class="flex items-center gap-1.5">
			<a
				href="/settings"
				class="flex flex-1 items-center gap-2.5 rounded-[10px] border border-border-base bg-canvas p-2 hover:bg-surface-raised min-w-0"
			>
				<Avatar name={user.name} />
				<div class="min-w-0 flex-1">
					<div class="truncate text-[13px] font-semibold text-ink">{user.name}</div>
					<div class="text-[11px] text-ink-muted">{user.role === 'OWNER' ? 'Owner' : 'User'}</div>
				</div>
			</a>

			<form method="POST" action="/logout">
				<button
					type="submit"
					class="grid size-10 place-items-center rounded-[10px] border border-border-base bg-canvas text-ink-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger transition active:scale-95"
					title="Keluar (Logout)"
					aria-label="Keluar"
				>
					<Icon name="logout" size={17} />
				</button>
			</form>
		</div>
	</div>
</aside>
