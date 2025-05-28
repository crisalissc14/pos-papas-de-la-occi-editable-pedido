// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoDJTuseJytyNdhWRtYK_7LQj2ww_En9g",
  authDomain: "pos-papasocci.firebaseapp.com",
  projectId: "pos-papasocci",
  storageBucket: "pos-papasocci.firebasestorage.app",
  messagingSenderId: "650286156534",
  appId: "1:650286156534:web:be827305d8e94d77fabad7",
  measurementId: "G-BMSK2M2JP2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };
