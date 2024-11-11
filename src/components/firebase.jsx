// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRoX_LCTUEJe20p5XOW5H7BvcGzVqbR20",
  authDomain: "interview-bot-sandbox-1.firebaseapp.com",
  projectId: "interview-bot-sandbox-1",
  storageBucket: "interview-bot-sandbox-1.appspot.com",
  messagingSenderId: "884871840336",
  appId: "1:884871840336:web:36db0134447f0274e20755",
  measurementId: "G-XW57XV9YHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth();
export const db=getFirestore(app);
export default app;