import { ref } from "vue";

// store local temporary messages
const pendingMessages = ref(new Map());
const pendingFiles = ref(new Map());

export const useOptimisticUpdates = () => {
  // generate temporary id
  const generateTempId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // optimistic update for sending message
  const optimisticSendMessage = (groupId: string, messageData: any) => {
    const tempId = generateTempId();
    const optimisticMessage = {
      id: tempId,
      ...messageData,
      status: "pending",
      createdAt: Date.now(),
      isPending: true,
    };

    pendingMessages.value.set(tempId, optimisticMessage);

    return {
      tempId,
      optimisticMessage,
    };
  };

  // confirm message sent successfully
  const confirmMessageSent = (tempId: string, serverMessage: any) => {
    pendingMessages.value.delete(tempId);
    return serverMessage;
  };

  // mark message as failed
  const markMessageFailed = (tempId: string) => {
    const message = pendingMessages.value.get(tempId);
    if (message) {
      message.status = "failed";
      pendingMessages.value.set(tempId, message);
    }
  };

  // optimistic update for file upload
  const optimisticFileUpload = (
    groupId: string,
    file: File,
    messageData: any
  ) => {
    const tempId = generateTempId();
    const optimisticFile = {
      id: tempId,
      ...messageData,
      file,
      status: "uploading",
      progress: 0,
      isPending: true,
      createdAt: Date.now(),
    };

    pendingFiles.value.set(tempId, optimisticFile);

    return {
      tempId,
      optimisticFile,
    };
  };

  // update file upload progress
  const updateFileProgress = (tempId: string, progress: number) => {
    const file = pendingFiles.value.get(tempId);
    if (file) {
      file.progress = progress;
      pendingFiles.value.set(tempId, file);
    }
  };

  // confirm file upload success
  const confirmFileUploaded = (tempId: string, serverMessage: any) => {
    pendingFiles.value.delete(tempId);
    return serverMessage;
  };

  // mark file upload as failed
  const markFileUploadFailed = (tempId: string) => {
    const file = pendingFiles.value.get(tempId);
    if (file) {
      file.status = "failed";
      pendingFiles.value.set(tempId, file);
    }
  };

  // get all pending messages and files
  const getPendingItems = (groupId: string) => {
    const messages = Array.from(pendingMessages.value.values()).filter(
      (msg) => msg.groupId === groupId
    );
    const files = Array.from(pendingFiles.value.values()).filter(
      (file) => file.groupId === groupId
    );
    return [...messages, ...files];
  };

  return {
    optimisticSendMessage,
    confirmMessageSent,
    markMessageFailed,
    optimisticFileUpload,
    updateFileProgress,
    confirmFileUploaded,
    markFileUploadFailed,
    getPendingItems,
    pendingMessages,
    pendingFiles,
  };
};
