import { TranslationContent, TranslationLanguage, Translations } from './types';
export declare function translate(key: string): Promise<TranslationContent>;
export declare function translateGroup(keys: string[]): Promise<Translations>;
export declare function translationResources(): Promise<Translations>;
export declare function translationSwitchTo(language: string): Promise<void>;
export declare function translationLanguage(): Promise<TranslationLanguage>;
export declare function translationLanguages(): Promise<Array<TranslationLanguage>>;
