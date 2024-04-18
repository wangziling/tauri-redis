import { invoke } from '@tauri-apps/api/tauri';
import { TranslationContent, TranslationKey, TranslationLanguage, Translations } from './types';

export function translate(key: TranslationKey, ...rest: TranslationContent[]): Promise<TranslationContent> {
	return invoke('plugin:translation|translate', { key, rest });
}

export function translateGroup(keys: TranslationKey[]): Promise<Translations> {
	return invoke('plugin:translation|translate_group', { keys });
}

export function translationResources(): Promise<Translations> {
	return invoke('plugin:translation|resources');
}

export function translationSwitchTo(language: TranslationLanguage): Promise<void> {
	return invoke('plugin:translation|switch_to', { language });
}

export function translationLanguage(): Promise<TranslationLanguage> {
	return invoke('plugin:translation|language');
}

export function translationLanguages(): Promise<Array<TranslationLanguage>> {
	return invoke('plugin:translation|languages');
}
