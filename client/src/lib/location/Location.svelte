<script context="module" lang="ts">
  import { httpPATCH } from '$lib/httpRequests';
    import { toast } from 'svelte-sonner';
  const IP_INFO_TOKEN = process.env.IP_INFO_TOKEN;

  export async function saveLocationToDB(location: { latitude: string; longitude: string }) {
    const functionName = '[SAVE LOCATION]';
    // console.log("location = ", location)
    try {
      const response = await httpPATCH('/account/profile/location', location)
      const data = await response.json();
      // console.log(`${functionName} `, data);
      if (data.error) {
        return false;
        // console.error(`${functionName} `, data.error)
        // toast.error('An error occured while updating your location');
      }
      else {
        return true;
      }
    } catch (error) {
      return false;
      // console.error(`${functionName} `, error);
    }
  }

  export async function initializeLocation() {
    const functionName = '[INITIALIZE LOCATION]';
    try {
      const locationData = await fetchUserLocation();
      if (locationData) {
        saveLocationToDB(locationData);
      }
      return locationData;
    } catch (error) {
      // console.error(`${functionName} `, error);
      return null;
    }
  }

  export async function fetchUserLocation() {
    const functionName = "[FETCH USER LOCATION]";
    try {
      if (navigator.geolocation) {
        const locationData = await getGeolocation();
        return locationData;
      } else {
        console.log(
          `${functionName} Geolocation is not supported by this browser.`,
        );
      }
    } catch (error) {
      // console.error(`${functionName} Error:`, error);
    }
    return await fetchLocationFromIP();
  }

  async function getGeolocation(): Promise<{ latitude: string; longitude: string; } | null> {
    const functionName = "[GET GEOLOCATION]";
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          };
          // console.log(
          //   `${functionName} Latitude: ${locationData.latitude}, Longitude: ${locationData.longitude}`,
          // );
          resolve(locationData);
        },
        async (error) => {
          // console.log(`${functionName} Geolocation error:`, error);
          const locationData = await fetchLocationFromIP();
          resolve(locationData);
        },
      );
    });
  }

  async function fetchLocationFromIP(): Promise<{ latitude: string; longitude: string; } | null> {
    const functionName = "[FETCH LOCATION FROM IP]";
    try {
      const response = await fetch(
        `https://ipinfo.io/json?token=${IP_INFO_TOKEN}`,
      );
      const data = await response.json();
      const [latitude, longitude] = data.loc.split(",");
      const locationData = { latitude, longitude };
      // console.log(`${functionName} Location based on IP:`, locationData);
      return locationData;
    } catch (error) {
      // console.error(`${functionName} Error fetching location from IP:`, error);
      return null;
    }
  }
</script>
