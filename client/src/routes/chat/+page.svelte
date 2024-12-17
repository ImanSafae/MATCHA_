<script lang="ts">
  import Mail from "lucide-svelte/icons/mail";
  import CornerDownLeft from "lucide-svelte/icons/corner-down-left";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { toast } from "svelte-sonner";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator";

  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  import { httpGET } from "$lib/httpRequests";
  import { getSocket } from "$lib/socket";
  import { userData } from "$lib/stores/userDataStore";
  import { mapConversationSummaryFromApi } from "../../types/ConversationSummary";
  import type { ConversationSummary } from "../../types/ConversationSummary";
  import { isAuthenticated } from "$lib/stores/isAuthenticated";
  import type { Socket } from "socket.io-client";
  
  let conversationsList: ConversationSummary[] = [];

  // variable to identify the current conversation
  let selectedConversationSummary: ConversationSummary | null = null;

  // variable to display the content of the selected conversation
  let selectedConversation: Conversation | null = null;

  let temporaryConversationSummary: ConversationSummary | null = null;

  let messageToSend: string = "";

  let conversationsLoaded: boolean = false;

  // let socket: Socket | null = null;

  function setOtherUser() {
    conversationsList.forEach((conversation) => {
      if (conversation.user_1.username === $userData!.username) {
        conversation.otherUser = conversation.user_2;
      } else {
        conversation.otherUser = conversation.user_1;
      }
    });
  }

  async function getConversationsSummaries() {
    // fill conversationSummaries variables with data from the server
    const response = await httpGET("/chat");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const convos: ConversationSummary[] = mapConversationSummaryFromApi(
      data.data
    );

    conversationsList = convos;
    setOtherUser();
  }

  function handleNewConversationSummary(
    interlocutor: User | null,
    me: User | null,
    content: string,
    conversationId?: number
  ) {
    // if (!user_1 || !user_2) {
    //   // console.error("Invalid users data");
    //   goto("/chat");
    //   return null;
    // }
    const newConversationSummary: ConversationSummary = {
      user_1: me,
      user_2: interlocutor,
      latestMessage: content,
      otherUser: interlocutor,
    };
    // conversationsList = [...conversationsList, newConversationSummary];
    return newConversationSummary;
  }

  function handleNewConversation(conversationId: number, user_1: User, user_2: User) {
    // the new conversation has been created server side: add it to the list
    const otherUser = user_1.id === $userData!.id ? user_2 : user_1;
    if (temporaryConversationSummary) { // the temporary conversation created is still assigned to the new one (should always be the case)
      temporaryConversationSummary.id = conversationId;
      selectConvo(temporaryConversationSummary);
      conversationsList = [...conversationsList, temporaryConversationSummary];
      temporaryConversationSummary = null;
    }
    else { // just in case the temporary conversation variable was destroyed or not assigned
      const newConversationSummary = handleNewConversationSummary(otherUser, $userData, "", conversationId);
      selectConvo(newConversationSummary);
      conversationsList = [...conversationsList, newConversationSummary];
    }

    const newConversation: Conversation = {
      id: conversationId,
      user_1: user_1,
      user_2: user_2,
      messages: [],
      latestMessage: "",
    };
    selectedConversation = newConversation;
  }

  function getUsernameById(id: number) {
    if (!$userData || !selectedConversationSummary) {
      return null;
    }

    if (selectedConversationSummary.user_1 && selectedConversationSummary.user_1.id === id) {
      return selectedConversationSummary.user_1.username;
    } else if (selectedConversationSummary.user_2 && selectedConversationSummary.user_2.id === id) {
      return selectedConversationSummary.user_2.username;
    } else {
      return null;
    }
  }

  function formatNewMessage(data: any): Message {
    return {
      sender: data.sender.id,
      content: data.content,
      timestamp: data.timestamp,
    };
  }

  function handleNewMessageIncoming(data: any) {
    let conversation = conversationsList.find((conversation: any) => {
      return conversation.id === data.conversationId;
    });

    if (!conversation) {
      // console.log("No conversation found for this message");
      handleNewConversationSummary(
        data.sender,
        $userData,
        data.content,
        data.conversationId
      );
      return;
    }

    conversation.latestMessage = data.content;
    conversationsList = conversationsList;

    if (
      selectedConversation &&
      selectedConversation.id === data.conversationId
    ) {
      const newMessageEntry: Message = formatNewMessage(data);
      selectedConversation.messages = [
        ...selectedConversation.messages,
        newMessageEntry,
      ];
      // console.log(
      //   "new content of selected conversation:",
      //   selectedConversation
      // );
    }
  }

  async function handleParams() {
    const idParam: string | null = $page.url.searchParams.get("id");
    if (idParam) {
      // chercher dans la liste des conversations si la conversation existe
      // si oui : la sélectionner
      const convoFound = conversationsList.find((conversation) => {
        if (conversation.otherUser && conversation.otherUser.id === parseInt(idParam)) {
          // console.log("An existing conversation was found with this user, requesting its content...");
          selectConvo(conversation);
          getFullConversation(conversation);
          return true;
        }
      });
      if (convoFound) {
        return;
      }
      // si non, la créer localement seulement pour l'instant
      // fetch le username
      // console.log("No conversation existed with this user, creating a new one...");
      const usernameResponse = await httpGET(`/get-username/${idParam}`);
      const data = await usernameResponse.json();
      if (!data || !data.success) {
        toast.error(data.msg);
        goto("/chat");
        return;
      }
      // console.log("You're trying to chat with:", data.data);
      const newUser: User = {
        id: parseInt(idParam),
        username: data.data,
      };
      const newConversationSummary = handleNewConversationSummary(
        newUser,
        $userData,
        ""
      );
      selectConvo(newConversationSummary);
      temporaryConversationSummary = newConversationSummary;
      // console.log("temporary conversation created:", temporaryConversationSummary);
    }
  }

  onMount(async () => {
    const authResponse = await httpGET('/account/check-auth');
    const authData = await authResponse.json();
    if (!authData.authenticated) {
      goto('/account/login');
      return;
    } else {
      let retryCount = 0;
      const maxRetries = 10;
      const intervalTime = 500; // 500 ms

      const intervalId = setInterval(() => {
        const socket = getSocket();
        if (socket) {
          // console.log("Socket successfully initialized");
          clearInterval(intervalId);
          setupSocketListeners(socket);
        } else {
          retryCount++;
          if (retryCount >= maxRetries) {
            // console.error("Failed to get socket after multiple retries.");
            clearInterval(intervalId);
          }
        }
      }, intervalTime);
    }
  });

  function setupSocketListeners(socket: Socket) {
    socket.off("CHAT_NEW_MSG");
    socket.on("CHAT_NEW_MSG", (data) => {
      // console.log("CHAT_NEW_MSG", data);
      if (!data.conversationId || !data.sender || !data.content) {
        // console.error("Invalid data received from server:", data);
        return;
      }
      handleNewMessageIncoming(data);
    });
        
    socket.on("CHAT_FULL_CONVERSATION", (data) => {
      // console.log("CHAT_FULL_CONVERSATION", data);
      if (!data.content.id || data.content.messages === undefined) {
        // console.error("Invalid data received from server:", data);
        return;
      }
      selectedConversation = data.content;
      // console.log("selectedConversation:", selectedConversation);
    });
    
    socket.off("MESSAGE_SENT");
    socket.on("MESSAGE_SENT", (dto) => {
      const data = dto.data;
      const conversation = conversationsList.find((conversation) => {
        return conversation.id === data.conversationId;
      });
      
      if (conversation) {
        conversation.latestMessage = data.content;
        conversationsList = conversationsList;
      }
        
      // console.log("MESSAGE_SENT", data);
        
      let newMessageContent: Message = {
        sender: data.sender.id,
        content: data.content,
        timestamp: data.timestamp,
      };
        
      if (selectedConversation) {
        if (selectedConversation.messages) {
          selectedConversation.messages = [
            ...selectedConversation.messages,
            newMessageContent,
          ];
        } else {
          selectedConversation.messages = [newMessageContent];
        }
      }
      
      messageToSend = "";
    });
      
    socket.on("MESSAGE_NOT_SENT", (data) => {
      // console.error("MESSAGE_NOT_SENT", data);
      messageToSend = "";
    });
      
    socket.on("CHAT_NEW_CONVERSATION", (data) => {
      // console.log("CHAT_NEW_CONVERSATION", data);
      if (!data.user_1 || !data.user_2 || !data.conversationId) {
        // console.error("Invalid data received from server:", data);
        return;
      }
      handleNewConversation(data.conversationId, data.user_1, data.user_2);
    });
  
    // get conversation summaries to display them on the left
    getConversationsSummaries().then(() => {
      conversationsLoaded = true;
      handleParams();
    });
  }

  function sendMessage() {
    // console.log("SEND MESSAGE FUNCTION TRIGGERED");
    const timestamp = new Date();

    if (!selectedConversationSummary || !selectedConversationSummary.otherUser) {
      // console.error("No conversation selected");
      return;
    }

    let newMessage: MessageToSend = {
      conversationId: selectedConversationSummary?.id,
      to: selectedConversationSummary.otherUser, // remplacer dans le cas ou c'est une nouvelle conversation
      content: messageToSend,
      timestamp: timestamp,
    };
    // console.log("sendMessage", newMessage);
    const socket = getSocket();
    if (socket) {
      socket.emit("CHAT_SEND_MESSAGE", newMessage);
    }

  }

  function getFullConversation(conversation: ConversationSummary | null) {
    if (!conversation || !conversation.id) {
      // console.error("Invalid conversationId or new conversation: no content to fetch");
      return;
    }
    const data = {
      conversationId: conversation.id,
      user: conversation.otherUser,
    };
    // console.log("requesting full conversation");
    const socket = getSocket();
    if (socket) {
      socket.emit("CHAT_GET_CONVERSATION", {
        conversationId: conversation.id,
        user: conversation.otherUser,
      });
    }
  }

  function selectConvo(conversation: any) {
    selectedConversationSummary = conversation;
    // console.log("selectConvo", conversation);
  }

  function handleEnter(event: KeyboardEvent) {
    if (event.key === "Enter") {
      sendMessage();
      event.preventDefault();
      event.stopPropagation();
    }
  }
