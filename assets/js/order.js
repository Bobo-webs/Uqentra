// ORDER.JS

import { app, auth, db } from "/assets/js/firebase-init.js";

import {
    ref,
    push,
    set,
    get,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

// EMAILJS INIT
emailjs.init("OhUilmHKZjlDViGXq");

const el = id => document.getElementById(id);
const assetEl = el('tx-asset');
const tfEl = el('tx-tf');
const quickEl = el('tx-amount-quick');
const amountEl = el('tx-amount');
const marketInput = el('tx-market');
const buyEl = el('tx-buy');
const sellEl = el('tx-sell');
const ordersEl = el('tx-orders');

if (!ordersEl || !assetEl || !tfEl || !amountEl || !buyEl || !sellEl) {
    console.warn("Transaction widget missing required elements");
}

const noDataImg = `<img class="nodata" src="/assets/images/nodata.png" alt="No active trades">`;

function showNoData() {
    if (ordersEl.children.length === 0) {
        ordersEl.innerHTML = noDataImg;
    }
}

function hideNoData() {
    if (ordersEl.querySelector('.nodata')) {
        ordersEl.innerHTML = '';
    }
}

setTimeout(showNoData, 150);

function formatMoney(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// CREATE ORDER ROW
function createOrderRow(trade, tradeId) {
    hideNoData();

    const wrapper = document.createElement('div');
    wrapper.className = `tx-order ${trade.direction === 'sell' ? 'sell' : ''}`;
    wrapper.id = `order-${tradeId}`;
    wrapper.dataset.tradeId = tradeId;

    wrapper.innerHTML = `
        <div class="tx-order-left">
            <div class="tx-order-symbol">${trade.symbol}</div>
            <div class="tx-order-action ${trade.direction === 'buy' ? 'buy' : 'sell'}">
                <div>${trade.direction.toUpperCase()}</div>
                <div>$${formatMoney(trade.amount)}</div>
            </div>
        </div>

        <!-- CLOSE BUTTON -->
        <div class="tx-order-close">
            <button class="tx-close-btn" data-tradeid="${tradeId}">
                Close
            </button>
        </div>

        <div class="tx-order-right">
            <div class="tx-order-timer">
                <span class="tx-timer-text">--</span>
            </div>
            <div class="tx-order-pnl neutral">
                <div class="loader loader--style5" title="Loading">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24px" height="30px" viewBox="0 0 24 30">
                        <rect x="0" y="0" width="4" height="10" fill="#333">
                            <animateTransform attributeType="xml" attributeName="transform" type="translate" values="0 0; 0 20; 0 0" begin="0" dur="0.6s" repeatCount="indefinite" />
                        </rect>
                        <rect x="10" y="0" width="4" height="10" fill="#333">
                            <animateTransform attributeType="xml" attributeName="transform" type="translate" values="0 0; 0 20; 0 0" begin="0.2s" dur="0.6s" repeatCount="indefinite" />
                        </rect>
                        <rect x="20" y="0" width="4" height="10" fill="#333">
                            <animateTransform attributeType="xml" attributeName="transform" type="translate" values="0 0; 0 20; 0 0" begin="0.4s" dur="0.6s" repeatCount="indefinite" />
                        </rect>
                    </svg>
                </div>
            </div>
        </div>
    `;

    ordersEl.prepend(wrapper);

    // TIMER
    const timerEl = wrapper.querySelector('.tx-timer-text');
    const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((trade.expiresAt - Date.now()) / 1000));
        timerEl.textContent = remaining + "s";
        if (remaining <= 0) {
            clearInterval(interval);
            wrapper.classList.add('fading');
            setTimeout(() => wrapper.remove(), 600);
            showNoData();
        }
    }, 500);

    // CLOSE BUTTON — IMMEDIATE CLOSE
    wrapper.querySelector('.tx-close-btn').addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            showToast("Please log in", "error");
            return;
        }

        try {
            showToast("Closing trade...", "info");

            const tradeRef = ref(db, `users/${user.uid}/openOrders/${tradeId}`);
            await update(tradeRef, {
                status: "closed",
                closedAt: Date.now()
            });

            showToast("Trade closed!", "success");

            wrapper.classList.add('fading');
            setTimeout(() => {
                wrapper.remove();
                showNoData();
            }, 600);

        } catch (error) {
            console.error("Close failed:", error);
            showToast("Close failed", "error");
        }
    });
}

