// ~/server/utils/firebase-admin.ts
import {
  initializeApp,
  cert,
  getApps,
  type ServiceAccount,
  App,
} from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Messaging, getMessaging } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";
import { MetricServiceClient } from "@google-cloud/monitoring";
import { Logging } from "@google-cloud/logging";

//let loggerInstance: Logger | null = null;
let monitoringClientInstance: MetricServiceClient | null = null;
let loggingClientInstance: Logging | null = null;

interface FirebaseAdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminDb: ReturnType<typeof getDatabase>;
  adminMessaging: Messaging;
  // logger: Logger;
  logger: Logging;
  monitoringClient: MetricServiceClient;
}

// Environment variable configuration that solves gRPC-related problems
process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";
process.env.GRPC_DNS_RESOLVER = "native";
process.env.GRPC_ENABLE_FORK_SUPPORT = "1";

export const initializeFirebaseAdmin = () => {
  const config = useRuntimeConfig();

  const serviceAccount: ServiceAccount = {
    projectId: config.firebase.serviceAccount.project_id,
    privateKey: config.firebase.serviceAccount.private_key
      ?.replace(/\\\\n/g, "\n")
      ?.replace(/^"|"$/g, ""), // Handle line breaks and remove excess quotes
    clientEmail: config.firebase.serviceAccount.client_email,
  };

  if (
    !serviceAccount.projectId ||
    !serviceAccount.privateKey ||
    !serviceAccount.clientEmail
  ) {
    throw new Error("Firebase service account configuration is incomplete");
  }

  // Application Initialization
  const adminApp =
    getApps()[0] ||
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}-default-rtdb.firebaseio.com`,
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    });

  const auth = getAuth(adminApp);
  const db = getDatabase(adminApp);
  const messaging = getMessaging(adminApp);

  if (!monitoringClientInstance) {
    const isInCloudRun = !!process.env.K_SERVICE;

    if (isInCloudRun) {
      monitoringClientInstance = new MetricServiceClient();
    } else {
      if (
        !serviceAccount.projectId ||
        !serviceAccount.clientEmail ||
        !serviceAccount.privateKey
      ) {
        console.error(
          "[Init Check] Service account credentials missing in configuration for non-Cloud Run environment."
        );
        // Fallback or error handling: For local dev, you might want an error if keys are missing.
        // Here, we attempt ADC as a fallback, requires `gcloud auth application-default login` locally.
        console.warn("[Init Check] Attempting ADC fallback locally.");
        monitoringClientInstance = new MetricServiceClient();
      } else {
        monitoringClientInstance = new MetricServiceClient({
          projectId: serviceAccount.projectId,
          credentials: {
            client_email: serviceAccount.clientEmail,
            private_key: serviceAccount.privateKey,
          },
        });
      }
    }
  }

  if (!loggingClientInstance) {
    const isInCloudRun = !!process.env.K_SERVICE;
    if (isInCloudRun) {
      loggingClientInstance = new Logging();
    } else {
      if (
        !serviceAccount.projectId ||
        !serviceAccount.clientEmail ||
        !serviceAccount.privateKey
      ) {
        console.error(
          "[Init Check] Service account credentials missing for Logging client in non-Cloud Run environment."
        );
        console.warn(
          "[Init Check] Attempting ADC fallback for Logging locally."
        );
        loggingClientInstance = new Logging(); // Fallback to ADC
      } else {
        loggingClientInstance = new Logging({
          projectId: serviceAccount.projectId,
          credentials: {
            client_email: serviceAccount.clientEmail,
            private_key: serviceAccount.privateKey,
          },
        });
      }
    }
  }

  return {
    adminApp,
    adminAuth: auth,
    adminDb: db,
    adminMessaging: messaging,
    logger: loggingClientInstance,
    monitoringClient: monitoringClientInstance,
  };
};

const {
  adminApp,
  adminAuth,
  adminDb,
  adminMessaging,
  logger,
  monitoringClient,
} = initializeFirebaseAdmin();

export {
  adminApp,
  adminAuth,
  adminDb,
  adminMessaging,
  logger,
  monitoringClient,
};

//Monitoring tool functions
export async function writeTimeSeries(
  metricType: string,
  value: number,
  labels: Record<string, string> = {}
) {
  if (!monitoringClient) throw new Error("Monitoring client not initialized");
  if (!logger) throw new Error("Logging client not initialized");

  const projectId = adminApp.options.projectId;
  if (!projectId) {
    console.error("[Metrics Write Debug] Project ID is missing or invalid!");
    return;
  }

  const timeSeries = {
    metric: {
      type: metricType,
      labels,
    },
    resource: {
      type: "global",
      labels: { project_id: projectId },
    },
    points: [
      {
        interval: {
          endTime: {
            seconds: Math.floor(Date.now() / 1000),
          },
        },
        value: {
          doubleValue: value,
        },
      },
    ],
  };

  try {
    await monitoringClient.createTimeSeries({
      name: `projects/${projectId}`,
      timeSeries: [timeSeries],
    });
  } catch (error) {
    console.error(
      `[Metrics Write Debug] Failed for Project ID: ${projectId}, Metric: ${metricType}`
    );
    const log = logger.log("error-log");
    const metadata = {
      resource: { type: "global" },
      severity: "ERROR",
    };
    const entry = log.entry(metadata, `Failed to write time series: ${error}`);
    await log.write(entry).catch(console.error);
  }
}
