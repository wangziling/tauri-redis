<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';

	export let name = `checkbox-${randomString(6)}`;
	export let label = '';

	$: dynamicClasses = calcDynamicClasses(['checkbox', $$restProps.class]);
</script>

<label for={name} class={dynamicClasses}>
	<input type="checkbox" {name} id={name} />
	{label}
</label>
