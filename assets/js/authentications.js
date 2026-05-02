// AUTHENTICATIONS.JS

import { auth, db } from "/assets/js/firebase-init.js";
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    verifyBeforeUpdateEmail
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

import { ref as dbRef, onValue } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

console.log("%cACCOUNT SETTINGS MODULE LOADED", "color:#8b5cf6;font-weight:bold;font-size:16px;background:#000;padding:8px 16px;border-radius:8px;");

// WAIT FOR USER + LOAD EMAIL FROM RTDB
auth.onAuthStateChanged((user) => {
    const currentEmailInput = document.getElementById('currentEmail');

    if (!user) {
        console.warn("%cNO USER LOGGED IN", "color:#dc2626;font-weight:bold;");
        currentEmailInput.value = "Not logged in";
        return;
    }

    console.log("%cUSER DETECTED — UID: " + user.uid, "color:#00ff9d;font-weight:bold;");

    const emailRef = dbRef(db, `users/${user.uid}/email`);
    onValue(emailRef, (snap) => {
        const dbEmail = snap.val();
        if (dbEmail) {
            console.log("%cEMAIL LOADED FROM RTDB: " + dbEmail, "color:#00ff9d;");
            currentEmailInput.value = dbEmail;
        } else {
            console.warn("%cNO EMAIL IN RTDB — USING AUTH EMAIL", "color:#f97316;");
            currentEmailInput.value = user.email || "No email";
        }
    }, (error) => {
        console.error("RTDB EMAIL READ FAILED:", error);
    });
});

// TAB SWITCHING
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// CHANGE EMAIL — (verifyBeforeUpdateEmail)
document.getElementById('changeEmailForm').onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        showToast("Please log in", "error");
        return;
    }

    const newEmail = document.getElementById('newEmail').value.trim();
    const currentPassword = document.getElementById('currentEmailPassword').value;

    try {
        // Reauthenticate
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Send verification to the new email
        await verifyBeforeUpdateEmail(user, newEmail);

        showToast("Verification email sent! Check your inbox or spam.", "success");

        e.target.reset();
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    }
};



// CHANGE PASSWORD
document.getElementById('changePasswordForm').onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        showToast("Please log in", "error");
        return;
    }

    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass || newPass.length < 6) {
        showToast("Passwords don't match or too short", "error");
        return;
    }

    try {
        showToast("Changing password...", "info");

        console.log("%cREAUTHENTICATING...", "color:#f97316;font-weight:bold;");

        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);

        console.log("%cUPDATING PASSWORD...", "color:#f97316;font-weight:bold;");
        await updatePassword(user, newPass);

        console.log("%cPASSWORD CHANGED SUCCESSFULLY", "color:#00ff9d;font-weight:bold;");
        showToast("Password updated successfully!", "success");

        e.target.reset();

    } catch (error) {
        console.error("PASSWORD CHANGE FAILED:", error);
        showToast("Wrong current password", "error");
    }
};