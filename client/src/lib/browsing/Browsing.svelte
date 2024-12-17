<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    import { httpGET } from '$lib/httpRequests';
  
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { StarFull, StarHalf, StarEmpty } from "$lib/components/ui/stars/index.ts";
  
    let profiles: any[] = [];
    let showedProfiles: any[] = [];
    const emptyPict: string = '/src/lib/assets/default-profile-pic.png';
    let sort = 0;
    const selector = {
      'dist-asc': { value: 0, str: 'Distance Ascending' },
      'dist-desc': { value: 1, str: 'Distance Descending' },
      'age-asc': { value: 2, str: 'Age Ascending' },
      'age-desc': { value: 3, str: 'Age Descending' },
      'fame-desc': { value: 4, str: 'Fame Descending' },
      'fame-asc': { value: 5, str: 'Fame Ascending' },
      'interest-desc': { value: 6, str: 'Common Interests Descending' },
      'interest-asc': { value: 7, str: 'Common Interests Ascending' }
    };
  
    let loading = true;
    let showFilter = false;
    let extremeAgeRange = [18, 100];
    let extremeFameRange = [0, 5];
  
    let selectedAgeRange = [18, 100];
    let selectedFameRange = [0, 5];
    let myFameRating = 0;
    let distanceRange = [0, 500];
    let selectedTags: string[] = [];
    let availableTags: string[] = [];
  
    onMount(async () => {
      try {
        const authResponse = await httpGET('/account/check-auth');
        const authData = await authResponse.json();
        if (!authData.authenticated) {
          goto('/account/login');
          return;
        }
        const response = await httpGET(`/browsing/users_for_me`);
        const data = await response.json();
        myFameRating = data.myFameRating;
        availableTags = data.myTags;
        profiles = data.users;
        // console.log(profiles);
        initFilterValue();
      } catch (error) {
        // console.error(error)
      } finally {
        loading = false;
      }
    });
  
    function initFilterValue() {
      showedProfiles = profiles;
      if (profiles) {
        const ages = profiles.map(user => user.age);
        extremeAgeRange[0] = selectedAgeRange[0] = Math.min(...ages);
        extremeAgeRange[1] = selectedAgeRange[1] = Math.max(...ages);
    
        if (myFameRating < 1) {
          extremeFameRange[0] = 0;
          extremeFameRange[1] = myFameRating + 1;
        } else if (myFameRating > 4) {
          extremeFameRange[0] = myFameRating - 1;
          extremeFameRange[1] = 5;
        } else {
          extremeFameRange[0] = myFameRating - 1;
          extremeFameRange[1] = myFameRating + 1;
        }
        selectedFameRange[0] = extremeFameRange[0];
        selectedFameRange[1] = extremeFameRange[1];
      }
  
    }
  
      const handleSelector = () => {
      // console.log(sort)
      switch (sort) {
        case selector['dist-asc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => a.distance - b.distance)];
          break;
        case selector['dist-desc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => b.distance - a.distance)];
          break;
        case selector['age-asc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => a.age - b.age)];
          break;
        case selector['age-desc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => b.age - a.age)];
          break;
        case selector['fame-asc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => a.fame_rating - b.fame_rating)];
          break;
        case selector['fame-desc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => b.fame_rating - a.fame_rating)];
          break;
        case selector['interest-asc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => (a.common_tags).length - (b.common_tags).length)];
          break;
        case selector['interest-desc'].value:
          showedProfiles = [...showedProfiles.sort((a, b) => (b.common_tags).length - (a.common_tags).length)];
          break;
      }
      }
  
    const applyFilters = () => {
      showedProfiles = profiles.filter(profile => 
        profile.age >= selectedAgeRange[0] && profile.age <= selectedAgeRange[1] &&
        profile.fame_rating >= selectedFameRange[0] && profile.fame_rating <= selectedFameRange[1] &&
        profile.distance >= distanceRange[0] * 500 && profile.distance <= distanceRange[1] * 500 &&
        (selectedTags.length === 0 || selectedTags.every(tag => profile.common_tags.includes(tag)))
      );
      showFilter = false;
    };
  
    const resetFilters = () => {
      showedProfiles = profiles;
      showFilter = false;
    };
  
    const toggleTag = (tag) => {
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
      } else {
        selectedTags = [...selectedTags, tag];
      }
    };
  </script>
  <div class="container">
  {#if loading}
    <div class="loading">Loading profiles...</div>
  {:else}
    <div class='title'>
      <h1 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-5xl">
        Suggested profiles
      </h1>
      <h2 class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        swipe to see more
      </h2>
  </div>
    <div class="fame-research">
      <strong>Order by</strong>
      <select bind:value={sort} on:change={handleSelector}>
        <option value={selector['dist-asc'].value}>{selector['dist-asc'].str}</option>
        <option value={selector['dist-desc'].value}>{selector['dist-desc'].str}</option>
        <option value={selector['age-asc'].value}>{selector['age-asc'].str}</option>
        <option value={selector['age-desc'].value}>{selector['age-desc'].str}</option>
        <option value={selector['fame-desc'].value}>{selector['fame-desc'].str}</option>
        <option value={selector['fame-asc'].value}>{selector['fame-asc'].str}</option>
        <option value={selector['interest-desc'].value}>{selector['interest-desc'].str}</option>
        <option value={selector['interest-asc'].value}>{selector['interest-asc'].str}</option>
      </select>  
    </div>
    <div class="filter-by">
      <button on:click={() => showFilter = !showFilter}>
      <strong>Filter by ⬇️</strong>
      </button>
      {#if showFilter}
        <div class="filters">
          <div class="age-research">
            <h2>Age (years)</h2>
            <div class="inputs">
                <input type="number" placeholder="minimum" class="w-32" min={extremeAgeRange[0]} max={selectedAgeRange[1]} bind:value={selectedAgeRange[0]} />
                <input type="number" placeholder="maximum" class="w-32" min={selectedAgeRange[0]} max={extremeAgeRange[1]} bind:value={selectedAgeRange[1]} />
            </div>
          </div>
          <div>
            <h2>Fame Rating (points)</h2>
            <input type="number" placeholder="minimum" class="w-32" min={extremeFameRange[0]} max={selectedFameRange[1]} bind:value={selectedFameRange[0]} />
            <input type="number" placeholder="minimum" class="w-32" min={selectedFameRange[0]} max={extremeFameRange[1]} bind:value={selectedFameRange[1]} />
          </div>
          <div>
            <h2>Distance (km)</h2>
            <input type="number" placeholder="minimum" class="w-32" min=0 max={distanceRange[1]} bind:value={distanceRange[0]} />
            <input type="number" placeholder="minimum" class="w-32" min={distanceRange[0]} max=500 bind:value={distanceRange[1]} />
          </div>
          <div>
            <div class="form-group">
              <h2>Common interests</h2>
              <div class="tags">
                {#if availableTags && availableTags.length}
                  {#each availableTags as tag}
                    <button 
                      type="button" 
                      class:tag-selected={selectedTags.includes(tag)} 
                      class="tag" 
                      on:click={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  {/each}
                {:else}
                  <div style="color: red;">
                    <strong>You should have at least one tag selected in your profile to have matching profiles</strong>
                  </div>
                {/if}
                
              </div>
            </div>
          </div>
          <div class='button-group'>
            <button class="apply-filters" on:click={applyFilters}>APPLY FILTERS</button>    
            <button class="apply-filters" on:click={resetFilters}>RESET FILTERS</button>
          </div>
        </div>
      {/if}
    </div>
  
    {#if showedProfiles && showedProfiles.length}
    <Carousel.Root opts={{align: "start"}} class="w-full max-w-7xl">
    <Carousel.Content>
      {#each showedProfiles as profile}
        <Carousel.Item class="md:basis-1/2 lg:basis-1/3">
          <div class="p-1">
            <Card.Root>
              <Card.Content
                class="flex items-center justify-center"
                style="padding-bottom: 5px"
              >
                <a href={`/account/profile?id=${profile.id}`} class="profile-card" tabindex="0">
                  <img src={profile.profile_pict || emptyPict } alt="{profile.first_name} {profile.last_name}" class="profile-pic" />
                  <div class="profile-info">
                    <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
                      {profile.first_name} {profile.last_name}
                    </h4>
                    <p>{profile.age} years old</p>
                    <p>Distance: {(profile.distance/1000).toFixed(1)} km</p>
                    <div class="fame-rating">Fame Rating:
                      <div class="fame-rating-stars">
                        {#each {length: Math.floor(profile.fame_rating.toFixed(1))} as i}
                          <StarFull />
                        {/each}
                        {#if profile.fame_rating.toFixed(1) - Math.floor(profile.fame_rating.toFixed(1)) >= 0.5}
                          <StarHalf />
                        {/if}
                        {#each {length: 5 - Math.ceil(profile.fame_rating.toFixed(1))} as i}
                          <StarEmpty />
                        {/each}
                      </div>
                    </div>
                  </div>
                </a>
              </Card.Content>
              <Card.Footer  style="height: 60px">
                {#if profile.common_tags && profile.common_tags.length > 0}
                  <div class="tags">
                    {#each profile.common_tags as tag}
                      <span class="tag">#{tag}</span>
                    {/each}
                  </div>
                {/if}
              </Card.Footer>
            </Card.Root>
          </div>
        </Carousel.Item>
      {/each}
    </Carousel.Content>
    <Carousel.Previous />
    <Carousel.Next />
  </Carousel.Root>
    {:else}
      <div class='title'>NO MATCHING PROFILES</div>
      {#if availableTags && availableTags.length == 0}
        <div class='title'>Select at least one interest in your profile</div>
      {/if}
    {/if}
  {/if}
  </div>
  
  <style>
  
    .loading {
      text-align: center;
      font-size: 1.5rem;
      color: #555;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5em;
      line-height: 1.2;
      margin-top: 5px;
    }
      
    .tag {
      background-color: #f1f1f1;
      color: #333;
      cursor: pointer;
      transition: background-color 0.3s;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
    }
  
    .tag-selected {
      background-color: #007bff;
      color: white;
    }
  
    .age-research {
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    input[type="number"] {
      color: #8a8383;
      width: 100px;
      height: 30px;
      font-size: 20px;
      border: none;
    }

    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button {  
      opacity: 1;
    }
  
    .filter-by {
      margin-top: 20px;
    }

    .filters {
      margin-top: 10px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    .filters div {
      margin-bottom: 10px;
    }

    .title {
      font-size: 2.5rem;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
  
    .fame-research {
      width: 100%;
    }

    .profile-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      row-gap: 1em;
      /* border: 1px solid #ddd; */
      margin: 0;
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
  
    button.apply-filters {
    background-color: #acacac;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
  }
  
    button.apply-filters:hover {
      background-color: #696969;
    }
  
    button.apply-filters:active {
      background-color: #a9a9a9;
    }
    
    .fame-rating {
      display: flex;
      flex-direction: row;
      gap: 0.5em;
      align-items: center;
    }
  
    .fame-rating-stars {
      height: 1em;
      display: flex;
      flex-direction: row;
    }

    .container {
    width: 90% !important;
  }
  
  </style>