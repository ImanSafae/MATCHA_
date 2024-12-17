const { StatusCodes } = require("http-status-codes");
const { httpResponse } = require("../utils");
const {
  getAllTagNames,
  searchProfiles,
  updateFameRating,
} = require("../database/dbQueries");

async function validateTags(tags) {
  if (tags === null || tags.length === 0 || tags === undefined) {
    // console.log("returning true");
    return true;
  }
  try {
    const realTags = await getAllTagNames();
    for (const tag of tags) {
      if (!realTags.includes(tag)) {
        return false;
      }
    }
    // console.log("returning true");
    return true;
  } catch (error) {
    // console.error("Error fetching tags:", error);
    return false;
  }
}

function validateLocation(location) {
  // console.log("location verification:...", location);
  
  if (location === null || location === undefined) {
    return true;
  }

  //checker que location contienne lattitude, longitude et radius
  if (location.lat === undefined || location.lon === undefined) {
    return false;
  }
  // checker que ce sont des nombres
  if (
    isNaN(location.lat) ||
    isNaN(location.lon)
  ) {
    return false;
  }
  // checker que la latitude et longitude sont dans les bonnes plages
  if (
    location.lat < -90 ||
    location.lat > 90 ||
    location.lon < -180 ||
    location.lon > 180
  ) {
    return false;
  }

  // console.log("location.address:", location.address);
  // console.log("location.address.city:", location.address.city);
  // console.log("location.address.village:", location.address.village);
  // console.log("location.address.town:", location.address.town);
  // console.log("location.address.municipality:", location.address.municipality);

  if (location.address.city === undefined && location.address.village === undefined
    && location.address.town === undefined && location.address.hamlet === undefined && location.address.province === undefined) {
      // console.log("error: no city requested");
    return false;
  }
  return true;
}

function validateParams(params) {
  if (params === null || params === undefined) {
    return false;
  }

  let criteria = 0;

  const validKeys = ["location", "minAge", "maxAge", "fameRating", "tags"];
  // checker qu'un champ autre que location, minAge, maxAge, fameRating et tags n'est pas présent
  for (const key in params) {
    if (!validKeys.includes(key)) {
      return false;
    }
    else {
      criteria++;
    }
  }
  if (criteria === 0) {
    return false;
  }
  return true;
}

function filterProfileInfo(profile) {
  return {
    id: profile.id,
    username: profile.username,
    first_name: profile.first_name,
    last_name: profile.last_name,
    fame_rating: profile.fame_rating,

  }
}

async function search_profiles(req, res) {
  const function_name = "SEARCH_PROFILES";
  try {
    const params = req.body;
    // console.log("searching profiles with following received params:", params);
    if (!validateParams(params)) {
      return httpResponse(
        res,
        function_name,
        StatusCodes.OK,
        {error: "Invalid parameters"}
      );
    }
    let { minAge, maxAge, tags, location, fameRating } = params;

      if (!minAge || minAge === undefined || minAge < 18) {
        minAge = 18;
      }
      if (minAge > 120) {
        minAge = 120;
      }
      if (maxAge < 18) {
        maxAge = 18;
      }
      if (!maxAge || maxAge === undefined || maxAge > 120) {
        maxAge = 120;
      }
      if (!fameRating || fameRating === undefined) {
        fameRating = 0;
      }
      if (maxAge < minAge) {
        return httpResponse(
          res,
          function_name,
          StatusCodes.OK,
          {error: "Invalid age range"}
        );
      }
      if (fameRating < 0 || fameRating > 5) {
        return httpResponse(
          res,
          function_name,
          StatusCodes.OK,
          {error: "Invalid fame rating"}
        );
      }
      const tagsValidated = await validateTags(tags);
      if (!tagsValidated) {
        // console.log("tags are invalid");
        return httpResponse(res, function_name, StatusCodes.OK, {error:"Invalid tag"});
      }
      const locationValidated = validateLocation(location);
      if (!locationValidated) {
        // console.log("location is invalid");
        return httpResponse(
          res,
          function_name,
          StatusCodes.OK,
          {error: "Invalid location", detail: "Location must be a city and contain latitude and longitude fields."}
        );
      }

    // get profiles
    const profiles = await searchProfiles({ userId: req.user.id, tags, minAge, maxAge, fameRating, location });
    // console.log("profiles found:", profiles);
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, data: profiles });
  } catch (error) {
    // console.error(error);
    return httpResponse(
      res,
      function_name,
      StatusCodes.OK,
      {error: "Internal server error"}
    );
  }
}

module.exports = {
  search_profiles,
};
