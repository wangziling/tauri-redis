<script lang="ts">
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import type { MainTabs, TArrayMember } from '$lib/types';
	import Dashboard from '$lib/components/page/Dashboard.svelte';
	import { MainTabType } from '$lib/types';
	import KeyDetail from '$lib/components/page/key-detail/KeyDetail.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let tabs: MainTabs = [];
	export let activeIdx = 0;

	function calcTabAnchorDynamicClasses(idx: number, others?: Parameters<typeof calcDynamicClasses>[0]) {
		return calcDynamicClasses([
			'tab-anchor',
			{
				'tab-anchor--active': activeIdx === idx
			},
			...[].concat(others)
		]);
	}

	function calcTabContentDynamicClasses(idx: number, others?: Parameters<typeof calcDynamicClasses>[0]) {
		return calcDynamicClasses([
			'tab-content',
			{
				'tab-content--active': activeIdx === idx
			},
			...[].concat(others)
		]);
	}

	function handleChooseTab(idx: number) {
		dispatch('chooseTab', { idx });
	}

	function handleCloseTab(idx: number) {
		dispatch('closeTab', { idx });
	}

	function calcKeyDetailAnchorContent(tab: Extract<TArrayMember<MainTabs>, { type: MainTabType.KeyDetail }>) {
		return tab.data.connectionInfo.connectionName + '|' + tab.data.key;
	}

	function calcDashboardAnchorContent(tab: Extract<TArrayMember<MainTabs>, { type: MainTabType.Dashboard }>) {
		return tab.data.connectionInfo.connectionName;
	}

	$: dynamicClasses = calcDynamicClasses(['tauri-redis-connections-content', $$restProps.class]);
	$: tabsDynamicClasses = calcDynamicClasses([
		'tabs',
		{
			'tabs--multiple': tabs.length > 1
		}
	]);
</script>

<div class={dynamicClasses}>
	{#if tabs.length}
		<div class={tabsDynamicClasses}>
			<div class="tabs-header">
				<div class="tabs-header-wrapper">
					{#each tabs as tab, idx (idx)}
						{#if tab['type'] === MainTabType.Dashboard}
							<div
								class={calcTabAnchorDynamicClasses(idx, 'tab-anchor__type-dashboard')}
								tabindex="0"
								role="button"
								on:click={() => handleChooseTab(idx)}
							>
								<div class="tab-anchor__icon fa fa-database" />
								<div class="tab-anchor__content" title={calcDashboardAnchorContent(tab)}>
									{calcDashboardAnchorContent(tab)}
								</div>
								<div class="tab-anchor__operations">
									<span
										class="tab-anchor__operation tab-anchor__operation-close fa fa-xmark"
										role="button"
										tabindex="0"
										on:click={() => handleCloseTab(idx)}
									/>
								</div>
							</div>
						{:else if tab['type'] === MainTabType.KeyDetail}
							<div
								class={calcTabAnchorDynamicClasses(idx, 'tab-anchor__type-key-detail')}
								tabindex="0"
								role="button"
								on:click={() => handleChooseTab(idx)}
							>
								<div class="tab-anchor__icon fa fa-key" />
								<div class="tab-anchor__content" title={calcKeyDetailAnchorContent(tab)}>
									{calcKeyDetailAnchorContent(tab)}
								</div>
								<div class="tab-anchor__operations">
									<span
										class="tab-anchor__operation tab-anchor__operation-close fa fa-xmark"
										role="button"
										tabindex="0"
										on:click={() => handleCloseTab(idx)}
									/>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
			<div class="tabs-content">
				{#each tabs as tab, idx (idx)}
					{#if tab['type'] === MainTabType.Dashboard}
						<div class={calcTabContentDynamicClasses(idx, 'tab-content__type-dashboard')}>
							<Dashboard
								class="tauri-redis-tab tauri-redis-tab__dashboard"
								bind:data={tab.data}
								on:loadMoreKeys
								on:refreshKeys
								on:createNewKey
								on:grepKeys
								on:removeKey
								on:previewKey
							/>
						</div>
					{:else if tab['type'] === MainTabType.KeyDetail}
						<div class={calcTabContentDynamicClasses(idx, 'tab-content__type-key-detail')}>
							<KeyDetail
								class="tauri-redis-tab tauri-redis-tab__key-detail"
								bind:data={tab.data}
								on:setKeyTTL
								on:renameKey
							/>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
