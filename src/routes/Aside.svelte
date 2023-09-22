<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { IpcConnections } from '$lib/types';
	import { merge } from 'lodash-es';
	import { translator } from '$lib/utils/translator';
	import type { TranslateResults } from '$lib/types';

	export let connections: IpcConnections = [];

	const dispatch = createEventDispatcher();

	const translations = {} as TranslateResults;
	const calcTranslations = function calcTranslations() {
		merge(translations, {
			'new connection': translator.translate('new connection|New connection')
		});
	};
	translator.subscribe(function (translations) {
		calcTranslations();
	});

	function handleNewConnection() {
		dispatch.apply(this, ['newConnection', ...arguments]);
	}

	function handleConfirmConnection() {
		dispatch.apply(this, ['confirmConnection', ...arguments]);
	}
</script>

<aside class="tauri-redis-aside">
	<header class="tauri-redis-aside__header">
		<div class="tauri-redis-aside__header-wrapper">
			<Button
				class="tauri-redis-aside__operation-btn tauri-redis-aside__operations-new"
				type="primary"
				on:click={handleNewConnection}
			>
				<span>{translations['new connection']}</span>
				<span class="fa fa-plus" />
			</Button>
		</div>
	</header>
	<section class="tauri-redis-aside__content">
		<ul class="tauri-redis-aside__connections">
			{#each connections as connection}
				<li class="tauri-redis-aside__connection aside-connection">
					<div class="aside-connection-wrapper">
						<div class="aside-connection__header" on:click={handleConfirmConnection} tabindex="0">
							<div class="aside-connection__name">{@html connection.connectionName}</div>
							<div class="aside-connection__operations" />
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</section>
</aside>
