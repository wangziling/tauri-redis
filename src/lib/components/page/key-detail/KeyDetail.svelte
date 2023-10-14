<script lang="ts">
	import type { MainTab, MainTabType } from '$lib/types';
	import { calcDynamicClasses, calcIpcKeyType } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import Input from '$lib/components/Input.svelte';
	import InputNumber from '$lib/components/InputNumber.svelte';
	import { IpcKeyType } from '$lib/types';
	import { fetchGetKeyTTL, fetchGetKeyType, fetchRenameKey, fetchSetKeyTTL } from '$lib/apis';
	import { invokeErrorHandle, invokeOperationSuccessHandle } from '$lib/utils/page';
	import KeyTypeStringDetailContent from '$lib/components/page/key-detail/KeyTypeStringDetailContent.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let data: Extract<MainTab, { type: MainTabType.KeyDetail }>['data'] = {} as any;
	export let maximumKeyTTL = 2 ** 32 - 1;
	export let minimumKeyTTL = -1;

	let keyMetrics = {
		ttl: -1,
		type: null as null | IpcKeyType,
		content: null,
		name: data.key
	};

	const translations = translator.derived(function () {
		return {
			'key ttl': translator.translate('key ttl|TTL')
		};
	});

	function handleSetKeyTTL() {
		return fetchSetKeyTTL(data.connectionInfo.guid, { name: data.key, ttl: keyMetrics.ttl })
			.then((res) => {
				dispatch('setKeyTTL', { guid: data.connectionInfo.guid, name: data.key, ttl: keyMetrics.ttl });

				return res;
			})
			.then(invokeOperationSuccessHandle)
			.catch(invokeErrorHandle);
	}

	function handleRenameKey() {
		return fetchRenameKey(data.connectionInfo.guid, { name: data.key, newName: keyMetrics.name })
			.then((res) => {
				dispatch('renameKey', { guid: data.connectionInfo.guid, name: data.key, newName: keyMetrics.name });

				return res;
			})
			.then(invokeOperationSuccessHandle)
			.catch(invokeErrorHandle);
	}

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
				<Input bind:value={keyMetrics.name} pure={false}>
					<span slot="prefix">{keyMetrics.type}</span>
					<span
						slot="suffix"
						class="input__operation fa fa-check"
						role="button"
						tabindex="0"
						on:click={handleRenameKey}
					/>
				</Input>
				<InputNumber
					bind:value={keyMetrics.ttl}
					minimum={minimumKeyTTL}
					maximum={maximumKeyTTL}
					pure={false}
					showStepOperations={false}
				>
					<span slot="prefix">{$translations['key ttl']}</span>
					<span
						slot="suffix"
						class="input__operation fa fa-check"
						role="button"
						tabindex="0"
						on:click={handleSetKeyTTL}
					/>
				</InputNumber>
			</div>
		</div>
		{#if keyMetrics.type === IpcKeyType.String}
			<KeyTypeStringDetailContent guid={data.connectionInfo.guid} keyName={data.key} />
		{/if}
	</div>
</div>
