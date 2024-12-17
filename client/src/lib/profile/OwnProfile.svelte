<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from '$app/navigation';


    import { httpGET, httpPATCH, httpPATCHmultipart } from '$lib/httpRequests';

    import { userData } from "$lib/stores/userDataStore";
    import { UserDetails } from "../../types/UserDetails";
    import { debounce, searchAddress, formatLocation } from "./Utils.svelte"; 
    import { saveLocationToDB } from "$lib/location/Location.svelte";

    import { Input } from "$lib/components/ui/input";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import { Separator } from "$lib/components/ui/separator";
    import { Button } from "$lib/components/ui/button";
    import * as Select from "$lib/components/ui/select";
    import { toast } from "svelte-sonner";
    import { StarFull, StarHalf, StarEmpty } from "$lib/components/ui/stars/index.ts";

    export let userDetails: UserDetails;
    let searchInput: HTMLInputElement;
    let results: Array<{ display_name: string, address: any, lat: string, lon: string }> = [];
    let localLocation: string;
    let locationData: { latitude: string; longitude: string } | null = null;
    const debouncedSearch = debounce(() => searchAddress(searchInput.value, (newResults) => {
      results = newResults;
    }), 700);
    interface FormData {
      email: string;
      first_name: string;
      last_name: string;
      gender: string;
      date_of_birth: string;
      sexual_pref: string;
      biography: string;
      tags: string[];
    };

    const emptyPict: string = '/src/lib/assets/empty.jpg';

    let fullStars: number = Math.floor(userDetails.fameRating);
    let halfStar: boolean = userDetails.fameRating % 1 >= 0.5;
    let emptyStars: number = halfStar ? 4 - fullStars : 5 - fullStars;

    interface Picture {
      file: File | null;
      path: string;
      isFromBackend: boolean;
    }

    const initialPicture: Picture = {
      file: null,
      path: emptyPict,
      isFromBackend: false,
    };

    let profilePict: Picture = { ...initialPicture}
    let additionalPicts: Picture[] = Array.from({ length: 4 }, () => ({ ...initialPicture }));
  
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    let nbNewAdditionalPictAvailable: number = 4;
    let pictPathToSuppr: string[] = [];

    let loading: boolean = true;
    let isFormValid: boolean = false;
    let formData: FormData = {
      email: '',
      first_name: '',
      last_name: '',
      gender: '',
      date_of_birth: '',
      sexual_pref: '',
      biography: '', 
      tags: []
    };
    let initialData: FormData = { ...formData };
    let fameRating: number;
    let username: string;
    let nbLikes: number;
    let nbViews: number;
    let allTags: string[] = [];
    let initialTags: string[] = [];
    // let viewedProfiles: any[] = [];
    // let viewers: any[] = [];
    // let likedProfiles: any[] = [];
    // let likers: any[] = [];
  
    onMount(async () => {
      try {
         if (!$userData) {
          goto('/account/login');
          return;
        }
          username = $userData.username;
          localLocation = userDetails.location;
          // console.log("LES DETAILS: ", userDetails)
          retrieveData(userDetails);
          await retrievePictures();
          loading = false;
      } catch (error) {
        // console.error('[PROFILE] ', error);
        loading = false;
      }
    });
  
    function retrieveData(userDetails: any) {
      formData.first_name = userDetails.firstName;
      formData.last_name = userDetails.lastName;
      formData.email = userDetails.email;
      formData.gender = userDetails.gender;
      formData.date_of_birth = getBirthDate(userDetails.birthDate);
      formData.sexual_pref = userDetails.sexualPref;
      formData.biography = userDetails.biography;
      fameRating = userDetails.fameRating;
      nbLikes = userDetails.nbOfLikes;
      nbViews = userDetails.nbOfViews;
      formData.tags = userDetails.tags;
      initialTags = userDetails.tags;
      allTags = userDetails.allTags;
      initialData = { ...formData };
    }

    function getBirthDate(date: Date): string {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    }

    async function retrievePictures() {
      const response = await httpGET('/account/pictures');
      additionalPicts = Array.from({ length: 4 }, () => ({ ...initialPicture }));
      const data = await response.json();
      if (data.pictPaths) {
        if (data.pictPaths.profile) {
          profilePict.path = data.pictPaths.profile;
          profilePict.isFromBackend = true;
          if ($userData)
            $userData.profilePic = true;
        }
        if (data.pictPaths.additional) {
          if (data.pictPaths.additional.length > 4) { return }
          for (let i = 0; i < data.pictPaths.additional.length; i++) {
            additionalPicts[i].path = data.pictPaths.additional[i];
            additionalPicts[i].isFromBackend = true;
          }
          nbNewAdditionalPictAvailable = 4 - data.pictPaths.additional.length;
        }
      }
    }
  
    function getChangedData() {
      let changedData: Partial<FormData> = {};
      (Object.keys(formData) as (keyof FormData)[]).forEach(key => {
        if (key !== "tags") {
          if (formData[key] !== initialData[key]) {
            changedData[key] = formData[key];
          }
        }
      });
      return changedData;
    }
  
    async function handleSubmitData(event: Event) {
      event.preventDefault(); // Avoid page reload
      try {
        const changedData = getChangedData();
        if (initialTags !== formData.tags) {
          changedData.tags = formData.tags;
        }
        const response = await httpPATCH('/account/profile', changedData);
        const data = await response.json();
        // console.log("[UPDATE PROFILE]", data);
        if (data.success) {
          initialData = { ...formData };
          toast.success("Profile updated successfully");
        }
      } catch (error) {
      // console.error('[UPDATE PROFILE] ', error);
      toast.error("An error occurred while updating your profile");
      }
    }

    async function handleSubmitPictures(event: Event) {
      event.preventDefault(); // Avoid page reload
      try {
        const formData = new FormData();
        if (profilePict.file && !profilePict.isFromBackend)
          formData.append('PROFILE', profilePict.file)

        for (let i = 0; i < 4; i++) {
          if (additionalPicts[i].file && !additionalPicts[i].isFromBackend) {
            formData.append('ADDITIONAL', additionalPicts[i].file as Blob)
          }
        }
        formData.append('data', JSON.stringify(pictPathToSuppr));
        pictPathToSuppr = [];
        const response = await httpPATCHmultipart('/account/pictures', formData);
        const data = await response.json();
        // console.log("[UPDATE PROFILE]", data);
        if (data.success) {
          toast.success("Picture(s) updated successfully");
        }
        else {
          toast.error("An error occurred while updating your picture(s)");
        }
        retrievePictures();
      } catch (error) {
      // console.error('[UPDATE PROFILE] ', error);
      }
    }

    function handleProfilePicture(event: Event): void {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length === 1) {
        if (!validMimeTypes.includes(target.files[0].type)) {
          // console.error("[UPDATE PROFILE] Bad file type");
        } else {
          profilePict.file = target.files[0];
          profilePict.path = URL.createObjectURL(target.files[0]);
          profilePict.isFromBackend = false;
        }
      }
    }

    function handleAdditionalPictures(event: Event): void {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > nbNewAdditionalPictAvailable) {
        toast.error(`You can only select ${nbNewAdditionalPictAvailable} new files.`);
        // alert(`You can only select ${nbNewAdditionalPictAvailable} new files.`);
        target.value = '';
      } else if (target.files) {
        const newFilesArray = Array.from(target.files);
        let hasInvalidFile = false;
        newFilesArray.forEach((file: File) => {
          if (!validMimeTypes.includes(file.type)) {
            target.value = ''
            // console.error("Invalid file type")
            hasInvalidFile = true;
          }
        })
        if (hasInvalidFile) return;
        let j = 0;
        for (let i = 0; i < 4; i++) {
          if (!additionalPicts[i].isFromBackend && !additionalPicts[i].file && newFilesArray[j]) {
            additionalPicts[i].file = newFilesArray[j];
            additionalPicts[i].path = URL.createObjectURL(newFilesArray[j++]);
            additionalPicts[i].isFromBackend = false;
          }
        }
        nbNewAdditionalPictAvailable -= newFilesArray.length;
      }
    }

    function deletePicture(event: Event, index: number): void {
      event.preventDefault();
      if (additionalPicts[index].isFromBackend) {
        let urlObject = new URL(additionalPicts[index].path);
        pictPathToSuppr.push(urlObject.pathname.substring(1))
      }
      additionalPicts[index] = { ...initialPicture};
      nbNewAdditionalPictAvailable++;
      reorganizeAdditionalPict();
    }

    function reorganizeAdditionalPict() {
      let newAdditionalPicts = Array.from({ length: 4 }, () => ({ ...initialPicture }));
      let j = 0;
      for (let i = 0 ; i < 4; i++) {
        if (additionalPicts[i].path !== emptyPict) {
          newAdditionalPicts[j++] = additionalPicts[i];
        }
      }
      additionalPicts = [ ...newAdditionalPicts];
    }

    function toggleTag(tag: string) {
      if (formData.tags.includes(tag)) {
        formData.tags = formData.tags.filter(t => t !== tag);
      } else {
        formData.tags = [...formData.tags, tag];
      }
    }

    async function handleSubmitLocation(event: Event) {
      event.preventDefault();
      if (locationData) {
        const success = await saveLocationToDB(locationData);
        if (success)
          toast.success('Location updated successfully');
      }
    }

    async function saveSelectedLocation(newLocation: { display_name: string, address: any, lat: string, lon: string }) {
    // console.log(newLocation)
    locationData = {
      latitude: newLocation.lat,
      longitude: newLocation.lon
    };
    localLocation = formatLocation(newLocation.address);
    results = [];
    searchInput.value = '';
  }

  $: isFormValid = (
    formData.email.trim() !== '' &&
    formData.first_name.trim() !== '' &&
    formData.last_name.trim() !== '' &&
    formData.gender.trim() !== '' &&
    formData.date_of_birth.trim() !== '' && 
    formData.sexual_pref.trim() !== ''
  );

  $: isLocationValid = (
    locationData?.latitude.trim() !== '' &&
    locationData?.longitude.trim() != ''
  );
  </script>
  
  <div>
      {#if !loading}
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Edit personal information</h3>
      <p class="text-muted-foreground mb-6">
        Manage what appears on your profile, like your name, biography, sexual preference, etc. Changing your sexual preference will affect the profiles shown to you.
      </p>
      <form on:submit={handleSubmitData} class="space-y-4 mb-8">
          <div class="form-group">
              <label for="username"><small class="text-sm font-semibold leading-none">Username</small></label>
              <Input type="text" id="username" name="username" value={username} readonly />
              <p class="text-sm text-muted-foreground">This is your public username. It can be your real name or a pseudonym.</p>
          </div>
          <div class="form-group">
              <label for="first_name"><small class="text-sm font-semibold leading-none">First Name</small></label>
              <Input type="text" id="first_name" name="first_name" bind:value={formData.first_name} />
          </div>
          <div class="form-group">
              <label for="last_name"><small class="text-sm font-semibold leading-none">Last Name</small></label>
              <Input type="text" id="last_name" name="last_name" bind:value={formData.last_name} />
          </div>
          <div class="form-group">
              <label for="email"><small class="text-sm font-semibold leading-none">Email</small></label>
              <Input type="email" id="email" name="email" bind:value={formData.email} />
          </div>
          <div class="form-group">
            <label for="date_of_birth"><small class="text-sm font-semibold leading-none">Date of birth</small></label>
            <Input type="date" id="date_of_birth" name="date_of_birth" bind:value={formData.date_of_birth} />
        </div>
          <div class="form-group">
              <label for="gender"><small class="text-sm font-semibold leading-none">Gender</small></label>
              <select id="gender" name="gender" bind:value={formData.gender}>
                  <option value="man">Man</option>
                  <option value="woman">Woman</option>
              </select>
          </div>
          <div class="form-group">
              <label for="sexual_pref"><small class="text-sm font-semibold leading-none">Sexual Preference:</small></label>
              <select id="sexual_pref" name="sexual_pref" bind:value={formData.sexual_pref}>
                  <option value="bisexual">Bisexual</option>
                  <option value="heterosexual">Heterosexual</option>
                  <option value="homosexual">Homosexual</option>
              </select>
          </div>
          <div class="form-group">
              <label for="biography"><small class="text-sm font-semibold leading-none">Biography</small></label>
              <Textarea id="biography" name="biography" bind:value={formData.biography} />
              <p class="text-sm text-muted-foreground">Say something about yourself.</p>
          </div>
          <div class="form-group">
            <label for="tags"><small class="text-sm font-semibold leading-none mb-0">Interests</small></label>
            <div id="tags">
              {#each allTags as tag}
                <button 
                  type="button" 
                  class:tag-selected={formData.tags.includes(tag)} 
                  class="tag" 
                  on:click={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              {/each}
            </div>
          </div>
          <div class="form-group">
            <div class="mt-3">
              <Button type="submit" disabled={!isFormValid}>Save profile</Button>
            </div>
          </div>
        </form>

        <div class="mb-6 space-y-4" id="location">
        <div class="form-group">
          <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
            <label for="Location">Location</label>
          </h4>
          <div>
            {localLocation}
          </div>
        </div>
        <div>
          <input
            type="text"
            bind:this={searchInput}
            placeholder="Enter an new location"
            on:input={debouncedSearch}
          />
          <ul class="search-results">
            {#each results as result}
              <li>
                <button type="button" on:click={() => saveSelectedLocation(result)}>
                  {result.display_name}
                </button>
              </li>
            {/each}
          </ul>
        </div>
        <form on:submit={handleSubmitLocation}>
          <div class="form-group">
            <div class="button">
              <Button type="submit" disabled={!isLocationValid}>Save location</Button>
            </div>
          </div>
        </form>
      </div>

      <div class="space-y-4" id="pictures">
        <form on:submit={handleSubmitPictures}>
          <div class="form-group">
            <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
                Profile Picture
              </h4>
              <div class="photos">
                <img alt="profilePictFile" src={profilePict.path} />
              </div>
              <input accept=".png,.jpeg,.jpg" type="file" id="profile_picture_input" name="profile_picture_input" on:change={handleProfilePicture}>
          </div>
          <div class="{profilePict.path === emptyPict ? 'disabled' : ''}">
            <div class="form-group">
              <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
                  Additional Pictures (up to 4):
                </h4>
            </div>
            <div class="photos">
              {#each additionalPicts as additionalPict, index}
                <img alt={`add${index}`} src={additionalPict.path} />
              {/each}
            </div>
            <div class="delete-buttons">
              {#each additionalPicts as additionalPict, index}
                <Button disabled={additionalPict.path === emptyPict} on:click={(event) => deletePicture(event, index)} >Delete</Button>
              {/each}
            </div>
            <input accept=".png,.jpeg,.jpg" type="file" id="additional_pictures" name="additional_pictures" multiple on:change={handleAdditionalPictures} disabled={nbNewAdditionalPictAvailable <= 0 || profilePict.path === emptyPict}/>
          </div>
          <div class="form-group">
            <div class="button">
              <Button type="submit" disabled={!isFormValid}>Save pictures</Button>
            </div>
          </div>
      </form>
    </div>
      {/if}
    </div>
  
    <style>
      button {
        background-color: #83d2ff;
        color: #333;
        padding: 10px 20px;
        border: 1px solid #aaa;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s ease, transform 0.1s ease;
    }

    button:active {
        background-color: #999;
        transform: scale(0.98);
    }

      input {
        padding: 0.5em;
        margin: 0.5em 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 100%;
      }
      .search-results {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }
      .search-results li {
        margin: 0.1em 0;
      }
      .search-results button {
        padding: 0.5em;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        text-align: left;
      }
      .search-results button:hover {
        background: #e9e9e9;
      }
      #tags {
        display: flex;
        flex-wrap: wrap;
        margin: 0;
      }
    
      .tag {
        background-color: #f1f1f1;
        color: #333;
        padding: 3px 5px;
        margin: 5px;
        border-radius: 20px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
    
      .tag-selected {
        /* background-color: #007bff; */
        background-color: #a6d8a6;
        color: white;
      }

      .form-group {
          margin-bottom: 5px;
          display: flex;
          flex-direction: column;
          row-gap: 0.5em;
      }
      .form-group input, .form-group select  {
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
      }
      .form-group input[type="file"] {
          padding: 3px;
      }
      .photos img {
          max-width: 100px;
          margin: 5px;
          border-radius: 4px;
      }
    
      .photos {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .photos img {
        max-width: 100px;
        border-radius: 4px;
      }
      .delete-buttons {
        display: flex;
        justify-content: space-between;
      }
    
      .disabled {
        opacity: 0.3 !important;
        pointer-events: none !important;
      }

    </style>
  