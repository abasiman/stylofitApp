
// 1) Core Firebase initialization
import { initializeApp, getApp } from "firebase/app";  // ← add getApp

import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 3) Firestore (NoSQL database) endpoint
import { getFirestore } from "firebase/firestore";

// 4) Cloud Storage (file storage) endpoint
import { getStorage } from "firebase/storage";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey:            "AIzaSyB0vZB__br506mXPwIipPwO1iI8TVjMiA4",
  authDomain:        "stylofit-6360d.firebaseapp.com",
  databaseURL:       "https://stylofit-6360d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "stylofit-6360d",
  storageBucket: "stylofit-6360d.firebasestorage.app",
  messagingSenderId: "1016914599319",
  appId:             "1:1016914599319:web:4b7e6003fbeb5020f5b8d2",
  measurementId:     "G-B1WMJ85D03"
};

// Initialize the Firebase app instance
const app = initializeApp(firebaseConfig);
console.log("🔍 storageBucket:", getApp().options.storageBucket);


// ----------------------------
// Exported Firebase services:
// ----------------------------

// Authentication service with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore database service
export const db = getFirestore(app);

// Cloud Storage service
export const storage = getStorage(app);
