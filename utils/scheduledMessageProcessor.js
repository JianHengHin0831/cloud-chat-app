import {
  ref as dbRef,
  get,
  set,
  remove,
  query,
  orderByChild,
  startAt,
  endAt,
  push,
} from "firebase/database";
import { db } from "~/firebase/firebase.js";

// process all scheduled messages
export const processScheduledMessages = async () => {
  try {
    const chatroomsRef = dbRef(db, "chatrooms");
    const chatroomsSnapshot = await get(chatroomsRef);

    if (!chatroomsSnapshot.exists()) return;

    const now = Date.now();
    const promises = [];

    chatroomsSnapshot.forEach((chatroomSnapshot) => {
      const chatroomId = chatroomSnapshot.key;
      promises.push(processRoomScheduledMessages(chatroomId, now));
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error processing scheduled messages:", error);
  }
};

// process scheduled messages for a specific chatroom
const processRoomScheduledMessages = async (chatroomId, now) => {
  try {
    const scheduledMessagesRef = dbRef(
      db,
      `chatrooms/${chatroomId}/scheduledMessages`
    );
    const dueMessagesQuery = query(
      scheduledMessagesRef,
      orderByChild("scheduledFor"),
      startAt(1),
      endAt(now)
    );

    const dueMessagesSnapshot = await get(dueMessagesQuery);

    if (!dueMessagesSnapshot.exists()) return;

    const promises = [];

    dueMessagesSnapshot.forEach((messageSnapshot) => {
      const messageId = messageSnapshot.key;
      const messageData = messageSnapshot.val();

      if (messageData.files && messageData.files.length > 0) {
        messageData.files.forEach((fileUrl) => {
          const fileMessageRef = push(
            dbRef(db, `chatrooms/${chatroomId}/messages`)
          );
          const fileMessage = {
            messageContent: fileUrl,
            messageType: "file",
            senderId: messageData.senderId,
            createdAt: messageData.scheduledFor - 1000,
          };
          promises.push(set(fileMessageRef, fileMessage));
        });
      }

      if (messageData.messageContent.trim() !== "") {
        const newMessageRef = dbRef(
          db,
          `chatrooms/${chatroomId}/messages/${messageId}`
        );
        const newMessage = {
          messageContent: messageData.messageContent,
          messageType: messageData.messageType,
          senderId: messageData.senderId,
          createdAt: messageData.scheduledFor,
        };

        promises.push(set(newMessageRef, newMessage));
      }

      promises.push(
        remove(
          dbRef(db, `chatrooms/${chatroomId}/scheduledMessages/${messageId}`)
        )
      );
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(
      `Error processing scheduled messages for room ${chatroomId}:`,
      error
    );
  }
};
