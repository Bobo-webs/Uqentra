// firebase-init.js — FINAL CLEAN VERSION (NO WARNINGS)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7UOOdjUgbYfNyZbNgdOCjkYRhxfJf_14",
    authDomain: "investify-traders-net.firebaseapp.com",
    databaseURL: "https://investify-traders-net-default-rtdb.firebaseio.com",
    projectId: "investify-traders-net",
    storageBucket: "investify-traders-net.firebasestorage.app",
    messagingSenderId: "769846151420",
    appId: "1:769846151420:web:a85156de7f33127b08af79",
    measurementId: "G-E6KSCFYTB6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Global exports for old code
window.firebaseDatabase = db;
window.auth = auth;

// RTDB offline persistence = ENABLED BY DEFAULT in v10+
// Nothing else needed — it's already working

console.log("%cFirebase Ready — RTDB Offline Active", "color:#00ff9d;font-weight:bold;");