import type { TArrayOrPrimitive } from '$lib/types';
import type { Action } from 'svelte/action';
import { isMatch, uniqWith, forEach, cloneDeep, capitalize } from 'lodash-es';

type ActionsKeyboardParamsKey = 'keyup' | 'keydown' | 'keypress';
type ActionsKeyboardParamsEventName = `keyboard${Capitalize<ActionsKeyboardParamsKey>}`;
type ActionsKeyboardAttributesEventName = `on:${ActionsKeyboardParamsEventName}`;

export type ActionsKeyboardParams = {
	type: ActionsKeyboardParamsKey;
	target?: HTMLElement | Window; // Default current node.
	key?: string;
	/**@deprecated*/
	keyCode?: number;
};

export type ActionsKeyboardReturnParams = {
	e: KeyboardEvent;
	config: ActionsKeyboardParams;
	eventName: ActionsKeyboardParamsEventName;
};

export type ActionsKeyboardAttributes = {
	[key in ActionsKeyboardAttributesEventName]: (
		e: CustomEvent<ActionsKeyboardReturnParams>
	) => void;
};

type ActionsKeyboardHandlerItem = ActionsKeyboardParams & {
	_$_handle_$_?: (...args: any[]) => any;
};

export const keyboard: Action<
	HTMLElement | Window,
	TArrayOrPrimitive<ActionsKeyboardParams>,
	ActionsKeyboardAttributes
> = function keyboard(node, params) {
	const initialize = function initialize(options: TArrayOrPrimitive<ActionsKeyboardParams>) {
		const config = cloneDeep(
			uniqWith(([] as any[]).concat(options), isMatch)
		) as Array<ActionsKeyboardHandlerItem>;

		const handlerGenerator = function handlerGenerator(p: ActionsKeyboardHandlerItem) {
			p._$_handle_$_ = function handler(e: KeyboardEvent) {
				if (p.key) {
					if (p.key === e.key) {
						node.dispatchEvent(
							new CustomEvent(`keyboard${capitalize(p.type)}`, { detail: { e, config: p } })
						);
					}

					return;
				}

				if (p.keyCode) {
					if (p.keyCode === e.keyCode) {
						node.dispatchEvent(
							new CustomEvent(`keyboard${capitalize(p.type)}`, { detail: { e, config: p } })
						);
					}

					return;
				}

				node.dispatchEvent(
					new CustomEvent(`keyboard${capitalize(p.type)}`, { detail: { e, config: p } })
				);
			};

			return p._$_handle_$_;
		};

		const getTarget = function getTarget(cfg: ActionsKeyboardHandlerItem) {
			return cfg.target instanceof HTMLElement || cfg.target === window ? cfg.target : node;
		};

		const install = function install() {
			if (result.enabled) {
				return;
			}

			forEach(config, function (cfg) {
				getTarget(cfg).addEventListener(cfg.type, handlerGenerator(cfg));
			});
		};

		const uninstall = function uninstall() {
			if (!result.enabled) {
				return;
			}

			forEach(config, function (cfg) {
				getTarget(cfg).removeEventListener(cfg.type, cfg._$_handle_$_!);

				cfg._$_handle_$_ = undefined;
			});
		};

		const result = {
			install,
			uninstall,
			enabled: false
		};

		return result;
	};

	let handle = initialize(params);
	setTimeout(function () {
		handle.install();
	});

	return {
		update(newParams) {
			handle.uninstall();

			handle = initialize(newParams);
			handle.install();
		},
		destroy() {
			handle.uninstall();
		}
	};
};
