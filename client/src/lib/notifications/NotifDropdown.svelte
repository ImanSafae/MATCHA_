<script lang="ts">
  import { onMount } from "svelte";
  import type { Socket } from "socket.io-client";
  import { goto } from "$app/navigation";

  import IoIosNotificationsOutline from 'svelte-icons/io/IoIosNotificationsOutline.svelte';
  
  import { notifications } from "$lib/stores/notificationsStore";
  import {  userData, addLikedProfile, addMatchedProfile,
    removeMatchedProfile,
  } from "$lib/stores/userDataStore";
  
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { toast } from "svelte-sonner";
  import Button from "$lib/components/ui/button/button.svelte";
  import { getSocket } from "$lib/socket";

  $:  reversedNotifications = ($notifications || []).slice().reverse();
  $: nbOfUnread = ($notifications || []).filter(notif => !notif.read).length;

  let notifTimer: any;

  function readNotification(notification: Notification) {
    if (notification.read) {
      return;
    }
    // // console.log("readNotification", notification);
    notifTimer = setTimeout(() => {
      const socket = getSocket();
      if (socket) {
        socket.emit("READ_NOTIF", notification.id);
      }
    }, 1000);
  }

  function setAllNotifsAsRead() {
    const socket = getSocket();
    $notifications.forEach(notif => {
      if (!notif.read) {
        if (socket) {
          socket.emit("READ_NOTIF", notif.id);
        }
      }
    });
  }

  function cancelReadNotification() {
    clearTimeout(notifTimer);
  }
  
  onMount(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit("NOTIF_GET_LIST");
      
      socket.on("NOTIF_LIST", (data: any) => {
        const notifs: any[] = data.data;
        // console.log("NOTIF_GET_LIST", notifs);
        notifications.set(notifs);
        // console.log("notifications after:", $notifications);
      });
      
      socket.on("NEW_NOTIF", (data: Notification) => {
        // console.log("NEW_NOTIF:", data);
        // console.log("notifications before:", $notifications);
        notifications.update(current => [...(current || []), data]);
        // console.log("notifications after:", $notifications);
        
        if (data.type === "NEW_MATCH") {
          if ($userData && data.sender) {
            // alert("You got a match!");
            toast.success("You got a match!", {
              description: `You and ${data.sender.username} liked each other back!`,
              action: {
                label: "Chat",
                onClick: () => goto(`/chat?id=${data.sender.id}`)
              }
            });
            addMatchedProfile(data.sender.id);
            return ;
          }
        } else if (data.type === "UNLIKE") {
          // console.log("Voila le sender", data.sender)
          if ($userData && data.sender) {
            if ($userData.matched?.includes(data.sender.id)) {
              removeMatchedProfile(data.sender.id);
            }
          }
        }
        toast.success("You got a new notification!", {
          description: `${data.sender?.username} ${data.message}`,
          action: {
            label: "Read",
            onClick: () => data.read = true
          }
        });
      });
  
      socket.on("NOTIF_READ_SUCCESS", (data: any) => {
        // console.log("NOTIF_READ_SUCCESS", data);
        const notifId = data.data;
        notifications.update(current => {
          const index = current.findIndex(notif => notif.id === notifId);
          // console.log("index:", index);
          if (index !== -1) {
            if (current[index].read === false) {
              current[index].read = true;
              // console.log("notification marked as read:", current[index]);
            }
          }
          return current;
        });
        $notifications = $notifications;
  
        // console.log("new state of notifications:", $notifications);
        // console.log("new state of reversedNotifications:", reversedNotifications);
        // console.log("new state of nbOfUnread:", nbOfUnread);
      });
    }

  });
</script>
   
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <div class="notif-icon">
      <IoIosNotificationsOutline />
      {#if nbOfUnread > 0}
        <span class="badge">{nbOfUnread}</span>
      {/if}
    </div>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content style="max-height: 40vh; display: flex; flex-direction: column;">
    <DropdownMenu.Group>
      <DropdownMenu.Label>My notifications</DropdownMenu.Label>
      <div style="overflow-y: auto; max-height: 30vh; margin-top: 0.5rem;">
        {#if reversedNotifications}
          {#each reversedNotifications as notification}
            <a 
              href={notification.type === 'NEW_MESSAGE' ? `/chat?id=${notification.sender.id}` : `/account/profile?id=${notification.sender.id}`}
              on:mouseover={() => readNotification(notification)}
              on:focus={() => {readNotification(notification)}}
              on:mouseout={cancelReadNotification}
              on:blur={cancelReadNotification}
              tabindex="-1"
            >
              <DropdownMenu.Item
                style={notification.read ? '' : 'background-color: #c0eed3;'}>
                {notification.sender?.username} {notification.message}
              </DropdownMenu.Item>
            </a>
            <DropdownMenu.Separator />
          {/each}
        {/if}
      </div>
    </DropdownMenu.Group>
    <Button on:click={setAllNotifsAsRead} style="width: 100%; margin-top: 0.5rem;">Set all as read</Button>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<style>

.notif-icon {
  position: relative;
  width: 2em;
  height: 2em;
  margin-top: 0.5em;
}

.badge {
  position: absolute;
  top: -0.5em;
  right: -0.5em;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 0.1em 0.5em;
  font-size: 0.8em;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 1.5em;
  height: 1.5em;
  box-sizing: border-box;
  white-space: nowrap;
}


</style>