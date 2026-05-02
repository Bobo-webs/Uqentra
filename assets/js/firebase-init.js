// firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD0Zjrd8jRlgJkWxMC-M1h8tIV9-pRGcEI",
    authDomain: "uqentra-usa.firebaseapp.com",
    databaseURL: "https://uqentra-usa-default-rtdb.firebaseio.com",
    projectId: "uqentra-usa",
    storageBucket: "uqentra-usa.firebasestorage.app",
    messagingSenderId: "343589265051",
    appId: "1:343589265051:web:1f42835da0a6a8a0bdb03e",
    measurementId: "G-379X05PV6H"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Global exports for old code
window.firebaseDatabase = db;
window.auth = auth;

// RTDB offline persistence = ENABLED BY DEFAULT in v10+

console.log("%cFirebase Ready — RTDB Offline Active", "color:#00ff9d;font-weight:bold;");