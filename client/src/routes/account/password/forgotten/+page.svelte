<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from '$app/navigation';
  import { httpPOST } from '$lib/httpRequests';
  import Modal from '$lib/components/Modal.svelte';
  
  interface FormData {
    email: string;
  };
  
  let formData: FormData = {
    email: '',
  };

  let isFormValid: boolean = false;
  let showModal: boolean = false;

  onMount(async () => { });

  async function handleForgottenPwd() {
    try {
      const response = await httpPOST("/account/password/forgotten", formData);
      resetForm();
      const data = await response.json();
      // console.log("[FORGOTTEN_PWD]", data);
      showModal = true;
    } catch (error) {
        // console.error('[FORGOTTEN_PWD]: ', error);
    }
  }

  function closeModalAndRedirect() {
    showModal = false;
    goto('/account/login');
  }

  function resetForm() {
    formData = {
      email: ''
    };
  }

  $: isFormValid = (
    formData.email.trim() !== ''
  );
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
  }
  button:disabled {
    background-color: #a9a9a9;
    cursor: not-allowed;
  }
</style>

<div class="container">
  <div class="form-container">
    <h1>Forgotten Password</h1>
    <h2>Enter your email address:</h2>
    <input type="email" placeholder="Email" bind:value={formData.email} />      
    <button on:click={handleForgottenPwd} disabled={!isFormValid}>Recover my password</button>
  </div>
  <Modal 
    bind:showModal={showModal} 
    title="Password recovered" 
    message="You can now login to matcha"
    buttons={[
      { label: 'OK', action: closeModalAndRedirect }
    ]}
  />
</div>
