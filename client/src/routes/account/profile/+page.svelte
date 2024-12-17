<script lang="ts">
  import { httpGET } from '$lib/httpRequests';
  import { onMount } from "svelte";
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { UserDetails } from "../../../types/UserDetails";
  import OtherUserProfile from '$lib/profile/OtherUserProfile.svelte';
  import { userData } from "$lib/stores/userDataStore";

  let loading: boolean = true;
  let userDetails: UserDetails;
  let userId: number;

  onMount(async () => {
    try {
      const response = await httpGET('/account/check-auth');
      const data = await response.json();
      if (!data.authenticated || !$userData || !$userData.id) {
        goto('/account/login');
        return;
      }
      const idQuery: string | null = $page.url.searchParams.get('id');
      if (!idQuery) {
        // console.log("No id query parameter found");
        goto('/');
      } else {
        userId = parseInt(idQuery);
        const userDetailsDTO: UserDetails | null = await retrieveData(userId);
        if (!userDetailsDTO || userId === $userData.id) {
          // console.log("User is the same as the logged in user or user does not exist");
          goto('/');
          return;
        }

        userDetails = UserDetails.fromDTO(userDetailsDTO);
        loading = false;
      }
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

{#if !loading}
  <OtherUserProfile userDetails={userDetails} />
{/if}
