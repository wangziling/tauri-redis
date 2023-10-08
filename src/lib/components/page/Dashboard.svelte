<script lang="ts">
	import type { MainTab, MainTabType } from '$lib/types';
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import Card from '$lib/components/Card.svelte';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import constants from '$lib/constants';
	import { merge } from 'lodash-es';
	import { createEventDispatcher } from 'svelte';
	import Input from '$lib/components/Input.svelte';

	const dispatch = createEventDispatcher();

	export let data: Extract<MainTab, { type: MainTabType.Dashboard }>['data'] = {} as any;

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
			'grep keys': translator.translate('grep keys|Grep keys')
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
					[dbname]: {
						[valueParis[1]]: valueParis[2]
					}
				});
			});

			return acc;
		}, {} as Record<string /** dbname */, Record<string, string>>);

	const handleRefreshKeysClick = function handleRefreshKeysClick() {
		dispatch('refreshKeys', { guid: data.connectionInfo.guid });
	};
	const handleCreateNewKeyClick = function handleCreateNewKeyClick() {
		dispatch('createNewKey', { guid: data.connectionInfo.guid });
	};
	const handleGrepKeys = function handleCreateNewKeyClick(e: CustomEvent<string>) {
		dispatch('grepKeys', { guid: data.connectionInfo.guid, conditionPart: e.detail });
	};
</script>

<div class={dynamicClasses}>
	<Card class="dashboard__card">
		<div slot="header" class="dashboard__header">
			<div class="dashboard__header-icon fa fa-key" />
			<div class="dashboard__header-content">{$translations['keys']}</div>
			<div class="dashboard__header-operations">
				<Input
					class="dashboard__header-operation dashboard__header-operation-grep-keys"
					placeholder={$translations['grep keys']}
					on:input={handleGrepKeys}
				>
					<span class="fa fa-search" slot="prefix" />
				</Input>
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
			{#each data['keys'] as key (key)}
				<div class="dashboard__content-item">
					<div class="dashboard__content-item-content">{key}</div>
				</div>
			{:else}
				<div class="dashboard__content-item dashboard__content-item--full-width dashboard__content-item--empty">
					<div class="dashboard__content-item-content">{$translations['nothing here']}</div>
				</div>
			{/each}
		</div>
	</Card>
	<Card class="dashboard__card">
		<div slot="header" class="dashboard__header">
			<div class="dashboard__header-icon fa fa-server" />
			<div class="dashboard__header-content">{$translations['server metrics']}</div>
		</div>
		<div class="dashboard__content">
			{#each Object.entries(serverMetricsKeyPropertyMapping) as [key, property] (key)}
				<div class="dashboard__content-item">
					<div class="dashboard__content-item-label">{$translations[key]}</div>
					<div class="dashboard__content-item-content">{data['metrics'][property]}</div>
				</div>
			{:else}
				<div class="dashboard__content-item dashboard__content-item--full-width dashboard__content-item--empty">
					<div class="dashboard__content-item-content">{$translations['nothing here']}</div>
				</div>
			{/each}
		</div>
	</Card>
	<Card class="dashboard__card">
		<div slot="header" class="dashboard__header">
			<div class="dashboard__header-icon fa fa-database" />
			<div class="dashboard__header-content">{$translations['db metrics']}</div>
		</div>
		<div class="dashboard__content">
			{#each Object.entries(dbMetrics) as [dbname, metrics] (dbname)}
				<div class="dashboard__content-item dashboard__content-item--full-width">
					<div class="dashboard__content-item-label">{dbname}</div>
					<div class="dashboard__content-item-content">
						{#each Object.entries(dbMetricsKeyPropertyMapping) as [key, property] (key)}
							<div class="dashboard__content-item dashboard__content-item--full-width">
								<div class="dashboard__content-item-label">{$translations[key]}</div>
								<div class="dashboard__content-item-content">{metrics[property]}</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="dashboard__content-item dashboard__content-item--full-width dashboard__content-item--empty">
					<div class="dashboard__content-item-content">{$translations['nothing here']}</div>
				</div>
			{/each}
		</div>
	</Card>
</div>
