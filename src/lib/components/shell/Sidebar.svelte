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
		collapsed?: boolean;
		onToggleCollapse?: () => void;
	};

	let {
		user,
		orgName = 'Mng-Task',
		reminderCount = 0,
		impersonating = false,
		collapsed = false,
		onToggleCollapse
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

<aside
	class={[
		'hidden lg:flex lg:sticky lg:top-0 lg:h-screen flex-col gap-6 border-r border-border-base bg-surface py-5 transition-all duration-300 z-30',
		collapsed ? 'w-[72px] px-2 items-center' : 'w-[var(--sidebar-w)] px-4'
	].join(' ')}
	aria-label="Navigasi utama"
>
	{#if collapsed}
		<!-- Header Collapsed -->
		<div class="flex flex-col items-center gap-2.5">
			<div
				class="grid size-[34px] place-items-center rounded-[9px] bg-primary font-[family-name:var(--font-display)] text-lg font-bold text-white shadow-xs"
			>
				M
			</div>
			{#if onToggleCollapse}
				<button
					type="button"
					class="grid size-7 place-items-center rounded-md border border-border-base/70 text-ink-muted hover:bg-surface-raised hover:text-ink transition active:scale-95"
					onclick={onToggleCollapse}
					title="Bentangkan sidebar"
					aria-label="Bentangkan sidebar"
				>
					<Icon name="chevronRight" size={15} />
				</button>
			{/if}
		</div>
	{:else}
		<!-- Header Expanded -->
		<div class="flex items-center gap-2.5 px-2">
			<div
				class="grid size-[34px] place-items-center rounded-[9px] bg-primary font-[family-name:var(--font-display)] text-lg font-bold text-white shrink-0"
			>
				M
			</div>
			<div class="min-w-0 flex-1">
				<div class="font-[family-name:var(--font-display)] text-lg font-bold tracking-[-0.02em] text-ink truncate">
					Mng-Task
				</div>
				<div class="truncate text-[11px] text-ink-muted">{orgName}</div>
			</div>
			{#if onToggleCollapse}
				<button
					type="button"
					class="grid size-7 place-items-center rounded-md border border-border-base/70 text-ink-muted hover:bg-surface-raised hover:text-ink transition active:scale-95 shrink-0"
					onclick={onToggleCollapse}
					title="Ciutkan sidebar"
					aria-label="Ciutkan sidebar"
				>
					<Icon name="chevronLeft" size={15} />
				</button>
			{/if}
		</div>
	{/if}

	<nav class={['flex flex-1 flex-col gap-1 overflow-y-auto w-full', collapsed ? 'items-center' : ''].join(' ')}>
		{#if !collapsed}
			<p class="px-2.5 pb-1.5 text-[11px] font-bold tracking-[0.09em] text-ink-muted uppercase">Menu</p>
		{/if}

		{#each mainNav as item (item.href)}
			{@const active = isActive(item.href)}
			{#if collapsed}
				<a
					href={item.href}
					class={[
						'relative grid size-10 place-items-center rounded-xl transition active:scale-95',
						active
							? 'bg-primary text-white shadow-xs font-bold'
							: 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
					].join(' ')}
					aria-current={active ? 'page' : undefined}
					title={item.label}
				>
					<Icon name={item.icon} size={19} />
					{#if item.badge && item.badge > 0}
						<span
							class="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#451a03] shadow-xs"
						>
							{item.badge}
						</span>
					{/if}
				</a>
			{:else}
				<a
					href={item.href}
					class={[
						'relative flex h-[38px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition',
						active
							? 'bg-primary-soft font-semibold text-primary'
							: 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
					].join(' ')}
					aria-current={active ? 'page' : undefined}
				>
					{#if active}
						<span class="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary"></span>
					{/if}
					<Icon name={item.icon} />
					<span class="truncate">{item.label}</span>
					{#if item.badge && item.badge > 0}
						<span
							class="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-[#451a03]"
						>
							{item.badge}
						</span>
					{/if}
				</a>
			{/if}
		{/each}

		{#if collapsed}
			<div class="my-2 h-px w-6 bg-border-base/70"></div>
		{:else}
			<p class="mt-4 px-2.5 pb-1.5 text-[11px] font-bold tracking-[0.09em] text-ink-muted uppercase">
				Kelola
			</p>
		{/if}

		{#each visibleManage as item (item.href)}
			{@const active = isActive(item.href)}
			{#if collapsed}
				<a
					href={item.href}
					class={[
						'relative grid size-10 place-items-center rounded-xl transition active:scale-95',
						active
							? 'bg-primary text-white shadow-xs font-bold'
							: 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
					].join(' ')}
					aria-current={active ? 'page' : undefined}
					title={item.label}
				>
					<Icon name={item.icon} size={19} />
				</a>
			{:else}
				<a
					href={item.href}
					class={[
						'relative flex h-[38px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition',
						active
							? 'bg-primary-soft font-semibold text-primary'
							: 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
					].join(' ')}
					aria-current={active ? 'page' : undefined}
				>
					{#if active}
						<span class="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary"></span>
					{/if}
					<Icon name={item.icon} />
					<span class="truncate">{item.label}</span>
				</a>
			{/if}
		{/each}
	</nav>

	<div class={['mt-auto flex flex-col gap-2 w-full', collapsed ? 'items-center' : ''].join(' ')}>
		{#if impersonating}
			{#if collapsed}
				<button
					type="button"
					class="grid size-10 place-items-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition active:scale-95"
					onclick={returnToOwner}
					title="Kembali ke Owner"
					aria-label="Kembali ke Owner"
				>
					<Icon name="switchUser" size={16} />
				</button>
			{:else}
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
		{/if}

		{#if collapsed}
			<div class="flex flex-col items-center gap-2">
				<a
					href="/settings"
					class="grid size-9 place-items-center rounded-full transition active:scale-95"
					title={`${user.name} (${user.role === 'OWNER' ? 'Owner' : 'User'})`}
				>
					<Avatar name={user.name} size="sm" />
				</a>

				<form method="POST" action="/logout">
					<button
						type="submit"
						class="grid size-9 place-items-center rounded-lg border border-border-base bg-canvas text-ink-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger transition active:scale-95"
						title="Keluar (Logout)"
						aria-label="Keluar"
					>
						<Icon name="logout" size={16} />
					</button>
				</form>
			</div>
		{:else}
			<div class="flex items-center gap-1.5">
				<a
					href="/settings"
					class="flex flex-1 items-center gap-2.5 rounded-[10px] border border-border-base bg-canvas p-2 hover:bg-surface-raised min-w-0 transition"
					title="Pengaturan akun"
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
		{/if}
	</div>
</aside>
