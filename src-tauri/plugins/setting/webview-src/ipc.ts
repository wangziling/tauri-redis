import { invoke } from '@tauri-apps/api/tauri';
import { Settings, SettingsPresets, SettingsResources } from './types';

export function fetchResources(): Promise<SettingsResources> {
	return invoke('plugin:setting|resources');
}

export function fetchPresets(): Promise<SettingsPresets> {
	return invoke('plugin:setting|presets');
}

export function fetchSettings(): Promise<Settings> {
	return invoke('plugin:setting|settings');
}

export function fetchGet<T = any>(key: keyof Settings): Promise<T> {
	return invoke('plugin:setting|get', { key });
}

export function fetchGetPreset<T = any>(key: keyof SettingsPresets): Promise<T> {
	return invoke('plugin:setting|get_preset', { key });
}

export function fetchSet(key: keyof Settings, value: any): Promise<void> {
	return invoke('plugin:setting|set', { key, value });
}

export function fetchReset(): Promise<void> {
	return invoke('plugin:setting|reset');
}
