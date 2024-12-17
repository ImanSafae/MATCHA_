const db = require("./../database/database");
const { httpResponse } = require('../utils');
const { StatusCodes } = require('http-status-codes');


async function get_nearby(req, res) {
    const function_name = "GET_NEARBY"
    try {
      const { lat, lon, km } = req.query; 
      if (!lat || !lon || !km) { return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Missing parameter", detail: "MISSING_PARAMETER" });  }
      const radius = parseFloat(km) * 1000;
      const query = `
        SELECT id, username, ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
        FROM users
        WHERE id != $4  -- Exclude the current user
        AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        ORDER BY distance;
      `;
    const values = [lon, lat, radius, req.user.id];
      const { rows } = await db.query(query, values);
      // console.log(rows);
      if (rows.length > 0) {
        return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "Users found", detail: "USERS_FOUND", users: rows });
      }
      return httpResponse(res, function_name, StatusCodes.OK, { success: true, msg: "No user found", detail: "USER_NOT_FOUND", users: rows });
    } catch (error) {
      // console.error('Error fetching nearby users:', error);
      return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Error: ", error: error, detail: "INTERNAL_SERVER_ERROR" });
    }
  }

  module.exports = { 
    get_nearby
  }; 