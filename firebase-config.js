import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqjk8zsXQxYezzCw_68GNyGntCwiugIi0",
  authDomain: "myapply-sa.firebaseapp.com",
  projectId: "myapply-sa",
  storageBucket: "myapply-sa.firebasestorage.app",
  messagingSenderId: "341079141374",
  appId: "1:341079141374:web:436c9cc03dba2081f22eaf",
  measurementId: "G-9T3QNFMS25"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics (Note: Analytics automatically disables itself when running on localhost)
export const analytics = getAnalytics(app);

// --- EMULATOR SETUP ---
// Detects if you are running locally on port 5000 (or localhost) to use free local instances
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    console.log("⚡ Connecting to Local Firebase Emulators...");
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
