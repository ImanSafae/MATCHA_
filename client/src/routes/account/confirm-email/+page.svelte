<!-- src/routes/account/confirm-email.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { httpPOST } from '$lib/httpRequests';

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const uuid = params.get('uuid');

        if (uuid) {
            try {
                const response = await httpPOST("/account/email/confirmation", { uuid: uuid });
                const data = await response.json();
                // console.log(data)
            } catch (error) {
                // console.error('[CONFIRM_EMAIL]: ', error);
            }
        }
        goto('/account/login');
    });
</script>

<div>
    Email in validation...
</div>
