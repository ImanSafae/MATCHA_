<!-- src/routes/account/confirm-email.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { httpPOST } from '$lib/httpRequests';

  onMount(async () => {
      const params = new URLSearchParams(window.location.search);
      const uuid = params.get('uuid');

      if (uuid) {
          try {
              const response = await httpPOST("/account/email/update", { uuid: uuid });
              const data = await response.json();
              // console.log(data)
          } catch (error) {
              // console.error('[UPDATE_EMAIL]: ', error);
          }
      }
      goto('/');
  });
</script>

<div>
  Email in validation...
</div>
