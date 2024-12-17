const { validateEmail } = require('../../database/validators');
const { getUniqueFromTable, postUuid } = require("../../database/dbQueries");
const { socketResponse } = require('../../utils');
const { v4: uuidv4 } = require('uuid');
const { sendEmailForgottenPassword } = require('../email/sendEmail');
const { StatusCodes } = require('http-status-codes');
const { httpResponse } = require('../../utils');

const function_name = "FORGOTTEN_PWD_RESP";

async function forgotten_pwd(req, res) {
  data = req.body
  if (data.email) {
    if (!validateEmail({ email: data.email })) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Email not valid", detail: "PASSWORD_RECOVER" })}
    const user = await getUniqueFromTable({"email": data.email}, "users");
    if (!user) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "User does not exist", detail: "PASSWORD_RECOVER" }) }
    
    try {
      const uuid = uuidv4();
      await postUuid(uuid, user.id);
      sendEmailForgottenPassword(data.email, user.username, uuid);
      return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "UUID for Forgotten Pwd Created", detail: "PASSWORD_RECOVER" })
    } catch (error) {
      httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, msg: "Error: ", detail: "PASSWORD_RECOVER" })
    }
  } else {
    httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", detail: "PASSWORD_RECOVER" })
  }
}

module.exports = { 
  forgotten_pwd,
};  