import type { Action } from 'svelte/action';
import { tick } from 'svelte';
import { has } from 'lodash-es';

export type ActionsFocusWhenMountParams = Partial<{
	useNextTick: boolean;
	useSetTimeout: boolean;
	bubbles: boolean;

	condition: boolean;
}>;

export type ActionsFocusWhenMountReturnParams = Partial<{
	e: Event;
	target: HTMLElement;
}>;

export type ActionsFocusWhenMountAttributes = {
	'on:focus': (e: CustomEvent<ActionsFocusWhenMountReturnParams>) => void;
};

export const focusWhenMount: Action<HTMLElement, ActionsFocusWhenMountParams, ActionsFocusWhenMountAttributes> =
	function focusWhenMount(node, params) {
		const handler = function handler(config: typeof params) {
			const mainTask = function mainTask() {
				if (config.useNextTick) {
					tick().then(function tickThenFocus() {
						node.focus();
					});

					return;
				}

				if (config.useSetTimeout) {
					setTimeout(function timeoutFocus() {
						node.focus();
					});

					return;
				}

				node.focus();
			};

			if (!has(config, 'condition')) {
				mainTask();

				return;
			}

			if (config.condition) {
				mainTask();

				return;
			}
		};

		handler(params);

		return {
			update(newParams: typeof params) {
				if (newParams.condition != params.condition) {
					handler(newParams);
				}
			}
		};
	};
