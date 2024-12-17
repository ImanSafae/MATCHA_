<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card";
  import * as Carousel from "$lib/components/ui/carousel";
  import { toast } from "svelte-sonner";
  import { StarFull, StarHalf, StarEmpty } from "$lib/components/ui/stars/index.ts";

  import GiFemale from "svelte-icons/gi/GiFemale.svelte";
  import GiMale from "svelte-icons/gi/GiMale.svelte";

  import { UserDetails } from "../../types/UserDetails";
  import {
    userData,
    addLikedProfile,
    addMatchedProfile,
    removeLikedProfile,
    removeMatchedProfile,
    addBlockedProfile,
    removeBlockedProfile,
  } from "$lib/stores/userDataStore";

  import { getSocket } from "$lib/socket";
  import { formatBirthDate } from "$lib/profile/Utils.svelte"

  const genderIcons = {
    man: GiMale,
    woman: GiFemale,
  };

  export let userDetails: UserDetails;

  $: isLiked = $userData?.likedProfiles?.includes(userDetails.userData.id) || false;
  $: likeButtonLabel = isLiked ? "Unlike" : "Like";
  $: isMatched = $userData?.matched?.includes(userDetails.userData.id) || false;
  $: isBlocked = $userData?.blocked?.includes(userDetails.userData.id) || false;

  const emptyPict: string = '/src/lib/assets/default-profile-pic.png';
  let SelectedIcon = genderIcons[userDetails.gender];
  // console.log("SelectedIcon: ", SelectedIcon);

  let fullStars: number = Math.floor(userDetails.fameRating);
  let halfStar: boolean = userDetails.fameRating % 1 >= 0.5;
  let emptyStars: number = halfStar ? 4 - fullStars : 5 - fullStars;


  function unlike() {
    // console.log("unlike attempt");
      const unlikeData = {
        unliked_user: userDetails.userData,
        timestamp: new Date(),
      };
      const socket = getSocket();
      if (socket) {
        socket.emit("UNLIKE_PROFILE", unlikeData);
        // removeLikedProfile(userDetails.userData.id);
        // if (isMatched) {
        //   removeMatchedProfile(userDetails.userData.id);
        //   isMatched = false;
        // }
      }
  }
  
  function likeOrUnlike() {
    // console.log("LIKE BUTTON CLICKED");
    if (isLiked) {
      unlike();
    }
    else {
      // console.log("like attempt");
      if (!($userData?.profilePic)) {
        // alert("You need to update a profile picture before you can like other profiles.");
        toast.error("You need to update a profile picture before you can like other profiles.");
        return;
      }
      const likeData = {
        liked_user: userDetails.userData,
        timestamp: new Date(),
      };
      const socket = getSocket();
      if (socket) {
        socket.emit("LIKE_PROFILE", likeData);
        // addLikedProfile(userDetails.userData.id);
        }
      }
    }

    function waitForCondition(conditionFn: () => boolean, interval: number = 100): Promise<void> {
      return new Promise((resolve) => {
        const intervalId = setInterval(() => {
          if (conditionFn()) {
            clearInterval(intervalId);
            resolve();
          }
        }, interval);
      });
    }

    async function block(): Promise<void> {
      // console.log("BLOCK");
      if (isLiked) {
        unlike();
        await waitForCondition(() => !isLiked);
      }
      const socket = getSocket();
      if (socket) {
        socket.emit("BLOCK_REQUEST", { user: userDetails.userData });
      }
    }

    async function unblock() {
      // console.log("UNBLOCK");
      const socket = getSocket();
      if (socket) {
        socket.emit("UNBLOCK_REQUEST", {user: userDetails.userData});
      }
    }

    async function report() {
      // console.log("REPORT")
      if (!isBlocked) {
        await block();
      }
      const socket = getSocket();
      if (socket) {
        socket.emit("REPORT_ACCOUNT_REQUEST", {user: userDetails.userData});}
      }

  onMount(() => {
    // console.log("userDetails received: ", userDetails);
    // console.log("mes infos : ", $userData);
    const socket = getSocket();
    if (socket) {
      socket.emit("NEW_VIEW", { viewed: userDetails.userData, timestamp: new Date() });
  
      socket.on("MATCH", (data: any) => {
        if (data.data === userDetails.userData.id) {
          // console.log("Matched with user: ", data);
          isMatched = true;
        }
        addMatchedProfile(data.data);
      });
  
      socket.on("BLOCK_SUCCESS", (data: any) => {
        // console.log("Blocked user: ", data);
        // console.log("userDetails.userData.id: ", userDetails.userData.id);
        if (data.data.id === userDetails.userData.id) {
          // console.log("Blocked user: ", data);
          isBlocked = true;
          addBlockedProfile(data.data.id);
        }
      });
  
      socket.on("UNBLOCK_SUCCESS", (data: any) => {
        // console.log("Unblocked user: ", data);
        if (data.data.id === userDetails.userData.id) {
          isBlocked = false;
          removeBlockedProfile(data.data.id);
        }
      });
  
      socket.on("UNLIKE_SUCCESS", (data: any) => {
        // console.log("UNLIKE_SUCCESS", data);
        if ($userData) {
          removeLikedProfile(data.data.id);
          // $userData.likedProfiles = $userData.likedProfiles?.filter((id) => id !== data.data.id);
          if (isMatched) {
            removeMatchedProfile(userDetails.userData.id);
            isMatched = false;
        }
        }
      });
  
      socket.on("LIKE_SUCCESS", (data: any) => {
        // console.log("LIKE_SUCCESS", data);
        if ($userData) {
          addLikedProfile(data.data.id);
        }
      });
    }
  });
