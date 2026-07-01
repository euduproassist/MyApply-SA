import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services to be exported
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
