<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { fetchGetKeyContentTypeString } from '$lib/apis';
	import { invokeErrorHandle } from '$lib/utils/page.js';

	export let guid = '';
	export let keyName = '';

	let content = null;

	const translations = translator.derived(function () {
		return {
			'invalid key metrics': translator.translate('invalid key metrics|Invalid key metrics')
		};
	});

	$: metricsInvalid = !(guid && keyName);

	$: dynamicClasses = calcDynamicClasses([
		'key-detail-content',
		'key-detail-content__type-string',
		{
			'key-detail-content--invalid': metricsInvalid
		}
	]);

	$: {
		content = null;

		fetchGetKeyContentTypeString(guid, keyName)
			.then((res) => {
				content = res.data;

				return res;
			})
			.catch(invokeErrorHandle);
	}
</script>

<div class={dynamicClasses}>
	{#if metricsInvalid}
		<div class="key-detail-content__content">{$translations['invalid key metrics']}</div>
	{:else}
		<div class="key-detail-content__content">{content}</div>
	{/if}
</div>
