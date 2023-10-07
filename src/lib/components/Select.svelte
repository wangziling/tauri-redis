<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import type { SelectOptionItem, SelectOptions } from '$lib/types';
	import { createEventDispatcher, tick } from 'svelte';
	import Input from '$lib/components/Input.svelte';
	import { clickOutside } from '$lib/actions/click-outside';
	import { writable } from 'svelte/store';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';

	const initialSelectedValue = Symbol('initialSelectedValue');
	const dispatch = createEventDispatcher();
	const defaultName = `select-${calcRandomCompNameSuffix()}`;

	export let disabled = false;
	export let readonly = disabled;
	export let loading = false;
	export let name = defaultName;
	export let searchPlaceholder = 'Search...';
	export let searchable = false;
	export let defaultOptionsVisible = false;
	export let hideInvalidOptions = false;
	export let options: SelectOptions = [];
	// Is a pure component, will not change the prop-value straightly
	export let pure = false;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value: any = initialSelectedValue;
	export let emptyNotice = 'Empty.';
	export let unmatchedNotice = 'Unmatched.';

	let optionsVisible = defaultOptionsVisible;
	let searchContent = '';
	let selectedValue: any | symbol = value;
	let inputIns: null | Input = null;

	const nameWatched = writable(name);
	$: nameWatched.set(name);
	const disabledWatched = writable(disabled);
	$: disabledWatched.set(disabled);
	const readonlyWatched = writable(readonly);
	$: readonlyWatched.set(readonly);
	const loadingWatched = writable(loading);
	$: loadingWatched.set(loading);
	const pureWatched = writable(pure);
	$: pureWatched.set(pure);

	const formItemFieldMisc = initialFormItemFieldMisc(
		{ disabledWatched, readonlyWatched, loadingWatched, nameWatched, defaultName, pureWatched },
		{ fieldType: 'select' }
	);
	const isFormItemFieldMiscValid = formItemFieldMisc.metrics.valid;
	const {
		finalNameDerived,
		finalLoadingDerived,
		finalReadonlyDerived,
		finalDisabledDerived,
		isNameOrFormFieldPropPresetDerived,
		isPuredDerived,
		miscClasses
	} = formItemFieldMisc.getters;

	$: dynamicClasses = calcDynamicClasses([
		'select',
		{
			'select--disabled': $finalDisabledDerived,
			'select--readonly': $finalReadonlyDerived,
			'select--loading': $finalLoadingDerived,
			'select--options-visible': optionsVisible,
			'select--searchable': searchable,
			'select--valued': selectedValue !== initialSelectedValue
		},
		$$restProps.class,
		miscClasses
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
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		selectedValue = option.value;
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				selectedValue = value;

				return;
			}

			formItemFieldMisc.events.handleFieldSetValue(selectedValue, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = selectedValue;
		}

		dispatch('input', selectedValue);

		hideOptions();
	}

	function calcSelectOptionClass(option: SelectOptionItem, selected: typeof selectedValue) {
		return calcDynamicClasses([
			'select-option',
			{
				'select-option--selected': option.value === selected
			}
		]);
	}

	function handleClickSearchInput(e: CustomEvent<Event>) {
		e.detail.stopPropagation();
		e.detail.preventDefault();
	}

	function handleFocusSearchInput(e: CustomEvent<Event>) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldFocus(e);
		}

		dispatch('focus', e);
	}

	function handleBlurSearchInput(e: CustomEvent<Event>) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleClickContainer() {
		return toggleOptionsVisible();
	}

	function handleClickOutSide() {
		hideOptions();
	}

	export const focus = function focus() {
		optionsVisible = true;
		if (optionsVisible && searchable) {
			tick().then(() => {
				inputIns && inputIns.focus();
			});
		}
	};

	export const blur = function blur() {
		optionsVisible = false;
	};

	export function toggleOptionsVisible() {
		optionsVisible = !optionsVisible;

		if (optionsVisible && searchable) {
			tick().then(() => {
				inputIns && inputIns.focus();
			});
		}
	}

	export function showOptions() {
		optionsVisible = true;

		if (searchable) {
			tick().then(() => {
				inputIns && inputIns.focus();
			});
		}
	}

	export function hideOptions() {
		optionsVisible = false;
		searchContent = '';
	}
</script>

<div class={dynamicClasses} use:clickOutside on:outside={handleClickOutSide}>
	<div class="select-wrapper">
		<div class="select-container" on:click={handleClickContainer}>
			<div class="select-selector">
				<div class="select-value">{selectedValue}</div>
				{#if searchable}
					<Input
						class="select-search-input"
						name={$finalNameDerived}
						id={$finalNameDerived}
						disabled={$finalDisabledDerived}
						readonly={$finalReadonlyDerived}
						placeholder={searchPlaceholder}
						bind:this={inputIns}
						on:click={handleClickSearchInput}
						on:focus={handleFocusSearchInput}
						on:blur={handleBlurSearchInput}
						bind:value={searchContent}
						pure={false}
					/>
				{/if}
			</div>
			<div class="select-operations">
				<span class="select-operation select-operation__arrow fa fa-angle-down" />
			</div>
		</div>
		<div class="select-options">
			{#each grepedOptions as option}
				{@const isOptionValid = judgeOptionInvalid(option)}
				{#if isOptionValid || !hideInvalidOptions}
					<div
						class={calcSelectOptionClass(option, selectedValue)}
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
