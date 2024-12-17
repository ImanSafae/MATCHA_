<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from 'svelte';

  import { httpGET } from "$lib/httpRequests";
  import { debounce, searchAddress } from "../profile/Utils.svelte";
  import { hasCityOrEquivalent, formatLocation } from "$lib/profile/Utils.svelte"

  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { toast } from "svelte-sonner";

  import type { ResearchFormData } from "../../types/ResearchFormData";
  import type { Location } from "../../types/Location";

  let locationSuggestions: Array<Location> = [];
    let locationInput: string = '';
    
  export let tags: string[] | undefined = [];
  export let searchData: ResearchFormData = {
  minAge: undefined,
  maxAge: undefined,
  tags: [],
  location: undefined,
  fameRating: undefined
};

  export let errors: any = {
    location: false,
    ageRange: false,
    fameRating: false,
    tags: false,
    noCriteria: false
  }

  $ : if (errors.location === true) {
    toast.error("Selected location must be a city.");
  }

	const dispatch = createEventDispatcher();

  function setLocationSuggestions(results: any) {
    // console.log(`LES LOCATIONS: `, results);
    locationSuggestions = results.filter((result: any) => {
      return hasCityOrEquivalent(result.address);
    });
    locationSuggestions.forEach((location:any) => {
      location.display_name = formatLocation(location.address);
    })
  }

  const debouncedSearch = debounce(() => {
    searchAddress(locationInput, setLocationSuggestions);
  }, 400);

  function setDesiredLocation(result: any) {
    searchData.location = result;
    locationInput = result.display_name;
    locationSuggestions = [];
  }

  function validateForm(form: ResearchFormData): boolean {
    if (form.location === undefined
    && form.tags?.length === 0
    && form.minAge === undefined
    && form.maxAge === undefined
    && form.fameRating === undefined) {
      errors.noCriteria = true;
      toast.error("You must select at least one criteria.");
      return false;
    }

    if ((form.maxAge && form.maxAge < 18) || (form.minAge && form.minAge < 18)) {
      toast.error("Users can't be under 18.");
      return false;
    }

    if (form.fameRating && (form.fameRating < 0 || form.fameRating > 5)) {
      toast.error("Fame rating must be between 0 and 5.");
      return false;
    }
    return true;
  }

  function sendForm() {
    // console.log("search data:", searchData);
    
    const isValid: boolean = validateForm(searchData);
    if (!isValid) {
      // console.error("Invalid form");
      errors.noCriteria = true;
      return ;
    }
    /* aligner au centre */
    errors.noCriteria = false;
    dispatch("search", searchData);
  }

  onMount(() => {
    httpGET("/get-tags")
      .then((res: any) => {
        const data = res.json().then((data: any) => {
          tags = data.data;
        });
      })
      .catch((err) => {
        // console.error(err);
      });
  });
</script>

<div class="container">
    <h1 class="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">Find and meet your perfect match</h1>
    <!-- {#if errors.noCriteria}
      <p class="text-red-500">You must select at least one criteria.</p>
    {/if} -->
    <div class="age-research">
      <h2>Age</h2>
      <div class="inputs">
          <Input
          type="number"
          placeholder="minimum"
          class="w-32"
          min="18"
          max="120"
          on:input={e => searchData.minAge = e.target.value || undefined}
          />
          <Input
          type="number"
          placeholder="maximum"
          class="w-32"
          min="18"
          max="120"
          on:input={e => searchData.maxAge = e.target.value || undefined}
          />
      </div>
      {#if errors.ageRange}
        <p class="text-red-500">Minimum age must be less than maximum age.</p>
      {/if}
    </div>

  {#if tags}
    <div class="interests-research">
        <h2>Interests</h2>
      <ToggleGroup.Root bind:value={searchData.tags} type="multiple" variant="outline" style="display: flex; flex-wrap: wrap; justify-content:flex-start">
        {#each tags as tag}
          <ToggleGroup.Item value={tag} >#{tag}</ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
    </div>
  {/if}

  <div class="fame-research">
    <h2>Fame rating</h2>
    <Select.Root bind:selected={searchData.fameRating}>
      <Select.Trigger class="w-[180px]">
        <Select.Value placeholder="Fame rating" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value=0>any</Select.Item>
        <Select.Item value=1>1 and above</Select.Item>
        <Select.Item value=2>2 and above</Select.Item>
        <Select.Item value=3>3 and above</Select.Item>
        <Select.Item value=4>4 and above</Select.Item>
        <Select.Item value=5>5</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

  <div class="location-research">
    <h2>City</h2>
    <Input
      type="text"
      placeholder="Select a location"
      class="w-34"
      bind:value={locationInput}
      on:input={debouncedSearch}
    />
    <!-- {#if errors.location}
      <p class="text-red-500">Selected location must be a city.</p>
    {/if} -->
    <ul class="search-results">
      {#each locationSuggestions as result}
        <li>
          <button type="button" on:click={() => setDesiredLocation(result)}>
            {result.display_name}
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <Button on:click={sendForm}>SEARCH</Button>

</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    row-gap: 1.7rem;
    padding: 1rem;
    border: 1px solid lightgrey;
    border-radius: 5px;
    width: 70vw;
    box-sizing: border-box;
    margin-top: 5vh;
    height: 80vh;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .age-research {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

    .age-research .inputs {
        display: flex;
        gap: 1rem;
    }

  .interests-research  {
    width: 100%;
  }

  .fame-research {
    width: 100%;
  }
    h2 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 1rem;
    }

    h1 {
      text-align: center;
    }
</style>
