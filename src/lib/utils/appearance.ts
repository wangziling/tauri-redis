import { derived, writable } from 'svelte/store';
import { PageTheme } from '$lib/types';
import { get as lodashGet } from 'lodash-es';
import { onDestroy } from 'svelte';

const matchMediaEventTarget = window.matchMedia('(prefers-color-scheme: dark)');

const calcTheme = function calcTheme() {
	return !!lodashGet(matchMediaEventTarget, 'matches') ? PageTheme.Dark : PageTheme.Light;
};

const themeMisc = {
	theme: writable<PageTheme>(calcTheme()),
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

	return {
		theme: derived(themeMisc.theme, function (th) {
			return th;
		}),
		toggleTheme(th: PageTheme) {
			themeMisc.theme.set(th);
		},
		useDarkTheme() {
			themeMisc.theme.set(PageTheme.Dark);
		},
		useLightTheme() {
			themeMisc.theme.set(PageTheme.Light);
		},
		initEvents: initThemeEvents,
		deInitEvents: deInitThemeEvents,
		subscribe,
		unsubscribe
	};
};
