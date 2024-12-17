const { getViewedProfiles, getViewers, getLikedProfiles, getLikers } = require("../database/dbQueries");
const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');

async function get_viewed_profiles(req, res) {
  const function_name = "get_viewed_profiles";
  try {
    viewedProfiles = await getViewedProfiles(req.user.id);
    // console.log("viewedProfiles = ", viewedProfiles)
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, viewedProfiles: viewedProfiles, msg: "My views found", detail: "MY_VIEWS_FOUND" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

async function get_viewers(req, res) {
  const function_name = "get_viewers";
  try {
    viewers = await getViewers(req.user.id);
    // console.log("viewers = ", viewers)
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, viewers: viewers, msg: "Viewers found", detail: "VIEWERS_FOUND" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

async function get_liked_profiles(req, res) {
  const function_name = "get_liked_profiles";
  try {
    likedProfiles = await getLikedProfiles(req.user.id);
    // console.log("likedProfiles = ", likedProfiles)
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, likedProfiles: likedProfiles, msg: "My likes found", detail: "MY_LIKES_FOUND" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

async function get_likers(req, res) {
  const function_name = "get_likers";
  try {
    likers = await getLikers(req.user.id);
    // console.log("likers = ", likers)
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, likers: likers, msg: "Likers found", detail: "LIKERS_FOUND" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { 
  get_viewed_profiles,
  get_viewers,
  get_liked_profiles,
  get_likers
}; 