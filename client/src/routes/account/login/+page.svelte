<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from '$app/navigation';

  import { httpPOST, httpGET } from '$lib/httpRequests';
  import { initializeLocation } from "$lib/location/Location.svelte";
  import Modal from '$lib/components/Modal.svelte';
  
  import type { User } from '$lib/types/User';
  import { userData } from "$lib/stores/userDataStore";
  import { isAuthenticated } from '$lib/stores/isAuthenticated';
  import { theme } from "$lib/stores/theme";

  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button/index.js";
  import { getSocket, initializeSocket } from "$lib/socket";
  import Input from "$lib/components/ui/input/input.svelte";

  interface FormData {
    username: string;
    password: string;
  };
  
  let formData: FormData = {
    username: '',
    password: ''
  };

  let isFormValid: boolean = false;
  let loading: boolean = true;
  let showFailedModal = false;
  let user_value: User | null;
  const unsubscribe = userData.subscribe((value) => (user_value = value));


  onMount(async () => {
    try {
      const response = await httpGET('/account/check-auth');
      const data = await response.json();
      if (data.authenticated) {
        goto('/');
      } else {
        loading = false;
      }
    } catch (error) {
      // console.error('[AUTH CHECK] ', error);
      loading = false;
    }
  });

  onDestroy(unsubscribe);

  async function handleLogin() {
    try {
      const response = await httpPOST('/account/login', formData)
      const result = await response.json();
      resetForm();
      // console.log("[LOGIN]", result);

      if (result.success && result.data && result.data.username && result.data.id) {
        // console.log("user data: ", result.data);
        //$userData = data.data;
        if (result.token) {
          sessionStorage.setItem('token', result.token);
          initializeSocket();
        }
        const newUserData: User = result.data;
        userData.set(newUserData);
        goto('/');
        initializeLocation();
        // const socket = getSocket();
        // if (socket) {
        //   socket.emit("NOTIF_GET_LIST");
        // }
        $isAuthenticated = true;
      } else {
        showFailedModal = true;
      }
    } catch (error) {
      // console.error('[LOGIN] ', error);
    }
  }


  function resetForm() {
    formData = {
      username: '',
      password: ''
    };
  }

  $: isFormValid = (
    formData.username.trim() !== '' &&
    formData.password.trim() !== ''
  );
</script>

<style>

.main-container {
  min-height: 100vh; 
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-image: url("/src/lib/assets/classic/matcha_decor8.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
  position: absolute;
  }
  .form-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 300px;
  }
  input {
    width: 100%;
    padding: 8px;
    margin: 5px 0;
    box-sizing: border-box;
    outline: none;
    border: 1px solid lightgray;
    border-radius: 3px;
  }

  .forgot-password {
    margin-top: 10px;
    color: blue;
    cursor: pointer;
  }
</style>

<div class="main-container" style="background-image:url({$theme.loginPageBackground})">
  {#if loading}
  <!-- <div>Insert loader</div>  -->
  {:else}
  <div class="container">
    <Card.Root>
      <Card.Header class="space-y-1">
        <Card.Title class="text-2xl">Log In Matcha</Card.Title>
        <Card.Description>Enter your email below to start matching</Card.Description>
      </Card.Header>
      <Card.Content class="grid gap-4">
    <div class="form-container">
      <input 
        type="text" 
        placeholder="Username" 
        bind:value={formData.username} 
      />
      <input type="password" placeholder="Password" bind:value={formData.password} /> 
      <Card.Footer class="flex flex-col items-center">
        <Button class="w-full mb-2" on:click={handleLogin} disabled={!isFormValid}>Log In</Button>
        <a class="forgot-password text-blue-500" href="/account/password/forgotten">Forgot your password?</a>
      </Card.Footer>
    </div>
  </Card.Content>
  </Card.Root>
  </div>

  <Modal bind:showModal={showFailedModal} title="Wrong Username and/or Password" message="Please try again." />
  {/if}
</div>
