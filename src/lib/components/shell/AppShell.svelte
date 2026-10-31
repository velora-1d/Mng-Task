<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import Topbar from './Topbar.svelte';
	import Bottombar from './Bottombar.svelte';
	import ImpersonateBanner from './ImpersonateBanner.svelte';
	import type { UserRole } from '#lib/types';

	type Props = {
		user: { name: string; role: UserRole };
		orgName?: string;
		reminderCount?: number;
		impersonating?: boolean;
		switchableUsers?: { id: string; name: string; email: string; role: string }[];
		children: Snippet;
	};

	let { user, orgName = 'Mng-Task', reminderCount = 0, impersonating = false, switchableUsers = [], children }: Props = $props();

	let collapsed = $state(false);

	onMount(() => {
		try {
			collapsed = localStorage.getItem('mngtask-sidebar-collapsed') === 'true';
		} catch {
			/* localStorage aman */
		}
	});

	function toggleCollapse() {
		collapsed = !collapsed;
		try {
			localStorage.setItem('mngtask-sidebar-collapsed', String(collapsed));
		} catch {
			/* localStorage aman */
		}
	}
</script>

{#if impersonating}
	<ImpersonateBanner userName={user.name} />
{/if}

<div
	class={[
		'min-h-screen transition-all duration-300',
		collapsed
			? 'lg:grid lg:grid-cols-[72px_minmax(0,1fr)]'
			: 'lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]'
	].join(' ')}
	style={impersonating ? 'padding-top: 40px' : ''}
>
	<Sidebar
		{user}
		{orgName}
		{reminderCount}
		{impersonating}
		{collapsed}
		onToggleCollapse={toggleCollapse}
	/>

	<div class="flex min-w-0 flex-col">
		<Topbar
			{user}
			{reminderCount}
			{switchableUsers}
			sidebarCollapsed={collapsed}
			onToggleSidebar={toggleCollapse}
		/>

		<main class="w-full flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
			{@render children()}
		</main>

		<Bottombar {user} {reminderCount} {switchableUsers} />
	</div>
</div>
