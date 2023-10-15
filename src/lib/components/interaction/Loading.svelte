<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';

	const defaultContent = translator.translateDerived('loading|Loading...');

	export let fullscreen = false;
	export let visible = true;
	export let content: string | undefined = undefined;

	$: innerContent = content ?? $defaultContent;

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
		{#if $$slots.content}
			<div class="loading__content">
				<slot name="content" />
			</div>
		{:else if innerContent}
			<div class="loading__content">{@html innerContent}</div>
		{/if}
	</div>
</div>
