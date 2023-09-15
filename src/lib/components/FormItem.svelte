<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';

	export let label = '';
	export let prop = '';
	export let required = false;
	export let name = `form-item-fake-name-${randomString(6)}`;
	export let errorMessage = '';

	let innerErrorMessage = errorMessage;

	$: dynamicClasses = calcDynamicClasses([
		'form-item',
		{
			['form-item__prop-' + prop]: prop,
			'form-item--error': innerErrorMessage,
			'form-item--required': required
		},
		$$restProps.class
	]);
</script>

<div class={dynamicClasses}>
	<div class="form-item-wrapper">
		<label class="form-item-label" for={name}>
			{#if label}
				{@html label}
			{:else}
				<slot name="label" />
			{/if}
		</label>
		<div class="form-item-content" id={name}>
			<slot />
		</div>
	</div>
	<div class="form-item-error">
		{@html innerErrorMessage}
	</div>
</div>
