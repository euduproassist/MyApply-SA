// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqjk8zsXQxYezzCw_68GNyGntCwiugIi0",
  authDomain: "myapply-sa.firebaseapp.com",
  projectId: "myapply-sa",
  storageBucket: "myapply-sa.firebasestorage.app",
  messagingSenderId: "341079141374",
  appId: "1:341079141374:web:436c9cc03dba2081f22eaf",
  measurementId: "G-9T3QNFMS25"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);










http://127.0.0.1:5000/
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBYQY2-wLmm4XB1AmRO_t7ACvJiXNrjEM",
  authDomain: "atlas-c58f8.firebaseapp.com",
  projectId: "atlas-c58f8",
  storageBucket: "atlas-c58f8.firebasestorage.app",
  messagingSenderId: "645586610569",
  appId: "1:645586610569:web:f9182dea6a718615a75958",
  measurementId: "G-R08BR0Z8RS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// --- EMULATOR SETUP ---
// This part ensures you stay at R0 cost while testing locally
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    console.log("Connecting to Local Emulators...");
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}


s
