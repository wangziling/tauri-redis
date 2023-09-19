<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';

	export let name = `checkbox-${calcRandomCompNameSuffix()}`;
	export let label = '';

	$: dynamicClasses = calcDynamicClasses(['checkbox', $$restProps.class]);
</script>

<label for={name} class={dynamicClasses}>
	<input type="checkbox" {name} id={name} />
	{label}
</label>
