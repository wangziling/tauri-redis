<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import type { SelectOptionItem, SelectOptions } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import Input from '$lib/components/Input.svelte';

	const initialSelectedValue = Symbol('initialSelectedValue');
	const dispatch = createEventDispatcher();

	export let disabled = false;
	export let readonly = disabled;
	export let name = `input-${randomString(6)}`;
	export let searchPlaceholder = 'Search...';
	export let searchable = false;
	export let defaultOptionVisible = false;
	export let hideInvalidOptions = false;
	export let options: SelectOptions = [];
	export let value: any = initialSelectedValue;
	export let emptyNotice = 'Empty.';
	export let unmatchedNotice = 'Unmatched.';

	let optionVisible = defaultOptionVisible;
	let searchContent = '';
	let selectedValue: any | symbol = value;

	$: dynamicClasses = calcDynamicClasses([
		'select',
		{
			'select--disabled': disabled,
			'select--readonly': readonly
		},
		$$restProps.class
	]);

	$: grepedOptions = searchContent
		? options.filter((o) => o.label && o.label.toLowerCase().includes(searchContent.toLowerCase()))
		: options;

	$: {
		selectedValue = value;
	}

	function judgeOptionInvalid(option: SelectOptionItem) {
		return options && typeof option.label === 'string' && option.label && option.value;
	}

	function handleChooseOptionItem(option: SelectOptionItem) {
		if (disabled) {
			return;
		}

		selectedValue = option.value;

		dispatch('setValue', selectedValue);
	}

	function calcSelectOptionClass(option: SelectOptionItem) {
		return calcDynamicClasses([
			'select-option',
			{
				'select-option--selected': option.value === selectedValue
			}
		]);
	}

	function handleChangeSearchContent(e: CustomEvent<string>) {
		searchContent = e.detail;
	}
</script>

<div class={dynamicClasses}>
	<div class="select-wrapper">
		<div class="select-container">
			{#if searchable}
				<Input
					class="select-search-input"
					{name}
					id={name}
					{disabled}
					{readonly}
					placeholder={searchPlaceholder}
					on:input={handleChangeSearchContent}
				/>
			{/if}
		</div>
		<div class="select-options">
			{#each grepedOptions as option}
				{@const isOptionValid = judgeOptionInvalid(option)}
				{#if isOptionValid || !hideInvalidOptions}
					<div
						class={calcSelectOptionClass(option)}
						on:click={handleChooseOptionItem.bind(this, option)}
					>
						{@html option.label}
					</div>
				{/if}
			{:else}
				<div class="select-option select-option--disabled">
					{@html searchContent ? unmatchedNotice : emptyNotice}
				</div>
			{/each}
		</div>
	</div>
</div>
