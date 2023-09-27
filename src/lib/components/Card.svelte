<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';

	export let shadowStill = true;

	$: dynamicClasses = calcDynamicClasses([
		'card',
		{
			'card--shadow-still': shadowStill
		},
		$$restProps.class
	]);
</script>

<div class={dynamicClasses}>
	<div class="card-wrapper">
		{#if $$slots.header}
			<div class="card__header">
				<slot name="header" />
			</div>
		{/if}
		<div class="card__body">
			<slot />
		</div>
	</div>
</div>
