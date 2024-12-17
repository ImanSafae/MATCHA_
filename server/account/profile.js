const fs = require('fs');
const path = require('path');
const { getUniqueFromTable,
        getDataByColumnName,
        postUuid, 
        updateInputsInTable, 
        getUserTags, getAllTagNames, 
        postPicturesPath, 
        deleteMultipleRows, 
        getMultiFromTableWithOrder, 
        deleteInputFromTable,
        getUserProfileData,
        incrementProfileView,
        // incrementProfileLikes,
        updateLikedProfiles,
        getConversationIdByUserIds,
        decrementProfileLikes, 
        updateLastActive,
        updateLocation,
        getUserLocation,
        postView,
        getFullUser,
        postTags, 
        createConversation} = require("../database/dbQueries");
const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const { validatePatchUser, validatePatchLocation, validatePicture } = require("../database/validators");
const { v4: uuidv4 } = require('uuid');
const { sendEmailUpdateEmail } = require('./email/sendEmail');
const { isUserConnected, getNewFameRating } = require('../social/social');
const { isChatRequestValid } = require('../chat/chat');
const { nominatimGetAddress } = require("../search/location");
const { EVENT_TYPES } = require('../social/types');

async function newActivityTimestamp(userId) {
  const date = new Date();
  await updateLastActive(userId, date);
}

// function isUserConnected(userId) {
//   return global.connectedUsers.has(userId);
// }

async function get_profile(req, res) {
  const function_name = "GET_PROFILE"
  try {
    const params = req.query;
    params.id = params.id || req.user.id;
    let user;
    if (params.id == req.user.id)
      user = await mapUserProfileData(params.id, req);
    else
      user = await mapOtherUserProfileData(params.id, req);
    if (!user) { 
      // console.error("User not found in get_profile");
      return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "User doesn't exist", detail: "USER_NOT_FOUND" });
    }
    const isOnline = isUserConnected(user.userData.id);
    if (isOnline) {
      user.status = "online";
    }
    else {
      user.status = "offline";
    }
    const { password, id, ...safeUser } = user;
    if (Number(req.user.id) !== Number(params.id)) {
      await newProfileView(req.user.id, params.id);
    }
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, user: safeUser, msg: "User found", detail: "USER_FOUND" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

