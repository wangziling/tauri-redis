<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { IpcConnection, PageConnections, TArrayMember } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { calcDynamicClasses } from '$lib/utils/calculators';

	export let pageConnections: PageConnections = [];

	const dispatch = createEventDispatcher();

	const translations = translator.derived(function () {
		return {
			'new connection': translator.translate('new connection|New connection'),
			'release connection': translator.translate('release connection|Release connection'),
			'remove connection': translator.translate('remove connection|Remove connection'),
			'edit connection': translator.translate('edit connection|Edit connection')
		};
	});

	function handleNewConnection() {
		dispatch.apply(this, ['newConnection', ...arguments]);
	}

	function handleConfirmConnection(connection: IpcConnection) {
		dispatch('confirmConnection', connection);
	}

	function handleRemoveConnection(connection: IpcConnection) {
		dispatch('removeConnection', connection);
	}

	function handleReleaseConnection(connection: IpcConnection) {
		dispatch('releaseConnection', connection);
	}

	function handleEditConnection(connection: IpcConnection) {
		dispatch('editConnection', connection);
	}

	const calcDynamicAsideConnectionClasses = (pageConnection: TArrayMember<PageConnections>) =>
		calcDynamicClasses([
			'tauri-redis-connections-aside__connection',
			'aside-connection',
			{
				'aside-connection--selected': pageConnection.selected
			}
		]);
</script>

<aside class="tauri-redis-connections-aside">
	<header class="tauri-redis-connections-aside__header">
		<div class="tauri-redis-connections-aside__header-wrapper">
			<Button
				class="tauri-redis-connections-aside__operation-btn tauri-redis-connections-aside__operations-new"
				on:click={handleNewConnection}
			>
				<span>{$translations['new connection']}</span>
				<span class="fa fa-plus" />
			</Button>
		</div>
	</header>
	<section class="tauri-redis-connections-aside__content">
		<ul class="tauri-redis-connections-aside__connections">
			{#each pageConnections as connection (connection.info.guid)}
				<li class={calcDynamicAsideConnectionClasses(connection)}>
					<div class="aside-connection-wrapper">
						<div
							class="aside-connection__header"
							on:click={() => handleConfirmConnection(connection.info)}
							tabindex="0"
						>
							<div class="aside-connection__name">{@html connection.info.connectionName}</div>
							<div class="aside-connection__operations">
								{#if connection.selected}
									<span
										class="aside-connection__operation aside-connection__operation-remove fa fa-plug-circle-xmark"
										tabindex="0"
										role="button"
										title={$translations['release connection']}
										on:click|stopPropagation={() => handleReleaseConnection(connection.info)}
									/>
								{:else}
									<span
										class="aside-connection__operation aside-connection__operation-remove fa fa-pen-to-square"
										tabindex="0"
										role="button"
										title={$translations['edit connection']}
										on:click|stopPropagation={() => handleEditConnection(connection.info)}
									/>
								{/if}
								<span
									class="aside-connection__operation aside-connection__operation-remove fa fa-trash-can"
									tabindex="0"
									role="button"
									title={$translations['remove connection']}
									on:click|stopPropagation={() => handleRemoveConnection(connection.info)}
								/>
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</section>
</aside>
