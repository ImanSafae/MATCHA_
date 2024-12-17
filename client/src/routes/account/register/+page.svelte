<script lang="ts">
  import { getAnonymousSocket } from "$lib/socket";
  import { onMount } from "svelte";
  import { goto } from '$app/navigation';
  import { httpPOST, httpGET } from '$lib/httpRequests';
  import { debounce, isPasswordValid } from "$lib/profile/Utils.svelte";
  import Modal from '$lib/components/Modal.svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import { theme } from "$lib/stores/theme";
  
  interface FormData {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gender: string;
    sexual_pref: string;
    biography: string;
    date_of_birth: string;
  };
  
  let formData: FormData = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    gender: '',
    sexual_pref: '',
    biography: '',
    date_of_birth: ''
  };

  let usernameAvailable: boolean | null = null;
  let usernameChecked: boolean = false;
  let emailAvailable: boolean | null = null;
  let emailChecked: boolean = false;
  let isFormValid: boolean = false;
  let loading: boolean = true;
  let showSuccessModal: boolean = false;
  let showFailedModal: boolean = false;
  let usernameInfo: string | null = null;
  let emailInfo: string | null = null;
  let ageInfo: string | null = null;
  let passwordStrength: number = 0;
  let passwordFeedback: string | null = null;
  const socket = getAnonymousSocket();

  // const illustrations: string[] = [
  //   "/src/lib/assets/classic/matcha_decor10.png",
  //   "/src/lib/assets/classic/matcha_decor12.png",
  //   "/src/lib/assets/artdeco/matcha_decor29.png",
  //   "/src/lib/assets/geek/matcha_decor43.png",
  //   "/src/lib/assets/geek/matcha_decor47.png"
  // ];

  // const illustration: string = illustrations[Math.floor(Math.random() * illustrations.length)];

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
    if (socket) {
      socket.on("USERNAME_CHECK_RESP", (data) => {
        // console.log("checking username", data);
        usernameAvailable = data.available;
        usernameChecked = true;
        if (usernameChecked && usernameAvailable === false) {
          usernameInfo = data.reason;
        } else if (usernameChecked && usernameAvailable === true) {
          usernameInfo = "Username available.";
        }
  
      });
      socket.on("EMAIL_CHECK_RESP", (data) => {
        emailAvailable = data.available;
        emailChecked = true;
        if (emailChecked && emailAvailable == false) {
          emailInfo = data.reason;
        } else if (emailChecked && emailAvailable === true) {
          emailInfo = "Valid email.";
        }
      });
    }
  });

  const debouncedUsernameInput = debounce(() => handleUsernameInput(), 400);
  const debouncedEmailInput = debounce(() => handleEmailInput(), 400);

  function handleUsernameInput() {
    // console.log("username input");
    usernameChecked = false;
    usernameInfo = null;
    if (formData.username.trim() !== "") {
      // console.log("checking username");
      // console.log("DANS LE FRONT socket = ", socket)
      if (socket) {
        socket.emit("USERNAME_CHECK", { username: formData.username.trim() });
      }
    }
  }

  function handleBirthDateInput() {
    ageInfo = null;
    const today = new Date();
    const birthDate = new Date(formData.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (formData.date_of_birth.trim() !== '') {
      if (age < 18) {
        ageInfo = "You have to be at least 18 yo to register to Matcha";
      } else if (age > 110) {
        ageInfo = "Seriously? Sorry you're too old for this app";
      } else {
        ageInfo = null;
      }
    }
  }

  function handlePasswordInput() {
    if (formData.password.length === 0) {
      passwordFeedback = null;
      passwordStrength = 0;
    } else {
      const result = isPasswordValid(formData.password);
      passwordStrength = result.passwordStrength;
      if (passwordStrength >= 3) {
        passwordFeedback = "Valid password."
      } else {
        passwordFeedback = result.passwordFeedback;
      }
    }
  }

  function giveAdequateColor(data: any) {
    if (data) {
      return "green";
    } else {
      return "red";
    }
  }

  function handleEmailInput() {
    // console.log("email input");
    emailChecked = false;
    emailInfo = null;
    if (formData.email.trim() !== "") {
      // console.log("checking email");
      if (socket) {
        socket.emit("EMAIL_CHECK", { email: formData.email.trim() });
      }
    }
  }

  function closeSuccessModalAndRedirect() {
    showSuccessModal = false;
    goto('/account/login');
  }

  function closeModalAndRedirectToRegister() {
    showFailedModal = false;
    goto('/account/register');
  }
  
  async function handleRegister() {
  try {
    formData.username = formData.username.trim();
    formData.email = formData.email.trim();
    formData.first_name = formData.first_name.trim();
    formData.last_name = formData.last_name.trim();
    const response = await httpPOST("/account/register", formData);
    const data = await response.json();
    if (data.success) {
      showSuccessModal = true;
    } else {
      showFailedModal = true;
    }
    resetForm();
    // console.log("[REGISTER]", data);
  } catch (error) {
    // console.error('[REGISTER] ', error);
  }
}


  function resetForm() {
    formData = {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      gender: '',
      sexual_pref: '',
      biography: '',
      date_of_birth: ''
    };
    usernameAvailable = null;
    usernameChecked = false;
    emailAvailable = null;
    emailChecked = false;
  }

  $: isFormValid = (
    usernameAvailable === true &&
    emailAvailable === true &&
    formData.username.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.gender.trim() !== '' &&
    formData.first_name.trim() !== '' &&
    formData.last_name.trim() !== '' &&
    formData.date_of_birth.trim() !== '' &&
    passwordStrength >= 3
  );

</script>

<style>

@media (max-width: 768px) {
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    padding: 0;
    margin: 0;
  }

  .left-handside {
    height: 100%;
    width: 100%;
    position: absolute;
  }

  .right-handside {
    height: 100%;
    width: 100%;
    position: relative;
    background-color: white;
  }
}

  .container {
    min-height: 100vh;
    height: 100vh;
    min-width: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .left-handside {
    height: 100%;
    width: 50%;
    flex-grow: 1;
  }

  .right-handside {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 50%;
    flex-grow: 1;
    position: relative;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 300px;
  }
  input, textarea, select {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    box-sizing: border-box;
    outline: none;
  }
  button {
    padding: 10px;
    width: 100%;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  button:disabled {
    background-color: #a9a9a9;
    cursor: not-allowed;
  }

  input {
    border: 1px solid lightgray;
    border-radius: 3px;
  }

  textarea {
    border: 1px solid lightgray;
    border-radius: 3px;
  }
  .input-error {
    border: 3px solid red;
  }
  .input-success {
    border: 3px solid green;
  }

  .input-container {
    position: relative;
    width: 100%;
  }
  .input-infos {
    font-weight: 300;
    text-align: left;
    font-size: 0.75rem;
    margin: -8px 0;
    padding: 0;
    position: absolute;
    top: 100%;
    left: 0;
    line-height: 1.1;
  }

  .illustration {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    border-bottom-right-radius: 10px;
    border-top-right-radius: 10px;
}

  .login-button {
    position: absolute;
    right: 1em;
    top: 1em;
  }



</style>

<div class="container">
  <div class="left-handside">
    <img src={$theme.registerPageBackground} alt="matcha" class="illustration">
    
  </div>
  <div class="right-handside">
  {#if loading}
    <!-- <div>Insert loader</div>  -->
  {:else}
  <span class="login-button"><Button variant="ghost" on:click={() => { goto('/account/login') }} >Log In</Button></span>
    <div class="form-container">
      <h1 class="scroll-m-20 text-2xl font-semibold tracking-tight">Register to Matcha</h1>
      <div class="input-container">
        <input 
          type="text" 
          placeholder="Username*" 
          bind:value={formData.username} 
          on:input={debouncedUsernameInput}
          class:input-error={usernameChecked && usernameAvailable === false}
          class:input-success={usernameChecked && usernameAvailable === true}
        />
        {#if usernameInfo}
          <p class="input-infos" style='color: {giveAdequateColor(usernameAvailable)}'>{usernameInfo}</p>
        {/if}
      </div>
      <div class="input-container">
        <input 
          type="email" 
          placeholder="Email*" 
          bind:value={formData.email}
          on:input={debouncedEmailInput}
          class:input-error={emailChecked && emailAvailable === false}
          class:input-success={emailChecked && emailAvailable === true} 
        />
        {#if emailInfo}
          <p class="input-infos" style='color: {giveAdequateColor(emailAvailable)}'>{emailInfo}</p>
        {/if}
      </div>
      <div class="input-container">
        <input 
          type="password" 
          placeholder="Password*" 
          bind:value={formData.password}
          on:input={handlePasswordInput}
          class:input-error={passwordStrength < 3 && passwordFeedback}
          class:input-success={passwordStrength >= 3} 
        />
        {#if passwordFeedback}
          <p class="input-infos" style='color: {giveAdequateColor(passwordStrength >= 3)}'>{passwordFeedback}</p>
        {/if}
      </div>
      <input type="text" placeholder="First Name*" bind:value={formData.first_name} />
      <input type="text" placeholder="Last Name*" bind:value={formData.last_name} />
      <div class="input-container">
        <input type="date" placeholder="Date of Birth*" bind:value={formData.date_of_birth} on:blur={handleBirthDateInput} />
        {#if ageInfo}
          <p class="input-infos" style='color: {giveAdequateColor(!ageInfo)}'>{ageInfo}</p>
        {/if}
      </div>
      <select bind:value={formData.gender}>
        <option value="">Select Gender*</option>
        <option value="woman">Woman</option>
        <option value="man">Man</option>
      </select>
      <select bind:value={formData.sexual_pref}>
        <option value="">Select Sexual Preference</option>
        <option value="heterosexual">Heterosexual</option>
        <option value="homosexual">Homosexual</option>
        <option value="bisexual">Bisexual</option>
      </select>
      <textarea placeholder="Biography" bind:value={formData.biography}></textarea>
      <button on:click={handleRegister} disabled={!isFormValid}>Register</button>
    </div>
    {#if showSuccessModal}
      <Modal 
        bind:showModal={showSuccessModal}
        title="Registration Successful"
        message="An email has been sent to you for confirmation. Please verify your mailbox to continue."
        buttons={[
          { label: 'Close', action: closeSuccessModalAndRedirect }
        ]}
      />
    {:else if showFailedModal}
      <Modal 
        bind:showModal={showFailedModal}
        title="Error During Registration"
        message="Please try again."
        buttons={[
          { label: 'Close', action: closeModalAndRedirectToRegister }
        ]}
      />
    {/if}
  {/if}
  </div>
</div>
