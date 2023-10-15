import { derived, get, type Readable, writable } from 'svelte/store';
import { LoadingArea, PageTheme, type TArrayOrPrimitive } from '$lib/types';
import { get as lodashGet, remove, result } from 'lodash-es';
import { onDestroy } from 'svelte';
import { type Language, settings, Theme } from 'tauri-redis-plugin-setting-api';
import { translator } from 'tauri-redis-plugin-translation-api';
import { calcDynamicClasses } from '$lib/utils/calculators';

const matchMediaEventTarget = window.matchMedia('(prefers-color-scheme: dark)');

const calcTheme = function calcTheme() {
	return !!lodashGet(matchMediaEventTarget, 'matches') ? PageTheme.Dark : PageTheme.Light;
};

const themeMisc = {
	theme: writable<PageTheme>(calcTheme()),
	eventInitialized: false,
	setTheme(th: PageTheme) {
		themeMisc.theme.set(th);
	},
	useDarkTheme() {
		themeMisc.theme.set(PageTheme.Dark);
	},
	useLightTheme() {
		themeMisc.theme.set(PageTheme.Light);
	},
	useSystemTheme() {
		themeMisc.theme.set(calcTheme());
	}
};

const settingsMisc = {
	eventInitialized: false
};

const loadingMisc = {
	loadingArea: writable([] as LoadingArea[]),
	setLoading(area: TArrayOrPrimitive<LoadingArea>) {
		([] as Array<LoadingArea>).concat(area).forEach(function (ar) {
			if (!get(loadingMisc.loadingArea).includes(ar)) {
				loadingMisc.loadingArea.update(function (lArea) {
					lArea.push(ar);

					return lArea;
				});
			}
		});
	},
	unsetLoading(area: TArrayOrPrimitive<LoadingArea>) {
		([] as Array<LoadingArea>).concat(area).forEach(function (ar) {
			if (get(loadingMisc.loadingArea).includes(ar)) {
				loadingMisc.loadingArea.update(function (lArea) {
					remove(lArea, function (lAr) {
						return lAr === ar;
					});

					return lArea;
				});
			}
		});
	},
	judgeLoading(area: TArrayOrPrimitive<LoadingArea>) {
		const loadingArea = get(loadingMisc.loadingArea);

		return ([] as Array<LoadingArea>).concat(area).some(function (ar) {
			return loadingArea.includes(ar);
		});
	},
	derived(func: Parameters<typeof derived>[1]) {
		return derived(loadingMisc.loadingArea, func) as Readable<LoadingArea[]>;
	},
	wrapPromise(p: Promise<any>, area: TArrayOrPrimitive<LoadingArea> = LoadingArea.Global) {
		loadingMisc.setLoading(area);

		return p.finally(() => loadingMisc.unsetLoading(area));
	}
};

function prefersColorSchemeChange(e: Event) {
	themeMisc.theme.set(calcTheme());
}

const initThemeEvents = function initThemeEvents() {
	if (themeMisc.eventInitialized) {
		return;
	}

	themeMisc.eventInitialized = true;
	matchMediaEventTarget.addEventListener('change', prefersColorSchemeChange);
	// Get settings theme.
	settings.getTheme().then((theme) => {
		switch (theme) {
			case Theme.Dark: {
				themeMisc.useDarkTheme();
				break;
			}
			case Theme.Light: {
				themeMisc.useLightTheme();
				break;
			}
			case Theme.System: {
				themeMisc.useSystemTheme();
			}
		}
	});
};

const deInitThemeEvents = function deInitThemeEvents() {
	if (!themeMisc.eventInitialized) {
		return;
	}

	matchMediaEventTarget.removeEventListener('change', prefersColorSchemeChange);
};

const initSettingsEvents = function initSettingsEvents() {
	if (settingsMisc.eventInitialized) {
		return;
	}

	settingsMisc.eventInitialized = true;

	// Getting resources.
	settings.resources();
};

const deInitSettingsEvents = function deInitSettingsEvents() {
	if (!settingsMisc.eventInitialized) {
		return;
	}

	settingsMisc.eventInitialized = false;
};

export const createThemeMisc = function createThemeMisc() {
	const subscribes: Array<Function> = [];
	const subscribe: (typeof themeMisc.theme)['subscribe'] = function subscribe(run, _) {
		const us = themeMisc.theme.subscribe(run);

		subscribes.push(us);

		return us;
	};

	const unsubscribe = function unsubscribe() {
		subscribes.forEach(function (sub) {
			sub();
		});
	};

	onDestroy(function () {
		unsubscribe();
	});

	const result = {
		theme: derived(themeMisc.theme, function (th) {
			return th;
		}),
		toggleTheme() {
			if (get(themeMisc.theme) === PageTheme.Light) {
				return result.setTheme(PageTheme.Dark);
			}

			return result.setTheme(PageTheme.Light);
		},
		setTheme(th: PageTheme) {
			themeMisc.setTheme(th);

			let themeInSettings = Theme.System;
			switch (th) {
				case PageTheme.Dark: {
					themeInSettings = Theme.Dark;
					break;
				}
				case PageTheme.Light: {
					themeInSettings = Theme.Light;
					break;
				}
			}

			return settings.set('theme', themeInSettings);
		},
		setThemeFromSettings(th: Theme) {
			switch (th) {
				case Theme.Dark: {
					themeMisc.useDarkTheme();
					break;
				}
				case Theme.Light: {
					themeMisc.useLightTheme();
					break;
				}
				case Theme.System: {
					themeMisc.useSystemTheme();
					break;
				}
			}

			return settings.set('theme', th);
		},
		useDarkTheme() {
			return themeMisc.useDarkTheme();
		},
		useLightTheme() {
			return themeMisc.useLightTheme();
		},
		useSystemTheme() {
			return themeMisc.useSystemTheme();
		},
		initEvents: initThemeEvents,
		deInitEvents: deInitThemeEvents,
		subscribe,
		unsubscribe
	};

	return result;
};

