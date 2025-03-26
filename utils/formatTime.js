// utils/formatTime.js
export const formatTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return "";

  // 将 seconds 和 nanoseconds 转换为毫秒
  const milliseconds =
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;

  // 创建 Date 对象
  const date = new Date(milliseconds);

  // 格式化为本地时间字符串
  return date.toLocaleString(); // 例如： "2024/1/1 12:34:56"
};
