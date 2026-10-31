<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import { ICONS, type IconName } from '../icons/icons';

	type Props = Omit<SVGAttributes<SVGSVGElement>, 'children'> & {
		name: IconName;
		size?: number;
	};

	let { name, size = 18, class: cls = '', ...rest }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={cls}
	aria-hidden="true"
	focusable="false"
	{...rest}
>
	{@html ICONS[name]}
</svg>
