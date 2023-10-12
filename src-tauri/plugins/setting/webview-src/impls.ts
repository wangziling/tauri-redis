import { derived, Writable, writable } from 'svelte/store';
import { get, resources, set, reset } from './ipc';
import { Settings as Resources, Theme } from './types';

class Settings {
	private _resources = writable({} as Resources);

	private _update(res: Resources) {
		this._resources.set(res);

		return res;
	}

	constructor() {
		this._update = this._update.bind(this);
	}

	resources() {
		return resources().then(this._update);
	}

	get<T = any>(...args: Parameters<typeof get>) {
		return get<T>(...args);
	}

	set(...args: Parameters<typeof set>) {
		return set(...args).then((res) => {
			return this.resources().then(() => res);
		});
	}

	reset(...args: Parameters<typeof reset>) {
		return reset(...args).then((res) => {
			return this.resources().then(() => res);
		});
	}

	getTheme() {
		return this.get<Theme>('theme');
	}

	getLanguage() {
		return this.get<string>('language');
	}

	subscribe(...args: Parameters<Writable<Resources>['subscribe']>) {
		return this._resources.subscribe(...args);
	}

	derived(callback?: (resources: Resources) => any) {
		return derived<Writable<Resources>, Resources>(this._resources, function (res) {
			return typeof callback === 'function' ? callback(res) : res;
		});
	}
}

export const settings = new Settings();
