import { invoke } from '@tauri-apps/api/tauri';
import { Settings } from './types';

export function resources(): Promise<Settings> {
	return invoke('plugin:setting|resources');
}

export function get(key: keyof Settings): Promise<any> {
	return invoke('plugin:setting|get', { key });
}

export function set(key: keyof Settings, value: any): Promise<void> {
	return invoke('plugin:setting|set', { key, value });
}

export function reset(): Promise<void> {
	return invoke('plugin:setting|reset');
}
