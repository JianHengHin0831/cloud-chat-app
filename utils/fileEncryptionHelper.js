// 辅助函数：根据文件名获取MIME类型
import { auth } from "~/firebase/firebase.js";
import { fetchAndDecryptFile } from "~/services/chatroom-service";

export const getMimeType = (fileType) => {
  const mimeTypes = {
    image: "image/*",
    video: "video/*",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    code: "text/plain",
    text: "text/plain",
    file: "application/octet-stream",
  };

  return mimeTypes[fileType] || "application/octet-stream";
};

// 添加 getFileType 函数，根据文件名获取文件类型
export const getFileType = (fileName) => {
  if (!fileName) return "file";

  // 获取文件扩展名
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // 图片类型
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return "image";
  }

  // 视频类型
  if (["mp4", "webm", "avi", "mov", "flv", "mkv"].includes(extension)) {
    return "video";
  }

  // 文档类型
  if (["pdf"].includes(extension)) {
    return "pdf";
  }

  if (["doc", "docx"].includes(extension)) {
    return "doc";
  }

  if (["xls", "xlsx"].includes(extension)) {
    return "xls";
  }

  if (["ppt", "pptx"].includes(extension)) {
    return "ppt";
  }

  // 代码文件类型
  if (
    ["js", "ts", "java", "py", "cpp", "c", "html", "css", "json"].includes(
      extension
    )
  ) {
    return "code";
  }

  // 文本文件类型
  if (["txt", "md", "rtf"].includes(extension)) {
    return "text";
  }

  // 其他文件类型
  return "file";
};

export const getDecryptUrl = async (url, fileName, groupId) => {
  try {
    //loading.value = true; // 显示加载提示

    // 获取文件类型
    const fileType = getFileType(fileName);
    const mimeType = getMimeType(fileType);

    // 判断是否为Firebase Storage的URL
    if (url && url.includes("firebasestorage.googleapis.com")) {
      const user = auth.currentUser;
      if (user) {
        try {
          // 尝试通过服务器API获取并解密文件
          const decryptedUrl = await fetchAndDecryptFile(
            url,
            user.uid,
            groupId,
            mimeType
          );

          // 总是预览文件，不直接下载
          return decryptedUrl;
        } catch (error) {
          console.error("文件预览失败:", error);
          // alert("文件预览失败，请稍后重试或联系管理员");
        }
      } else {
        return url;
      }
    } else {
      return url;
    }
  } catch (error) {
    console.error("预览文件失败:", error);
    //alert("文件预览失败，请稍后重试");
  } finally {
    //loading.value = false; // 隐藏加载提示
  }
};

export const downloadFile = async (url, groupId) => {
  const filename = getFileName(url);
  const decryptUrl = await getDecryptUrl(url, filename, groupId);
  const link = document.createElement("a");
  link.href = decryptUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
