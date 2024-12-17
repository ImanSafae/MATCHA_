<script lang="ts">
  export let showModal: boolean;
  export let title: string = "Modal Title";
  export let message: string = "Modal Message";
  export let buttons: Array<{ label: string, action: () => void }> = [];

  export function closeModal() {
    showModal = false;
  }
</script>

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .modal-content h2 {
    margin-top: 0;
  }

  .modal-content button {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }

  .modal-content button:hover {
    background-color: #45a049;
  }

  .button-group {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
</style>

{#if showModal}
  <button class="modal" on:click={closeModal}>
    <button class="modal-content" on:click|stopPropagation>
      <h2>{title}</h2>
      <p>{message}</p>

      <div class="button-group">
        {#if buttons.length > 0}
          {#each buttons as button}
            <button on:click={button.action}>{button.label}</button>
          {/each}
        {:else}
          <!-- Default Close Button -->
          <button on:click={closeModal}>OK</button>
        {/if}
      </div>
    </button>
  </button>
{/if}
