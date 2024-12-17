const { StatusCodes } = require('http-status-codes');

const { getUserIdByUsername, 
    addNotification,
    newMessageInConversation,
    getConversationIdByUserIds,
    createConversation,
    getConversationsSummariesByUserId,
    getUsernameByUserId,
    getConversationContentById } = require("../database/dbQueries");
const { httpResponse } = require("../utils");
const { checkIfNewMatch, checkBlock } = require("../social/social");

async function createNewConversation(senderId, recipientId) {
    let conversationId = await getConversationIdByUserIds(senderId, recipientId);
    if (!conversationId) {
        conversationId = await createConversation(senderId, recipientId);
    }
    return conversationId;
}

// Ajouter un message à la conversation entre 2 users
async function addNewMessageInConversation(senderId, messageObject) {

    const recipientId = await getUserIdByUsername(messageObject.to.username);

    if (!senderId) {
        return { success: false, error: `Sender user '${sender}' does not exist.` };
    }
    if (!recipientId || recipientId != messageObject.to.id) {
        return { success: false, error: `Recipient user '${messageObject.to}' does not exist.` };
    }

    const newMessage = {
        sender: senderId,
        content: messageObject.content,
        timestamp: messageObject.timestamp
    };
    
    let conversationId = await getConversationIdByUserIds(senderId, recipientId);
    // console.log("conversationId found:", conversationId);
    // PAS SENSEE ETRE CREEE LA 
    // if (!conversationId) {
    //     // console.log("No conversation between these users ; creating a new one");
    //     conversationId = await createConversation(senderId, recipientId, newMessage);
    //     // console.log("New conversation created with id:", conversationId);
    // }
    await newMessageInConversation(conversationId, newMessage);
    return { success: true, conversationId: conversationId };
}

async function get_chat_summary(req, res) {
    const function_name = "GET_CHAT_SUMMARY";
    try {
        // récupérer les conversations de l'utilisateur avec une db query qui inclut l'id, le username et le dernier message
        const result = await getConversationsSummariesByUserId(req.user.id);
        for (let conversation of result) {
            let user_1;
            let user_2;
            if (conversation.user_1 === req.user.id) {
                user_1 = { id: req.user.id, username: req.user.username };
                user_2 = { id: conversation.user_2, username: await getUsernameByUserId(conversation.user_2) };
            }
            else {
                user_1 = { id: conversation.user_1, username: await getUsernameByUserId(conversation.user_1) };
                user_2 = { id: req.user.id, username: req.user.username };
            }
            // const username_1 = await getUsernameByUserId(result[0].user_1);
            // const username_2 = await getUsernameByUserId(result[0].user_2);
            // const user_1 = {
            //     id: result[0].user_1,
            //     username: username_1
            // };
            // const user_2 = {
            //     id: result[0].user_2,
            //     username: username_2
            // };

            conversation.user_1 = user_1;
            conversation.user_2 = user_2;
            // // console.log("result:", result);
        }
        
        return httpResponse(res, function_name, StatusCodes.OK, { success: true, data: result }); 
    }
    catch (error) {
        return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: error, detail: "INTERNAL_SERVER_ERROR" });
    }
}

async function getConversationContent(userId, conversationId) {
    // récupérer les messages de la conversation
    // console.log("conversationId =", conversationId)
    const result = await getConversationContentById(conversationId);
    if (!result) {
        return { success: false, error: "Conversation not found." };
    }

    // -> comparer les id des users de la conversation avec l'id de l'utilisateur
    // -> si l'utilisateur n'est pas un des users, renvoyer une erreur
    if (result.user_1 !== userId && result.user_2 !== userId) {
        return { success: false, error: "User not authorized to access this conversation." };
    }

    // -> si l'utilisateur est un des users, renvoyer les messages
    return { success: true, data: result };
}

function mapNewMessage(conversationId, sender, timestamp, content) {
    return {
        content: content,
        conversationId: conversationId,
        sender: sender,
        timestamp: timestamp
    };
}

async function isChatRequestValid(senderId, recipientId) {
    // vérifier que les users sont matchés et non bloqués
    // -> si non, renvoyer une erreur
    if (!senderId || !recipientId) {
        return { success: false, error: "Missing sender or recipient id." };
    }
    const areMatched = await checkIfNewMatch(senderId, recipientId);
    if (!areMatched) {
        return { success: false, error: `Users ${senderId} and ${recipientId} are not matched.` };
    }
    const areBloked = await checkBlock(senderId, recipientId);
    if (!areBloked.success) {
        return { success: false, error: `Couldn't send message to user ${recipientId}` };
    }
    return { success: true };
}

// async function handle_conversation_request(req, res) {
//     // vérifier si une conversation existe entre les 2 users
//     // -> si oui, la renvoyer
//     // -> si non, vérifier que les users sont matchés et non bloqués, la créer et la renvoyer

//     const function_name = "HANDLE_CONVERSATION_REQUEST";

//     const senderId = req.user.id;
//     const recipientId = req.body.to;
//     const recipientUsername = await getUsernameByUserId(recipientId);
//     if (!recipientUsername) {
//         return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: `User '${recipientId}' does not exist.` });
//     }

//     const conversationId = await getConversationIdByUserIds(senderId, recipientId);
//     if (!conversationId) {
//         // vérifier que les users sont matchés et non bloqués

//         // match check
//         if (!checkMatch(senderId, recipientId)) {
//             return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: `Users '${senderId}' and '${recipientId}' are not matched.` });
//         }

//         // créer la conversation
//         const newConversation = await createConversation(senderId, recipientId);
//     }
//     else {
//         const conversationContent = await getConversationContentById(conversationId);
//         if (conversationContent.success) {
//             const returnData = {
//                 conversation: conversationContent,
//                 username: recipientUsername
//             };
//             return httpResponse(res, function_name, StatusCodes.OK, { success: true, data: returnData });
//         }
//         else {
//             return httpResponse(res, function_name, StatusCodes.OK, { success: false, error: conversationContent.error });
//         }
//     }
// }

module.exports = {
    addNewMessageInConversation,
    getConversationContent,
    mapNewMessage,
    get_chat_summary,
    isChatRequestValid,
    createNewConversation
    // handle_conversation_request
};
