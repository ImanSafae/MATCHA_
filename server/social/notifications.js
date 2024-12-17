const { getUserIdByUsername, getAllDataByColumnName, getUsernameByUserId, markNotificationAsRead, getUniqueFromTable } = require("../database/dbQueries");
const { addNotification } = require("../database/dbQueries");
const { NOTIFICATION_TYPES, NOTIFICATION_MESSAGES } = require("./types");


async function addNewNotification(userId, senderId, type, timestamp) {
    try {
        const result = await addNotification(userId, type, senderId, timestamp);
        return { success: true, data: result };
    }
    catch (error) {
        // console.error("Error adding new notification:", error);
        return { success: false, error: error };
    }
}

// Ajouter une notification de nouveau message
async function addNewMessageNotification(userId, senderId, timestamp) {

    try {
        const result = await addNotification(userId, NOTIFICATION_TYPES.NEW_MESSAGE, senderId, timestamp);
        return { success: true, data: result };
    }
    catch (error) {
        return { success: false, error: error };
    }
}

function mapNewNotification(queryResult, sender, type, timestamp) {
    if (!queryResult || !queryResult.id) {
        // console.error("queryResult:", queryResult)
        throw new Error("Invalid query result");
    }
    if (!NOTIFICATION_MESSAGES[type] || !NOTIFICATION_TYPES[type]) {
        // console.error("type:", type);
        throw new Error("Invalid notification type");
    }
    if (!sender || !sender.id || !sender.username) {
        throw new Error("Invalid sender object");
    }

    const newNotif =  {
        id: queryResult.id,
        sender: sender,
        type: NOTIFICATION_TYPES[type],
        message: NOTIFICATION_MESSAGES[type],
        timestamp: timestamp,
        read: false
    };

    // // console.log("new notification object created:", newNotif);
    return newNotif;
}

async function getNotifications(userId) {
    try {
        const notifList = await getAllDataByColumnName('user_id', userId, 'notifications');
        if (notifList) {
            // // console.log("notifList:", notifList);
            for (let notif of notifList) {
                const notifType = notif.type;
                const username = await getUsernameByUserId(notif.sender_id);
                const sender = {
                    id: notif.sender_id,
                    username: username
                };
                notif.message = NOTIFICATION_MESSAGES[notifType];
                notif.sender = sender;
                delete notif.sender_id;
            }
        }

        return { success: true, data: notifList };
    }
    catch (error) {
        // console.error("Error getting notifications:", error);
        return { success: false, error: error };
    }
}

async function handleReadNotif(notifId, userId) {
    try {
        // console.log("notifId:", notifId);
        // console.log("userId:", userId);
        const notif = await getUniqueFromTable({id: notifId}, 'notifications');
        if (!notif) {
            return { success: false, error: "Notification not found" };
        }
        if (notif.user_id !== userId) {
            return { success: false, error: "User not authorized to read this notification" };
        }
        await markNotificationAsRead(notifId);
        return { success: true };
    }
    catch (error) {
        // console.error("Error marking notification as read:", error);
        return { success: false, error: error };
    }
}

module.exports = {
    addNewNotification,
    addNewMessageNotification,
    mapNewNotification,
    getNotifications,
    handleReadNotif
}