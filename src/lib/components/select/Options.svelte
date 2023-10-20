<script lang="ts">
	import type { SelectOptions, SelectOptionItem } from '$lib/types';
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let options: SelectOptions = [];
	export let hideInvalidOptions = false;
	export let unmatchedNotice = '';
	export let selectedValue = Symbol('selectedValue');
	export let appendToBody = true;

	let el: null | HTMLElement = null;

	function judgeOptionInvalid(option: SelectOptionItem) {
		return options && typeof option.label === 'string' && option.label && option.value;
	}

	function calcSelectOptionClass(option: SelectOptionItem, selected: SelectOptionItem['value'] | any) {
		return calcDynamicClasses([
			'select-option',
			{
				'select-option--selected': option.value === selected
			}
		]);
	}

	function handleChooseOptionItem(option: SelectOptionItem) {
		dispatch('chooseOptionItem', { option });
	}

	function calcElRect() {
		// @ts-ignore
		const parent = el._originParentEl || el.parentElement;
		if (parent) {
			// @ts-ignore
			el._originParentEl = parent;

			const rect = parent.getBoundingClientRect();

			el.style.left = rect.left + 'px';
			el.style.top = rect.top + rect.height + 'px';
			el.style.width = rect.width + 'px';
		}
	}

	$: dynamicClasses = calcDynamicClasses(['select-options', $$restProps.class]);

	onMount(function onMount() {
		if (appendToBody) {
			// Calc twice.
			// Before append and after append.
			tick()
				.finally(calcElRect)
				.finally(() => document.body.appendChild(el))
				.finally(calcElRect);
		}
	});

	onDestroy(function onDestroy() {
		if (appendToBody) {
			document.body.removeChild(el);
		}
	});
</script>

<div class={dynamicClasses} bind:this={el}>
	{#each options as option}
		{@const isOptionValid = judgeOptionInvalid(option)}
		{#if isOptionValid || !hideInvalidOptions}
			<div class={calcSelectOptionClass(option, selectedValue)} on:click={handleChooseOptionItem.bind(this, option)}>
				{@html option.label}
			</div>
		{/if}
	{:else}
		<div class="select-option select-option--disabled">{@html unmatchedNotice}</div>
	{/each}
</div>
