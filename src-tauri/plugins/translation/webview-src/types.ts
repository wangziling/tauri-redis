// Lorem ipsum dolor sit amet.
// Lorem ipsum {0} sit amet. ----- {0} will be replaced by .translate(__, 'the content for 0');
export type TranslationContent = string;

// Key: xxxx
// Key: xxxx|Default content.
export type TranslationKey = `${Lowercase<string>}` | `${Lowercase<string>}|${TranslationContent}` | string;

export type Translations = Record<TranslationKey, TranslationContent>;

// zh-CN, en-US.
export type TranslationLanguage = `${string}-${Uppercase<string>}`;

export type IpcTranslations = {
	translations: Translations;
	language: TranslationLanguage;
};
