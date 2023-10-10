import { get, resources, set, reset } from './ipc';

class Settings {
	resources(...args: Parameters<typeof resources>) {
		return resources(...args);
	}

	get(...args: Parameters<typeof get>) {
		return get(...args);
	}

	set(...args: Parameters<typeof set>) {
		return set(...args);
	}

	reset(...args: Parameters<typeof reset>) {
		return reset(...args);
	}

	getTheme() {
		return this.get('theme');
	}

	getLanguage() {
		return this.get('language');
	}
}

export const settings = new Settings();
