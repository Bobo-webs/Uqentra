// PROFILE.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref as dbRef, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log("%cPROFILE MODULE LOADED", "color:#8b5cf6;font-weight:bold;");

    const usernameInput = document.getElementById('username');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');

    // LOADING OVERLAY — YOUR EXISTING ONE
    const showLoading = () => {
        document.getElementById("loading-overlay").classList.add("show");
    };

    const hideLoading = () => {
        document.getElementById("loading-overlay").classList.remove("show");
    };

    // LOAD USER DATA FROM RTDB
    auth.onAuthStateChanged((user) => {
        if (!user) {
            showToast("Please log in", "error");
            return;
        }

        console.log("%cUSER LOGGED IN — UID: " + user.uid, "color:#00ff9d;font-weight:bold;");

        const userRef = dbRef(db, `users/${user.uid}`);
        onValue(userRef, (snap) => {
            const data = snap.val();
            if (data) {
                usernameInput.value = data.firstname || '';
                fullNameInput.value = data.lastname || '';
                emailInput.value = data.email || 'No email';

                profileUsername.textContent = data.firstname || 'User';
                profileEmail.textContent = data.email || 'No email';

                console.log("%cPROFILE DATA LOADED", "color:#00ff9d;font-weight:bold;");
            }
        });
    });

    // SAVE PROFILE + LOADING + FULL REFRESH
    document.getElementById('profileForm').onsubmit = async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) return;

        const firstname = usernameInput.value.trim();
        const lastname = fullNameInput.value.trim();

        if (!firstname || !lastname) {
            showToast("Please fill all fields", "error");
            return;
        }

        try {
            showToast("Saving profile...", "info");

            await update(dbRef(db, `users/${user.uid}`), {
                firstname: firstname,
                lastname: lastname
            });

            showToast("Profile updated!", "success");

            // SHOW YOUR LOADING OVERLAY
            showLoading();

            // REFRESH PAGE AFTER 1.5 SECONDS
            setTimeout(() => {
                hideLoading();
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("PROFILE SAVE FAILED:", error);
            showToast("Save failed. Try again.", "error");
        }
    };
});