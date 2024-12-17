const { StatusCodes } = require('http-status-codes');

const { httpResponse } = require('../utils');
const { getAllTagNames } = require('../database/dbQueries');

async function get_tags(req, res) {
    const function_name = "GET_TAGS";
    try {
        const tags = await getAllTagNames();
        // // console.log("TAGS = ", tags);
        return httpResponse(res, function_name, StatusCodes.OK, { data: tags });
    } catch (error) {
        // console.error(function_name, error);
        return httpResponse(res, function_name, StatusCodes.OK, { success: false, msg: "Internal server error", error });
    }
}

module.exports = { get_tags };