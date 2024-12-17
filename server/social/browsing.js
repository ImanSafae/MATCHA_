const { getMatchingProfiles, getDataByColumnName, getTagsName, getUniqueFromTable, getSuggestedUsers } = require('../database/dbQueries');
const { httpResponse } = require('../utils');

const { StatusCodes } = require('http-status-codes');

async function getUserParameters(userId) {

    const userProfile = await getDataByColumnName('id', userId, 'users');
    if (!userProfile) {
        throw new Error('User not found:', userId);
    }

    // récup l'orientation, la localisation, le fame rating, le genre et les centres d'intérêt
    return ({
        sexualPreference: userProfile.sexual_pref,
        location: userProfile.location,
        gender: userProfile.gender,
        interests: userProfile.interests
    });
}

function mapBrowsingParameters(userParams) {
    if (!userParams) {
        throw new Error('User parameters are missing');
    }

    const sexualPref = userParams.sexualPreference;
    const gender = userParams.gender;
    delete userParams.sexualPreference;
    delete userParams.gender;
    delete userParams.interests;

    switch (sexualPref) {
        case 'heterosexual':
            if (gender === 'man') {
                return { ...userParams, gender: 'woman' };
            }
            else {
                return { ...userParams, gender: 'man' };
            }
        case 'bisexual' :
            return { ...userParams, gender: 'both' };
        case 'homosexual':
            if (gender === 'man') {
                return { ...userParams, gender: 'man' };
            }
            else {
                return { ...userParams, gender: 'woman' };
            }
    }
}

async function get_browsing(req, res) {
    const function_name = "BROWSING";
    try {

        const sortingParameters = await getUserParameters(req.user.id);
        const browsingParameters = mapBrowsingParameters(sortingParameters);
        
        const firstProfilesSearch = await getMatchingProfiles(req.user.id, browsingParameters.gender, browsingParameters.location);

        // console.log("found matching profiles:", firstProfilesSearch);
        return httpResponse(res, function_name, StatusCodes.OK, { success: true, data: firstProfilesSearch });
    }
    catch (error) {
        // console.error("Error in get_browsing:", error);
        return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, detail: "INTERNAL_SERVER_ERROR" });
    }
}

async function get_users_according_to_gender_and_sexual_pref(req, res) {
    const function_name = "GET USERS GENDER / SEXUAL PREF";
    try {
        const users = await getSuggestedUsers(req.user.id);
        const me = await getUniqueFromTable({"id": req.user.id}, "users");
        const blockedUsers = me.blocked;
        let nonBlockedUsers;
        if (users) {
            nonBlockedUsers = users.filter(user => !blockedUsers.includes(user.id));
        } else {
            nonBlockedUsers = users;
        }
        const myTags = await getTagsName(req.user.id);
        return httpResponse(res, function_name, StatusCodes.OK, { success: true, myFameRating: me.fame_rating, myTags: myTags, users: nonBlockedUsers, msg: "Users found", detail: "USERS_FOUND" });
    }
    catch (error) {
        // console.error(`${function_name} Error: `, error);
        return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, detail: "INTERNAL_SERVER_ERROR" });
    }
}

module.exports = {
    get_browsing,
    get_users_according_to_gender_and_sexual_pref
};