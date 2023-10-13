<script lang="ts">
	import '$lib/sass/main.scss';
	import { createSettingsMisc, createThemeMisc } from '$lib/utils/appearance';
	import { PageTheme } from '$lib/types';
	import Aside from './Aside.svelte';

	const themeMisc = createThemeMisc();
	const settingsMisc = createSettingsMisc();

	themeMisc.initEvents();
	themeMisc.subscribe(function (theme) {
		Object.values(PageTheme).forEach(function (th) {
			document.documentElement.classList.remove(`theme-${th.toLowerCase()}`);
		});

		document.documentElement.classList.add(`theme-${theme.toLowerCase()}`);
	});

	settingsMisc.initEvents();
</script>

<main class="tauri-redis-main">
	<Aside class="tauri-redis-aside" />
	<section class="tauri-redis-content">
		<slot />
	</section>
</main>
