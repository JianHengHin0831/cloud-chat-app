// mapping of file extensions to their corresponding icons and colors
// used for visual representation of different file types in the ui

const fileTypeIcons = {
  pdf: { icon: ["far", "file-pdf"], color: "text-red-500" },
  doc: { icon: ["far", "file-word"], color: "text-blue-600" },
  docx: { icon: ["far", "file-word"], color: "text-blue-600" },
  txt: { icon: ["far", "file-alt"], color: "text-gray-500" },
  rtf: { icon: ["far", "file-alt"], color: "text-gray-500" },

  // spreadsheet types
  xls: { icon: ["far", "file-excel"], color: "text-green-600" },
  xlsx: { icon: ["far", "file-excel"], color: "text-green-600" },
  csv: { icon: ["far", "file-csv"], color: "text-green-600" },

  // presentation types
  ppt: { icon: ["far", "file-powerpoint"], color: "text-orange-500" },
  pptx: { icon: ["far", "file-powerpoint"], color: "text-orange-500" },

  // image types
  jpg: { icon: ["far", "file-image"], color: "text-purple-500" },
  jpeg: { icon: ["far", "file-image"], color: "text-purple-500" },
  png: { icon: ["far", "file-image"], color: "text-purple-500" },
  gif: { icon: ["far", "file-image"], color: "text-purple-500" },
  svg: { icon: ["far", "file-image"], color: "text-purple-500" },
  webp: { icon: ["far", "file-image"], color: "text-purple-500" },

  // video types
  mp4: { icon: ["far", "file-video"], color: "text-indigo-500" },
  webm: { icon: ["far", "file-video"], color: "text-indigo-500" },
  mov: { icon: ["far", "file-video"], color: "text-indigo-500" },
  avi: { icon: ["far", "file-video"], color: "text-indigo-500" },

  // audio types
  mp3: { icon: ["far", "file-audio"], color: "text-pink-500" },
  wav: { icon: ["far", "file-audio"], color: "text-pink-500" },
  ogg: { icon: ["far", "file-audio"], color: "text-pink-500" },

  // archive types
  zip: { icon: ["far", "file-archive"], color: "text-yellow-500" },
  rar: { icon: ["far", "file-archive"], color: "text-yellow-500" },
  "7z": { icon: ["far", "file-archive"], color: "text-yellow-500" },
  tar: { icon: ["far", "file-archive"], color: "text-yellow-500" },
  gz: { icon: ["far", "file-archive"], color: "text-yellow-500" },

  // code types
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

// get file extension from filename
export const getFileExtension = (filename) => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

// get filename from url
export const getFileName = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = decodeURIComponent(urlObj.pathname);
    const filenameWithPrefix = pathname.split("/o/")[1].split("/").pop();
    return filenameWithPrefix.replace(/^\d+-/, "");
  } catch (e) {
    return url;
  }
};

// get icon for file type
export const getFileIcon = (url) => {
  const extension = getFileExtension(getFileName(url));
  return fileTypeIcons[extension]?.icon || ["far", "file"];
};

// get color for file type
export const getFileIconColor = (url) => {
  const extension = getFileExtension(getFileName(url));
  return fileTypeIcons[extension]?.color || "text-gray-500";
};
