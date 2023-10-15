<script lang="ts">
	import '$lib/sass/main.scss';
	import { createLoadingMisc, createSettingsMisc, createThemeMisc } from '$lib/utils/appearance';
	import { PageTheme } from '$lib/types';
	import Aside from './Aside.svelte';
	import Loading from '$lib/components/interaction/Loading.svelte';
	import { calcDynamicClasses } from '$lib/utils/calculators';

	const themeMisc = createThemeMisc();
	const settingsMisc = createSettingsMisc();

	const loadingMisc = createLoadingMisc();
	const { loading, parentDynamicClasses } = loadingMisc;

	themeMisc.initEvents();
	themeMisc.subscribe(function (theme) {
		Object.values(PageTheme).forEach(function (th) {
			document.documentElement.classList.remove(`theme-${th.toLowerCase()}`);
		});

		document.documentElement.classList.add(`theme-${theme.toLowerCase()}`);
	});

	settingsMisc.initEvents();
	$: dynamicClasses = calcDynamicClasses(['tauri-redis-main', $parentDynamicClasses]);
</script>

<main class={dynamicClasses}>
	<Aside class="tauri-redis-aside" />
	<section class="tauri-redis-content">
		<slot />
	</section>
	<Loading visible={$loading} />
</main>
