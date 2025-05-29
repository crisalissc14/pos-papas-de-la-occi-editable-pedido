// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCoDJTuseJytyNdhWRtYK_7LQj2ww_En9g",
  authDomain: "pos-papasocci.firebaseapp.com",
  projectId: "pos-papasocci",
  storageBucket: "pos-papasocci.firebasestorage.app",
  messagingSenderId: "650286156534",
  appId: "1:650286156534:web:be827305d8e94d77fabad7",
  measurementId: "G-BMSK2M2JP2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Exportar lo necesario
export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  doc
};
