import type { TranslationContent, TranslationLanguage, Translations } from '$lib/types';
import { derived, get, type Readable, type Writable, writable } from 'svelte/store';
import { get as lodashGet, has, isEmpty } from 'lodash-es';
import { GLOBAL_TRANSLATION_VARIABLE_PATH, TRANSLATION_KEY_DEFAULT_SPLITTER } from '$lib/constants/strings';
import type { IpcTranslations } from '$lib/types';
import constants from '$lib/constants';

const defaultTranslations = getDefaultTranslations();

function getDefaultTranslations(): IpcTranslations {
	return (
		lodashGet(window, GLOBAL_TRANSLATION_VARIABLE_PATH) || {
			translations: {},
			language: 'en-US'
		}
	);
}

export class Translator {
	private translations = writable({});
	private language = writable('en-US');

	constructor(translations: Translations, language: TranslationLanguage) {
		this.update(translations, language);
	}

	update(translations: Translations, language: TranslationLanguage) {
		if (!(translations && typeof translations === 'object')) {
			return;
		}

		this.translations.set(translations);
		this.language.set(language);

		return this;
	}

	private _baseTranslate(
		translations: Translations,
		keyMayContainsDefaultContent: keyof Translations
	): TranslationContent {
		if (typeof keyMayContainsDefaultContent !== 'string') {
			return '';
		}

		if (!keyMayContainsDefaultContent.replace(constants.regexps.whitespaceReplacer, '').length) {
			return '';
		}

		const splitterIdx = keyMayContainsDefaultContent.indexOf(TRANSLATION_KEY_DEFAULT_SPLITTER);
		const key = splitterIdx === -1 ? keyMayContainsDefaultContent : keyMayContainsDefaultContent.slice(0, splitterIdx);
		const defaultContent = (splitterIdx === -1 ? '' : keyMayContainsDefaultContent.slice(splitterIdx + 1)) || `#${key}`;

		if (!isEmpty(translations)) {
			return defaultContent;
		}

		const translation = translations[key.toLowerCase()];
		if (!has(translation, 'content')) {
			return defaultContent;
		}

		const translationContent = lodashGet(translation, 'content');
		if (typeof translationContent !== 'string') {
			return defaultContent;
		}

		return translationContent;
	}

	private _translate(
		translations: Translations,
		keyMayContainsDefaultContent: keyof Translations,
		...args: string[]
	): TranslationContent {
		let content = this._baseTranslate(translations, keyMayContainsDefaultContent);
		if (!content) {
			return content;
		}

		// Replace by the idx;
		if (args.length) {
			content = this.format.apply(this, [content, ...args]);
		}

		// Try to catch the translation key placeholder.
		// E.g. Please give me some {advice}.
		// The {advice} will be replaced by translate('advice').
		const matcher = constants.regexps.translationKeyLikePlaceholderMatcher;
		if (!matcher.test(content)) {
			return content;
		}

		return content.replace(matcher, (_, maybeKeyContainsDefaultContent) => {
			// Maybe it is Please give me some {advice|Advice}.
			return this._baseTranslate(translations, maybeKeyContainsDefaultContent);
		});
	}

	translate(keyMayContainsDefaultContent: keyof Translations, ...args: string[]): TranslationContent {
		return this._translate.apply(this, [get(this.translations), keyMayContainsDefaultContent, ...args]);
	}

	translateDerived(keyMayContainsDefaultContent: keyof Translations, ...args: string[]): Readable<TranslationContent> {
		const self = this;

		return derived(this.translations, function (translations) {
			return self._translate.apply(this, [translations, keyMayContainsDefaultContent, ...args]);
		});
	}

	format(content: TranslationContent, ...args: string[]) {
		args.forEach(function (replacer, idx) {
			if (typeof replacer !== 'string') {
				return;
			}

			content = content.replace(new RegExp('\\{' + idx + '\\}', 'gm'), replacer);
		});

		return content;
	}

	subscribe(...args: Parameters<Writable<Translations>['subscribe']>) {
		return this.translations.subscribe.apply(this.translations, args);
	}
}

export const translator = new Translator(defaultTranslations.translations, defaultTranslations.language);
