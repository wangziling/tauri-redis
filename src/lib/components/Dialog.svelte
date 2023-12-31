<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '$lib/actions/click-outside';
	import { keyboard, type ActionsKeyboardReturnParams } from '$lib/actions/keyboard';
	import { focusWhenMount } from '$lib/actions/focus-when-mount';
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import Icon from '$lib/components/Icon.svelte';

	export let header = '';
	export let content = '';
	export let layered = true;
	export let headerCentered = true;
	export let footerPosition: 'left' | 'right' | 'center' = 'left';
	export let still = false;
	export let focusWhenShown = true;

	let shown = true;

	$: dynamicClasses = calcDynamicClasses([
		'dialog',
		{
			'dialog--layered': layered,
			'dialog--header-centered': headerCentered,
			'dialog--header-empty': !($$slots.header || header),
			'dialog--content-empty': !($$slots.default || content),
			'dialog--footer-empty': !$$slots.footer,
			['dialog--footer-pos-' + footerPosition]: footerPosition,
			'dialog--shown': shown
		},
		$$restProps.class
	]);

	const dispatch = createEventDispatcher();

	function handleClickClose(e: Event) {
		shown = false;

		e.stopPropagation();

		dispatch.apply(this, ['close', ...arguments]);
	}

	function handleKeyupClose(e: KeyboardEvent) {
		if (e.keyCode === 13 || e.key === 'Enter' || e.keyCode === 32 || e.key === 'Space') {
			return handleClickClose(e);
		}

		e.stopPropagation();
	}

	function handleClickOutside(e: Event) {
		if (still) {
			e.stopPropagation();
			dispatch.apply(this, ['outside', ...arguments]);

			return;
		}

		handleClickClose(e);
	}

	function handleWindowKeyup(e: CustomEvent<ActionsKeyboardReturnParams>) {
		if (e.detail.config.key === 'Escape') {
			if (still) {
				e.stopPropagation();
				dispatch(this, e.detail.eventName, e);

				return;
			}

			handleClickClose(e);
		}
	}
</script>

<svelte:window use:keyboard={{ key: 'Escape', type: 'keyup' }} on:keyboardKeyup={handleWindowKeyup} />
<dialog class={dynamicClasses} use:focusWhenMount={{ condition: shown && focusWhenShown }} open={shown}>
	<div class="dialog-wrapper" use:clickOutside on:outside={handleClickOutside}>
		<div class="dialog-header">
			<div class="dialog-header-wrapper">
				<div class="dialog-header-content">
					{#if header}
						{@html header}
					{:else}
						<slot name="header" />
					{/if}
				</div>
				<div class="dialog-header-operations">
					<Icon
						class="dialog-header-operation dialog-header-operation__close fa fa-xmark"
						role="button"
						aria-label="close"
						tabindex="0"
						on:click={handleClickClose}
						on:keyup={handleKeyupClose}
					/>
				</div>
			</div>
		</div>
		<div class="dialog-content">
			{#if content}
				{@html content}
			{:else}
				<slot />
			{/if}
		</div>
		<div class="dialog-footer">
			<slot name="footer" />
		</div>
	</div>
</dialog>
