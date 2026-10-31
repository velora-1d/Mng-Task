<script lang="ts">
	type Props = {
		name: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	};

	let { name, size = 'md', class: cls = '' }: Props = $props();

	const SIZES = { sm: 'size-7 text-[10px]', md: 'size-8 text-xs', lg: 'size-10 text-sm' };

	const COLORS = [
		'var(--primary)',
		'#2563eb',
		'#0284c7',
		'#0d9488',
		'#16a34a',
		'#0369a1'
	];

	function initials(value: string): string {
		const parts = value.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}

	function color(value: string): string {
		let hash = 0;
		for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 997;
		return COLORS[hash % COLORS.length];
	}
</script>

<span
	class={[
		'inline-grid shrink-0 place-items-center rounded-full font-bold text-white',
		SIZES[size],
		cls
	].join(' ')}
	style:background={color(name)}
	aria-hidden="true"
	title={name}
>
	{initials(name)}
</span>
