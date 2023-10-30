<script lang="ts">
	import { calcDynamicClasses, omitRestProps } from '$lib/utils/calculators';

	export let still: boolean = false;

	export let role: string = '';

	$: dynamicClasses = calcDynamicClasses([
		'icon',
		{
			'icon--still': still,
			['icon--role-' + role]: role
		},
		$$restProps.class
	]);
</script>

<span class={dynamicClasses} {role} {...omitRestProps($$restProps)} on:click on:keyup on:keydown on:keypress />
