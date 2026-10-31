<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Toaster from '#lib/components/ui/Toaster.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="Mng-Task — kelola tugas tim tanpa ribet." />
</svelte:head>

{@render children()}
<Toaster />
