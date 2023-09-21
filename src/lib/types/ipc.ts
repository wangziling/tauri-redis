import type { TranslationLanguage, Translations } from '$lib/types/utils';

export type IpcTranslations = {
	translations: Translations;
	language: TranslationLanguage;
};
