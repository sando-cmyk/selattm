// Firebase SDK Initializer & Service Exports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Production Firebase Configuration for selattm-ba765
const firebaseConfig = {
  apiKey: "AIzaSyBy4Tri9p0ciZ8kG9GYwYaCwW84EE2xjcA",
  authDomain: "selattm-ba765.firebaseapp.com",
  projectId: "selattm-ba765",
  storageBucket: "selattm-ba765.firebasestorage.app",
  messagingSenderId: "540683663122",
  appId: "1:540683663122:web:85744ab8d25158b53d25cb",
  measurementId: "G-Z7DJL0S72S"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Export Auth Methods
export { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
};

// Export Firestore Methods
export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
};