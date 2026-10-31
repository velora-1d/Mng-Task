<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import Topbar from './Topbar.svelte';
	import type { UserRole } from '#lib/types';

	type Props = {
		user: { name: string; role: UserRole };
		orgName?: string;
		reminderCount?: number;
		children: Snippet;
	};

	let { user, orgName = 'Mng-Task', reminderCount = 0, children }: Props = $props();

	let menuOpen = $state(false);
</script>

<div class="min-h-screen lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
	<Sidebar bind:open={menuOpen} {user} {orgName} {reminderCount} />

	<div class="flex min-w-0 flex-col">
		<Topbar {user} {reminderCount} onmenu={() => (menuOpen = true)} />

		<main class="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
			{@render children()}
		</main>
	</div>
</div>
