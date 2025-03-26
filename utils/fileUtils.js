// File type to icon mapping utility

const fileTypeIcons = {
  // Document types
  pdf: { icon: ["far", "file-pdf"], color: "text-red-500" },
  doc: { icon: ["far", "file-word"], color: "text-blue-600" },
  docx: { icon: ["far", "file-word"], color: "text-blue-600" },
  txt: { icon: ["far", "file-alt"], color: "text-gray-500" },
  rtf: { icon: ["far", "file-alt"], color: "text-gray-500" },

  // Spreadsheet types
  xls: { icon: ["far", "file-excel"], color: "text-green-600" },
  xlsx: { icon: ["far", "file-excel"], color: "text-green-600" },
  csv: { icon: ["far", "file-csv"], color: "text-green-600" },

  // Presentation types
  ppt: { icon: ["far", "file-powerpoint"], color: "text-orange-500" },
  pptx: { icon: ["far", "file-powerpoint"], color: "text-orange-500" },

  // Image types
  jpg: { icon: ["far", "file-image"], color: "text-purple-500" },
  jpeg: { icon: ["far", "file-image"], color: "text-purple-500" },
  png: { icon: ["far", "file-image"], color: "text-purple-500" },
  gif: { icon: ["far", "file-image"], color: "text-purple-500" },
  svg: { icon: ["far", "file-image"], color: "text-purple-500" },
  webp: { icon: ["far", "file-image"], color: "text-purple-500" },

  // Video types
  mp4: { icon: ["far", "file-video"], color: "text-indigo-500" },
  webm: { icon: ["far", "file-video"], color: "text-indigo-500" },
  mov: { icon: ["far", "file-video"], color: "text-indigo-500" },
  avi: { icon: ["far", "file-video"], color: "text-indigo-500" },

  // Audio types
  mp3: { icon: ["far", "file-audio"], color: "text-pink-500" },
  wav: { icon: ["far", "file-audio"], color: "text-pink-500" },
  ogg: { icon: ["far", "file-audio"], color: "text-pink-500" },

  // Archive types
  zip: { icon: ["far", "file-archive"], color: "text-yellow-500" },
  rar: { icon: ["far", "file-archive"], color: "text-yellow-500" },
  "7z": { icon: ["far", "file-archive"], color: "text-yellow-500" },
  tar: { icon: ["far", "file-archive"], color: "text-yellow-500" },
  gz: { icon: ["far", "file-archive"], color: "text-yellow-500" },

  // Code types
  js: { icon: ["far", "file-code"], color: "text-yellow-400" },
  ts: { icon: ["far", "file-code"], color: "text-blue-400" },
  html: { icon: ["far", "file-code"], color: "text-orange-500" },
  css: { icon: ["far", "file-code"], color: "text-blue-400" },
  json: { icon: ["far", "file-code"], color: "text-gray-500" },
  xml: { icon: ["far", "file-code"], color: "text-gray-500" },
  py: { icon: ["far", "file-code"], color: "text-blue-400" },
  java: { icon: ["far", "file-code"], color: "text-red-500" },
  cpp: { icon: ["far", "file-code"], color: "text-blue-400" },
  c: { icon: ["far", "file-code"], color: "text-blue-400" },
  cs: { icon: ["far", "file-code"], color: "text-purple-500" },
  php: { icon: ["far", "file-code"], color: "text-purple-500" },
  rb: { icon: ["far", "file-code"], color: "text-red-500" },
  go: { icon: ["far", "file-code"], color: "text-blue-500" },
};

// Get file extension from filename or URL
export const getFileExtension = (filename) => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

// Get file name from URL or path
export const getFileName = (url) => {
  try {
    // 创建URL对象
    const urlObj = new URL(url);

    // 获取路径名并解码
    const pathname = decodeURIComponent(urlObj.pathname);

    // 提取文件名部分（最后一个斜杠后的内容）
    const filenameWithPrefix = pathname.split("/o/")[1].split("/").pop();

    // 去掉可能的时间戳前缀（格式：数字-）
    return filenameWithPrefix.replace(/^\d+-/, "");
  } catch (e) {
    console.error("Error parsing URL:", e);
    return null;
  }
};

// Get icon for file type
// Get file icon
export const getFileIcon = (url) => {
  const extension = getFileExtension(getFileName(url));
  return fileTypeIcons[extension]?.icon || ["far", "file"];
};

// Get file icon color class
export const getFileIconColor = (url) => {
  const extension = getFileExtension(getFileName(url));
  return fileTypeIcons[extension]?.color || "text-gray-500";
};
