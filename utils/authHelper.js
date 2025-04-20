import { auth, db } from "~/firebase/firebase.js";
import { ref as dbRef, set, get } from "firebase/database";
import QRCode from "qrcode-generator";
import CryptoJS from "crypto-js";

// base32 character table
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// decode base32 to hex
function base32ToHex(base32) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";

  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.substr(i, 8);
    hex += parseInt(chunk, 2).toString(16).padStart(2, "0");
  }

  return hex;
}

// convert uint8array to base32 string
function arrayToBase32(array) {
  let bits = "";
  let value = 0;
  let output = "";

  for (let i = 0; i < array.length; i++) {
    value = (value << 8) | array[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

// generate user-specific secret key
function generateUserSecret(userId) {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hash = new Uint8Array(20);

  for (let i = 0; i < data.length; i++) {
    hash[i % 20] ^= data[i];
  }

  return arrayToBase32(hash);
}

// generate totp key and qr code
export const generateTOTP = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const userRef = dbRef(db, `users/${user.uid}/securitySettings`);
    const snapshot = await get(userRef);

    let secret;
    if (snapshot.exists() && snapshot.val().totpSecret) {
      secret = snapshot.val().totpSecret;
    } else {
      secret = generateUserSecret(user.uid);
    }

    const otpauth = `otpauth://totp/CloudTalk:${encodeURIComponent(
      user.email
    )}?secret=${secret}&issuer=CloudTalk`;

    const qr = QRCode(0, "M");
    qr.addData(otpauth);
    qr.make();
    const qrCode = qr.createDataURL(4);

    await set(userRef, {
      totpSecret: secret,
      mfaEnabled: false,
      setupInProgress: true,
      lastUpdated: new Date().toISOString(),
    });

    return {
      secret,
      qrCode,
    };
  } catch (error) {
    console.error("Error generating TOTP:", error);
    throw error;
  }
};

// verify totp code
export const verifyTOTP = async (code) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const userRef = dbRef(db, `users/${user.uid}/securitySettings`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      throw new Error("TOTP not set up");
    }

    const securityData = snapshot.val();
    const secret = securityData.totpSecret;

    const isValid = verifyTOTPCode(secret, code);

    if (isValid) {
      if (!securityData.mfaEnabled) {
        await set(userRef, {
          ...securityData,
          mfaEnabled: true,
          setupInProgress: false,
          lastUpdated: new Date().toISOString(),
        });
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    throw error;
  }
};

// verify totp code implementation
function verifyTOTPCode(secret, code) {
  const timeStep = 30;
  const window = 1;
  const now = Math.floor(Date.now() / 1000);

  const currentCode = generateTOTPCode(secret, now);
  const prevCode = generateTOTPCode(secret, now - timeStep);
  const nextCode = generateTOTPCode(secret, now + timeStep);

  return code === currentCode || code === prevCode || code === nextCode;
}

// generate totp code
function generateTOTPCode(secret, time) {
  const timeStep = 30;
  let t = Math.floor(time / timeStep);

  const timeArray = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    timeArray[i] = t & 0xff;
    t >>= 8;
  }

  const key = base32ToHex(secret);

  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const timeWordArray = CryptoJS.lib.WordArray.create(timeArray);
  const hmacHex = CryptoJS.HmacSHA1(timeWordArray, keyWordArray).toString();

  const hmacBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    hmacBytes[i] = parseInt(hmacHex.substr(i * 2, 2), 16);
  }

  const offset = hmacBytes[19] & 0xf;

  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const code = binary % 1000000;
  const finalCode = code.toString().padStart(6, "0");
  return finalCode;
}

// check mfa status
export const checkMFAStatus = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userRef = dbRef(db, `users/${user.uid}/securitySettings`);
    const snapshot = await get(userRef);

    return snapshot.exists() && snapshot.val().mfaEnabled === true;
  } catch (error) {
    console.error("Error checking MFA status:", error);
    return false;
  }
};

// disable mfa
export const disableMFA = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const userRef = dbRef(db, `users/${user.uid}/securitySettings`);
    await set(userRef, {
      mfaEnabled: false,
      totpSecret: null,
      lastUpdated: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error disabling MFA:", error);
    throw error;
  }
};
