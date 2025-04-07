import { ref } from "vue";

// 存储本地临时消息的 Map
const pendingMessages = ref(new Map());
const pendingFiles = ref(new Map());

export const useOptimisticUpdates = () => {
  // 生成临时ID
  const generateTempId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 乐观更新发送消息
  const optimisticSendMessage = (groupId: string, messageData: any) => {
    const tempId = generateTempId();
    const optimisticMessage = {
      id: tempId,
      ...messageData,
      status: "pending", // 用于UI显示发送状态
      createdAt: Date.now(),
      isPending: true,
    };

    // 存储到临时Map
    pendingMessages.value.set(tempId, optimisticMessage);

    return {
      tempId,
      optimisticMessage,
    };
  };

  // 确认消息发送成功
  const confirmMessageSent = (tempId: string, serverMessage: any) => {
    pendingMessages.value.delete(tempId);
    return serverMessage;
  };

  // 标记消息发送失败
  const markMessageFailed = (tempId: string) => {
    const message = pendingMessages.value.get(tempId);
    if (message) {
      message.status = "failed";
      pendingMessages.value.set(tempId, message);
    }
  };

  // 乐观更新文件上传
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

  // 更新文件上传进度
  const updateFileProgress = (tempId: string, progress: number) => {
    const file = pendingFiles.value.get(tempId);
    if (file) {
      file.progress = progress;
      pendingFiles.value.set(tempId, file);
    }
  };

  // 确认文件上传成功
  const confirmFileUploaded = (tempId: string, serverMessage: any) => {
    pendingFiles.value.delete(tempId);
    return serverMessage;
  };

  // 标记文件上传失败
  const markFileUploadFailed = (tempId: string) => {
    const file = pendingFiles.value.get(tempId);
    if (file) {
      file.status = "failed";
      pendingFiles.value.set(tempId, file);
    }
  };

  // 获取所有待处理的消息和文件
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
