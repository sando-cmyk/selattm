/* ==========================================================================
   SELA Civil - Firebase Initialization & Master Export Engine
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// SELA TTM Web App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBy4Tri9p0ciZ8kG9GYwYaCwW84EE2xjcA",
  authDomain: "selattm-ba765.firebaseapp.com",
  projectId: "selattm-ba765",
  storageBucket: "selattm-ba765.firebasestorage.app",
  messagingSenderId: "540683663122",
  appId: "1:540683663122:web:85744ab8d25158b53d25cb",
  measurementId: "G-Z7DJL0S72S"
};

// Initialize Core Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot
};