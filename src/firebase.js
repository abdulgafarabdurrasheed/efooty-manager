import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA7gOv71jw44aCwcBsQxhwmTJ39ChwHMS4",
  authDomain: "random-483418.firebaseapp.com",
  projectId: "random-483418",
  storageBucket: "random-483418.firebasestorage.app",
  messagingSenderId: "291543649118",
  appId: "1:291543649118:web:b11972830c0057326fddcf",
  measurementId: "G-9WPEQLT0G7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
