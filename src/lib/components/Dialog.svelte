<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '$lib/actions/click-outside';
	import {
		globalKeyboard,
		type ActionsGlobalKeyboardReturnParams
	} from '$lib/actions/global-keyboard';
	import { calcDynamicClasses } from '$lib/utils/calculators';

	export let header = '';
	export let content = '';
	export let layered = true;
	export let headerCentered = true;
	export let footerPosition: 'left' | 'right' | 'center' = 'left';
	export let still = false;

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

	function handleClickClose() {
		shown = false;

		dispatch.apply(this, ['close', ...arguments]);
	}

	function handleKeyupClose(e: KeyboardEvent) {
		if (e.keyCode === 13 || e.key === 'Enter' || e.keyCode === 32 || e.key === 'Space') {
			handleClickClose();
		}
	}

	function handleClickOutside() {
		if (still) {
			dispatch.apply(this, ['outside', ...arguments]);
			return;
		}

		handleClickClose();
	}

	function handleGlobalKeyup(e: CustomEvent<ActionsGlobalKeyboardReturnParams>) {
		if (still) {
			dispatch(this, e.detail.eventName, e);
			return;
		}

		if (e.detail.config.key === 'Escape') {
			handleClickClose();
		}
	}
</script>

<dialog class={dynamicClasses} open={shown}>
	<div
		class="dialog-wrapper"
		use:clickOutside
		use:globalKeyboard={{ key: 'Escape', type: 'keyup' }}
		on:globalKeyup={handleGlobalKeyup}
		on:outside={handleClickOutside}
	>
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
					<span
						class="dialog-header-operation dialog-header-operation__close fa fa-xmark"
						role="button"
						aria-label="close"
						tabindex="0"
						on:click|stopPropagation={handleClickClose}
						on:keyup|stopPropagation={handleKeyupClose}
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
