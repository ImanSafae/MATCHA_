const { validateUuid, validateEmail } = require('../../database/validators');
const { updateInputsInTable, getUniqueFromTable, deleteInputFromTable } = require("../../database/dbQueries");
const { httpResponse } = require('../../utils');
const { StatusCodes } = require('http-status-codes');

const function_name = "UPDATE_EMAIL";

async function update_email(req, res) {
  try {
    data = req.body;
    if (!data.uuid) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Empty UUID", detail: "INVALID_UUID"});}
    if (!validateUuid({ uuid: data.uuid })) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "UUID is invalid.", detail: "EMAIL_NOT_VALIDATED" });}
    const new_email = await getUniqueFromTable({"uuid": data.uuid}, "uuid");
    if (!new_email) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Email update doesn't exist", detail: "EMAIL_NOT_VALIDATED"});}
    const currentDate = new Date();
    if (new Date(new_email.expiration_date) < currentDate) {
      await deleteInputFromTable({"uuid": data.uuid }, "uuid");
      httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "UUID has expired", detail: "UUID_HAS_EXPIRED"}); 
      return null;
    }
    const id = new_email.user_id;
    await deleteInputFromTable({"id": new_email.id}, "uuid");
    await updateInputsInTable({ email: new_email.detail }, "id", id, "users")
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Email confirmed", detail: "EMAIL_UPDATED" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { 
  update_email,
};
