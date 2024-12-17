<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { httpGET } from '$lib/httpRequests';
  import { getSocket } from '$lib/socket';

  import { isAuthenticated } from '$lib/stores/isAuthenticated';

  onMount(async () => {
    try {
      const response = await httpGET('/account/logout');
      const data = await response.json();
      // console.log("[LOGOUT]", data);
      if (data.success) {
        sessionStorage.removeItem('token');
        $isAuthenticated = false;
        const socket = getSocket();
        if (socket) {
          // console.log('Forcing socket disconnect');
          socket.disconnect();
        }
        goto('/account/login');
      }
    } catch (error) {
      // console.error('[LOGOUT] ', error);
    }
  });
</script>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .message {
    font-size: 1.5rem;
  }
</style>

<div class="container">
  <div class="message">Logging out...</div>
</div>
