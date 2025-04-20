import { auth } from "~/firebase/firebase.js";

// log event to server
export const logEvent = async (
  eventType: string,
  details: Record<string, any>
) => {
  try {
    // await fetch("/api/log", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
    //   },
    //   body: JSON.stringify({
    //     event: eventType,
    //     details: {
    //       ...details,
    //       timestamp: new Date().toISOString(),
    //       environment: process.env.NODE_ENV,
    //     },
    //   }),
    // });
  } catch (err) {
    console.error("Failed to send log:", err);
  }
};

// log error with context
export const logError = async (error: Error, context: Record<string, any>) => {
  await logEvent("application_error", {
    ...context,
    error: error.message,
    stack: error.stack,
    severity: "ERROR",
  });
};

// track metric with labels
export const trackMetric = async (
  metricName: string,
  value: number,
  labels: Record<string, string>
) => {
  try {
    // await fetch("/api/monitor", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
    //   },
    //   body: JSON.stringify({
    //     metric: metricName,
    //     value,
    //     labels: {
    //       ...labels,
    //       user_id: auth.currentUser?.uid,
    //       environment: process.env.NODE_ENV,
    //     },
    //   }),
    // });
  } catch (err) {
    console.error("Failed to track metric:", err);
  }
};
