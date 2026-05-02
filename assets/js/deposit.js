// DEPOSIT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import {
    ref,
    push,
    set,
    get,
    child,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

// GLOBAL: user's lastname
let userLastName = "User";

auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const snap = await get(ref(db, `users/${user.uid}/firstname`));
            if (snap.exists()) userLastName = snap.val().trim() || "User";
        } catch (err) {
            console.warn("Couldn't load lastname");
        }
    }
});

// SEND EMAIL TO USER + ADMIN
function sendMail(amount, cryptoValue, cryptoText) {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    const params = {
        name: userLastName,
        fund_amount: amount,
        crypto_type: cryptoText,
        crypto: cryptoValue,

        // Sends to both user and admin
        to_email: `${user.email}, investify.traders@gmail.com`,
        to_name: `${userLastName}, User`
    };

    emailjs.send("service_o8fin53", "template_plo6qzw", params)
        .then(() => console.log("Email sent to USER + ADMIN →", amount, cryptoText))
        .catch(err => console.error("Email failed:", err));
}

// ============== REST OF YOUR CODE (only tiny changes) ==============

const depositForm = document.getElementById('depositForm');
const cryptoSelect = document.getElementById('cryptoSelect');
const amountInput = document.getElementById('amountInput');
const submitBtn = document.getElementById('submitBtn');
const cryptoBtns = document.querySelectorAll('.crypto-btn');

const depositFormContainer = document.getElementById('depositFormContainer') || depositForm?.closest('.card');
const depositConfirmContainer = document.getElementById('depositConfirmContainer') || document.querySelector('.deposit-confirmation-card')?.closest('.card');

const dcCoinIcon = document.getElementById('dcCoinIcon');
const dcCoinName = document.getElementById('dcCoinName');
const dcTicker = document.getElementById('dcTicker');
const depositAddress = document.getElementById('depositAddress');
const qrCodeImg = document.getElementById('qrCodeImg');
const totalUsdValue = document.getElementById('totalUsdValue');
const totalValueTicker = document.getElementById('totalValueTicker');

const loadingScreen = document.getElementById('loading-overlay');

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

const COIN_DATA = {
    BTC: { name: "Bitcoin", icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
    ETH: { name: "Ethereum", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    USDT: { name: "Tether", icon: "/assets/images/tether-usdt-logo.png" }
};

async function submitDeposit() {
    const cryptoValue = cryptoSelect?.value;
    const cryptoText = cryptoSelect?.selectedOptions[0]?.text.trim();
    const amount = parseFloat(amountInput?.value);

    if (!cryptoValue || isNaN(amount) || amount < 20) {
        showToast("Please select crypto and enter amount ≥ $20", "error");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showToast("You must be logged in", "error");
        return;
    }

    const uid = user.uid;
    const depositData = {
        uid,
        crypto: cryptoValue,
        cryptoName: cryptoText,
        amount,
        amountUSD: amount,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        status: "pending",
        userEmail: user.email || "guest@demo.com"
    };

    try {
        await set(push(ref(db, `users/${uid}/allDeposits`)), depositData);
        await set(ref(db, `users/${uid}/currentDeposit`), depositData);

        console.log("DEPOSIT SAVED!");

        // SWITCH UI
        if (depositFormContainer) depositFormContainer.style.display = 'none';
        if (depositConfirmContainer) depositConfirmContainer.style.display = 'block';

        showLoading();
        await new Promise(r => setTimeout(r, 2000));

        // SEND EMAIL WITH REAL VALUES (before reset!)
        sendMail(amount, cryptoValue, cryptoText);

        // NOW safe to reset form
        depositForm.reset();
        cryptoBtns.forEach(b => b.classList.remove('active'));

    } catch (error) {
        console.error("Deposit failed:", error);
        hideLoading();
        showToast("Deposit failed", "error");
    }
}

// Keep your listener exactly the same
function startConfirmationListener() {
    auth.onAuthStateChanged((user) => {
        if (!user) return;
        const depositRef = ref(db, `users/${user.uid}/currentDeposit`);

        onValue(depositRef, async (snap) => {
            const deposit = snap.val();
            if (!deposit || !deposit.crypto) return;

            const crypto = deposit.crypto;
            const amount = deposit.amount || 0;

            if (dcCoinIcon) dcCoinIcon.src = COIN_DATA[crypto]?.icon || "";
            if (dcCoinName) dcCoinName.innerHTML = `${COIN_DATA[crypto]?.name || crypto} <strong>${crypto}</strong>`;
            if (dcTicker) dcTicker.textContent = crypto;
            if (totalUsdValue) totalUsdValue.textContent = amount.toFixed(2);
            if (totalValueTicker) totalValueTicker.textContent = crypto;

            const noteSpan = document.querySelector(".dc-address-note span");
            if (noteSpan) {
                const fullName = COIN_DATA[crypto]?.name || crypto;
                noteSpan.textContent = `${fullName} (${crypto})`;   // Bitcoin (BTC), Ethereum (ETH), Tether (USDT)
            }

            try {
                const walletSnap = await get(child(ref(db, 'adminWallets'), crypto));
                const wallet = walletSnap.val();
                if (wallet && depositAddress) {
                    const address = typeof wallet === 'object' ? wallet.address : wallet;
                    const qr = typeof wallet === 'object' ? wallet.qr : wallet;
                    depositAddress.value = address || "N/A";
                    if (qrCodeImg) qrCodeImg.src = qr || "https://via.placeholder.com/180";
                }
            } catch (err) {
                console.error("Wallet fetch failed:", err);
            }

            hideLoading();
            feather?.replace?.();
        });
    });
}

// BUTTON CLICK
submitBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await submitDeposit();  // this now calls sendMail() with correct values
});

document.addEventListener('DOMContentLoaded', () => {
    startConfirmationListener();
    feather?.replace?.();
});