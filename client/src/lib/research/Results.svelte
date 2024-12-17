<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import * as Accordion from "$lib/components/ui/accordion";
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Select from "$lib/components/ui/select";

  interface Filters {
    minAge: number | null;
    maxAge: number | null;
    minFame: any;
    tags: string[] | undefined;
  }

  export let profiles: any[] = [];
  export let tags: string[] | undefined = [];

  let displayedProfiles: any[] = profiles;

  const emptyPict: string = "/src/lib/assets/default-profile-pic.png";

  let sortCriteria: any = null;

  let filters: Filters = {
    minAge: null,
    maxAge: null,
    minFame: null,
    tags: [],
  };

  function handleSelector() {
    // console.log("SORTING ; Received criteria: ", sortCriteria);
    if (!sortCriteria) {
      return;
    }
    // console.log("SORTING ; Sorting profiles by ", sortCriteria.value);
    switch (sortCriteria.value) {
      case null:
        break;
      case "fame-desc":
        displayedProfiles = [...displayedProfiles.sort((a, b) => b.fame_rating - a.fame_rating)];
        break;
      case "fame-asc":
        displayedProfiles = [...displayedProfiles.sort((a, b) => a.fame_rating - b.fame_rating)];
        break;
      case "age-desc":
        displayedProfiles = [...displayedProfiles.sort((a, b) => b.age - a.age)];
        break;
      case "age-asc":
        displayedProfiles = [...displayedProfiles.sort((a, b) => a.age - b.age)];
        break;
      case "distance-desc":
        displayedProfiles = [...displayedProfiles.sort((a, b) => b.distance - a.distance)];
        break;
      case "distance-asc":
        displayedProfiles = [...displayedProfiles.sort((a, b) => a.distance - b.distance)];
        break;
    }
  }

  function filterProfiles() {
    // console.log("FILTERING ; Received filters: ", filters);
    let newProfiles = profiles;
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null) {
        switch (key) {
          case "minAge":
          newProfiles = newProfiles.filter(
              (profile) => profile.age >= value,
            );
            break;
          case "maxAge":
          newProfiles = newProfiles.filter(
              (profile) => profile.age <= value,
            );
            break;
          case "minFame":
            if (!value.value)
              break;
            newProfiles = newProfiles.filter(
              (profile) => profile.fame_rating >= value.value,
            );
            break;
          case "tags":
            if (value.length === 0)
              break ;
            newProfiles = newProfiles.filter((profile) =>
              value.every((tag: string) => profile.tags.includes(tag)),
            );
            break;
        }
      }
    }
    displayedProfiles = newProfiles;
  }

  $: if (sortCriteria !== null) {
    handleSelector();
  }
</script>

<div class="container">
  <h1>RESULTS</h1>

  <div class="sort-and-filter">
  <div class="sorting">
    <!-- <Accordion.Root>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Sort by</Accordion.Trigger>
        <Accordion.Content>
          Yes. It adheres to the WAI-ARIA design pattern.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root> -->

    <Select.Root bind:selected={sortCriteria} items={["fame-asc", "fame-desc", "age-asc", "age-desc", "distance-asc", "distance-desc"]} >
      <Select.Trigger class="w-[180px]">
        <Select.Value  placeholder="SORT BY" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="fame-asc">Fame rating ascending</Select.Item>
        <Select.Item value="fame-desc">Fame rating descending</Select.Item>
        <Select.Item value="age-asc">Age ascending</Select.Item>
        <Select.Item value="age-desc">Age descending</Select.Item>
        <Select.Item value="distance-asc">Distance ascending</Select.Item>
        <Select.Item value="distance-desc">Distance descending</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

  <div class="filtering">
    <Accordion.Root>
      <Accordion.Item value="item-1">
        <Accordion.Trigger><label for="filters">FILTER BY</label></Accordion.Trigger>
        <Accordion.Content>
            <div id="filters">

              <label for="minimum-age">Age:</label>
              <div class="age-filter">
                <Input type="number" placeholder="Minimum age" min="18" max="120" bind:value={filters.minAge} name="minimum-age"/>
                <Input type="number" placeholder="Maximum age" min="18" max="120" bind:value={filters.maxAge} />
              </div>

              <label for="minimum-fame-rating">Fame rating:</label>
              <div class="fame-rating-filter">
                <Select.Root name="minimum-fame-rating" bind:selected={filters.minFame}>
                  <Select.Trigger class="w-[180px]">
                    <Select.Value placeholder="Minimum fame rating" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="1">1</Select.Item>
                    <Select.Item value="2">2</Select.Item>
                    <Select.Item value="3">3</Select.Item>
                    <Select.Item value="4">4</Select.Item>
                    <Select.Item value="5">5</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              {#if tags && tags.length > 0}
              <label for="tags-filter">Tags:</label>
                <div class="tags-filter">
                  <ToggleGroup.Root bind:value={filters.tags} type="multiple" variant="outline" style="display: flex; flex-wrap: wrap; overflow: visible; justify-content:flex-start" >
                    {#each tags as tag}
                      <ToggleGroup.Item value={tag}>#{tag}</ToggleGroup.Item>
                    {/each}
                  </ToggleGroup.Root>
                </div>
              {/if}

            <Button on:click={filterProfiles} variant="secondary">FILTER</Button>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>

  </div>

    <div class="profile-list">
      {#each displayedProfiles as profile}
        <a href="/account/profile?id={profile.id}">
          <div class="profile-card">
            <img
              src={profile.profile_pict || emptyPict}
              alt="{profile.first_name} {profile.last_name}"
              class="profile-pic"
            />
            <div class="profile-info">
              <span
                ><strong>{profile.first_name} {profile.last_name}</strong></span
              >
              <!-- <span><strong>{profile.first_name} {profile.last_name}</strong></span> -->
              <span>Age: {profile.age}</span>
              <span>Fame Rating: {profile.fame_rating}</span>
              <span>Distance: {(profile.distance / 1000).toFixed(1)} km</span>
              {#if profile.common_tags && profile.common_tags.length > 0}
                <div class="tags">
                  {#each profile.common_tags as tag}
                    <span class="tag">{tag}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
</div>

<style>
  .container {
    padding-top: 3vh;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    text-align: center;
  }
  .profile-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .profile-card {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 8px;
    background-color: #fff;
  }

  .profile-pic {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 20px;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
  }

  .profile-info > span {
    margin-bottom: 5px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
  }

  .tag {
    background-color: #eee;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
  }
  
  .sort-and-filter {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
  }

  .filtering {
    width: auto;

  }

  #filters {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }

  .age-filter {
    display: flex;
    flex-direction: row;
    gap: 1rem;
  }

</style>
