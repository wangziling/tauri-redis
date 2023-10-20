<script lang="ts">
	import { translator } from 'tauri-redis-plugin-translation-api';
	import type { Theme, Language, SettingsResources } from 'tauri-redis-plugin-setting-api';
	import Card from '$lib/components/Card.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Select from '$lib/components/select/Select.svelte';
	import { writable } from 'svelte/store';
	import { createSettingsMisc, createThemeMisc } from '$lib/utils/appearance';
	import InputNumber from '$lib/components/InputNumber.svelte';

	const themeMisc = createThemeMisc();
	const settingsMisc = createSettingsMisc();
	const minimumRedisEachScanCount = 50;
	const maximumRedisEachScanCount = 20000;
	const redisEachScanCountStepGap = 50;

	const translations = translator.derived(function () {
		return {
			settings: translator.translate('settings|Settings'),
			'settings appearance': translator.translate('settings appearance|Appearance'),
			'settings miscellaneous': translator.translate('settings miscellaneous|Miscellaneous'),
			'settings choose theme': translator.translate('settings choose theme|Choose theme'),
			'settings choose language': translator.translate('settings choose language|Choose language'),
			'settings set redis scan count': translator.translate(
				'settings set redis scan count|Set each the loading count of the keys.'
			)
		};
	});

	const resources = settingsMisc.resources;

	let themesOptions = calcThemesOptions($resources);
	let languagesOptions = calcLanguagesOptions($resources);

	// Observe settings change.
	// Refresh options.
	settingsMisc.subscribe(function (resources) {
		themesOptions = calcThemesOptions(resources);
		languagesOptions = calcLanguagesOptions(resources);
	});

	// Observe translations change.
	// Refresh options. Especially for the translation content.
	translator.subscribe(function () {
		themesOptions = calcThemesOptions($resources);
		languagesOptions = calcLanguagesOptions($resources);
	});

	const model = writable({
		theme: '',
		language: '',
		redisEachScanCount: minimumRedisEachScanCount
	});

	const rules = writable({});

	settingsMisc.subscribe((res) => {
		model.update((m) => {
			m.theme = res.settings.theme;
			m.language = res.settings.language;
			m.redisEachScanCount = res.settings.redisEachScanCount;

			return m;
		});
	});

	function calcThemesOptions(resources: SettingsResources) {
		return (resources.presets.themes || []).map((th) => ({
			label: translator.translate(th.labelTranslationKey),
			value: th.value
		}));
	}

	function calcLanguagesOptions(resources: SettingsResources) {
		return (resources.presets.languages || []).map((th) => ({
			label: translator.translate(th.labelTranslationKey),
			value: th.value
		}));
	}

	function handleThemeChange(e: CustomEvent<Theme>) {
		return themeMisc.setThemeFromSettings(e.detail);
	}

	function handleLanguageChange(e: CustomEvent<Language>) {
		return settingsMisc.setLanguage(e.detail);
	}

	function handleRedisEachScanCountChange(e: CustomEvent<number>) {
		return settingsMisc.setRedisEachScanCount(e.detail);
	}
</script>

<section class="tauri-redis-settings">
	<div class="tauri-redis-settings-wrapper">
		<div class="tauri-redis-settings-header settings-header">
			<div class="settings-header-wrapper">
				<h1 class="settings-header__caption">{$translations['settings']}</h1>
			</div>
		</div>
		<div class="tauri-redis-settings-content">
			<Card class="settings-card settings-card__appearance">
				<div class="settings-card-header" slot="header">
					<h4 class="settings-card-header__caption">{$translations['settings appearance']}</h4>
				</div>
				<div class="settings-card-content">
					<Form class="settings-form settings-form__appearance" {model} {rules}>
						<FormItem bind:label={$translations['settings choose theme']} prop="theme">
							<Select options={themesOptions} on:input={handleThemeChange} />
						</FormItem>
						<FormItem bind:label={$translations['settings choose language']} prop="language">
							<Select options={languagesOptions} on:input={handleLanguageChange} />
						</FormItem>
					</Form>
				</div>
			</Card><Card class="settings-card settings-card__miscellaneous">
				<div class="settings-card-header" slot="header">
					<h4 class="settings-card-header__caption">{$translations['settings miscellaneous']}</h4>
				</div>
				<div class="settings-card-content">
					<Form class="settings-form settings-form__appearance" {model} {rules}>
						<FormItem bind:label={$translations['settings set redis scan count']} prop="redisEachScanCount">
							<InputNumber
								on:input={handleRedisEachScanCountChange}
								on:change={handleRedisEachScanCountChange}
								minimum={minimumRedisEachScanCount}
								maximum={maximumRedisEachScanCount}
								stepGap={redisEachScanCountStepGap}
								disableManualInputWhenShowStepOperations
							/>
						</FormItem>
					</Form>
				</div>
			</Card>
		</div>
	</div>
</section>
