<script lang="ts">
	import type { MainTab, MainTabType } from '$lib/types';
	import { calcDynamicClasses, createEachTagKeyGenerator, emptyInsteadBy } from '$lib/utils/calculators';
	import Card from '$lib/components/Card.svelte';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import constants from '$lib/constants';
	import { merge, times } from 'lodash-es';
	import { createEventDispatcher } from 'svelte';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import Loading from '$lib/components/interaction/Loading.svelte';
	import { createLoadingMisc } from '$lib/utils/appearance';
	import { LoadingArea, type SelectOptions } from '$lib/types';
	import Select from '$lib/components/select/Select.svelte';
	import { fetchDbNums, fetchSwitchDb } from '$lib/apis';
	import { invokeErrorHandle } from '$lib/utils/page';

	const dispatch = createEventDispatcher();
	const calcKeysKey = createEachTagKeyGenerator('keys');
	const loadingMisc = createLoadingMisc();
	const keysLoadingDerived = loadingMisc.judgeLoadingDerived(LoadingArea.DashboardKeys);
	const keysLoadingParentDynamicClassesDerived = loadingMisc.calcParentDynamicClassesDerived(LoadingArea.DashboardKeys);

	export let data: Extract<MainTab, { type: MainTabType.Dashboard }>['data'] = {} as any;

	let grepContent = '';
	let dbNums = 15;
	let currentDb = 0;

	const translations = translator.derived(function () {
		return {
			'server metrics': translator.translate('server metrics|Server metrics'),
			'redis version': translator.translate('redis version|Redis version'),
			'redis mode': translator.translate('redis mode|Redis mode'),
			os: translator.translate('os|OS'),
			'process id': translator.translate('process id|Process ID'),
			'used memory': translator.translate('used memory|Used memory'),
			'used memory peak': translator.translate('used memory peak|Used memory peak'),
			'used memory lua': translator.translate('used memory lua|Used memory lua'),
			'connected clients': translator.translate('connected clients|Connected clients'),
			'total connections': translator.translate('total connections|Total connections'),
			'total commands': translator.translate('total commands|Total commands'),
			'db metrics': translator.translate('db metrics|DB metrics'),
			db: translator.translate('db|DB'),
			'keys num': translator.translate('keys num|Keys'),
			'average ttl': translator.translate('average ttl|Average ttl'),
			'expired keys num': translator.translate('expired keys num|Expired keys'),
			keys: translator.translate('keys|Keys'),
			'nothing here': translator.translate('nothing here|Nothing here'),
			'create new key': translator.translate('create new key|Create new key'),
			refresh: translator.translate('refresh|Refresh'),
			'grep keys by press enter': translator.translate('grep keys by press enter|Grep keys by pressing Enter.'),
			'remove key': translator.translate('remove key|Remove key'),
			'n/a': translator.translate('n/a|N/A'),
			'load more keys': translator.translate('load more keys|Load more keys')
		};
	});

	const serverMetricsKeyPropertyMapping = {
		'redis version': 'redis_version',
		os: 'os',
		'redis mode': 'redis_mode',
		'process id': 'process_id',
		'used memory': 'used_memory_human',
		'used memory peak': 'used_memory_peak_human',
		'used memory lua': 'used_memory_lua_human',
		'connected clients': 'connected_clients',
		'total connections': 'total_connections_received',
		'total commands': 'total_commands_processed'
	};

	const dbMetricsKeyPropertyMapping = {
		'keys num': 'keys',
		'expired keys num': 'expires',
		'average ttl': 'avg_ttl'
	};

	function calcContent(content: any) {
		return emptyInsteadBy(content, $translations['n/a']);
	}

	// Get the db nums.
	fetchDbNums(data.connectionInfo.guid).then((res) => (dbNums = res.data));

	// db0: "keys=4,expires=2,avg_ttl=6346900"
	$: dynamicClasses = calcDynamicClasses(['dashboard', $$restProps.class]);
	$: dbMetrics = Object.entries(data.metrics)
		.filter(
			([key, value]) => constants.regexps.dbMetricsPropertyKeyMatcher.test(key) && value && typeof value === 'string'
		)
		.reduce((acc, [dbname, dbValue]) => {
			const valueSplit = dbValue.split(constants.regexps.dbMetricsPropertyValueSplitter);
			valueSplit.forEach(function (valueSplitItem) {
				const valueParis = constants.regexps.dbMetricsPropertyValuePair.exec(valueSplitItem);
				if (!valueParis) {
					return;
				}

				merge(acc, {
					[dbname.toUpperCase()]: {
						[valueParis[1]]: valueParis[2]
					}
				});
			});

			return acc;
		}, {} as Record<string /** dbname */, Record<string, string>>);
	$: keysLoadingParentDynamicClasses = calcDynamicClasses([
		'dashboard__card',
		'dashboard__card-keys',
		$keysLoadingParentDynamicClassesDerived
	]);
	$: dbNumsOptions = times(dbNums, (i) => ({ label: i + '', value: i })) as SelectOptions;

	const handleLoadMoreKeysClick = function handleLoadMoreKeysClick() {
		dispatch('loadMoreKeys', { guid: data.connectionInfo.guid });
	};
	const handleRefreshKeysClick = function handleRefreshKeysClick() {
		dispatch('refreshKeys', { guid: data.connectionInfo.guid });
	};
	const handleCreateNewKeyClick = function handleCreateNewKeyClick() {
		dispatch('createNewKey', { guid: data.connectionInfo.guid });
	};
	const handleGrepKeys = function handleGrepKeys(e: KeyboardEvent) {
		if (e.key !== 'Enter') {
			return;
		}

		dispatch('grepKeys', { guid: data.connectionInfo.guid, conditionPart: grepContent });
	};
	const handlePreviewKey = function handlePreviewKey(key: string) {
		dispatch('previewKey', { guid: data.connectionInfo.guid, key });
	};
	const handleRemoveKey = function handleRemoveKey(key: string) {
		dispatch('removeKey', { guid: data.connectionInfo.guid, key });
	};
	const handleSwitchDb = function handleSwitchDb(e: CustomEvent<number>) {
		const db = e.detail;

		return fetchSwitchDb(data.connectionInfo.guid, db)
			.then(() => {
				dispatch('switchDb', { guid: data.connectionInfo.guid, db });
				currentDb = db;
			})
			.catch(invokeErrorHandle)
			.catch(() => {
				currentDb = currentDb;
			});
	};
