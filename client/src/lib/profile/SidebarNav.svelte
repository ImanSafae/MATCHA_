<script lang="ts">
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";

  export let items: { title: string; tab: any, isActive: boolean }[];

  function activateTab(item: any) {
    // console.log("Activating tab: ", item);
    items.forEach((i) => {
      i.isActive = i === item;
    });
    items = items;
  }
</script>

<div>
  <nav>
    {#each items as item}
      {@const className = item.isActive ? 'bg-muted rounded-md justify-start' : 'relative justify-start'}

      <Button on:click={() => activateTab(item)} variant="ghost" data-sveltekit-noscroll class={className}>
        <!-- {#if isActive}
          <div class="bg-muted rounded-md" />
        {/if} -->
        <div class="relative">
          {item.title}
        </div>
      </Button>
    {/each}
  </nav>
</div>

<style>
  nav {
    display: flex;
    flex-direction: column;
  }
</style>
