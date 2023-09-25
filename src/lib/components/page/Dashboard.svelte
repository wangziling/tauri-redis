<script lang="ts">
	import type { MainTab, MainTabType } from '$lib/types';
	import { calcDynamicClasses } from '$lib/utils/calculators';

	export let data: Extract<MainTab, { type: MainTabType.Dashboard }>['data'] = {} as any;

	$: dynamicClasses = calcDynamicClasses(['tauri-redis-tab', 'tauri-redis-tab__dashboard', $$restProps.class]);

	$: stringifiedData = JSON.stringify(data);
</script>

<div class={dynamicClasses}>
	{@html stringifiedData}
</div>
