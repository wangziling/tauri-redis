<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import type { MainTabs } from '$lib/types';
	import Dashboard from '$lib/components/page/Dashboard.svelte';
	import { MainTabType } from '$lib/types';

	export let tabs: MainTabs = [];

	$: dynamicClasses = calcDynamicClasses(['tauri-redis-content', $$restProps.class]);
</script>

<div class={dynamicClasses}>
	{#each tabs as tab}
		{#if tab['type'] === MainTabType.Dashboard}
			<Dashboard class="tauri-redis-tab tauri-redis-tab__dashboard" bind:data={tab.data} />
		{/if}
	{/each}
</div>