async function get_pictures(req, res) {
  const function_name = "GET_PICTURES"
  try {
    const params = req.query;
    const userId = params.id || req.user.id;
    const pictures = await getMultiFromTableWithOrder({ "user_id": userId }, "picture", "created_at");
    if (!pictures.length) { return httpResponse(res, function_name, StatusCodes.OK, { success: true, pictPaths: [], msg: "No pictures found", detail: "PICTURES_NOT_FOUND" }); }
    const pictPaths = formatPictures(pictures, req);
    // console.log(pictPaths);
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, pictPaths: pictPaths, msg: "Pictures found", detail: "PICTURES_FOUND" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

function formatPictures(pictures, req) {
  if (!pictures.length) { return []; }
  const profilePicture = pictures.find(picture => picture.pict_type === 'PROFILE');
  const additionalPictures = pictures.filter(picture => picture.pict_type !== 'PROFILE');
  return {
    profile: profilePicture ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(profilePicture.path)}` : null,
    additional: additionalPictures.map(picture => `${req.protocol}://${req.get('host')}/uploads/${path.basename(picture.path)}`)
  };
}
 
async function patch_profile(req, res) {
  const function_name = "PATCH_PROFILE"
  try {
    const data = req.body;
    // console.log(data)
    if (!validatePatchUser(data)) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Data invalid", detail: "INVALID_DATA" });}
    if ("email" in data) {
      const uuid = uuidv4();
      await postUuid(uuid, req.user.id, data['email']);
      sendEmailUpdateEmail(data["email"], req.user.username, uuid)
    }
    if ("tags" in data) {
      await postTags(req.user.id, data['tags']);
    }
    const { email, tags, ...dataWithoutEmailAndTags } = data;
    if (Object.keys(dataWithoutEmailAndTags).length) { await updateInputsInTable(dataWithoutEmailAndTags, "id", req.user.id, "users"); }
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Profile updated", detail: "USER_UPDATED" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

async function patch_location(req, res) {
  const function_name = "PATCH_PROFILE"
  try {
    const data = req.body;
    // console.log(data);
    const floatData = {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude)
    };
    if (!validatePatchLocation(floatData)) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Data invalid", detail: "INVALID_DATA" });}
    await updateLocation(req.user.id, floatData['latitude'], floatData['longitude']);
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Location updated", detail: "USER_UPDATED" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

function get_file(req, res) {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);
  
  res.sendFile(filepath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
}

function deleteFiles(files) {
  if (files) {
    for (let i = 0 ; i < files.length; i++) {
      fs.unlink(files[i], (err) => {
        if (err) {
          // console.error(`Error deleting file: ${files[i]}`, err);
        } else {
          // console.log(`File deleted successfully: ${files[i]}`);
        }
      })
    }
  }
}

async function patch_pictures(req, res) {
  const function_name = "PATCH_PICTURES"
  try {
    if (req.body.data) {
      const data = JSON.parse(req.body.data);
      if (data.length > 0) {
        // console.log("Retrieve data:", data);
        await deleteMultipleRows("path", data, "picture");
        deleteFiles(data);
      }
    }
    const files = Object.values(req.files).flat();
    // console.log('Received files:', files);

    for (let file of files) {
      if (!validatePicture(file)) {
        return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Pictures invalid", detail: "INVALID_DATA" });
      }
    }
    if (files.length > 0) {
      await postPicturesPath(files, req.user.id);
    }
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Pictures updated", detail: "USER_UPDATED" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

async function mapOtherUserProfileData(userId, req) {
  try {
    if (!userId) { 
      return null; 
    }
    const data = await getUserProfileData(userId);
    const location = await getFullAddress(data.latitude, data.longitude);
    const newData = {
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: `${data.first_name} ${data.last_name}`,
      userData: {
        username: data.username,
        id: data.id,
      },
      gender: data.gender,
      birthDate: data.date_of_birth,
      sexualPref: data.sexual_pref,
      location: location,
      pictures: formatPictures(data.pictures, req),
      biography: data.biography,
      lastActive: data.last_active,
      nbOfLikes: data.nb_likes,
      nbOfViews: data.nb_views,
      fameRating: data.fame_rating,
      tags: data.tags,
      allTags: data.all_tags
    };
    return newData;
  }
  catch (error) {
    // console.error("Error in mapOtherUserProfileData:", error);
    return null;
  }
}

async function mapUserProfileData(userId, req) {
  try {
    if (!userId) { 
      return null; 
    }
    const data = await getFullUser(userId);
    // // console.log("TOUT : ", data)
    const location = await getFullAddress(data.latitude, data.longitude);
    const newData = {
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: `${data.first_name} ${data.last_name}`,
      userData: {
        username: data.username,
        id: data.id,
      },
      email: data.email,
      gender: data.gender,
      birthDate: data.date_of_birth,
      sexualPref: data.sexual_pref,
      location: location,
      pictures: formatPictures(data.pictures, req),
      biography: data.biography,
      lastActive: data.last_active,
      nbOfLikes: data.nb_likes,
      nbOfViews: data.nb_views,
      fameRating: data.fame_rating,
      tags: data.tags,
      allTags: data.all_tags
    };
    // // console.log("newData : ", newData);
    return newData;
  }
  catch (error) {
    // console.error("Error in mapUserProfileData:", error);
    return null;
  }
}

async function getFullAddress(latitude, longitude) {
  try {
    // const getPoint = await getUserLocation(userId);
    const fullAddress = await nominatimGetAddress(latitude, longitude);
    return fullAddress;
  } catch (error) {
    // console.error("Error in getFullAddress:", error);
    return null;
  }
}

async function newProfileView(viewer_id, viewed_id) {
  try {
    await postView(viewer_id, viewed_id);
    const newFameRating = await getNewFameRating(EVENT_TYPES.VIEW, viewed_id);
    // console.log("new fame rating after view:", newFameRating);
  }
  catch (error) {
    // console.error("Error in newProfileView:", error);
  }
}

async function likeProfile(likerId, likedId, timestamp) {
  // const function_name = "LIKE_PROFILE"
  // // console.log("like_profile");
  try {
    // const params = req.body;
    // const user = req.user;

    const updatedLikedProfilesResult = await updateLikedProfiles(likerId, likedId, timestamp, true);
    if (!updatedLikedProfilesResult) { 
      // console.log("Profile was already liked.");
      return { success: false, msg: "Can't like profile that was already liked", detail: "PROFILE_ALREADY_LIKED" };
    }
    
    // await incrementProfileLikes(likedId);
    const newFameRating = await getNewFameRating(EVENT_TYPES.LIKE, likedId);
    // console.log("new fame rating after like:", newFameRating);
    return { success: true, msg: "User liked", detail: "USER_LIKED" };
  }
  catch(error) {
    return { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" };
  }
}

async function unlikeProfile(unlikerId, unlikedId) {
  try {
    const updatedLikedProfilesResult = await updateLikedProfiles(unlikerId, unlikedId, false);
    if (!updatedLikedProfilesResult) { 
      return { success: false, msg: "Can't unlike profile that was not liked", detail: "PROFILE_NOT_LIKED" };
    }

    // await decrementProfileLikes(unlikedId);
    const newFameRating = await getNewFameRating(EVENT_TYPES.UNLIKE, unlikedId);
    // console.log("new fame rating after unlike:", newFameRating);
    return { success: true, msg: "User unliked", detail: "USER_UNLIKED" };
  }
  catch(error) {
    return { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" };
  }
}

async function get_username(req, res) {
  const function_name = "GET_USERNAME";
  try {
    const validRequest = await isChatRequestValid(req.user.id, req.params.id);
    // console.log('validRequest = ', validRequest);
    if (!validRequest.success) {
      // console.log("invalid request");
      return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Forbidden request", detail: "FORBIDDEN_REQUEST" });
    }
    const id = req.params.id;
    const user = await getDataByColumnName("id", id, "users");
    if (!user) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "User doesn't exist", detail: "USER_NOT_FOUND" });  }
    
    let conversationId = await getConversationIdByUserIds(req.user.id, req.params.id);
    if (!conversationId) {
      conversationId = await createConversation(req.user.id, req.params.id);
      // console.log("Conversation created id = ", conversationId);
    } else {
      // console.log("conversationId found:", conversationId);
    }

    const returnData = {
      success: true,
      data: user.username,
      msg: "Username found",
      detail: "USERNAME_FOUND",
      conv: conversationId
    };
    return httpResponse(res, function_name, StatusCodes.OK, returnData);
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { 
  get_profile,
  patch_profile,
  patch_location,
  likeProfile,
  get_file,
  patch_pictures,
  get_pictures,
  unlikeProfile,
  get_username,
  newActivityTimestamp
}; 
