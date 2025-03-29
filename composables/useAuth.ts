import { ref } from "vue";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useSignal } from "./useSignal";
import { useKeyBundle } from "./useKeyBundle";

export const useAuth = () => {
  const auth = getAuth();
  const { generateKeyBundle } = useSignal();
  const { storeKeyBundle, getKeyBundle } = useKeyBundle();

  const currentUser = ref(null);
  const currentDevice = ref(null);
  const isAuthenticated = ref(false);

  // Register a new user
  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    currentUser.value = userCredential.user;

    // Generate and store device key bundle
    const deviceId = generateDeviceId();
    const keyBundle = await generateKeyBundle();
    await storeKeyBundle(currentUser.value.uid, deviceId, keyBundle);

    currentDevice.value = {
      id: deviceId,
      keyBundle,
    };

    isAuthenticated.value = true;
    return userCredential.user;
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    currentUser.value = userCredential.user;

    // Register new device if first time login
    const deviceId = generateDeviceId();
    let keyBundle = await getKeyBundle(currentUser.value.uid, deviceId);

    if (!keyBundle) {
      keyBundle = await generateKeyBundle();
      await storeKeyBundle(currentUser.value.uid, deviceId, keyBundle);
    }

    currentDevice.value = {
      id: deviceId,
      keyBundle,
    };

    isAuthenticated.value = true;
    return userCredential.user;
  };

  // Logout current user
  const logout = async () => {
    await auth.signOut();
    currentUser.value = null;
    currentDevice.value = null;
    isAuthenticated.value = false;
  };

  // Generate unique device ID
  const generateDeviceId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get current device info
  const getCurrentDevice = () => {
    return currentDevice.value;
  };

  // Check if device is registered
  const isDeviceRegistered = async (userId: string, deviceId: string) => {
    const keyBundle = await getKeyBundle(userId, deviceId);
    return !!keyBundle;
  };

  return {
    currentUser,
    currentDevice,
    isAuthenticated,
    register,
    login,
    logout,
    getCurrentDevice,
    isDeviceRegistered,
  };
};
