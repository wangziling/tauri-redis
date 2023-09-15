<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';

	export let name = `form-${randomString(6)}`;
	export let labelPosition: 'top' | 'left' = 'top';

	$: dynamicClasses = calcDynamicClasses([
		'form',
		{
			['form--label-pos-' + labelPosition]: labelPosition
		},
		$$restProps.class
	]);
</script>

<form class={dynamicClasses} {name} action="#" on:submit|preventDefault|stopPropagation>
	<slot />
</form>
