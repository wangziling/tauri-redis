<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";

  let name = "";
  let greetMsg = "";

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    greetMsg = await invoke("greet", { name });
  }

  async function async_greet() {
    console.log(await invoke("async_greet", { name, test: "1" }));
  }

  async function get_web_content() {
    console.log(await invoke("get_web_content", { name, uri: "https://baidu.com" }));
  }

  async function handleSubmit () {
    return Promise.allSettled([async_greet(), greet(), get_web_content()])
  }
</script>

<div>
  <form class="row" on:submit|preventDefault={handleSubmit}>
    <input id="greet-input" placeholder="Enter a name..." bind:value={name} />
    <button type="submit">Greet</button>
  </form>
  <p>{greetMsg}</p>
</div>
