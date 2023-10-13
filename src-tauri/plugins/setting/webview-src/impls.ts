import { derived, Writable, writable, get } from 'svelte/store';
import { fetchGet, fetchResources, fetchSet, fetchReset, fetchPresets, fetchSettings, fetchGetPreset } from './ipc';
import { SettingsResources, Theme } from './types';

class Settings {
	private _resources = writable({
		presets: {
			themes: [],
			languages: []
		},
		settings: {
			theme: Theme.System,
			language: 'en-US',
			fontFamily: [],
			redisEachScanCount: 1000
		}
	} as SettingsResources);

	private _update(res: SettingsResources) {
		this._resources.set(res);

		return res;
	}

	constructor() {
		this._update = this._update.bind(this);
	}

	resources() {
		return fetchResources().then(this._update);
	}

	presets() {
		return fetchPresets().then((presets) => {
			return this._update({
				...get(this._resources),
				presets
			});
		});
	}

	settings() {
		return fetchSettings().then((settings) => {
			return this._update({
				...get(this._resources),
				settings
			});
		});
	}

	get<T = any>(...args: Parameters<typeof fetchGet>) {
		return fetchGet<T>(...args);
	}

	getPreset<T = any>(...args: Parameters<typeof fetchGetPreset>) {
		return fetchGetPreset<T>(...args);
	}

	set(...args: Parameters<typeof fetchSet>) {
		return fetchSet(...args).then((res) => {
			return this.resources().then(() => res);
		});
	}

	reset(...args: Parameters<typeof fetchReset>) {
		return fetchReset(...args).then((res) => {
			return this.resources().then(() => res);
		});
	}

	getTheme() {
		return this.get<Theme>('theme');
	}

	getLanguage() {
		return this.get<string>('language');
	}

	subscribe(...args: Parameters<Writable<SettingsResources>['subscribe']>) {
		return this._resources.subscribe(...args);
	}

	derived(callback?: (resources: SettingsResources) => any) {
		return derived<Writable<SettingsResources>, SettingsResources>(this._resources, function (res) {
			return typeof callback === 'function' ? callback(res) : res;
		});
	}
}

export const settings = new Settings();
