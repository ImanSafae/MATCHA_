<script lang="ts">
  import { setContext } from 'svelte';
  import { onMount } from "svelte";
  import { goto } from '$app/navigation';
  
  import OwnProfile from '$lib/profile/OwnProfile.svelte';
  import SidebarNav from "$lib/profile/SidebarNav.svelte";
  import StatisticsTab from '$lib/profile/StatisticsTab.svelte';
  import HistoryTab from '$lib/profile/HistoryTab.svelte';

  import { UserDetails } from "../../../types/UserDetails";
  import { userData } from "$lib/stores/userDataStore";
  import { userDetails } from '$lib/stores/userDetailts';
  import { httpGET } from '$lib/httpRequests';

  import { Separator } from "$lib/components/ui/separator";


  let loading: boolean = true;

  let items: { title: string; tab: any, isActive: boolean }[] = [
    { title: "Profile", tab: OwnProfile, isActive: true },
    { title: "Statistics", tab: StatisticsTab, isActive: false },
    { title: "History", tab: HistoryTab, isActive: false },
  ];

  $: ActiveTab = (items.find((item) => item.isActive === true))?.tab;

  //$: console.log("Items: ", items);
  //$: console.log("Active tab: ", ActiveTab);

  setContext('userDetails', userDetails);
  setContext('surprise', 'gros toz');
  
  onMount(async () => {
    try {
      const response = await httpGET('/account/check-auth');
      const data = await response.json();
      if (!data.authenticated || !$userData) {
        goto('/account/login');
        return;
      }

      const userDetailsDTO: UserDetails | null = await retrieveData($userData.id);
      if (!userDetailsDTO) {
        goto('/');
        return;
      }

      $userDetails = UserDetails.fromDTO(userDetailsDTO);
      loading = false;
    } catch (error) {
      // console.error('[PROFILE] ', error);
      loading = false;
    }
  });

  async function retrieveData(id: number) {
    // console.log("Retrieving data for user with id: ", id);
    const response = await httpGET(`/account/profile?id=${id}`);
    const data = await response.json();
    if (!data.success) {
      // console.error('[PROFILE] ', data);
      alert(data.msg);
      return null;
    } else {
      const userDetailsDTO: UserDetails = data.user;
      return userDetailsDTO;
    }
  }
</script>
<div class="container">
  <div class="space-y-0.5">
    <h2 class="scroll-m-20 text-3xl font-bold tracking-tight">User Profile</h2>
  </div>
  <Separator class="my-6" />
  <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
    <aside class="-mx-4 lg:w-1/6">
      <SidebarNav bind:items={items} />
    </aside>
    <div class="flex-1 lg:max-w-2xl">
        {#if !loading && $userDetails}
          <svelte:component this={ActiveTab} userDetails={$userDetails} />
        {/if}
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 100vw;
    margin: 10 auto;
    background-color: #fff;
    padding: 75px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    max-height: 100vh;
  }
</style>