export const createSettingsMisc = function createSettingsMisc() {
	const subscribes: Array<Function> = [];
	const subscribe: (typeof settings)['subscribe'] = function subscribe(run, _) {
		const us = settings.subscribe(run);

		subscribes.push(us);

		return us;
	};

	const unsubscribe = function unsubscribe() {
		subscribes.forEach(function (sub) {
			sub();
		});
	};

	onDestroy(function () {
		unsubscribe();
	});

	const result = {
		// resources: settings.derived(function(res) {
		// 	return res;
		// }),
		resources: settings.derived(),
		settings: settings.derived(function (res) {
			return res.settings;
		}),
		presets: settings.derived(function (res) {
			return res.presets;
		}),
		setLanguage(language: Language) {
			return settings.set('language', language).then(() => translator.switchTo(language));
		},
		setRedisEachScanCount(count: number) {
			return settings.set('redisEachScanCount', count);
		},
		getRedisEachScanCount() {
			return settings.get('redisEachScanCount');
		},
		getLanguage() {
			return settings.get('language');
		},
		getLanguages() {
			return settings.getPreset('languages');
		},
		getThemes() {
			return settings.getPreset('themes');
		},
		initEvents: initSettingsEvents,
		deInitEvents: deInitSettingsEvents,
		subscribe,
		unsubscribe,
		derived: settings.derived
	};

	return result;
};

export const createLoadingMisc = function createLoadingMisc(loadingArea = LoadingArea.Global) {
	let targetLoadingArea = writable(([] as Array<LoadingArea>).concat(loadingArea) as LoadingArea[]);

	const subscribes: Array<Function> = [];
	const subscribe: (typeof loadingMisc.loadingArea)['subscribe'] = function subscribe(run, _) {
		const us = loadingMisc.loadingArea.subscribe(run);

		subscribes.push(us);

		return us;
	};

	const unsubscribe = function unsubscribe() {
		subscribes.forEach(function (sub) {
			sub();
		});
	};

	onDestroy(function () {
		unsubscribe();
	});

	const loadingDerived = derived([loadingMisc.loadingArea, targetLoadingArea], function ([, targetLArea]) {
		// @ts-ignore
		return loadingMisc.judgeLoading(targetLArea);
	});

	return {
		loading: loadingDerived,
		subscribe,
		unsubscribe,
		setTargetLoadingArea(area: TArrayOrPrimitive<LoadingArea>) {
			return targetLoadingArea.update(function (target) {
				return ([] as Array<LoadingArea>).concat(area);
			});
		},
		addTargetLoadingArea(area: TArrayOrPrimitive<LoadingArea>) {
			return targetLoadingArea.update(function (target) {
				([] as Array<LoadingArea>).concat(area).forEach(function (ar) {
					if (target.includes(ar)) {
						return;
					}

					target.push(ar);
				});

				return target;
			});
		},
		removeTargetLoadingArea(area: TArrayOrPrimitive<LoadingArea>) {
			return targetLoadingArea.update(function (target) {
				([] as Array<LoadingArea>).concat(area).forEach(function (ar) {
					if (!target.includes(ar)) {
						return;
					}

					remove(target, function (targetAr) {
						return targetAr === ar;
					});
				});

				return target;
			});
		},
		judgeLoading() {
			// @ts-ignore
			return loadingMisc.judgeLoading(get(targetLoadingArea));
		},
		judgeLoadingDerived(loadingArea: TArrayOrPrimitive<LoadingArea>) {
			// @ts-ignore
			return derived(loadingMisc.loadingArea, function () {
				// @ts-ignore
				return loadingMisc.judgeLoading(loadingArea);
			});
		},
		calcParentDynamicClassesDerived(loadingArea: TArrayOrPrimitive<LoadingArea>) {
			// @ts-ignore
			return derived(loadingMisc.loadingArea, function () {
				// @ts-ignore
				return calcDynamicClasses([
					'loading__parent',
					{
						'loading__parent--loading': loadingMisc.judgeLoading(loadingArea)
					}
				]);
			});
		},
		setLoading() {
			// @ts-ignore
			return loadingMisc.setLoading(get(targetLoadingArea));
		},
		unsetLoading() {
			// @ts-ignore
			return loadingMisc.unsetLoading(get(targetLoadingArea));
		},
		wrapPromise(...args: Parameters<(typeof loadingMisc)['wrapPromise']>) {
			// @ts-ignore
			return loadingMisc.wrapPromise(args[0], args[1] || get(targetLoadingArea));
		},
		parentDynamicClasses: derived(loadingDerived, function (loading) {
			return calcDynamicClasses([
				'loading__parent',
				{
					'loading__parent--loading': loading
				}
			]);
		})
	};
};
