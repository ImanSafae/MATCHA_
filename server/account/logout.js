const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');

const function_name = "LOGOUT";

function logout(req, res) {
  try {
    httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Logout successful", detail: "LOGOUT_SUCCESS" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
  }

};

module.exports = { 
  logout,
};