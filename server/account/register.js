const bcrypt = require("bcrypt");
const { getUniqueFromTable, postPendingUser } = require("../database/dbQueries");
const { validateCreateUser, usernameValidator, emailValidator } = require('../database/validators');
const { sendEmailAccountConfirmation } = require('./email/sendEmail');
const { v4: uuidv4 } = require('uuid');
const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');

const function_name = "REGISTER";

async function usernameAvailable(username) {
  try {
      const user_by_username = await getUniqueFromTable({"username": username}, "users");
      const pending_user_by_username = await getUniqueFromTable({"username": username}, "pending_users");
      const available = !user_by_username && !pending_user_by_username;
      //if (!available) { console.log("[USERNAME_AVAILABLE] Username not available") }
      return available
  } catch (error) {
      // console.error("[USERNAME_AVAILABLE] Error checking username availability", error);
      return false;
  }
}

async function emailAvailable(email) {
  try {
      const user_by_email = await getUniqueFromTable({"email": email}, "users");
      const pending_user_by_email = await getUniqueFromTable({"email": email}, "pending_users");
      const available = !user_by_email && !pending_user_by_email;
      // if (!available) { console.log("[EMAIL_AVAILABLE] Email not available") }
      return available
  } catch (error) {
      // console.error("[EMAIL_AVAILABLE] Error checking email availability", error);
      return false;
  }
}

async function checkUsername(socket, data) {
  try {
    const usernameValidation = usernameValidator(data.username);
    if (!usernameValidation.valid) {
      return socket.emit("USERNAME_CHECK_RESP", { available: false, reason: usernameValidation.reason });
    }
    const available = await usernameAvailable(data.username);
    if (available) {
      return socket.emit("USERNAME_CHECK_RESP", { available });
    } else {
      return socket.emit("USERNAME_CHECK_RESP", { available , reason: "Username unavailable."});
    }
  } catch (error) {
      // console.error("[CHECK_USERNAME] Error during username check", error);
      return socket.emit("USERNAME_CHECK_RESP", { available: false });
  }
}

async function checkEmail(socket, data) {
  try {
    const emailValidation = emailValidator(data.email);
    if (!emailValidation.valid) {
      return socket.emit("EMAIL_CHECK_RESP", { available: false, reason: emailValidation.reason });
    }
    const available = await emailAvailable(data.email);
    return socket.emit("EMAIL_CHECK_RESP", { available });
  } catch (error) {
    // console.error("[CHECK_EMAIL] Error during email check", error);
    return socket.emit("EMAIL_CHECK_RESP", { available: false });
  }
}

async function register(req, res) {
  data = req.body;
  await new Promise(resolve => setTimeout(resolve, 500)); // Avoid Brute Force : 500 ms sleep
  if (!validateCreateUser(data)) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Create User Invalid Data", detail: "INVALID_DATA" });}
  try {
    const isUsernameAvailable = await usernameAvailable(data.username);
    if (!isUsernameAvailable) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Username not available", detail: "USERNAME_NOT_AVAILABLE" });}
    const isEmailAvailable = await emailAvailable(data.email);
    if (!isEmailAvailable) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Email not available", detail: "EMAIL_NOT_AVAILABLE" }); }
    data.username = data.username.trim();
    data.email = data.email.trim();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const uuid = uuidv4();
    if (!data.sexual_pref) {
      data.sexual_pref = 'bisexual';
    }
    await postPendingUser(data, hashedPassword, uuid);
    sendEmailAccountConfirmation(data.email, data.username, uuid);
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "User successfully created", detail: "REGISTER_SUCCESSFUL" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { 
  register,
  checkUsername,
  checkEmail 
};  