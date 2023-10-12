export type TranslationContent = string;
export type TranslationKey = `${Lowercase<string>}` | `${Lowercase<string>}|${TranslationContent}` | string;
export type Translations = Record<TranslationKey, TranslationContent>;
export type TranslationLanguage = `${string}-${Uppercase<string>}`;
export type IpcTranslations = {
    translations: Translations;
    language: TranslationLanguage;
};
