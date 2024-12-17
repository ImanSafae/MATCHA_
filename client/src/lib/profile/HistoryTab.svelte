<script lang="ts">
  import { UserDetails } from "../../types/UserDetails";
  import { httpGET } from "$lib/httpRequests";

  import { Button } from "$lib/components/ui/button";

  export let userDetails: UserDetails;

  let viewedProfiles: any[] = [];
  let viewers: any[] = [];
  let likers: any[] = [];
  let likedProfiles: any[] = [];

  async function showViewedProfiles(event: Event) {
    event.preventDefault();
    const response = await httpGET("/account/profile/viewed");
    const data = await response.json();
    viewedProfiles = data.viewedProfiles;
  }

  async function showViewers(event: Event) {
    event.preventDefault();
    const response = await httpGET("/account/profile/viewers");
    const data = await response.json();
    viewers = data.viewers;
  }

  async function showLikedProfiles(event: Event) {
    event.preventDefault();
    const response = await httpGET("/account/profile/liked");
    const data = await response.json();
    likedProfiles = data.likedProfiles;
  }

  async function showLikers(event: Event) {
    event.preventDefault();
    const response = await httpGET("/account/profile/likers");
    const data = await response.json();
    likers = data.likers;
  }
</script>

<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">History</h3>
<p class="text-muted-foreground mb-6">
  Browse your views and likes history.
</p>
<form on:submit={showViewedProfiles}>
  <Button type="submit">Show Viewed Profiles</Button>
</form>
<div class="views-container">
  {#each viewedProfiles as view}
    <div class="view-item">
      <a href="/account/profile?id={view.id}">
        {view.first_name}
        {view.last_name}'s profile viewed on {new Date(
          view.timestamp
        ).toLocaleString()}
      </a>
    </div>
  {/each}
</div>
<form on:submit={showViewers}>
  <Button type="submit">Show who viewed my profile</Button>
</form>
<div class="views-container">
  {#each viewers as view}
    <div class="view-item">
      <a href="/account/profile?id={view.id}">
        {view.first_name}
        {view.last_name} has viewed your profile on {new Date(
          view.timestamp
        ).toLocaleString()}
      </a>
    </div>
  {/each}
</div>
<form on:submit={showLikedProfiles}>
  <Button type="submit">Show Liked Profiles</Button>
</form>
<div class="views-container">
  {#each likedProfiles as view}
    <div class="view-item">
      <a href="/account/profile?id={view.id}">
        You liked {view.first_name}
        {view.last_name}'s profile on {new Date(
          view.timestamp
        ).toLocaleString()}
      </a>
    </div>
  {/each}
</div>
<form on:submit={showLikers}>
  <Button type="submit">Show who liked my profile</Button>
</form>
<div class="views-container">
  {#each likers as view}
    <div class="view-item">
      <a href="/account/profile?id={view.id}">
        {view.first_name}
        {view.last_name} has liked your profile on {new Date(
          view.timestamp
        ).toLocaleString()}
      </a>
    </div>
  {/each}
</div>

<style>
  .views-container {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
    margin-top: 10px;
  }

  .view-item {
    padding: 5px 0;
    border-bottom: 1px solid #eee;
  }
</style>
