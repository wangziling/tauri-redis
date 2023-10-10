/// <reference types="svelte" />
import { TranslationContent, TranslationLanguage, Translations } from './types';
import { type Readable, type Writable } from 'svelte/store';
export declare class Translator {
    private translations;
    private language;
    constructor();
    switchTo(language: TranslationLanguage): Promise<this | undefined>;
    private _init;
    private _update;
    private _baseTranslate;
    private _translate;
    translate(keyMayContainsDefaultContent: keyof Translations, ...args: string[]): TranslationContent;
    translateDerived(keyMayContainsDefaultContent: keyof Translations, ...args: string[]): Readable<TranslationContent>;
    format(content: TranslationContent, ...args: string[]): string;
    subscribe(...args: Parameters<Writable<Translations>['subscribe']>): import("svelte/store").Unsubscriber;
    derived(callback: (translations: Translations) => any): Readable<Translations>;
}
export declare const translator: Translator;
