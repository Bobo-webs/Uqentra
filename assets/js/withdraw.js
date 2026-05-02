// WITHDRAWAL.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

let userFullName = "User";

auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const snap = await get(ref(db, `users/${user.uid}/firstname`));
            if (snap.exists()) {
                userFullName = snap.val().trim() || "User";
            }
        } catch (err) {
            console.warn("Could not load user name");
        }
    }
});

function sendWithdrawalMail(amount, cryptoValue, walletAddress) {
    const user = auth.currentUser;
    if (!user || !user.email) return Promise.reject("No user");

    const cryptoText = {
        BTC: "Bitcoin (BTC)",
        ETH: "Ethereum (ETH)",
        USDT: "Trc20 (USDT)",
        USDC: "Trc20 (USDC)"
    }[cryptoValue] || cryptoValue;

    const params = {
        name: userFullName,
        withdraw_amount: amount,
        crypto_type: cryptoText,
        address: walletAddress,
        to_email: `${user.email}, investify.traders@gmail.com`,
        to_name: `${userFullName}, Admin`
    };

    return emailjs.send("service_o8fin53", "template_vmbmklb", params)
        .then(() => console.log("Withdrawal email sent"))
        .catch(err => console.error("Email failed:", err));
}

// ========== MAIN FORM SUBMISSION ========= //
document.getElementById('withdrawForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        showToast("Please log in to withdraw", "error");
        return;
    }

    const uid = user.uid;
    const crypto = document.getElementById('cryptoSelect').value;
    const rawAmount = document.getElementById('amountInput').value.trim();
    const amount = parseFloat(rawAmount);
    const walletAddress = document.getElementById('walletAddress').value.trim();

    // === BASIC VALIDATION === //
    if (!crypto || !rawAmount || isNaN(amount) || amount < 20 || !walletAddress || walletAddress.length < 20) {
        showToast("Please complete all fields correctly", "error");
        return;
    }

    try {
        // === GET CURRENT USER BALANCE FIRST === //
        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
            showToast("User data not found", "error");
            return;
        }

        const userData = snapshot.val();
        const currentBalance = Number(userData.balance) || 0;

        // === INSUFFICIENT BALANCE CHECK ===
        if (amount > currentBalance) {
            showToast(`Insufficient balance! You have $${currentBalance.toFixed(2)}`, "error");
            return;
        }

        // 1. Save withdrawal record
        const newWithdrawRef = push(ref(db, `users/${uid}/allWithdrawals`));
        await set(newWithdrawRef, {
            uid: newWithdrawRef.key,
            crypto,
            amount: amount,
            walletAddress,
            status: "pending",
            timestamp: Date.now(),
            date: new Date().toISOString(),
            type: "withdrawal"
        });

        // 2. Update balance & total withdrawals
        showToast("Processing withdrawal request...", "info");

        await update(userRef, {
            withdrawals: (userData.withdrawals || 0) + amount,
            balance: currentBalance - amount
        });

        // 3. Send email
        await sendWithdrawalMail(amount.toFixed(2), crypto, walletAddress);

        // 4. Success
        showToast(`$${amount.toFixed(2)} ${crypto} withdrawal request sent!<br>Status: Pending`, "success");

        // 5. Reload after toast
        setTimeout(() => location.reload(), 2200);

        // Reset form
        document.getElementById('withdrawForm').reset();
        document.getElementById('submitBtn').disabled = true;
        document.querySelectorAll('.crypto-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('cryptoSelect').value = "";

    } catch (error) {
        console.error("Withdrawal failed:", error);
        showToast("Withdrawal failed. Try again.", "error");
    }
});