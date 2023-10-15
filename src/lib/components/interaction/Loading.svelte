<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';

	export let fullscreen = false;
	export let visible = true;
	export let content = translator.translate('loading|Loading...');

	$: dynamicClasses = calcDynamicClasses([
		'loading',
		{
			'loading--fullscreen': fullscreen,
			'loading--visible': visible
		},
		$$restProps.class
	]);
</script>

<div class={dynamicClasses}>
	<div class="loading-wrapper">
		<span class="loading__spinner fa fa-spinner fa-spin" />
		{#if content}
			<div class="loading__content">{@html content}</div>
		{:else if $$slots.content}
			<div class="loading__content">
				<slot name="content" />
			</div>
		{/if}
	</div>
</div>
