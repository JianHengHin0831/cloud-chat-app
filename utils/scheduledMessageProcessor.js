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

export const processScheduledMessages = async () => {
  try {
    // Get all chatrooms
    const chatroomsRef = dbRef(db, "chatrooms");
    const chatroomsSnapshot = await get(chatroomsRef);

    if (!chatroomsSnapshot.exists()) return;

    const now = Date.now();
    const promises = [];

    chatroomsSnapshot.forEach((chatroomSnapshot) => {
      const chatroomId = chatroomSnapshot.key;

      // Process this chatroom's scheduled messages
      promises.push(processRoomScheduledMessages(chatroomId, now));
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error processing scheduled messages:", error);
  }
};

const processRoomScheduledMessages = async (chatroomId, now) => {
  try {
    // Get scheduled messages that are due
    const scheduledMessagesRef = dbRef(
      db,
      `chatrooms/${chatroomId}/scheduledMessages`
    );
    const dueMessagesQuery = query(
      scheduledMessagesRef,
      orderByChild("scheduledFor"),
      startAt(1), // Ensure we get valid timestamps
      endAt(now) // Get messages scheduled up to now
    );

    const dueMessagesSnapshot = await get(dueMessagesQuery);

    if (!dueMessagesSnapshot.exists()) return;

    const promises = [];

    dueMessagesSnapshot.forEach((messageSnapshot) => {
      const messageId = messageSnapshot.key;
      const messageData = messageSnapshot.val();

      // Process files first if any
      if (messageData.files && messageData.files.length > 0) {
        messageData.files.forEach((fileUrl) => {
          const fileMessageRef = push(
            dbRef(db, `chatrooms/${chatroomId}/messages`)
          );
          const fileMessage = {
            messageContent: fileUrl,
            messageType: "file",
            senderId: messageData.senderId,
            createdAt: messageData.scheduledFor - 1000, // Slightly earlier than text
          };
          promises.push(set(fileMessageRef, fileMessage));
        });
      }

      // Create a regular message for the text content (if not empty)
      if (messageData.messageContent.trim() !== "") {
        const newMessageRef = dbRef(
          db,
          `chatrooms/${chatroomId}/messages/${messageId}`
        );
        const newMessage = {
          messageContent: messageData.messageContent,
          messageType: messageData.messageType,
          senderId: messageData.senderId,
          createdAt: messageData.scheduledFor, // Use the scheduled time
        };

        // Add the message
        promises.push(set(newMessageRef, newMessage));
      }

      // Remove from scheduled
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
