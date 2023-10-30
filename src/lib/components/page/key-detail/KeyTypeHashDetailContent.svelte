<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { fetchHScanKeyAllValues, fetchRefreshHScanKeyAllValues, fetchRemoveHashKeyField } from '$lib/apis';
	import { invokeErrorHandle, invokeOperationSuccessHandle } from '$lib/utils/page.js';
	import { createEventDispatcher } from 'svelte';
	import { type IpcHashKeyValues, IpcKeyType, LoadingArea, type TArrayMember } from '$lib/types';
	import { createLoadingMisc } from '$lib/utils/appearance';
	import Loading from '$lib/components/interaction/Loading.svelte';
	import { writable } from 'svelte/store';
	import Icon from '$lib/components/Icon.svelte';

	const dispatch = createEventDispatcher();
	const loadingMisc = createLoadingMisc(LoadingArea.KeyDetailContent);
	const { loading, parentDynamicClasses } = loadingMisc;

	export let guid = '';
	export let keyName = '';
	export let indexValid = false;

	let content = writable([] as IpcHashKeyValues);

	const translations = translator.derived(function () {
		return {
			'invalid key metrics': translator.translate('invalid key metrics|Invalid key metrics'),
			'hash key index': translator.translate('hash key index|Index'),
			'hash key field name': translator.translate('hash key field name|Field name'),
			'hash key field value': translator.translate('hash key field value|Field value'),
			'hash key remove field': translator.translate('hash key remove field|Remove field'),
			operations: translator.translate('operations|Operations')
		};
	});

	function handleGetScannedValues(data: IpcHashKeyValues) {
		content.update(function (c) {
			return c.concat(data);
		});

		dispatch('getHashKeyValues', { guid, keyName, type: IpcKeyType.Hash });
	}

	function handleRemoveField(item: TArrayMember<IpcHashKeyValues>, e: Event) {
		e.stopPropagation();

		return loadingMisc.wrapPromise(
			fetchRemoveHashKeyField(guid, keyName, item.name)
				.then(invokeOperationSuccessHandle)
				.then(() => {
					dispatch('removeHashField', { guid, keyName, field: item.name });
				})
				.then(handleRefreshScannedValues)
				.catch(invokeErrorHandle)
		);
	}

	function handleRefreshScannedValues() {
		return loadingMisc.wrapPromise(
			fetchRefreshHScanKeyAllValues(guid, keyName, undefined).then((res) => {
				content.update(function (c) {
					if (!Array.isArray(res.data)) {
						return c;
					}

					return res.data;
				});

				dispatch('refreshHashKeyValues', { guid, keyName, type: IpcKeyType.Hash });
			})
		);
	}

	$: metricsInvalid = !(guid && keyName);

	$: dynamicClasses = calcDynamicClasses([
		'key-detail-content',
		'key-detail-content__type-hash',
		$parentDynamicClasses,
		{
			'key-detail-content--invalid': metricsInvalid
		}
	]);

	$: {
		loadingMisc.wrapPromise(
			fetchHScanKeyAllValues(guid, keyName, undefined, true)
				.then((res) => {
					handleGetScannedValues(res.data);
					return res;
				})
				.catch(invokeErrorHandle)
		);
	}
</script>

<div class={dynamicClasses}>
	{#if metricsInvalid}
		<div class="key-detail-content__content">{$translations['invalid key metrics']}</div>
	{:else}
		<div class="key-detail-content__content">
			<table class="key-detail-content__table table table--bordered">
				<thead>
					<tr>
						{#if indexValid}
							<th>{$translations['hash key index']}</th>
						{/if}
						<th>{$translations['hash key field name']}</th>
						<th>{$translations['hash key field value']}</th>
						<th>{$translations['operations']}</th>
					</tr>
				</thead>
				<tbody>
					{#each $content as item, idx (idx)}
						<tr>
							{#if indexValid}
								<td>{idx}</td>
							{/if}
							<td>{item['name']}</td>
							<td>{item['value']}</td>
							<td>
								<div class="key-detail-content__table-cell-operations">
									<Icon
										class="table-cell-operation table-cell-operation__remove-field fa fa-trash-can"
										title={$translations['hash key remove field']}
										role="button"
										still
										on:click={(e) => handleRemoveField(item, e)}
									/>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="key-detail-content__operations">
			<!-- <Button
				class="key-detail-content__operation key-detail-content__operation-save"
				type="primary"
				on:click={handleSetHashKeyValues}>{$translations['save']}</Button
			> -->
		</div>
	{/if}
	<Loading visible={$loading} />
</div>
