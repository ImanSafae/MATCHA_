const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require('cookie');
const { sendEmailReportProfile } = require("../account/email/sendEmail");

const db = require("../database/database")
// const { checkUsername, checkEmail } = require("../account/register");
const { addNewMessageInConversation,
        getConversationContent,
        mapNewMessage, 
        isChatRequestValid,
        createNewConversation }
        = require("../chat/chat");
const { addNewNotification, addNewMessageNotification, mapNewNotification, getNotifications, handleReadNotif } = require("../social/notifications");
const { validateNewMessage } = require("../database/validators");
const { likeProfile, unlikeProfile, newActivityTimestamp } = require("../account/profile");
const { checkIfNewMatch,
      checkIfNewUnmatch,
      blockProfile,
      unblockProfile,
      checkBlock,
      isUserConnected,
      getUserSocketId }
      = require("../social/social");
const { checkUsername, checkEmail, register } = require("../account/register");
const { login } = require("../account/login");
const { forgotten_pwd } = require("../account/password/forgotten");
const { recover_pwd } = require("../account/password/recover");
const { EVENTS } = require("./events");
const { NOTIFICATION_TYPES } = require("../social/types");

const privateEvents = [EVENTS.CHAT_SEND_MSG, EVENTS.CHAT_GET_CONVERSATION, EVENTS.NOTIF_GET_LIST, EVENTS.LIKE_PROFILE, EVENTS.UNLIKE_PROFILE, EVENTS.REPORT_ACCOUNT_REQUEST, EVENTS.BLOCK_REQUEST, EVENTS.UNBLOCK_REQUEST, EVENTS.READ_NOTIF, EVENTS.NEW_VIEW];
// console.log("private events length:", privateEvents.length);

