// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpKbvOwxwVcJJ7BsUUy-EpGP3ryrk8_qA",
  authDomain: "gridguard-app-c16d1.firebaseapp.com",
  projectId: "gridguard-app-c16d1",
  storageBucket: "gridguard-app-c16d1.firebasestorage.app",
  messagingSenderId: "656773654773",
  appId: "1:656773654773:web:f1cbfb79b49d856beefdbc",
  measurementId: "G-8XYNQL4EPD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };