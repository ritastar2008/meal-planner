import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 請替換為你專案的 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBWl0hLfssF7Yao7mtw7-uYoLA192re7hE",
  authDomain: "seasonal-meal-planner.firebaseapp.com",
  projectId: "seasonal-meal-planner",
  storageBucket: "seasonal-meal-planner.firebasestorage.app",
  messagingSenderId: "824540967519",
  appId: "1:824540967519:web:46f6648571782ad6de21ea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);