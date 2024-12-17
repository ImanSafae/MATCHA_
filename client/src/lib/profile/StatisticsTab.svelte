<script lang="ts">
  import { UserDetails } from "../../types/UserDetails";

  export let userDetails: UserDetails;
</script>

<div class="container">
  <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
    Your statistics
  </h3>
  <p class="text-muted-foreground mb-6">
    Check how well you're doing on Matcha.
  </p>
  <div class="stats">
    <div class="fame-rating">
      <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        Fame Rating
      </h4>
      {userDetails.fameRating.toFixed(1)}
    </div>
    <div class="profile-views-stats">
      <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        Profile Views
      </h4>
      <div>{userDetails.nbOfViews}</div>
    </div>
    <div class="likes-stats">
      <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Likes</h4>
      <div>{userDetails.nbOfLikes}</div>
    </div>
  </div>
</div>

<style>
  .stats {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
</style>
