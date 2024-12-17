const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');

const function_name = "HOME";

async function home(req, res) {
  try {
    user = req.user;
    // console.log(user)
    return httpResponse(res, function_name, StatusCodes.OK, { success: true, user: user, msg: "Home ok", detail: "HOME_OK" });
  } catch(error) {
    return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, msg: "Error: ", detail: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { 
    home,
  };  