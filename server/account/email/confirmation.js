const { validateUuid } = require('../../database/validators');
const { getUniqueFromTable, deleteInputFromTable, postUser } = require("../../database/dbQueries");
const { httpResponse } = require('../../utils');
const { StatusCodes } = require('http-status-codes');

const function_name = "CONFIRM_EMAIL";

async function confirm_email(req, res) {
  const uuid = req.body.uuid;

  if (!uuid) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "UUID is required.", detail: "EMAIL_NOT_VALIDATED" });
  }

  if (!validateUuid({ uuid: uuid })) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "UUID is invalid.", detail: "EMAIL_NOT_VALIDATED" });
  }

  const user = await getUniqueFromTable({"uuid": uuid}, "pending_users");

  if (!user) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "User doesn't exist.", detail: "EMAIL_NOT_VALIDATED" }); }

  try {
    const currentDate = new Date();

    if (new Date(user.expiration_date) < currentDate) {
      await deleteInputFromTable({"uuid": uuid}, "pending_users");
      return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "UUID has expired.", detail: "EMAIL_NOT_VALIDATED" });
    }

    await postUser({
      username: user.username,
      email: user.email,
      password: user.password,
      first_name: user.first_name,
      last_name: user.last_name,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      sexual_pref: user.sexual_pref,
      biography: user.biography
    });

    await deleteInputFromTable({"uuid": uuid }, "pending_users");
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Email confirmed", detail: "EMAIL_VALIDATED" });
  } catch (error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { 
  confirm_email,
};
