<script lang="ts">
	import { page } from '$app/state';
	import Icon from '../ui/Icon.svelte';
	import type { IconName } from '../icons/icons';
	import type { UserRole } from '#lib/types';

	type Props = {
		user: { name: string; role: UserRole };
		reminderCount?: number;
		onmenu?: () => void;
	};

	let { user, reminderCount = 0, onmenu }: Props = $props();

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
		{ href: '/reports', label: 'Laporan', icon: 'report' },
		...(user.role === 'OWNER'
			? [{ href: '/users', label: 'Pengguna', icon: 'users' as IconName }]
			: []),
		{ href: '/settings', label: 'Pengaturan', icon: 'settings' }
	]);

	const path = $derived(page.url.pathname);
	const isActive = (href: string) => path === href || (href !== '/dashboard' && path.startsWith(`${href}/`));
</script>

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
				<Icon name={item.icon} size={19} class={active ? 'stroke-[2.2]' : ''} />
				{#if item.badge && item.badge > 0}
					<span
						class="absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#451a03]"
					>
						{item.badge}
					</span>
				{/if}
			</div>
			<span class="text-[10px] sm:text-[11px] leading-tight tracking-tight truncate max-w-[64px]">
				{item.label}
			</span>
			{#if active}
				<span class="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-primary" aria-hidden="true"></span>
			{/if}
		</a>
	{/each}
</nav>
