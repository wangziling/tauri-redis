import { derived, get, writable } from 'svelte/store';
import { PageTheme } from '$lib/types';
import { get as lodashGet } from 'lodash-es';
import { onDestroy } from 'svelte';
import { settings, Theme, type Language } from 'tauri-redis-plugin-setting-api';
import { translator } from 'tauri-redis-plugin-translation-api';

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
