<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { fetchGetKeyContentTypeString, fetchSetKeyContentTypeString } from '$lib/apis';
	import { invokeErrorHandle } from '$lib/utils/page.js';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { createEventDispatcher } from 'svelte';
	import { IpcKeyType } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let guid = '';
	export let keyName = '';

	let content = '';

	const translations = translator.derived(function () {
		return {
			'invalid key metrics': translator.translate('invalid key metrics|Invalid key metrics'),
			save: translator.translate('save|Save')
		};
	});

	function handleSetKeyContent() {
		return fetchSetKeyContentTypeString(guid, { name: keyName, content })
			.then((res) => {
				dispatch('setKeyContent', { guid, keyName, content, type: IpcKeyType.String });

				return res;
			})
			.catch(invokeErrorHandle);
	}

	$: metricsInvalid = !(guid && keyName);

	$: dynamicClasses = calcDynamicClasses([
		'key-detail-content',
		'key-detail-content__type-string',
		{
			'key-detail-content--invalid': metricsInvalid
		}
	]);

	$: {
		fetchGetKeyContentTypeString(guid, keyName)
			.then((res) => {
				content = res.data;

				dispatch('getKeyContent', { guid, keyName, type: IpcKeyType.String });

				return res;
			})
			.catch(invokeErrorHandle);
	}
</script>

<div class={dynamicClasses}>
	{#if metricsInvalid}
		<div class="key-detail-content__content">{$translations['invalid key metrics']}</div>
	{:else}
		<div class="key-detail-content__content">
			<Input bind:value={content} type="textarea" pure={false} />
		</div>
		<div class="key-detail-content__operations">
			<Button
				class="key-detail-content__operation key-detail-content__operation-save"
				type="primary"
				on:click={handleSetKeyContent}>{$translations['save']}</Button
			>
		</div>
	{/if}
</div>
