const { addMatch, getDataByColumnName, removeMatch, addBlockedUser, removeBlockedUser, updateFameRating, getLikedIds, checkMatch } = require("../database/dbQueries");
const { EVENT_TYPES } = require("./types");

async function checkIfNewMatch(user_1, user_2) {
    const user_1_likes = await getLikedIds(user_1);
    const user_2_likes = await getLikedIds(user_2);

    if (user_1_likes.includes(Number(user_2)) && user_2_likes.includes(Number(user_1))) {
        if (await checkMatch(user_1, user_2)) {
            // console.log("Users are already marked as matched");
            return true;
        }
        await addMatch(user_1, user_2);
        const newFameRating_1 = await getNewFameRating(EVENT_TYPES.MATCH, user_1);
        const newFameRating_2 = await getNewFameRating(EVENT_TYPES.MATCH, user_2);
        return true;
    }
    return false;
}

async function checkIfNewUnmatch(unmatcher, unmatched) {
    // checks if an unmatch is needed after someone unlikes a profile
    try {
        if (!(await checkMatch(unmatcher, unmatched))) {
            // means that the users were not matched to begin with
            return false;
        }

        const user_1_likes = await getLikedIds(unmatcher);
        const user_2_likes = await getLikedIds(unmatched);
        // vérifier que les 2 ne se likent pas mutuellement (renvoyer erreur si c'est le cas)
        if (user_1_likes.includes(unmatched) && user_2_likes.includes(unmatcher)) {
            throw new Error('Users are still matched');
        }
        // si c'est le cas, les dématcher -> renvoyer true
        await removeMatch(unmatcher, unmatched);
        const newFameRating = await getNewFameRating(EVENT_TYPES.UNMATCH, unmatched);
        // TODI il sert a quoi ce new fame rating du coup ?
        return true;
    }
    catch (err) {
        throw err;
    }
}

async function blockProfile(blockerId, blockedId) {
    try {
        // checker que les deux users existent -> renvoyer erreur si non
        const blockerData = await getDataByColumnName('id', blockerId, 'users');
        const blockedData = await getDataByColumnName('id', blockedId, 'users');

        if (!blockerData) {
            throw new Error('User not found:', blockerId);
        }
        if (!blockedData) {
            throw new Error('User not found:', blockedId);
        }
        
        // checker que l'utilisateur n'est pas déjà bloqué -> renvoyer false si c'est le cas
        if (blockerData.blocked.includes(blockedId)) {
            return false;
        }

        // ajouter l'utilisateur bloqué à la liste des bloqués -> renvoyer true
        await addBlockedUser(blockerId, blockedId);
        const newFameRating = await getNewFameRating(EVENT_TYPES.BLOCK, blockedId);
        // console.log("new fame rating after blocking:", newFameRating);
        return true;
    }
    catch (err) {
        throw err;
    }
}

async function unblockProfile(unblockerId, unblockedId) {
    try {
        // checker que les deux users existent -> renvoyer erreur si non
        const unblockerData = await getDataByColumnName('id', unblockerId, 'users');
        const unblockedData = await getDataByColumnName('id', unblockedId, 'users');

        if (!unblockerData) {
            throw new Error('User not found:', unblockerId);
        }
        if (!unblockedData) {
            throw new Error('User not found:', unblockedId);
        }
        // checker que l'utilisateur est bloqué -> renvoyer false si ce n'est pas le cas
        if (!unblockerData.blocked.includes(unblockedId)) {
            return false;
        }
        // enlever l'utilisateur bloqué de la liste des bloqués -> renvoyer true
        await removeBlockedUser(unblockerId, unblockedId);
        return true;
    }
    catch (err) {
        throw err;
    }
}

async function checkBlock(actionner_id, other_user_id) {
    try {
        const actionner = await getDataByColumnName('id', actionner_id, 'users');
        const other_user = await getDataByColumnName('id', other_user_id, 'users');

        if (!actionner) {
            throw new Error('User not found:', actionner_id);
        }
        if (!other_user) {
            throw new Error('User not found:', other_user_id);
        }

        if (actionner.blocked.includes(other_user_id)) {
            // console.log("user 1's blocked list:", actionner.blocked);
            // console.log("user 2's blocked list:", other_user.blocked);
            return { success: false, message: `User ${actionner_id} has blocked user ${other_user_id}` };
        }
        if (other_user.blocked.includes(actionner_id)) {
            return { success: false, message: `User ${other_user_id} has blocked user ${actionner_id}` };
        }
        return { success: true };
    }
    catch (error) {
        throw error;
    }
}

function isUserConnected(userId) {
    return global.connectedUsers.has(userId);
  }

  function getUserSocketId(userId) {
    return global.connectedUsers.get(userId);
  }


async function getNewFameRating(eventType, userId) {
    try {
        let coefficient = 1;

        switch (eventType) {
            case EVENT_TYPES.VIEW:
                coefficient = 1.01;
                break;
            case EVENT_TYPES.LIKE:
                coefficient = 1.02;
                break;
            case EVENT_TYPES.MATCH:
                coefficient = 1.05;
                break;
            case EVENT_TYPES.UNLIKE:
                coefficient = 0.98;
                break;
            case EVENT_TYPES.UNMATCH:
                coefficient = 0.95;
                break;
            case EVENT_TYPES.REPORT:
                coefficient = 0.9;
                break;
            case EVENT_TYPES.BLOCK:
                coefficient = 0.93;
                break;
        }

        const newFameRating = await updateFameRating(userId, coefficient);
        return newFameRating;
    }
    catch (error) {
        throw error;
    }
}


module.exports = {
    checkIfNewMatch,
    checkIfNewUnmatch,
    blockProfile,
    unblockProfile,
    checkBlock,
    isUserConnected,
    getNewFameRating,
    getUserSocketId
}