</script>
<div class="container">
<div class="grid h-screen w-full pl-[53px]">
  <div class="flex flex-col">
    <header
      class="bg-background sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b px-4"
    >
      <Mail class="size-4"/>
      <h1 class="text-xl font-semibold"> Private Messages</h1>
    </header>
    <main class="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
      <div class="relative hidden flex-col items-start gap-8 md:flex" id="sidebar">
        <form class="grid w-full items-start gap-6">
          <fieldset class="gap-6 rounded-lg border p-4" id="conversations-block">
            <legend class="-ml-1 px-1 text-sm font-medium"> Conversations </legend>
            <div class="searchbar">
              <Input type="text" placeholder="Search" />
            </div>
          {#if temporaryConversationSummary}
            <button
            class="conversation"
            on:click={() => {
              selectConvo(temporaryConversationSummary);
              getFullConversation(temporaryConversationSummary);
            }}>
            <ul class="interlocutor">@{temporaryConversationSummary.otherUser.username}</ul>
            <ul class="last-message">{temporaryConversationSummary.latestMessage}</ul>
            </button>
            <Separator />
          {/if}
          {#if !conversationsLoaded}
            <p>Loading...</p>
          {:else if conversationsList && conversationsList.length > 0}
          <div class="conversations-list">
            <Separator />
            {#each conversationsList as conversation, index}
              <button
                class="conversation"
                on:click={() => {
                  selectConvo(conversation);
                  getFullConversation(conversation);
                }}
              >
                <ul class="interlocutor">@{conversation.otherUser.username}</ul>
                {#if conversation.latestMessage !== undefined}
                  <ul class="last-message">{conversation.latestMessage}</ul>
                {/if}
              </button>
              {#if index < conversationsList.length - 1}
                <Separator />
              {/if}
              <Separator />
            {/each}
          </div>
          {:else}
              <p>No conversations yet. Match with someone to start chatting!</p>
          {/if}
          </fieldset>
        </form>
      </div>
      {#if selectedConversationSummary}
      <div
        class="bg-muted/50 relative flex h-full min-h-[50 vh] flex-col rounded-xl p-4 lg:col-span-2"
        id="chat"
      >
        <div class="upperbar">
          {#if selectedConversationSummary && selectedConversationSummary.otherUser && selectedConversationSummary.otherUser.username}
            {selectedConversationSummary.otherUser.username}
          {/if}
        </div>
        <div class="flex-1" id="messages">
          {#if selectedConversation && selectedConversation.messages}
              {#each selectedConversation.messages as message}
                <div>{getUsernameById(message.sender)} : {message.content}</div>
              {/each}
              {/if}
            </div>
            <form
            class="bg-background focus-within:ring-ring relative overflow-hidden rounded-lg border focus-within:ring-1"
            >
            <label for="message" class="sr-only">Message</label>
            <Textarea
            id="message"
            placeholder="Type your message here..."
            class="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
            bind:value={messageToSend}
            on:keydown={handleEnter}
            />
            <div class="flex items-center p-3 pt-0">
                  <Button type="submit" size="sm" class="ml-auto gap-1.5"
                  on:click={sendMessage} disabled={selectedConversationSummary ? false : true}>
                  Send Message
                  <CornerDownLeft class="size-3.5" />
                </Button>
              </div>
            </form>
          </div>
          {/if}
    </main>
  </div>
</div>
</div>

<style>
.searchbar {
    height: fit-content;
    margin:0;
    padding:0;
  }

  #conversations-block {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .container {
    display: flex;
    justify-content: center;
    min-height: 100vh;
    height:auto;
    flex-direction: row;
    border-radius: 10px;
    border-radius: 10px;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  
  #sidebar {
    display: flex;
    /* align-items: center; */
    flex-direction: column;
  }

  .conversation {
    border: none;
    /* border-bottom: 1px solid black; */
    width: 100%;
    background-color: white;
    cursor: pointer;
    box-shadow: none;
  }

  #chat {
    flex-direction: column;
    border: 1px solid lightgray;
  }

  .upperbar {
    height: 2em;
    border-bottom: 1px solid grey;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  #messages {
    padding: 1em;
    overflow-y: auto;
  }

  * {
  box-sizing: border-box;
}
</style>
