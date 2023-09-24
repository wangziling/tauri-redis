import { Translations } from './types';
export declare function translate(key: string): Promise<Translations>;
export declare function translateGroup(keys: string[]): Promise<Translations>;
export declare function translationResources(): Promise<Translations>;
export declare function translationSwitchTo(language: string): Promise<Translations>;
