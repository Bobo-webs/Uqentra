// DASHBOARD.JS

import { auth, db } from "/assets/js/firebase-init.js";

import {
    ref as dbRef,
    get,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";


// -------------------------------------
// DOM ELEMENTS
// -------------------------------------
const logoutButtons = document.querySelectorAll(".logoutBtn");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const confirmationPopup = document.getElementById("confirmationPopup");
const loadingScreen = document.getElementById("loading-overlay");
const popupOverlay = document.getElementById("popupOverlay") || document.getElementById("popup-overlay");

const subPlanNameEl = document.getElementById("subPlanName");

// -------------------------------------
// LOADING HELPERS
// -------------------------------------
function showLoading() {
    if (loadingScreen) loadingScreen.style.display = "flex";
}

function hideLoading() {
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.display = "none";
        }, 300);
    }
}

// -------------------------------------
// AUTH + ROLE CHECK
// -------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    showLoading();

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        // Check role
        const roleSnap = await get(dbRef(db, `users/${user.uid}/role`));
        const role = roleSnap.val();

        if (role !== "user") {
            // Boot out immediately if not "user"
            showToast("Access denied", "error");
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        // Role is "user" → proceed
        await user.reload();

        const authEmail = user.email;

        const userRef = dbRef(db, `users/${user.uid}/email`);

        onValue(userRef, async (snapshot) => {
            const dbEmail = snapshot.val();

            if (dbEmail !== authEmail) {
                await update(dbRef(db, `users/${user.uid}`), {
                    email: authEmail
                });

                console.log(
                    "%cEmail synced: " + authEmail,
                    "color:#22c55e;font-weight:bold;"
                );
            }
        });

        // Load user data
        displayUserData(user.uid).finally(() => {
            hideLoading();
        });

        // Load current plan into sidebar — FROM allSubscriptions (active status)
        if (subPlanNameEl) {
            const subsRef = dbRef(db, `users/${user.uid}/allSubscriptions`);

            onValue(subsRef, (snapshot) => {
                let currentPlan = "free"; // fallback

                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        const sub = child.val();
                        if (sub.status === "active") {
                            currentPlan = sub.plan || "free";
                        }
                    });
                }

                const formatted = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
                subPlanNameEl.innerHTML = `${formatted} <span>Plan</span>`;
            }, (error) => {
                console.warn("Failed to load plan:", error);
                subPlanNameEl.innerHTML = 'Free <span>Plan</span>';
            });
        }
    });
});


// -------------------------------------
// DISPLAY USER DATA
// -------------------------------------
async function displayUserData(uid) {
    try {
        const snapshot = await get(dbRef(db, `users/${uid}`));
        if (!snapshot.exists()) {
            console.warn("No user data found for UID:", uid);
            return;
        }

        const data = snapshot.val();

        const firstname = (data.firstname || "User").toString().trim();
        const balance = Number(data.balance || 0);
        const deposits = Number(data.deposits || 0);
        const withdrawals = Number(data.withdrawals || 0);

        const fmt = (num) => `$${num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

        const heroTitle = document.getElementById("userTitle");
        if (heroTitle) heroTitle.innerHTML = `Hello, ${firstname} 👋`;

        const profileUsername = document.querySelector(".profile-trigger .username");
        if (profileUsername) profileUsername.textContent = firstname;

        const availableBalance = document.querySelector(".tx-available span");
        if (availableBalance) availableBalance.textContent = fmt(balance);

        const totalBalance = document.getElementById("totalBalance");
        if (totalBalance) totalBalance.textContent = fmt(balance);

        const totalDeposits = document.getElementById("totalDeposits");
        if (totalDeposits) totalDeposits.textContent = fmt(deposits);

        const totalWithdrawals = document.getElementById("totalWithdrawals");
        if (totalWithdrawals) totalWithdrawals.textContent = fmt(withdrawals);

        console.log("User data displayed successfully");

    } catch (error) {
        console.error("Failed to load user data:", error);
    }
}

// -------------------------------------
// POPUP CONTROL
// -------------------------------------
function showPopup() {
    confirmationPopup?.classList.add("show");
    popupOverlay?.classList.add("show");
}

function hidePopup() {
    confirmationPopup?.classList.remove("show");
    popupOverlay?.classList.remove("show");
}

logoutButtons.forEach(btn => {
    btn.addEventListener("click", showPopup);
});

confirmYes?.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            hidePopup();
            window.location.href = "login.html";
        })
        .catch((err) => {
            console.error("Error signing out:", err);
            hidePopup();
        });
});

confirmNo?.addEventListener("click", hidePopup);

popupOverlay?.addEventListener("click", hidePopup);


// -------------------------------------
// THEME TOGGLER
// -------------------------------------

const themeToggle = document.querySelector('.theme-toggle');

themeToggle.addEventListener('click', (e) => {
    e.preventDefault();

    document.documentElement.classList.toggle('dark');

    // Save preference
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});