<script lang="ts">
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { settings, Theme } from 'tauri-redis-plugin-setting-api';
	import Card from '$lib/components/Card.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Select from '$lib/components/Select.svelte';
	import { writable } from 'svelte/store';
	import { createThemeMisc } from '$lib/utils/appearance';

	const themeMisc = createThemeMisc();

	const translations = translator.derived(function () {
		return {
			settings: translator.translate('settings|Settings'),
			'settings appearance': translator.translate('settings appearance|Appearance'),
			'settings choose theme': translator.translate('settings choose theme|Choose theme')
		};
	});

	const resources = settings.derived();

	const model = writable({
		theme: ''
	});

	const rules = writable({});

	settings.subscribe((res) => {
		model.update((m) => {
			m.theme = res.settings.theme;

			return m;
		});
	});

	// Getting resources.
	settings.resources();

	function handleThemeChange(e: CustomEvent<Theme>) {
		return themeMisc.setThemeFromSettings(e.detail);
	}

	$: themesOptions = ($resources.presets.themes || []).map((th) => ({
		label: translator.translate(th.labelTranslationKey),
		value: th.value
	}));
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
					</Form>
				</div>
			</Card>
		</div>
	</div>
</section>
