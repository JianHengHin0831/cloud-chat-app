import { monitoringClient, adminApp, logger } from "./firebase-admin";

export async function recordMetric(
  metricName: string,
  value: number,
  labels: Record<string, string> = {}
) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const fullMetricType = `custom.googleapis.com/chat/${metricName}`;
  console.log(
    `[Metrics Record Debug] Attempting metric: ${fullMetricType}, Value: ${value}, ProjectID (from env): ${projectId}`
  );

  if (!projectId) {
    console.error(
      "[Metrics Record Debug] FIREBASE_PROJECT_ID environment variable is not set!"
    );
    logEvent(
      "monitoring_error",
      { error: "FIREBASE_PROJECT_ID not set", metricName },
      "ERROR"
    );
    return;
  }

  if (!monitoringClient) {
    console.error(
      "[Metrics Record Debug] Monitoring client is not initialized!"
    );
    logEvent(
      "monitoring_error",
      { error: "Monitoring client not initialized", metricName },
      "ERROR"
    );
    return;
  }

  try {
    await monitoringClient.createTimeSeries({
      name: `projects/${projectId}`,
      timeSeries: [
        {
          metric: {
            type: fullMetricType,
            labels,
          },
          resource: {
            type: "global",

            labels: { project_id: projectId },
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
    console.log(
      `[Metrics Record Debug] Successfully recorded metric: ${fullMetricType}`
    );
  } catch (error) {
    console.error(
      `[Metrics Record Debug] Failed for Project ID: ${projectId}, Metric: ${fullMetricType}`,
      error
    );

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    logEvent(
      "monitoring_error",
      {
        error: `Failed to record metric: ${errorMessage}`,
        metricName: fullMetricType,
        projectIdFromEnv: projectId,
        details:
          error instanceof Error
            ? error.stack
            : JSON.stringify(error).substring(0, 500),
      },
      "ERROR"
    );
  }
}

//Record structured logs
export function logEvent(
  eventType: string,
  details: Record<string, any>,
  severity:
    | "DEBUG"
    | "INFO"
    | "NOTICE"
    | "WARNING"
    | "ERROR"
    | "CRITICAL"
    | "ALERT"
    | "EMERGENCY" = "INFO"
) {
  if (!logger) {
    console.error("Logger not initialized. Cannot log event:", {
      eventType,
      details,
      severity,
    });
    return;
  }
  const logName = "app-events";
  const log = logger.log(logName);

  const payload = {
    event: eventType,
    details,
  };

  const metadata = {
    resource: {
      type: "global",
      labels: {
        project_id:
          adminApp.options.projectId ||
          process.env.FIREBASE_PROJECT_ID ||
          "unknown-project",
        service: "cloudtalk-backend",
      },
    },
    severity: severity,
    labels: {
      eventType: eventType,
    },
  };

  const entry = log.entry(metadata, payload);

  log
    .write(entry)
    .then(() => {})
    .catch((err) => {
      console.error("Failed to write log entry:", err);
    });
}
