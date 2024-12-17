<script lang="ts">
  import { onMount } from "svelte";

  import UnloggedHomePage from "$lib/home/UnloggedHomePage.svelte";
  import Browsing from "$lib/browsing/Browsing.svelte";
  import { httpGET } from '$lib/httpRequests';


  let authenticated: boolean = false;

  onMount(async () => {
    const response = await httpGET('/account/check-auth');
    const page = await response.json();
    // console.log("PAGE: ", page);
    authenticated = page.authenticated;
  });

</script>

{#if authenticated}
  <Browsing />
{:else}
  <UnloggedHomePage />
{/if}


