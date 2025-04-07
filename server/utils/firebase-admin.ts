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
import { LoggingWinston } from "@google-cloud/logging-winston";
import { MetricServiceClient } from "@google-cloud/monitoring";
import winston, { Logger } from "winston";

let loggerInstance: Logger | null = null;
let monitoringClientInstance: MetricServiceClient | null = null;

interface FirebaseAdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminDb: ReturnType<typeof getDatabase>;
  adminMessaging: Messaging;
  logger: Logger;
  monitoringClient: MetricServiceClient;
}

// 解决 gRPC 相关问题的环境变量配置
process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";
process.env.GRPC_DNS_RESOLVER = "native"; // 比 GRPC_RESOLVER 更推荐
process.env.GRPC_ENABLE_FORK_SUPPORT = "1"; // 如果使用 Node.js 子进程

export const initializeFirebaseAdmin = () => {
  const config = useRuntimeConfig();

  // 确保服务账户配置正确
  const serviceAccount: ServiceAccount = {
    projectId: config.firebase.serviceAccount.project_id,
    privateKey: config.firebase.serviceAccount.private_key
      ?.replace(/\\\\n/g, "\n")
      ?.replace(/^"|"$/g, ""), // 处理换行符和移除多余的引号
    clientEmail: config.firebase.serviceAccount.client_email,
  };

  if (
    !serviceAccount.projectId ||
    !serviceAccount.privateKey ||
    !serviceAccount.clientEmail
  ) {
    throw new Error("Firebase 服务账户配置不完整");
  }

  // 应用初始化
  const adminApp =
    getApps()[0] ||
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}-default-rtdb.firebaseio.com`,
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    });

  // 初始化各服务
  const auth = getAuth(adminApp);
  const db = getDatabase(adminApp);
  const messaging = getMessaging(adminApp);

  // 初始化 Cloud Logging
  const loggingWinston = new LoggingWinston({
    projectId: serviceAccount.projectId,
    credentials: {
      client_email: serviceAccount.clientEmail,
      private_key: serviceAccount.privateKey,
    },
    // 添加这些关键配置
    logName: `firebase-logs`,
    resource: {
      type: "global",
      labels: {
        project_id: serviceAccount.projectId,
      },
    },
    redirectToStdout: false, // 确保直接写入Cloud Logging
    serviceContext: {
      service: "nuxt3-firebase-app",
    },
  });

  loggerInstance = winston.createLogger({
    level: "info",
    transports: [new winston.transports.Console(), loggingWinston],
    // 添加默认元数据
    defaultMeta: {
      service: "nuxt3-app",
      runtime: "node",
    },
  });

  // 初始化 Cloud Monitoring
  if (!monitoringClientInstance) {
    monitoringClientInstance = new MetricServiceClient({
      projectId: serviceAccount.projectId,
      credentials: {
        client_email: serviceAccount.clientEmail,
        private_key: serviceAccount.privateKey,
      },
    });
  }

  // db.settings({
  //   ignoreUndefinedProperties: true, // 忽略 undefined 值
  //   preferRest: true, // 在可能的情况下使用 REST API
  // });

  return {
    adminApp,
    adminAuth: auth,
    adminDb: db,
    adminMessaging: messaging,
    logger: loggerInstance,
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

// 监控工具函数
export async function writeTimeSeries(
  metricType: string,
  value: number,
  labels: Record<string, string> = {}
) {
  if (!monitoringClient) throw new Error("Monitoring client not initialized");

  // 从初始化时的 serviceAccount 获取项目ID
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
    logger?.error("Failed to write time series", { error });
  }
}
