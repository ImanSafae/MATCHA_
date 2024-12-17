const { validateUuid, validatePassword } = require('../../database/validators');
const { getUniqueFromTable, deleteInputFromTable, updateInputsInTable } = require("../../database/dbQueries");
const bcrypt = require("bcrypt");
const { StatusCodes } = require('http-status-codes');
const { httpResponse } = require('../../utils');

const function_name = "RECOVER_PWD_RESP"

async function check_pwd_uuid(data, res) {
  try {
    if (!data.uuid) { httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Empty UUID", detail: "INVALID_UUID"}); return null;}
    if (!validateUuid({ uuid: data.uuid })) { httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Invalid UUID", detail: "INVALID_UUID"}); return null; }
    const pwd_recover = await getUniqueFromTable({"uuid": data.uuid}, "uuid");
    if (!pwd_recover) { httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "User doesn't exist", detail: "USER_NOT_FOUND"}); return null; }
    const currentDate = new Date();
    if (new Date(pwd_recover.expiration_date) < currentDate) {
      await deleteInputFromTable({"uuid": data.uuid}, "uuid");
      httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "UUID has expired", detail: "UUID_HAS_EXPIRED"}); 
      return null;
    }
    // console.log("UUID is valid")
    return pwd_recover;
  } catch(error) {
    httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, msg: "Error: ", detail: "INTERNAL_SERVER_ERROR"});
    return null;
  }
}

async function recover_pwd(req, res) {
  data = req.body
  try {
    pwd_recover = await check_pwd_uuid(data, res)
    if (!pwd_recover) { return; }
    if (!validatePassword( { password: data.password })) { httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: `Invalid password: ${data.password}`, detail: "INVALID_PASSWORD"}); return;}
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await deleteInputFromTable({"id": pwd_recover.id}, "uuid");
    await updateInputsInTable({ password: hashedPassword }, "id", pwd_recover.user_id, "users");
    httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Password updated in db", detail: "PASSWORD_RECOVERED"}); 
  } catch(error) {
    httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, msg: "Error: ", detail: "INTERNAL_SERVER_ERROR"});
  }
}

module.exports = { 
  recover_pwd
};  