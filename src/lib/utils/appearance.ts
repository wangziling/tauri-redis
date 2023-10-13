import { derived, get, writable } from 'svelte/store';
import { PageTheme } from '$lib/types';
import { get as lodashGet } from 'lodash-es';
import { onDestroy } from 'svelte';
import { settings, Theme } from 'tauri-redis-plugin-setting-api';

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
