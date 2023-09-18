import type { Action } from 'svelte/action';

export type ActionsClickOutsideParams = Partial<{
	dock: HTMLElement; // Default document.body
	acceptableAncestor: HTMLElement;
	bubbles: boolean;
}>;

export type ActionsClickOutsideReturnParams = Partial<{
	currentTarget: HTMLElement; // Default document.body
	target: HTMLElement;
	e: Event;
}>;

export type ActionsClickOutsideAttributes = {
	'on:outside': (e: CustomEvent<ActionsClickOutsideReturnParams>) => void;
};

export const clickOutside: Action<HTMLElement, ActionsClickOutsideParams, ActionsClickOutsideAttributes> =
	function clickOutside(node, params) {
		const initialize = function initialize(config: typeof params) {
			const dockElement = config?.dock instanceof HTMLElement ? config!.dock : document.body;
			const handler = function handler(e: Event) {
				if (!e.target) {
					return;
				}

				if (node.contains(e.target as HTMLElement)) {
					return;
				}

				if (config?.acceptableAncestor instanceof HTMLElement && config!.acceptableAncestor.contains(node)) {
					return;
				}

				// Emit.
				node.dispatchEvent(
					new CustomEvent('outside', {
						detail: { currentTarget: dockElement, target: node, e },
						bubbles: config?.bubbles
					})
				);
			};

			const install = function install() {
				if (result.enabled) {
					return;
				}

				dockElement.addEventListener('click', handler);
				result.enabled = true;
			};

			const uninstall = function uninstall() {
				if (!result.enabled) {
					return;
				}

				dockElement.removeEventListener('click', handler);
				result.enabled = false;
			};

			const result = {
				install,
				uninstall,
				enabled: false
			};

			return result;
		};

		let handle = initialize(params);
		// Need setTimeout.
		//
		// I don't know why after install().
		// The previous click event which lets this action enabled,
		// it will be executed again or in another word trigger the 'click' again.
		//
		// Oh, maybe after install(), it added the event to the body.
		// The previous click event hadn't bubbled to the body yet.
		// So it triggers the body 'click' event.
		setTimeout(function () {
			// Initialize.
			handle.install();
		});

		return {
			update(newParams) {
				handle.uninstall();

				// New handle.
				handle = initialize(newParams);
				handle.install();
			},
			destroy() {
				handle.uninstall();
			}
		};
	};
