import { invoke } from '@tauri-apps/api/tauri';
import { Translations } from './types';

export function translate(key: string): Promise<Translations> {
	return invoke('plugin:translation|translate', { key });
}

export function translateGroup(keys: string[]): Promise<Translations> {
	return invoke('plugin:translation|translate_group', { keys });
}

export function translationResources(): Promise<Translations> {
	return invoke('plugin:translation|resources');
}

export function translationSwitchTo(language: string): Promise<Translations> {
	return invoke('plugin:translation|switch_to', { language });
}
