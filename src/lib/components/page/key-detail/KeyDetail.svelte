<script lang="ts">
	import type { MainTab, MainTabType } from '$lib/types';
	import { calcDynamicClasses, calcIpcKeyType } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import Input from '$lib/components/Input.svelte';
	import InputNumber from '$lib/components/InputNumber.svelte';
	import { IpcKeyType } from '$lib/types';
	import { fetchGetKeyTTL, fetchGetKeyType } from '$lib/apis/redis-client';
	import { invokeErrorHandle } from '$lib/utils/page';
	import KeyTypeStringDetailContent from '$lib/components/page/key-detail/KeyTypeStringDetailContent.svelte';

	export let data: Extract<MainTab, { type: MainTabType.KeyDetail }>['data'] = {} as any;

	let keyMetrics = {
		ttl: -1,
		type: null as null | IpcKeyType,
		content: null
	};

	const translations = translator.derived(function () {
		return {
			'key ttl': translator.translate('key ttl|TTL')
		};
	});

	$: dynamicClasses = calcDynamicClasses(['key-detail', $$restProps.class]);

	fetchGetKeyType(data.connectionInfo.guid, data.key)
		.then((res) => {
			const type = calcIpcKeyType(res.data);
			if (!type) {
				return res;
			}

			keyMetrics.type = type;

			return res;
		})
		.catch(invokeErrorHandle);

	fetchGetKeyTTL(data.connectionInfo.guid, data.key)
		.then((res) => {
			keyMetrics.ttl = res.data;

			return res;
		})
		.catch(invokeErrorHandle);
</script>

<div class={dynamicClasses}>
	<div class="key-detail-wrapper">
		<div class="key-detail-header">
			<div class="key-detail-metrics">
				<Input bind:value={data.key}>
					<span slot="prefix">{keyMetrics.type}</span>
					<span slot="suffix" class="input__operation fa fa-check" />
				</Input>
				<InputNumber bind:value={keyMetrics.ttl} minimum={-1} maximum={65535} showStepOperations={false}>
					<span slot="prefix">{$translations['key ttl']}</span>
					<span slot="suffix" class="input__operation fa fa-check" />
				</InputNumber>
			</div>
		</div>
		<div class="key-detail-content">
			{#if keyMetrics.type === IpcKeyType.String}
				<KeyTypeStringDetailContent guid={data.connectionInfo.guid} keyName={data.key} />
			{/if}
		</div>
	</div>
</div>
