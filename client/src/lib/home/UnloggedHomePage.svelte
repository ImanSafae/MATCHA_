<script>
    import { goto } from "$app/navigation";
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Card from "$lib/components/ui/card";

    import { theme } from "$lib/stores/theme";
  
  </script>
  <!-- <header>
    <h1>MatchApp</h1>
  </header> -->
  
  <!-- <main>
    Vive le thé 
  </main> -->
  
  <div class="main-container" style="background-image:url({$theme.homePageBackground});">
    <div class="upper-container">
  
      <div class="title">
        <h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          Meet the love or your life
        </h1>
      <h2 class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        or your next matcha date partner
      </h2>
    </div>
  
    <div class="cta">
      <Button variant='default' on:click={() => goto('/account/register')}>GET STARTED</Button>
      <p class="text-sm text-muted-foreground mt-2">Already have an account? <a href="/account/login">Log in</a></p>
    </div>
  </div>
  
    <div class="how-it-works">
      <div class="step" id="first-step">
        <Card.Root style="text-align: center; background-color: rgba(224, 96, 126, 0.8); height: 100%; border: 1px solid #BB2548;">
          <Card.Header>
            <Card.Title style="color:#BB2548;">Fill your profile</Card.Title>
            <Card.Description style=" color: black;">Select your gender, sexual orientation, location and as many centers of interest as you want</Card.Description>
          </Card.Header>
        </Card.Root>
      </div>
      <div class="step" id="second-step">
        <Card.Root style="text-align:center; background-color: rgba(255, 140, 66, 0.8); height: 100%; border: 1px solid #E05600;">
          <Card.Header>
            <Card.Title style="color:#E05600;">Browse our selection of profiles compatible for you</Card.Title>
            <Card.Description style=" color: black;">Our algorithm suggests you the best profiles for you, with a compability calculated based on your preferences and settings.</Card.Description>
          </Card.Header>
        </Card.Root>
      </div>
      <div class="step" id="third-step">
        <Card.Root style="text-align: center; background-color: rgba(90, 168, 150, 0.8); height: 100%; border: 1px solid #15796C;">
          <Card.Header>
            <Card.Title style="color:#15796C">Match and start chatting!</Card.Title>
            <Card.Description style=" color: black;">To avoid unwanted interactions, our app only allows you to connect and chat with the people you've matched with.</Card.Description>
          </Card.Header>
        </Card.Root>
      </div>
    </div>
  </div>
  
  
  <style>
    .main-container {
      min-height: 100vh;
      width: 100vw;
      padding-top: 10rem;
      background-image: url('/src/lib/assets/matcha_decor40.png');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      position: relative;
    }
  
    .upper-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      row-gap: 2em;
    }
  
  
    h1 {
      color: white;
      text-align: center;
    }
  
    h2 {
      color: #638936;
      text-align: center;
    }
  
    .cta {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  
    .how-it-works {
      position: absolute;
      left: 50%;
      transform: translate(-50%, 0);
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      column-gap: 3em;
      bottom: 1rem;
    }
  
    .step {
    flex-grow: 1;
      width: 20rem;
      min-height: 100%;
      height: auto;
    }
  </style>
  