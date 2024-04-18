import { TranslationContent, TranslationLanguage, Translations } from './types';
import {
	TRANSLATION_KEY_DEFAULT_SPLITTER,
	translationKeyLikePlaceholderMatcher,
	whitespaceReplacer
} from './constants';
import { isEmpty, noop } from 'lodash-es';
import { translationLanguage, translationResources, translationSwitchTo } from './ipc';
import { derived, type Readable, type Writable, writable, get } from 'svelte/store';

export class Translator {
	private translations = writable({} as Translations);
	private language = writable('en-US');

	constructor() {
		this._init().catch(noop);
	}

	switchTo(language: TranslationLanguage) {
		return translationSwitchTo(language)
			.then(() => translationResources())
			.then((translations) => this._update(translations, language));
	}

	private _init() {
		return Promise.all([translationLanguage(), translationResources()]).then(([language, translations]) =>
			this._update(translations, language)
		);
	}

	private _update(translations: Translations, language: TranslationLanguage) {
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

		if (!keyMayContainsDefaultContent.replace(whitespaceReplacer, '').length) {
			return '';
		}

		const splitterIdx = keyMayContainsDefaultContent.indexOf(TRANSLATION_KEY_DEFAULT_SPLITTER);
		const key = splitterIdx === -1 ? keyMayContainsDefaultContent : keyMayContainsDefaultContent.slice(0, splitterIdx);
		const defaultContent = (splitterIdx === -1 ? '' : keyMayContainsDefaultContent.slice(splitterIdx + 1)) || `#${key}`;

		if (isEmpty(translations)) {
			return defaultContent;
		}

		const translation = translations[key.toLowerCase()];
		if (typeof translation !== 'string') {
			return defaultContent;
		}

		return translation;
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
		const matcher = translationKeyLikePlaceholderMatcher;
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
		// eslint-disable-next-line
		const self = this;

		return derived(this.translations, function (translations) {
			return self._translate.apply(self, [translations, keyMayContainsDefaultContent, ...args]);
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
		return this.translations.subscribe(...args);
	}

	derived(callback?: (translations: Translations) => any) {
		return derived<Writable<Translations>, Translations>(this.translations, function (translations) {
			return typeof callback === 'function' ? callback(translations) : translations;
		});
	}
}

export const translator = new Translator();
