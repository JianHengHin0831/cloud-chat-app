import { logger, monitoringClient } from "./firebase-admin";

//记录自定义指标;
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
    logger.error("Failed to record metric", { error, metricName });
  }
}

//记录结构化日志
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
    // 添加资源标识
    resource: {
      labels: {
        project_id:
          process.env.FIREBASE_PROJECT_ID || adminApp.options.projectId,
      },
    },
  };

  switch (severity) {
    case "ERROR":
      logger.error({ message: eventType, jsonPayload: logData });
      break;
    case "WARNING":
      logger.warn({ message: eventType, jsonPayload: logData });
      break;
    case "DEBUG":
      logger.debug({ message: eventType, jsonPayload: logData });
      break;
    default:
      logger.info({ message: eventType, jsonPayload: logData });
  }
}
