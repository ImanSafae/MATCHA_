<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { httpPOST } from '$lib/httpRequests';
  import { isPasswordValid } from '$lib/profile/Utils.svelte';

  interface FormData {
    password: string;
    uuid: string | null;
  }

  let formData: FormData = {
    uuid: null,
    password: ''
  };

  let isFormValid: boolean = false;
  let passwordStrength: number = 0;
  let passwordFeedback: string | null = null;

  onMount(() => {
    // Get the UUID from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    formData.uuid = params.get('uuid');
  });

  async function pwdRecover() {
    try {
      const response = await httpPOST("/account/password/recover", formData);
      const data = await response.json();
      // console.log("[RECOVER_PWD]", data);
      goto('/account/login');
    } catch (error) {
      // console.error('[RECOVER_PWD] ', error);
    }
  }

  function handlePasswordInput() {
    if (formData.password.length === 0) {
      passwordFeedback = null;
      passwordStrength = 0;
    } else {
      const result = isPasswordValid(formData.password);
      passwordFeedback = result.passwordFeedback;
      passwordStrength = result.passwordStrength;
    }
  }

  $: isFormValid = formData.password.trim() !== '' && passwordStrength >= 3;
</script>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
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
  }
  button {
    padding: 10px;
    width: 100%;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    margin-top: 20px;
  }
  button:disabled {
    background-color: #a9a9a9;
    cursor: not-allowed;
  }
  .input-container {
    position: relative;
    width: 100%;
  }
  .input-infos {
    font-weight: 300;
    text-align: left;
    font-size: 0.75rem;
    margin: -7px 0;
    padding: 0;
    position: absolute;
    top: 100%;
    left: 0;
    line-height: 1.1;
  }
</style>

<div class="container">
  <div class="form-container">
    <h1>Password recovery</h1>
    <div class="input-container">
      <input 
        type="password" 
        placeholder="New Password" 
        bind:value={formData.password}
        on:input={handlePasswordInput}
      />
      {#if passwordFeedback}
        <p class="input-infos" style='color: {passwordStrength >= 3 ? "green" : "red"}'>{passwordFeedback}</p>
      {/if}
    </div>
    <button on:click={pwdRecover} disabled={!isFormValid}>Recover Password</button>
  </div>
</div>
