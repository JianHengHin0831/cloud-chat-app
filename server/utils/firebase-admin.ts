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
// import { LoggingWinston } from "@google-cloud/logging-winston";
import { MetricServiceClient } from "@google-cloud/monitoring";
//import winston, { Logger } from "winston";

//let loggerInstance: Logger | null = null;
let monitoringClientInstance: MetricServiceClient | null = null;

interface FirebaseAdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminDb: ReturnType<typeof getDatabase>;
  adminMessaging: Messaging;
  // logger: Logger;
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
    throw new Error("Firebase 服务账户配置不完整");
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

  // Initialize Cloud Loging
  // const loggingWinston = new LoggingWinston({
  //   projectId: serviceAccount.projectId,
  //   credentials: {
  //     client_email: serviceAccount.clientEmail,
  //     private_key: serviceAccount.privateKey,
  //   },
  //   logName: `firebase-logs`,
  //   resource: {
  //     type: "global",
  //     labels: {
  //       project_id: serviceAccount.projectId,
  //     },
  //   },
  //   redirectToStdout: false,
  //   serviceContext: {
  //     service: "nuxt3-firebase-app",
  //   },
  // });

  // loggerInstance = winston.createLogger({
  //   level: "info",
  //   transports: [new winston.transports.Console(), loggingWinston],

  //   defaultMeta: {
  //     service: "nuxt3-app",
  //     runtime: "node",
  //   },
  // });

  //Initialize Cloud Monitoring
  if (!monitoringClientInstance) {
    monitoringClientInstance = new MetricServiceClient({
      projectId: serviceAccount.projectId,
      credentials: {
        client_email: serviceAccount.clientEmail,
        private_key: serviceAccount.privateKey,
      },
    });
  }

  return {
    adminApp,
    adminAuth: auth,
    adminDb: db,
    adminMessaging: messaging,
    //  logger: loggerInstance,
    monitoringClient: monitoringClientInstance,
  };
};

const {
  adminApp,
  adminAuth,
  adminDb,
  adminMessaging,
  // logger,
  monitoringClient,
} = initializeFirebaseAdmin();

export {
  adminApp,
  adminAuth,
  adminDb,
  adminMessaging,
  //logger,
  monitoringClient,
};

//Monitoring tool functions
export async function writeTimeSeries(
  metricType: string,
  value: number,
  labels: Record<string, string> = {}
) {
  if (!monitoringClient) throw new Error("Monitoring client not initialized");

  // Get the project ID from the serviceAccount at initialization
  const projectId = adminApp.options.projectId;
  if (!projectId) throw new Error("Project ID not found");

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
    //logger?.error("Failed to write time series", { error });
  }
}
