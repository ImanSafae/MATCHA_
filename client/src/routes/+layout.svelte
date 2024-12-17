<script lang="ts">
import "../app.css";
import { goto } from '$app/navigation';
import { onMount } from "svelte";

import { getSocket } from "$lib/socket";
import NotifDropdown from "$lib/notifications/NotifDropdown.svelte";
import { notifications } from "$lib/stores/notificationsStore";
import { Toaster } from "$lib/components/ui/sonner";
import { isAuthenticated, checkAuth } from '$lib/stores/isAuthenticated';
import { themes } from "$lib/themes";
import { theme } from "$lib/stores/theme";

import House from "lucide-svelte/icons/house";
import LogOut from "lucide-svelte/icons/log-out";
import MessageCircle from "lucide-svelte/icons/message-circle";
import Search from "lucide-svelte/icons/search";
import UserRoundCog from "lucide-svelte/icons/user-round-cog";

let authStatus = false;
$: $isAuthenticated, authStatus = $isAuthenticated;
let selectedTheme = themes[0];
$: $theme = selectedTheme;


onMount(async () => {

  const randomIndex = Math.floor(Math.random() * themes.length);
  selectedTheme = themes[randomIndex];

  if (!authStatus) {
    await checkAuth();
  }

  if (authStatus) {
    const socket = getSocket();
    if (socket) {
      if (!$notifications) {
        socket.emit("NOTIF_GET_LIST");
      }
      
      socket.on("connect_error", (error) => {
        // console.error("connect_error", error);
      });
      
      socket.on("ERROR", (data) => {
        // console.error("ERROR", data);
      });
    }
  }
  
});

function navigateTo(path: string) {
  return (event: Event) => {
    event.preventDefault();
    if (window.location.pathname === path) {
      window.location.reload();
    } else {
      goto(path);
    }
  };
}

</script>
<div class="header">
  <div class="matcha-logo">
    <img src={selectedTheme.logoPath} class="matcha-logo" alt="Matcha Logo" />
  </div>
  <div class="navbar">
    <nav>
      <a href="/home" on:click={navigateTo('/')}><House class="size-4"/>Home</a>
       {#if !$isAuthenticated}
        <a href="/account/login" on:click={navigateTo('/account/login')}>Log In</a>
        <a href="/account/register" on:click={navigateTo('/account/register')}>Register</a>
      {:else}
        <a href="/research" on:click={navigateTo('/research')}><Search class="size-4"/>Search</a>
        <a href="/account/me" on:click={navigateTo('/account/me')} class="profile-link"><UserRoundCog class="size-4"/>My Profile</a>
        <a href="/chat" on:click={navigateTo('/chat')}><MessageCircle class="size-4"/>Chat</a>
        <a href="/account/logout" on:click={navigateTo('/account/logout')}><LogOut class="size-4"/>Log Out</a>
      {/if}
    </nav>
    {#if $isAuthenticated}
    <div class="notifications">
      <NotifDropdown/>
    </div>
    {/if}
  </div>

  <Toaster />
</div>
<slot></slot>


<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background-color: #f2faf2;
  }

  .header {
    display: flex;
    justify-content: space-between;
    background-color: #dffcdf;
  }

  .navbar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0.2em 1em;
    gap: 7em;
    z-index: 100;
  }

  .navbar nav a {
    color: white;
    background-color: black;
    padding: 0.5em 1em;
    text-decoration: none;
    border-radius: 5px;
    font-size: 1rem;
    transition: background-color 0.3s ease;
    display: inline-flex;
    align-items: center;
    text-align: center;
    gap: 0.5em;
  }

  .navbar nav a:hover {
    background-color: #444;
  }

  .navbar nav {
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .navbar nav {
      gap: 1em;
      flex-wrap: wrap;
    }

    .navbar nav a {
      padding: 0.5em 0.8em;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .navbar nav {
      flex-direction: row;
      align-items: right;
    }

    .navbar nav a {
      font-size: 0.8rem;
      padding: 0.4em 0.7em;
    }
  }

  .notifications {
    margin-right: 1vw;
  }

  .matcha-logo {
    width: 5rem;
    height: 5rem;
  }

</style>