async function createSocket(httpServer) {

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.DOMAIN + ":" + process.env.CLIENT_PORT,
      credentials: true,
    },
  });

  function checkToken(socket, next) {
    const token = socket.handshake.auth.token;
  
    if (!token) {
      // console.log('[SOCKET] no token provided');
      return next(new Error("Authentication error"));
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        // console.log('[SOCKET] Invalid JWT');
        return next(new Error("Authentication error"));
      }
      socket.user = decodedToken;
      global.connectedUsers.set(decodedToken.id, socket.id);
      // console.log("[SOCKET] Adding to connected users:", decodedToken.id, socket.id);
      next();
    });
  }

  io.on("connection", (socket) => {
    const userId = socket.user ? socket.user.id : null;
    // console.log("DANS LE BACK socket = ", socket.id)

    socket.on("USERNAME_CHECK", async (data) => {
      await checkUsername(socket, data);
    });
    
    socket.on("EMAIL_CHECK", async (data) => {
      await checkEmail(socket, data);
    });
    
    socket.on("REGISTER", async (data) => {
      await register(socket, data);
      global.connectedUsers.set(data.username, socket.id)
    });

    socket.on("CONFIRM_EMAIL", async (data) => {
      await confirm_email(socket, data);
    })

    socket.on("LOGIN", async (data) => {
      await login(socket, data);
      global.connectedUsers.set(data.username, socket.id)
    })

    socket.on("FORGOTTEN_PWD", async (data) => {
      await forgotten_pwd(socket, data);
    })

    socket.on("RECOVER_PWD", async (data) => {
      await recover_pwd(socket, data);
    })

    if (userId) {
      if (global.connectedUsers.has(userId)) {
          const oldSocketId = global.connectedUsers.get(userId);
          if (oldSocketId && oldSocketId !== socket.id) {
              const oldSocket = io.sockets.sockets.get(oldSocketId);
              if (oldSocket) {
                  oldSocket.disconnect(true);
                  // console.log(`Replaced old socket ${oldSocketId} for user ${userId}`);
              }
          }
      }
      global.connectedUsers.set(userId, socket.id);
      // console.log(`[SOCKET] Adding to connected users: ${userId} ${socket.id}`);
    }

    socket.use((packet, next) => {

      if (privateEvents.includes(packet[0])) {
        checkToken(socket, next);
      } else {
        next();
      }
    });

    socket.on("disconnect", () => {
      if (socket.user && global.connectedUsers.has(socket.user.id)) {
        const currentSocketId = global.connectedUsers.get(socket.user.id);
        if (currentSocketId === socket.id) {
            newActivityTimestamp(socket.user.id);
            global.connectedUsers.delete(socket.user.id);
            // console.log(`Removed user ${socket.user.id} from connected users`);
        }
      } else {
          // console.log(`Socket ${socket.id} not found in connected users.`);
      }
    });

    const handlePrivateEvent = (event, handler) => {
      socket.on(event, async (data) => {
        if (!socket.user) {
          // console.log("No socket user")
          socket.emit(EVENTS.ERROR, { message: "Authentication required" });
          return;
        }
        handler(data);
      });
    };
    
    async function sendNotif(userId, notifArray, message) {
      // console.log("sending notif");
      const blocked = await checkBlock(socket.user.id, userId);
      if (!blocked.success) {
        // console.log("User is blocked ; can't send notif");
        return ;
      }
      if (!isUserConnected(userId)) {
        // console.log("User not connected ; can't send notif");
        return ;
      }
      for (let [id, socketId] of global.connectedUsers) {
        if (id === userId) {
          for (let notif of notifArray) {
            io.to(socketId).emit(EVENTS.NEW_NOTIF, notif);
          }
          if (message) {
            io.to(socketId).emit(EVENTS.CHAT_NEW_MSG, message);
          }
          break ;
        }
      }
    }

    // console.log("New connection from " + socket.id);

    handlePrivateEvent(EVENTS.CHAT_SEND_MSG, async (data) => {
      // console.log("NEW MSG EVENT TRIGGERED FROM SOCKET", socket.id);
      try {
      if (!validateNewMessage(data)) {
        socket.emit(EVENTS.ERROR, { message: "Invalid data format."});
        return ;
      }
      const chatRequestValidity = await isChatRequestValid(socket.user.id, data.to.id);
      if (!chatRequestValidity.success) {
        socket.emit(EVENTS.ERROR, { message: chatRequestValidity.error});
        return ;
      }
      if (!data.conversationId) {
        const conversationId = await createNewConversation(socket.user.id, data.to.id);
        socket.emit(EVENTS.CHAT_NEW_CONVERSATION, { conversationId: conversationId, user_1: socket.user, user_2: data.to, otherUser: data.to });
        const otherSocketId = getUserSocketId(data.to.id);
        if (otherSocketId) {
          io.to(otherSocketId).emit(EVENTS.CHAT_NEW_CONVERSATION, { conversationId: conversationId, user_1: data.to, user_2: socket.user, otherUser: data.to });
        }

      }
        const messageResult = await addNewMessageInConversation(socket.user.id, data);
        if (!messageResult.success) {
          socket.emit(EVENTS.ERROR, { message: messageResult.error });
          return ;
        }
        
        const notifResult = await addNewMessageNotification(data.to.id, socket.user.id, data.timestamp);
        if (!notifResult.success) {
          socket.emit(EVENTS.ERROR, { message: notifResult.error });
          return ;
        }

        const newNotif = mapNewNotification(notifResult.data, socket.user, NOTIFICATION_TYPES.NEW_MESSAGE, data.timestamp);
        // // console.log("new notification object sending:", newNotif);

        const newMessage = mapNewMessage(messageResult.conversationId, socket.user, data.timestamp, data.content);
        // // console.log("new message object sending:", newMessage);

        await sendNotif(data.to.id, [newNotif], newMessage);
        socket.emit(EVENTS.CHAT_MESSAGE_SENT, { message: "Message sent successfully.", data: newMessage });

      }
      catch (error) {
        // console.error("Error sending message:", error);
        socket.emit(EVENTS.ERROR, { message: error });
      }
    });



    handlePrivateEvent(EVENTS.CHAT_GET_CONVERSATION, async (data) => {
      // console.log("get conversation event");
      // console.log("received data:", data);
      const result = await getConversationContent(socket.user.id, data.conversationId);

      if (!result.success) {
        socket.emit(EVENTS.ERROR, { message: result.error });
        return ;
      }
      // console.log("sending full conversation");
      socket.emit(EVENTS.CHAT_FULL_CONVERSATION, { content: result.data });
    });


    handlePrivateEvent(EVENTS.NOTIF_GET_LIST, async () => {

      const result = await getNotifications(socket.user.id);

      if (!result.success) {
        socket.emit(EVENTS.ERROR, { message: result.error });
        return ;
      }

      socket.emit(EVENTS.NOTIF_LIST, { data: result.data });
    });


    handlePrivateEvent(EVENTS.LIKE_PROFILE, async (data) => {
      // console.log("like profile event");
      // console.log("received data:", data);

      const result = await likeProfile(socket.user.id, data.liked_user.id, data.timestamp);
      if (!result.success) {
        socket.emit(EVENTS.ERROR, { message: result.error });
        return ;
      }
      socket.emit(EVENTS.LIKE_SUCCESS, { message: result.msg, data: data.liked_user });

      const blocked = await checkBlock(socket.user.id, data.liked_user.id);
      if (!blocked.success) {
        // console.log("Couldn't send notification to liked user." );
        return ;
      }
      // add notification for like to db
      const notifResult = await addNewNotification(data.liked_user.id, socket.user.id, NOTIFICATION_TYPES.NEW_LIKE, data.timestamp);
      if (!notifResult.success) {
        socket.emit(EVENTS.ERROR, { message: notifResult.error });
        // return ;
      }
      // send notification for like
      const newNotif = mapNewNotification(notifResult.data, socket.user, NOTIFICATION_TYPES.NEW_LIKE, data.timestamp);

      // check if match is needed and send match notification if yes
      const matched = await checkIfNewMatch(socket.user.id, data.liked_user.id);
      let matchNotifResult = null;
      let matchNotifResult_2 = null;
      if (matched) {
        matchNotifResult = await addNewNotification(data.liked_user.id, socket.user.id, NOTIFICATION_TYPES.NEW_MATCH, data.timestamp);
        matchNotifResult_2 = await addNewNotification(socket.user.id, data.liked_user.id, NOTIFICATION_TYPES.NEW_MATCH, data.timestamp);
        if (!matchNotifResult.success) {
          socket.emit(EVENTS.ERROR, { message: matchNotifResult.error });
          // return ;
        }
        if (!matchNotifResult_2.success) {
          socket.emit(EVENTS.ERROR, { message: matchNotifResult_2.error });
        }
      }

      const notifArray = [newNotif];

      if (matched) {
        const matchNotif = mapNewNotification(matchNotifResult.data, socket.user, NOTIFICATION_TYPES.NEW_MATCH, data.timestamp);
        const matchNotif_2 = mapNewNotification(matchNotifResult_2.data, data.liked_user, NOTIFICATION_TYPES.NEW_MATCH, data.timestamp);
        notifArray.push(matchNotif);
        socket.emit(EVENTS.MATCH, { data: data.liked_user.id });
        await sendNotif(socket.user.id, [matchNotif_2]);
      }
      await sendNotif(data.liked_user.id, notifArray);
    });

    handlePrivateEvent(EVENTS.UNLIKE_PROFILE, async (data) => {
      try {
        // console.log("unlike profile event");
        // console.log("received data:", data);
        
        // remove like from profile
        const result = await unlikeProfile(socket.user.id, data.unliked_user.id);
        if (!result.success) {
          socket.emit(EVENTS.ERROR, { message: result.error });
          return ;
        }
        socket.emit(EVENTS.UNLIKE_SUCCESS, { message: result.msg, data: data.unliked_user });
        
        // check block
        const blocked = await checkBlock(socket.user.id, data.unliked_user.id);
        if (!blocked.success) {
          // console.log("Couldn't send notification to unliked user." );
          return ;
        }

        // add notification
        const notifResult = await addNewNotification(data.unliked_user.id, socket.user.id, NOTIFICATION_TYPES.UNLIKE, data.timestamp);
        if (!notifResult.success) {
          socket.emit(EVENTS.ERROR, { message: notifResult.error });
          return ;
        }

        // check if unmatch is needed
        await checkIfNewUnmatch(socket.user.id, data.unliked_user.id);

        // send notification
        const newNotif = mapNewNotification(notifResult.data, socket.user, NOTIFICATION_TYPES.UNLIKE, data.timestamp);
        await sendNotif(data.unliked_user.id, [newNotif]);
    }
    catch (error) {
      // console.error("Error unliking profile:", error);
      socket.emit(EVENTS.ERROR, { message: error });
    }
  });

  handlePrivateEvent(EVENTS.REPORT_ACCOUNT_REQUEST, async (data) => {
    // console.log("report account event");
    try {
      const reporterId = socket.user.id;
      const reportedId = data.user.id;
      sendEmailReportProfile(reporterId, reportedId);
    } catch (error) {
      // console.error("Error reporting user:", error);
      socket.emit(EVENTS.ERROR, { message: error });
    }
  })


  handlePrivateEvent(EVENTS.BLOCK_REQUEST, async (data) => {
    // console.log("block request event");

    try {
      const blockerId = socket.user.id;
      // console.log("bloker = ", blockerId);
      const blockedId = data.user.id;
      // console.log("bloqué = ", blockedId);
      const success = await blockProfile(blockerId, blockedId);
      
      if (!success) {
        socket.emit(EVENTS.ERROR, { message: "Error blocking user." });
        return ;
      }
      socket.emit(EVENTS.BLOCK_SUCCESS, { message: "User blocked successfully.", data: data.user });
    }
      catch (error) {
        // console.error("Error blocking user:", error);
        socket.emit(EVENTS.ERROR, { message: error });
      }
  });

  handlePrivateEvent(EVENTS.UNBLOCK_REQUEST, async (data) => {
    // console.log("unblock request event");
    // console.log("received data:", data);
    try {
      const unblockerId = socket.user.id;
      const unblockedId = data.user.id;
      const success = await unblockProfile(unblockerId, unblockedId);
      
      if (!success) {
        // console.log("User not blocked.");
        socket.emit(EVENTS.ERROR, { message: "Error unblocking user." });
        return ;
      }
      socket.emit(EVENTS.UNBLOCK_SUCCESS, { message: "User unblocked successfully.", data: data.user });
    }
    catch (error) {
      socket.emit(EVENTS.ERROR, { message: error });
    }
  });

    handlePrivateEvent(EVENTS.READ_NOTIF, (data) => {
      // console.log("read notif event");
      // console.log("received data:", data);

      const readResult = handleReadNotif(data, socket.user.id)
      .then((result) => {
        if (result.success) {
          socket.emit(EVENTS.NOTIF_READ_SUCCESS, { message: "Notification read successfully.", data: data });
          return ;
        }
        socket.emit(EVENTS.ERROR, { message: result.error });
      })
      .catch((error) => {
        socket.emit(EVENTS.ERROR, { message: error });
      });
    })


  handlePrivateEvent(EVENTS.NEW_VIEW, async (data) => {
    // console.log("new view event, received data:", data);
    if (!data.viewed) {
      // console.log("missing viewed field");
      socket.emit(EVENTS.ERROR, { message: "Invalid data format."});
      return ;
    }

    const timestamp = data.timestamp ? data.timestamp : new Date();
    const viewNotifResult = await addNewNotification(data.viewed.id, socket.user.id, NOTIFICATION_TYPES.NEW_VIEW, timestamp);
    if (!viewNotifResult.success) {
      // console.log("couldn't create notif in db");
      socket.emit(EVENTS.ERROR, { message: viewNotifResult.error });
      return ;
    }
    if (!isUserConnected(data.viewed.id)) {
      // console.log("User not connected ; can't send notif");
      return ;
    }
    const newNotif = mapNewNotification(viewNotifResult.data, socket.user, NOTIFICATION_TYPES.NEW_VIEW, timestamp);
    await sendNotif(data.viewed.id, [newNotif]);
  });

  });
}

module.exports = {
  createSocket
};
