import type { TArrayOrPrimitive } from '$lib/types/base';
import type { Action } from 'svelte/action';
import { isMatch, uniqWith, forEach, cloneDeep, capitalize } from 'lodash-es';

type ActionsGlobalKeyboardParamsKey = 'keyup' | 'keydown' | 'keypress';
type ActionsGlobalKeyboardParamsEventName = `global${Capitalize<ActionsGlobalKeyboardParamsKey>}`;
type ActionsGlobalKeyboardAttributesEventName = `on:${ActionsGlobalKeyboardParamsEventName}`;

export type ActionsGlobalKeyboardParams = {
	type: ActionsGlobalKeyboardParamsKey;
	key?: string;
	/**@deprecated*/
	keyCode?: number;
};

export type ActionsGlobalKeyboardReturnParams = {
	e: KeyboardEvent;
	config: ActionsGlobalKeyboardParams;
	eventName: ActionsGlobalKeyboardParamsEventName;
};

export type ActionsGlobalKeyboardAttributes = {
	[key in ActionsGlobalKeyboardAttributesEventName]: (
		e: CustomEvent<ActionsGlobalKeyboardReturnParams>
	) => void;
};

type ActionsGlobalKeyboardHandlerItem = ActionsGlobalKeyboardParams & {
	_$_handle_$_?: (...args: any[]) => any;
};

export const globalKeyboard: Action<
	HTMLElement,
	TArrayOrPrimitive<ActionsGlobalKeyboardParams>,
	ActionsGlobalKeyboardAttributes
> = function globalKeyboard(node, params) {
	const initialize = function initialize(options: TArrayOrPrimitive<ActionsGlobalKeyboardParams>) {
		const config = cloneDeep(
			uniqWith(([] as any[]).concat(options), isMatch)
		) as Array<ActionsGlobalKeyboardHandlerItem>;

		const handlerGenerator = function handlerGenerator(p: ActionsGlobalKeyboardHandlerItem) {
			p._$_handle_$_ = function handler(e: KeyboardEvent) {
				if (p.key) {
					if (p.key === e.key) {
						node.dispatchEvent(
							new CustomEvent(`global${capitalize(p.type)}`, { detail: { e, config: p } })
						);
					}

					return;
				}

				if (p.keyCode) {
					if (p.keyCode === e.keyCode) {
						node.dispatchEvent(
							new CustomEvent(`global${capitalize(p.type)}`, { detail: { e, config: p } })
						);
					}

					return;
				}

				node.dispatchEvent(
					new CustomEvent(`global${capitalize(p.type)}`, { detail: { e, config: p } })
				);
			};

			return p._$_handle_$_;
		};

		const install = function install() {
			if (result.enabled) {
				return;
			}

			forEach(config, function (cfg) {
				window.addEventListener(cfg.type, handlerGenerator(cfg));
			});
		};

		const uninstall = function uninstall() {
			if (!result.enabled) {
				return;
			}

			forEach(config, function (cfg) {
				window.removeEventListener(cfg.type, cfg._$_handle_$_!);

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
