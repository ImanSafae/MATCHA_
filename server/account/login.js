const { validateLogin } = require('../database/validators');
const { getUniqueFromTable, getLikedIds } = require("../database/dbQueries");
const { getMultiFromTableWithOrder } = require("../database/dbQueries");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const { getDataByColumnName } = require("../database/dbQueries");
const { httpResponse } = require('../utils');

const function_name = "LOGIN";

async function mapUserData(user, pictures) {
  const likedProfiles = await getLikedIds(user.id);
  const profilePicture = pictures.find(picture => picture.pict_type === 'PROFILE');
  return {
    id: user.id,
    username: user.username,
    likedProfiles: likedProfiles,
    matched: user.matched,
    blocked: user.blocked,
    profilePic: profilePicture ? true : false,
  };
}

async function login(req, res) {
  const data = req.body;
  await new Promise(resolve => setTimeout(resolve, 500));
  if (!validateLogin(data)) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Login Invalid Data", detail: "INVALID_DATA" });}
  try {
    const user = await getUniqueFromTable({"username": data.username}, "users");
    if (!user) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "User does not exist", detail: "INVALID_DATA" });}
    if (await bcrypt.compare(data.password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '4h' });

      
      const pictures = await getMultiFromTableWithOrder({ "user_id": user.id }, "picture", "created_at");
      const userData = await mapUserData(user, pictures);
      return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Login successful", detail: "LOGIN_SUCCESS", data: userData, token: token });
    } else {
      return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Invalid Password", detail: "INVALID_DATA" });
    }
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = {
  login,
};
