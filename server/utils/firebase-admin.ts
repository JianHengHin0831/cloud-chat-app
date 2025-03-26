import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const config = useRuntimeConfig();
const serviceAccount = config.firebase.serviceAccount;
// const serviceAccount = JSON.parse(
//   process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
// );

// if (!serviceAccount.project_id) {
//   throw new Error("Firebase service account key is missing");
// }

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const adminAuth = getAuth(app);
