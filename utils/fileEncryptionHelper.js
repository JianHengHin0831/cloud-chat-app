// get type from folder name
import { auth } from "~/firebase/firebase.js";
import { fetchAndDecryptFile } from "~/services/chatroom-service";
import { getFileName } from "./fileUtils";

// get mime type from file type
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

// get file type from file name
export const getFileType = (fileName) => {
  if (!fileName) return "file";

  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return "image";
  }

  if (["mp4", "webm", "avi", "mov", "flv", "mkv"].includes(extension)) {
    return "video";
  }

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

  if (
    ["js", "ts", "java", "py", "cpp", "c", "html", "css", "json"].includes(
      extension
    )
  ) {
    return "code";
  }

  if (["txt", "md", "rtf"].includes(extension)) {
    return "text";
  }

  return "file";
};

// get decrypted url for file preview
export const getDecryptUrl = async (url, fileName, groupId) => {
  try {
    const fileType = getFileType(fileName);
    const mimeType = getMimeType(fileType);

    if (url && url.includes("firebasestorage.googleapis.com")) {
      const user = auth.currentUser;
      if (user) {
        try {
          const decryptedUrl = await fetchAndDecryptFile(
            url,
            user.uid,
            groupId,
            mimeType
          );

          return decryptedUrl;
        } catch (error) {
          console.error("file preview failed:", error);
        }
      } else {
        return url;
      }
    } else {
      return url;
    }
  } catch (error) {
    console.error("file preview failed:", error);
  } finally {
  }
};

// download file with decryption
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