</script>

<div class="container">
  <div class="handside-container" id="left">
    <div class="profile-summary card-container">
      <Card.Root style="width: 100%;">
        <img
          src={userDetails.pictures.profile || emptyPict}
          alt={userDetails.fullName}
          class="profile-pic"
        />
        <Card.Header>
          <Card.Title>
            <div class="summary-title">
              {userDetails.fullName}
              <div class="gender-icon"><SelectedIcon /></div>
            </div>
          </Card.Title>
          <Card.Description>📍 {userDetails.location} - 
            {#if userDetails.status === 'online'}
              <span style="color: green;">Online</span>
            {:else if userDetails.lastActive}
            <span style="color: black;">
              Last seen:  {userDetails.formattedDate} at 
              {userDetails.formattedTime}
            </span>
            {/if}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if !isBlocked && isMatched}
            <p>MATCHA'ED! 🍵</p>
          {/if}
        </Card.Content>
        <Card.Footer>
          <div class="interaction-buttons">
            <div class="like-chat-buttons">
              {#if !isBlocked}
                <Button on:click={likeOrUnlike}>{likeButtonLabel}</Button>
                {#if isMatched}
                  <Button on:click={() => {
                    goto(`/chat?id=${userDetails.userData.id}`);
                  }}>Chat</Button>
                {/if}
              {/if}
            </div>
            <div class="block-report-buttons">
              {#if isBlocked}
                <Button on:click={unblock}>Unblock</Button>
              {:else}
                <Button on:click={block}>Block</Button>
              {/if}
              <Button on:click={report}>Report Fake Profile</Button>
            </div>
          </div>
        </Card.Footer>
      </Card.Root>
    </div>

    <div class="profile-details card-container">
      <Card.Root style="width: 100%;">
        <Card.Header>
          <!-- <Card.Title>Card Title</Card.Title> -->
          <!-- <Card.Description>Card Description</Card.Description> -->
        </Card.Header>
        <Card.Content>
          <span class="details-line"
            ><p>AGE</p>
            <p>{userDetails.age}</p></span
          >
          <span class="details-line">
            <p>PREFERENCES</p>
            <p>{userDetails.sexualPref}</p>
          </span>
          <span class="details-line">
            <p>BIRTHDAY</p>
            <p>{formatBirthDate(userDetails.birthDate)}</p>
          </span>
          <span class="details-line">
            <p>FAME RATING</p>
            <!-- <p>{userDetails.fameRating}</p> -->
            <div class="fame-rating-stars">
              {#each {length: fullStars} as i}
              <StarFull />
              {/each}
              {#if halfStar}
              <StarHalf />
              {/if}
              {#each {length: emptyStars} as i}
              <StarEmpty />
              {/each}
            </div>
          </span>
          <span class="details-line"
            ><p>VIEWS</p>
            <p>{userDetails.nbOfViews}</p></span
          >
          <span class="details-line"
            ><p>LIKES</p>
            <p>{userDetails.nbOfLikes}</p></span
          >
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <div class="handside-container" id="right">
    {#if userDetails.biography}
    <div class="about card-container">
      <Card.Root style="width: 100%;">
        <Card.Header>
          <Card.Title>ABOUT</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>{userDetails.biography}</p>
        </Card.Content>
      </Card.Root>
    </div>
    {/if}
    <div class="interests card-container">
      <Card.Root style="width: 100%;">
        <Card.Header>
          <Card.Title>INTERESTS</Card.Title>
        </Card.Header>
        <Card.Footer>
          <div class="interests-line">
            {#each userDetails.tags ?? [] as interest}
              <Badge variant="outline">#{interest}</Badge>
            {/each}
          </div>
        </Card.Footer>
      </Card.Root>
    </div>

    {#if userDetails.pictures.additional && userDetails.pictures.additional.length > 0}
    <div class="gallery-card-container" style="width: 70%">
      <Carousel.Root>
        <Carousel.Content>
          {#each userDetails.pictures.additional ?? [] as photo}
          <Carousel.Item
          class="flex items-center justify-center">
                <img src={photo} alt={userDetails.fullName} style="max-width:15rem; max-height:20rem; border-radius: 5%;" />
          </Carousel.Item>
          {/each}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel.Root>
    </div>
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  .handside-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 10px;
  }

  #left {
    width: 100%;
    justify-content: space-around;
  }


  #right {
    width: 100%;
    justify-content: space-around;
  }

  .card-container {
    width: 90%;
    margin: 10px 0;
  }

  .profile-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .profile-pic {
    width: 80px;
    height: 80px;
    border-radius: 50%;
  }

  .profile-summary .summary-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    text-align: center;
  }

  .profile-summary .gender-icon {
    width: 1em;
    height: 1em;
    margin-left: 0.5em;
  }

  .profile-summary img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  .interaction-buttons {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
    row-gap: 10px;
  }

  .profile-details {
    width: 70%;
  }

  .details-line {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .interests-line {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 5px;
  }

  .gallery-card-container {
    width: 100%;
  }

  .fame-rating-stars {
    height: 1em;
    display: flex;
    flex-direction: row;
  } 

  .fame-rating-stars :global(svg) {
    width: 16px;
    height: 16px;
  }

  @media(min-width: 768px) {
    .container {
      flex-direction: row;
    }

    #left {
      width: 40%;
    }

    #right {
      width: 60%;
    }

    .card-container {
      width: 70%;
    }

    .profile-pic {
      width: 100px;
      height: 100px;
    }

    .gallery-card-container {
      height: 40%;
    }

    .fame-rating-stars :global(svg) {
      width: 20px;
      height: 20px;
    }
  }
</style>
