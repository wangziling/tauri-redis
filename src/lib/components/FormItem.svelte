<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import type { FormItemMessageInfo } from '$lib/types';
	import { lowerCase } from 'lodash-es';

	export let label = '';
	export let prop = '';
	export let required = false;
	export let name = `form-item-fake-name-${randomString(6)}`;

	let messageInfo: FormItemMessageInfo | undefined;

	$: isMessageInfoValid = !!(messageInfo && messageInfo.message);

	$: dynamicClasses = calcDynamicClasses([
		'form-item',
		{
			['form-item__prop-' + prop]: prop,
			'form-item--required': required
		},
		isMessageInfoValid ? 'form-item--message-' + lowerCase(messageInfo.type) : '',
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
	<div class="form-item-message">
		{#if isMessageInfoValid}
			{@html messageInfo.message}
		{/if}
	</div>
</div>
