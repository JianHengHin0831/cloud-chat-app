// utils/formatTime.js
import { ref as dbRef, get } from "firebase/database";
import { db } from "~/firebase/firebase.js";
import { auth } from "~/firebase/firebase.js";

// cache user settings
let showExactTime = true;

// get user settings from database
export const getUserSettings = async () => {
  try {
    const userRef = dbRef(
      db,
      `users/${auth.currentUser?.uid}/advancedSettings/showExactTime`
    );
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      showExactTime = snapshot.val();
    }
    return showExactTime;
  } catch (error) {
    console.error("Failed to get user settings:", error);
    return true; // default to showing exact time
  }
};

// format timestamp to readable time
export const formatTime = async (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const showExact = await getUserSettings();

  if (showExact) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  const currentTime = new Date();
  const timeDiff = currentTime - date;

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const YEAR = 365 * DAY;

  if (timeDiff < MINUTE) {
    const seconds = Math.floor(timeDiff / SECOND);
    return `${seconds}s ago`;
  } else if (timeDiff < HOUR) {
    const minutes = Math.floor(timeDiff / MINUTE);
    return `${minutes}min ago`;
  } else if (timeDiff < DAY) {
    const hours = Math.floor(timeDiff / HOUR);
    return `${hours}h ago`;
  } else if (timeDiff < WEEK) {
    const days = Math.floor(timeDiff / DAY);
    return `${days}d ago`;
  } else if (timeDiff < YEAR) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } else {
    const years = Math.floor(timeDiff / YEAR);
    return `${years}y ago`;
  }
};

// format time with option to show exact or relative time
export const formatTimeWithShowExact = (timestamp, showExact) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (showExact) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  const currentTime = new Date();
  const timeDiff = currentTime - date;

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const YEAR = 365 * DAY;

  if (timeDiff < MINUTE) {
    const seconds = Math.floor(timeDiff / SECOND);
    return `${seconds}s ago`;
  } else if (timeDiff < HOUR) {
    const minutes = Math.floor(timeDiff / MINUTE);
    return `${minutes}min ago`;
  } else if (timeDiff < DAY) {
    const hours = Math.floor(timeDiff / HOUR);
    return `${hours}h ago`;
  } else if (timeDiff < WEEK) {
    const days = Math.floor(timeDiff / DAY);
    return `${days}d ago`;
  } else if (timeDiff < YEAR) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } else {
    const years = Math.floor(timeDiff / YEAR);
    return `${years}y ago`;
  }
};
