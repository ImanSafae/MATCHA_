<script lang="ts">
  import Research from "$lib/research/Research.svelte";
  import Results from "$lib/research/Results.svelte";

  import type { ResearchFormData } from "../../types/ResearchFormData";
  import { httpPOST, httpGET } from "$lib/httpRequests";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let resultsDisplay: boolean = false;
  let searchData: ResearchFormData;
  let results: any = null;
  let isAuthenticated = false;
  let tags: string[] | undefined;

  const RESEARCH_ERRORS_MSGS = {
    LOCATION_ERROR: "Invalid location",
    TAGS_ERROR: "Invalid tag",
    PARAMS_ERROR: "Invalid parameters",
    AGE_ERROR: "Invalid age range",
    FAME_ERROR: "Invalid fame rating"
  }

  let researchErrors: any = {
    location: false,
    tags: false,
    ageRange: false,
    fameRating: false,
    noCriteria: false
  };

 

  function sendForm(event: CustomEvent<ResearchFormData>) {
    searchData = event.detail;
    // console.log("search data received in parent component:", searchData);
    resultsDisplay = true;

    httpPOST("/research", searchData)
      .then((res) => {
        // console.log("res", res);
        const data = res.json().then((data) => {
          // console.log("data", data);
          if (data.error) {
            // console.error(data.error);
            switch (data.error) {
              case RESEARCH_ERRORS_MSGS.LOCATION_ERROR:
                // console.error("location error");
                researchErrors.location = true;
                break;
              case RESEARCH_ERRORS_MSGS.TAGS_ERROR:
                researchErrors.tags = true;
                break;
              case RESEARCH_ERRORS_MSGS.AGE_ERROR:
                researchErrors.minAge = true;
                researchErrors.maxAge = true;
                break;
              case RESEARCH_ERRORS_MSGS.FAME_ERROR:
                researchErrors.fameRating = true;
                break;
              default:
                break;
            }
            resultsDisplay = false;
            return ;
          }
          else {
            results = data.data;
            // console.log("profiles :", results);
          }
        });
      })
      .catch((err) => {
        // console.error(err);
      });
  }

  onMount(async () => {
    const resp = await httpGET('/account/check-auth');
    const page = await resp.json();
    if (!page.authenticated) {
      goto('/account/login');
      return;
    } else {
      isAuthenticated = true;
      httpGET("/get-tags")
      .then((res: any) => {
        const data = res.json().then((data: any) => {
          tags = data.data;
        });
      })
      .catch((err) => {
        // console.error(err);
      });
    }
  });
</script>

{#if isAuthenticated}
  {#if !resultsDisplay}
    <Research bind:searchData on:search={sendForm} bind:errors={researchErrors} tags={tags} />
  {:else if resultsDisplay && !results}
    <p>Loading</p>
  {:else}
    <Results profiles={results} tags={tags} />
  {/if}
{/if}
