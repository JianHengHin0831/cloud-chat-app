import { monitoringClient } from "./firebase-admin";

//Record custom metrics;
export async function recordMetric(
  metricName: string,
  value: number,
  labels: Record<string, string> = {}
) {
  try {
    await monitoringClient.createTimeSeries({
      name: `projects/${process.env.FIREBASE_PROJECT_ID}`,
      timeSeries: [
        {
          metric: {
            type: `custom.googleapis.com/chat/${metricName}`,
            labels,
          },
          resource: {
            type: "global",
            labels: { project_id: process.env.FIREBASE_PROJECT_ID || "" },
          },
          points: [
            {
              interval: {
                endTime: { seconds: Math.floor(Date.now() / 1000) },
              },
              value: { doubleValue: value },
            },
          ],
        },
      ],
    });
  } catch (error) {
    // logger.error("Failed to record metric", { error, metricName });
  }
}

//Record structured logs
export function logEvent(
  eventType: string,
  details: Record<string, any>,
  severity: "DEBUG" | "INFO" | "WARNING" | "ERROR" = "INFO"
) {
  const logData = {
    event: eventType,
    severity,
    ...details,
    timestamp: new Date().toISOString(),
    resource: {
      labels: {
        project_id:
          process.env.FIREBASE_PROJECT_ID || adminApp.options.projectId,
      },
    },
  };

  switch (severity) {
    case "ERROR":
      break;
    case "WARNING":
      break;
    case "DEBUG":
      break;
    default:
  }
}