</script>

<div class={dynamicClasses}>
	<Card class={keysLoadingParentDynamicClasses}>
		<div slot="header" class="dashboard__header">
			<div class="dashboard__header-icon fa fa-key" />
			<div class="dashboard__header-content">{$translations['keys']}</div>
			<div class="dashboard__header-operations">
				<Select
					class="dashboard__header-operation dashboard__header-operation-switch-db"
					size="mini"
					options={dbNumsOptions}
					bind:value={currentDb}
					on:input={handleSwitchDb}
				/>
				<Input
					class="dashboard__header-operation dashboard__header-operation-grep-keys"
					placeholder={$translations['grep keys by press enter']}
					bind:value={grepContent}
					pure={false}
					size="mini"
					on:keyup={handleGrepKeys}
				>
					<span class="fa fa-search" slot="prefix" />
				</Input>
				<Button
					class="dashboard__header-operation dashboard__header-operation-load-more-keys"
					title={$translations['load more keys']}
					size="mini"
					on:click={handleLoadMoreKeysClick}>{$translations['load more keys']}</Button
				>
				<span
					class="dashboard__header-operation dashboard__header-operation-refresh-keys fa fa-refresh"
					title={$translations['refresh']}
					role="button"
					on:click={handleRefreshKeysClick}
				/>
				<span
					class="dashboard__header-operation dashboard__header-operation-new-key fa fa-plus"
					title={$translations['create new key']}
					role="button"
					on:click={handleCreateNewKeyClick}
				/>
			</div>
		</div>
		<div class="dashboard__content">
			{#each data['keys'] as key (calcKeysKey(key))}
				<div class="dashboard__content-item dashboard__content-item--operable" on:click={() => handlePreviewKey(key)}>
					<div class="dashboard__content-item-content">{key}</div>
					<div class="dashboard__content-item-operations">
						<span
							class="dashboard__content-item-operation dashboard__content-item-operation-remove-key fa fa-trash-can"
							role="button"
							tabindex="0"
							title={$translations['remove key']}
							on:click|stopPropagation={() => handleRemoveKey(key)}
						/>
					</div>
				</div>
			{:else}
				<div class="dashboard__content-item dashboard__content-item--full-width dashboard__content-item--empty">
					<div class="dashboard__content-item-content">{$translations['nothing here']}</div>
				</div>
			{/each}
		</div>
		<Loading visible={$keysLoadingDerived} />
	</Card>
	<Card class="dashboard__card dashboard__card-server-metrics">
		<div slot="header" class="dashboard__header">
			<div class="dashboard__header-icon fa fa-server" />
			<div class="dashboard__header-content">{$translations['server metrics']}</div>
		</div>
		<div class="dashboard__content">
			{#each Object.entries(serverMetricsKeyPropertyMapping) as [key, property] (key)}
				<div class="dashboard__content-item">
					<div class="dashboard__content-item-label">{$translations[key]}</div>
					<div class="dashboard__content-item-content">{calcContent(data['metrics'][property])}</div>
				</div>
			{:else}
				<div class="dashboard__content-item dashboard__content-item--full-width dashboard__content-item--empty">
					<div class="dashboard__content-item-content">{$translations['nothing here']}</div>
				</div>
			{/each}
		</div>
	</Card>
	<Card class="dashboard__card dashboard__card-db-metrics">
		<div slot="header" class="dashboard__header">
			<div class="dashboard__header-icon fa fa-database" />
			<div class="dashboard__header-content">{$translations['db metrics']}</div>
		</div>
		<div class="dashboard__content">
			{#each Object.entries(dbMetrics) as [dbname, metrics] (dbname)}
				<div class="dashboard__content-item">
					<div class="dashboard__content-item-label">{dbname}</div>
					<div class="dashboard__content-item-content">
						{#each Object.entries(dbMetricsKeyPropertyMapping) as [key, property] (key)}
							<div class="dashboard__content-item dashboard__content-item--full-width">
								<div class="dashboard__content-item-label">{$translations[key]}</div>
								<div class="dashboard__content-item-content">{calcContent(metrics[property])}</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="dashboard__content-item dashboard__content-item--empty">
					<div class="dashboard__content-item-content">{$translations['nothing here']}</div>
				</div>
			{/each}
		</div>
	</Card>
</div>
