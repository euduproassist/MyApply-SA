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
