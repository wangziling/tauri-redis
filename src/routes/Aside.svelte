<script lang="ts">
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { page } from '$app/stores';
	import { createThemeMisc } from '$lib/utils/appearance';
	import { PageTheme } from '$lib/types';

	const themeMisc = createThemeMisc();
	const currentTheme = themeMisc.theme;

	const translations = translator.derived(function () {
		return {
			connections: translator.translate('connections|Connections'),
			logs: translator.translate('logs|Logs'),
			settings: translator.translate('settings|Settings'),
			'toggle theme': translator.translate('toggle theme|Toggle theme')
		};
	});

	const calcActionDynamicClasses = (targetPathname: string, pathname: string) =>
		calcDynamicClasses([
			'aside-action',
			{
				'aside-action--active': targetPathname === pathname
			}
		]);

	const handleToggleTheme = function handleToggleTheme() {
		themeMisc.toggleTheme();
	};

	$: dynamicClasses = calcDynamicClasses(['aside', $$restProps.class]);

	$: toggleThemeIconDynamicClasses = calcDynamicClasses([
		'aside-action__icon',
		'fa',
		$currentTheme === PageTheme.Dark ? 'fa-moon' : 'fa-sun'
	]);
</script>

<aside class={dynamicClasses}>
	<div class="aside__item aside__item-compositions">
		<div class="aside-actions">
			<ul class="aside-actions-container">
				<li class={calcActionDynamicClasses($page.url.pathname, '/connections')}>
					<a
						class="aside-action__icon fa fa-server"
						href="/connections"
						title={$translations['connections']}
						aria-label={$translations['connections']}
					/>
				</li>
				<li class={calcActionDynamicClasses($page.url.pathname, '/logs')}>
					<a
						class="aside-action__icon fa fa-file-lines"
						href="/logs"
						title={$translations['logs']}
						aria-label={$translations['logs']}
					/>
				</li>
			</ul>
		</div>
	</div>
	<div class="aside__item aside__item-operations">
		<div class="aside-actions">
			<ul class="aside-actions-container">
				<li class="aside-action">
					<a
						class={toggleThemeIconDynamicClasses}
						href="javascript:;"
						title={$translations['toggle theme']}
						aria-label={$translations['toggle theme']}
						on:click|preventDefault={handleToggleTheme}
					/>
				</li>
				<li class={calcActionDynamicClasses($page.url.pathname, '/settings')}>
					<a
						class="aside-action__icon fa fa-sliders"
						href="/settings"
						title={$translations['settings']}
						aria-label={$translations['settings']}
					/>
				</li>
			</ul>
		</div>
	</div>
</aside>
