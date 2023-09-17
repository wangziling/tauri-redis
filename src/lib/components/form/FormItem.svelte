<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import type { FormField, FormItemMessageInfo } from '$lib/types';
	import { lowerCase } from 'lodash-es';
	import { getContext, onDestroy, onMount } from 'svelte';
	import {
		contextStoreKey,
		type createStore,
		getFieldPropPathValue
	} from '$lib/components/form/context';

	export let label = '';
	export let prop = '';
	export let required = false;
	export let name = `form-item-fake-name-${randomString(6)}`;
	export let rules: FormField['rules'] = [];

	const contextStore = getContext(contextStoreKey) as ReturnType<typeof createStore>;

	let messageInfo: FormItemMessageInfo | undefined;
	contextStore.subscribe(function subscribe(state) {
		messageInfo = getFieldPropPathValue(state, { name }, 'messageInfo');
	});

	let loading = false;
	contextStore.subscribe(function subscribe(state) {
		loading = getFieldPropPathValue(state, { name }, 'loading');
	});

	$: isMessageInfoValid = !!(messageInfo && messageInfo.message);

	$: innerRules = required
		? rules.some(function (rule) {
				return rule.required;
		  })
			? rules
			: (rules.push({ required: true }), rules)
		: rules;

	$: innerRequired = rules.some(function (rule) {
		return rule.required;
	});

	$: dynamicClasses = calcDynamicClasses([
		'form-item',
		{
			['form-item__prop-' + prop]: prop,
			'form-item--required': innerRequired,
			'form-item--loading': loading
		},
		isMessageInfoValid ? 'form-item--message-' + lowerCase(messageInfo.type) : '',
		$$restProps.class
	]);

	onMount(function onMount() {
		contextStore.mutations.registerField({
			prop,
			name,
			required: innerRequired,
			loading,
			rules: innerRules,
			messageInfo
		});

		// contextStore.utils.updateRegisteredField({ name }, function setMessageInfo(field) {
		// 	if (!field) {
		// 		return;
		// 	}
		//
		// 	field.messageInfo = {
		// 		type: FormItemMessageType.Info,
		// 		message: '123'
		// 	};
		// });
	});
	onDestroy(function onDestroy() {
		contextStore.mutations.unregisterField({
			name
		});
	});
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
