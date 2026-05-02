// PLAN.JS

import { auth, db } from "/assets/js/firebase-init.js";
import {
    ref,
    get,
    set,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const switchInput = document.getElementById('billingSwitch');
    const modalOverlay = document.getElementById('subModalOverlay');
    const selectedPlanName = document.getElementById('selectedPlanName');
    const selectedRate = document.getElementById('selectedRate');
    const selectedPrice = document.getElementById('selectedPrice');
    const userBalanceEl = document.getElementById('userBalance');
    const confirmBtn = document.getElementById('confirmSubscription');

    let selectedPlan = null;
    let isYearly = false;

    /* ======= TOGGLE MONTHLY / YEARLY ======== */
    switchInput?.addEventListener('change', () => {
        isYearly = switchInput.checked;

        document.querySelectorAll('.price-amount').forEach(el => {
            el.textContent = isYearly ? el.dataset.yearly : el.dataset.monthly;
        });

        document.querySelectorAll('.price-period').forEach(el => {
            if (el.closest('.plan-card').dataset.plan === 'free') {
                el.textContent = "/ forever";
            } else {
                el.textContent = isYearly ? "/ year" : "/ month";
            }
        });
    });

    /* ======== OPEN MODAL ======== */
    document.querySelectorAll('.plan-subscribe').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.disabled) return;

            const card = btn.closest('.plan-card');
            selectedPlan = card.dataset.plan;

            selectedPlanName.textContent =
                card.querySelector('.plan-header h4').textContent;
            selectedRate.textContent =
                card.querySelector('.plan-rate').textContent;

            const priceAmount = card.querySelector('.price-amount').textContent;
            const period = card.querySelector('.price-period').textContent;
            selectedPrice.textContent = priceAmount + period;

            onAuthStateChanged(auth, async (user) => {
                if (!user) return;
                const balSnap = await get(ref(db, `users/${user.uid}/balance`));
                const balance = parseFloat(balSnap.val()) || 0;
                userBalanceEl.textContent = `$${balance.toFixed(2)} USD`;
            });

            modalOverlay.classList.add('active');
        });
    });

    document.getElementById('closeSubModal')
        ?.addEventListener('click', () => modalOverlay.classList.remove('active'));

    /* ======== CONFIRM SUBSCRIPTION ========= */
    confirmBtn?.addEventListener('click', () => {
        onAuthStateChanged(auth, async (user) => {
            if (!user || !selectedPlan) return;

            const card = document.querySelector(
                `.plan-card[data-plan="${selectedPlan}"]`
            );

            const priceStr = isYearly
                ? card.dataset.yearly
                : card.dataset.monthly;

            const price = Number(priceStr);

            try {
                const balanceRef = ref(db, `users/${user.uid}/balance`);
                const balanceSnap = await get(balanceRef);
                const balance = parseFloat(balanceSnap.val()) || 0;

                if (balance < price) {
                    showToast("Insufficient balance", "error");
                    modalOverlay.classList.remove('active');
                    return;
                }

                await set(balanceRef, (balance - price).toFixed(2));

                const days = isYearly ? 365 : 30;
                const expiry = Date.now() + days * 24 * 60 * 60 * 1000;

                const historyRef = ref(
                    db,
                    `users/${user.uid}/allSubscriptions`
                );

                /* EXPIRE ANY ACTIVE SUB */
                const historySnap = await get(historyRef);
                historySnap.forEach(child => {
                    if (child.val().status === "active") {
                        set(child.ref.child("status"), "expired");
                    }
                });

                /* CREATE NEW ACTIVE SUB */
                const newSubRef = push(historyRef);
                await set(newSubRef, {
                    plan: selectedPlan,
                    billing: isYearly ? "yearly" : "monthly",
                    startDate: Date.now(),
                    expiryDate: expiry,
                    boostPercent:
                        selectedPlan === "free"
                            ? 0
                            : selectedPlan === "couples"
                                ? 40
                                : 50,
                    pricePaid: price,
                    status: "active",
                    createdAt: Date.now()
                });

                showToast("Subscription successful!", "success");
                modalOverlay.classList.remove('active');
                updatePlanUI(selectedPlan);

            } catch (error) {
                console.error("Subscription failed:", error);
                showToast("Subscription failed", "error");
            }
        });
    });

    /* ========= UPDATE UI (MODIFIED) ========== */
    function updatePlanUI(activePlan) {
        const hasPaidPlan = activePlan && activePlan !== "free";

        document.querySelectorAll('.plan-card').forEach(card => {
            const btn = card.querySelector('.plan-subscribe');
            card.classList.remove('active');

            if (card.dataset.plan === activePlan) {
                card.classList.add('active');
                btn.textContent = "Current Plan";
                btn.disabled = true;
                btn.style.display = "inline-block";
            } else {
                if (hasPaidPlan) {
                    btn.style.display = "none";
                } else {
                    btn.textContent = "Subscribe Now";
                    btn.disabled = false;
                    btn.style.display = "inline-block";
                }
            }
        });
    }

    /* ====== LOAD ACTIVE SUB + EXPIRY CHECK ====== */
    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const historyRef = ref(
            db,
            `users/${user.uid}/allSubscriptions`
        );

        onValue(historyRef, async (snap) => {
            let activeSub = null;

            snap.forEach(child => {
                const sub = child.val();
                if (sub.status === "active") {
                    activeSub = { ...sub, key: child.key };
                }
            });

            if (!activeSub) {
                updatePlanUI("free");
                return;
            }

            /* EXPIRY CHECK */
            if (activeSub.expiryDate && Date.now() > activeSub.expiryDate) {
                await set(
                    ref(db, `users/${user.uid}/allSubscriptions/${activeSub.key}/status`),
                    "expired"
                );

                updatePlanUI("free");
                return;
            }

            updatePlanUI(activeSub.plan);
        });
    });
});