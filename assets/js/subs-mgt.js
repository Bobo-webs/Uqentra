// SUBS-MGT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const subsBody = document.getElementById('adminSubsBody');
    if (!subsBody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const usersRef = ref(db, 'users');

        onValue(usersRef, (snapshot) => {
            subsBody.innerHTML = '';

            let subsList = [];

            snapshot.forEach(userSnap => {
                const userUid = userSnap.key;
                const userData = userSnap.val() || {};

                const lastname = userData.lastname || 'No data';

                const subsRef = userSnap.child('allSubscriptions');
                if (!subsRef.exists()) return;

                subsRef.forEach(subSnap => {
                    const subId = subSnap.key;
                    const sub = subSnap.val() || {};

                    subsList.push({
                        userUid,
                        subId,
                        lastname,
                        plan: sub.plan || 'free',
                        billing: sub.billing || 'N/A',
                        status: sub.status || 'active',
                        startDate: sub.startDate || 0,
                        expiryDate: sub.expiryDate || 0,
                        boostPercent: sub.boostPercent || 0,
                        pricePaid: sub.pricePaid || 0
                    });
                });
            });

            if (subsList.length === 0) {
                subsBody.innerHTML = '<tr><td colspan="10">No subscriptions found</td></tr>';
                return;
            }

            // Sort newest first (by startDate)
            subsList.sort((a, b) => b.startDate - a.startDate);

            subsList.forEach(sub => {
                let formattedStart = 'No data';
                if (sub.startDate) {
                    formattedStart = new Date(sub.startDate).toLocaleString();
                }

                let formattedExpiry = 'No expiry';
                if (sub.expiryDate) {
                    formattedExpiry = new Date(sub.expiryDate).toLocaleString();
                }

                const row = document.createElement('tr');
                row.dataset.userUid = sub.userUid;
                row.dataset.subId = sub.subId;

                row.innerHTML = `
                    <td class="admin-actions">
                        <button class="admin-actions-btn edit" data-useruid="${sub.userUid}" data-subid="${sub.subId}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="admin-actions-btn delete" data-useruid="${sub.userUid}" data-subid="${sub.subId}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                    <td>${sub.lastname}</td>
                    <td>${sub.subId}</td>
                    <td>${sub.plan}</td>
                    <td>${sub.billing}</td>
                    <td><span class="sub-status ${sub.status}">${sub.status}</span></td>
                    <td>${formattedStart}</td>
                    <td>${formattedExpiry}</td>
                    <td>${sub.boostPercent}%</td>
                    <td>$${Number(sub.pricePaid).toFixed(2)}</td>
                `;
                subsBody.appendChild(row);
            });
        });
    });

    // EVENT DELEGATION
    document.body.addEventListener('click', async (e) => {
        // DELETE
        const deleteBtn = e.target.closest('.admin-actions-btn.delete');
        if (deleteBtn) {
            const userUid = deleteBtn.dataset.useruid;
            const subId = deleteBtn.dataset.subid;
            document.getElementById('subDeleteOverlay').classList.add('active');
            document.getElementById('subDeleteOverlay').dataset.targetUserUid = userUid;
            document.getElementById('subDeleteOverlay').dataset.targetSubId = subId;
        }

        if (e.target.id === 'subDeleteConfirm') {
            const overlay = document.getElementById('subDeleteOverlay');
            const userUid = overlay.dataset.targetUserUid;
            const subId = overlay.dataset.targetSubId;
            overlay.classList.remove('active');

            try {
                showToast("Deleting subscription...", "info");
                await remove(ref(db, `users/${userUid}/allSubscriptions/${subId}`));
                showToast("Subscription deleted", "success");
            } catch (error) {
                showToast("Delete failed", "error");
            }
        }

        if (e.target.id === 'subDeleteCancel') {
            document.getElementById('subDeleteOverlay').classList.remove('active');
        }

        // EDIT
        const editBtn = e.target.closest('.admin-actions-btn.edit');
        if (editBtn) {
            const userUid = editBtn.dataset.useruid;
            const subId = editBtn.dataset.subid;
            const overlay = document.getElementById('subEditOverlay');
            overlay.classList.add('active');
            overlay.dataset.targetUserUid = userUid;
            overlay.dataset.targetSubId = subId;

            const subSnap = await get(ref(db, `users/${userUid}/allSubscriptions/${subId}`));
            const sub = subSnap.val() || {};

            document.getElementById('subId').value = subId;

            document.getElementById('subPlan').value = sub.plan || 'free';
            document.getElementById('subBilling').value = sub.billing || 'monthly';
            document.getElementById('subStatus').value = sub.status || 'active';
            document.getElementById('subBoost').value = sub.boostPercent || 0;
            document.getElementById('subPricePaid').value = sub.pricePaid || 0;

            if (sub.startDate) {
                const date = new Date(sub.startDate);
                const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                document.getElementById('subStartDate').value = local.toISOString().slice(0, 16);
            } else {
                document.getElementById('subStartDate').value = '';
            }

            if (sub.expiryDate) {
                const date = new Date(sub.expiryDate);
                const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                document.getElementById('subExpiryDate').value = local.toISOString().slice(0, 16);
            } else {
                document.getElementById('subExpiryDate').value = '';
            }
        }

        if (e.target.id === 'closeSubModal') {
            document.getElementById('subEditOverlay').classList.remove('active');
        }
    });

    // EDIT FORM SUBMIT
    document.getElementById('adminSubForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const overlay = document.getElementById('subEditOverlay');
        const userUid = overlay.dataset.targetUserUid;
        const subId = overlay.dataset.targetSubId;

        try {
            showToast("Saving subscription changes...", "info");

            const startStr = document.getElementById('subStartDate').value;
            const startDate = startStr ? new Date(startStr).getTime() : Date.now();

            const expiryStr = document.getElementById('subExpiryDate').value;
            const expiryDate = expiryStr ? new Date(expiryStr).getTime() : null;

            const updates = {
                plan: document.getElementById('subPlan').value,
                billing: document.getElementById('subBilling').value,
                status: document.getElementById('subStatus').value,
                startDate: startDate,
                expiryDate: expiryDate,
                boostPercent: parseInt(document.getElementById('subBoost').value) || 0,
                pricePaid: parseFloat(document.getElementById('subPricePaid').value) || 0
            };

            await update(ref(db, `users/${userUid}/allSubscriptions/${subId}`), updates);

            showToast("Subscription updated!", "success");
            overlay.classList.remove('active');

        } catch (error) {
            console.error("Edit failed:", error);
            showToast("Update failed", "error");
        }
    });
});