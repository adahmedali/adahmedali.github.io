import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDka96NawfxCs5jDZGVwwykI-HIWQsRF9E",
  authDomain: "habitsflow-4f7b1.firebaseapp.com",
  projectId: "habitsflow-4f7b1",
  storageBucket: "habitsflow-4f7b1.firebasestorage.app",
  messagingSenderId: "1001666064240",
  appId: "1:1001666064240:web:99810318b4e268cbfb69b5",
  measurementId: "G-8LR7CRKDNT",
};

const app = initializeApp(firebaseConfig);

// Analytics est optionnel : il échoue silencieusement en localhost/file://
// sans bloquer auth ni Firestore.
export const analytics = await isSupported().then(ok => ok ? getAnalytics(app) : null);

export const auth = getAuth(app);
export const db   = getFirestore(app);