// ADMIN EMAIL NOTIFICATION
async function sendTradeNotification(user, tradeData) {
    const userSnap = await get(ref(db, `users/${user.uid}`));
    const userData = userSnap.val() || {};

    const lastname = userData.lastname || 'User';
    const email = user.email || 'unknown';

    const templateParams = {
        name: lastname,
        email: email,
        direction: tradeData.direction.toUpperCase(),
        amount: `$${formatMoney(tradeData.amount)}`,
        duration: tradeData.timeframe,
        market: tradeData.market.toUpperCase(),
        symbol: tradeData.symbol.toUpperCase()
    };

    try {
        console.log("Sending Trade Notification...");
        await emailjs.send("service_jkfz31k", "template_vlvyszb", templateParams);
        console.log("Admin notified");
    } catch (error) {
        console.error("EmailJS failed:", error);
        console.log("Admin notification failed");
    }
}

// SUBMIT TRADE — WITH ADMIN EMAIL
async function submitTrade(direction) {
    const symbol = assetEl?.value?.trim();
    const timeframe = tfEl?.value;
    const amount = parseFloat(amountEl?.value?.trim());
    const market = marketInput?.value?.trim() || "crypto";

    if (!symbol || !timeframe || isNaN(amount) || amount < 20) {
        showToast("Invalid Trade, Recheck Parameters", "error");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showToast("Please log in", "error");
        return;
    }

    const uid = user.uid;
    const balanceRef = ref(db, `users/${uid}/balance`);
    const openOrdersRef = ref(db, `users/${uid}/openOrders`);

    try {
        const snap = await get(balanceRef);
        const balance = parseFloat(snap.val()) || 0;

        if (balance < amount) {
            showToast(`Insufficient funds! You have $${balance.toFixed(2)}`, "error");
            return;
        }

        // DEDUCT BALANCE FIRST
        await set(balanceRef, (balance - amount).toFixed(2));

        const tradeData = {
            uid: uid,
            symbol: symbol,
            market: market,
            direction: direction,
            amount: amount,
            timeframe: parseInt(timeframe, 10),
            status: "open",
            openedAt: Date.now(),
            expiresAt: Date.now() + (parseInt(timeframe, 10) * 1000),
            outcome: "pending",
            closedAt: null
        };

        const newRef = push(openOrdersRef);
        await set(newRef, tradeData);

        // SEND EMAIL TO ADMIN
        sendTradeNotification(user, tradeData);

        amountEl.value = "";
        quickEl && (quickEl.value = "");

        showToast("Trade placed successfully!", "success");

    } catch (err) {
        console.error(err);
        showToast("Trade failed: " + err.message, "error");
    }
}

// SYNC UI
function startLiveOrdersSync() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            ordersEl.innerHTML = noDataImg;
            return;
        }

        const openOrdersRef = ref(db, `users/${user.uid}/openOrders`);

        onValue(openOrdersRef, (snapshot) => {
            ordersEl.innerHTML = '';

            let hasOpenTrade = false;

            snapshot.forEach(child => {
                const trade = child.val();
                const tradeId = child.key;

                if (trade.status === "open") {
                    hasOpenTrade = true;
                    createOrderRow(trade, tradeId);
                }
            });

            if (!hasOpenTrade) {
                ordersEl.innerHTML = noDataImg;
            }
        });
    });
}

// AUTO-CLOSE EXPIRED
function startTradeExpirationWatcher() {
    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const openOrdersRef = ref(db, `users/${user.uid}/openOrders`);

        onValue(openOrdersRef, (snapshot) => {
            const now = Date.now();
            const updates = {};

            snapshot.forEach(child => {
                const trade = child.val();
                const key = child.key;

                if (trade.status === "open" && trade.expiresAt <= now) {
                    updates[`${key}/status`] = "closed";
                    updates[`${key}/closedAt`] = now;
                }
            });

            if (Object.keys(updates).length > 0) {
                update(openOrdersRef, updates).catch(console.error);
            }
        });
    });
}

// BUTTONS & INIT
quickEl?.addEventListener('change', () => quickEl.value && (amountEl.value = quickEl.value));

buyEl?.addEventListener('click', (e) => { e.preventDefault(); submitTrade("buy"); });
sellEl?.addEventListener('click', (e) => { e.preventDefault(); submitTrade("sell"); });

// Populate assets
if (assetEl && assetEl.options.length === 0 && typeof COINS !== "undefined") {
    COINS.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.symbol.toUpperCase();
        opt.textContent = c.symbol.toUpperCase();
        assetEl.appendChild(opt);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    startLiveOrdersSync();
    startTradeExpirationWatcher();
    setTimeout(showNoData, 200);
});