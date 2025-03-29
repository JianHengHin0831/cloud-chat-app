// import { ref as vueRef, type Ref } from "vue";
// import { initializeApp } from "firebase/app";
// import {
//   getAuth,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   type User,
// } from "firebase/auth";
// import {
//   getDatabase,
//   ref as dbRef,
//   set,
//   serverTimestamp,
// } from "firebase/database";
// import { getStorage } from "firebase/storage";
// import { getMessaging } from "firebase/messaging";

// // Initialize Firebase
// import { app } from "~/firebase/firebase.js";
// const auth = getAuth(app);
// const db = getDatabase(app);
// const storage = getStorage(app);
// const messaging = getMessaging(app);

// export const useFirebase = () => {
//   const user: Ref<User | null> = vueRef(null);
//   const loading: Ref<boolean> = vueRef(true);
//   const error: Ref<string | null> = vueRef(null);

//   // Listen to auth state changes
//   onAuthStateChanged(auth, (currentUser) => {
//     user.value = currentUser;
//     loading.value = false;
//   });

//   // Register a new user
//   const register = async (email: string, password: string) => {
//     try {
//       error.value = null;
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       return userCredential.user;
//     } catch (e: any) {
//       error.value = e.message;
//       throw e;
//     }
//   };

//   // Login user
//   const login = async (email: string, password: string) => {
//     try {
//       error.value = null;
//       const userCredential = await signInWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       return userCredential.user;
//     } catch (e: any) {
//       error.value = e.message;
//       throw e;
//     }
//   };

//   // Logout user
//   const logout = async () => {
//     try {
//       error.value = null;
//       await signOut(auth);
//     } catch (e: any) {
//       error.value = e.message;
//       throw e;
//     }
//   };

//   // Register device
//   const registerDevice = async (deviceId: string) => {
//     if (!user.value) throw new Error("No user logged in");

//     const deviceRef = dbRef(
//       db,
//       `devices/${user.value.uid}/registered/${deviceId}`
//     );

//     await set(deviceRef, {
//       registeredAt: serverTimestamp(),
//       lastActive: serverTimestamp(),
//     });
//   };

//   return {
//     user,
//     loading,
//     error,
//     auth,
//     db,
//     storage,
//     messaging,
//     register,
//     login,
//     logout,
//     registerDevice,
//   };
// };
