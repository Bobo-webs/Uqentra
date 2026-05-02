// DEPOSITS-MGT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, get, set, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js"; // ← update imported
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const depositsBody = document.getElementById('adminDepositsBody');
    if (!depositsBody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const usersRef = ref(db, 'users');

        onValue(usersRef, (snapshot) => {
            depositsBody.innerHTML = '';

            let depositsList = [];

            snapshot.forEach(userSnap => {
                const userUid = userSnap.key;
                const userData = userSnap.val() || {};

                const lastname = userData.lastname || 'No data';
                const email = userData.email || 'No data';

                const depositsRef = userSnap.child('allDeposits');
                if (!depositsRef.exists()) return;

                depositsRef.forEach(depositSnap => {
                    const depositId = depositSnap.key;
                    const deposit = depositSnap.val() || {};

                    depositsList.push({
                        userUid,
                        depositId,
                        lastname,
                        email,
                        amount: deposit.amount || 0,
                        cryptoName: deposit.cryptoName || 'No data',
                        timestamp: deposit.timestamp || 0,
                        status: deposit.status || 'pending'
                    });
                });
            });

            if (depositsList.length === 0) {
                depositsBody.innerHTML = '<tr><td colspan="8">No deposits found</td></tr>';
                return;
            }

            // Sort newest first
            depositsList.sort((a, b) => b.timestamp - a.timestamp);

            depositsList.forEach(deposit => {
                let formattedDate = 'No data';
                if (deposit.timestamp) {
                    const date = new Date(deposit.timestamp);
                    formattedDate = date.toLocaleString();
                }

                const row = document.createElement('tr');
                row.dataset.userUid = deposit.userUid;
                row.dataset.depositId = deposit.depositId;

                row.innerHTML = `
                    <td>
                        <div class="admin-actions">
                            <button class="admin-actions-btn edit" data-useruid="${deposit.userUid}" data-depositid="${deposit.depositId}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="admin-actions-btn delete" data-useruid="${deposit.userUid}" data-depositid="${deposit.depositId}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                    <td>${deposit.lastname}</td>
                    <td>${formattedDate}</td>
                    <td>${deposit.depositId}</td>
                    <td><span class="deposits-status ${deposit.status}">${deposit.status}</span></td>
                    <td>$${Number(deposit.amount).toFixed(2)}</td>
                    <td>${deposit.cryptoName}</td>
                    <td>${deposit.email}</td>
                    
                `;
                depositsBody.appendChild(row);
            });
        });
    });

    // EVENT DELEGATION
    document.body.addEventListener('click', async (e) => {
        // DELETE
        const deleteBtn = e.target.closest('.admin-actions-btn.delete');
        if (deleteBtn) {
            const userUid = deleteBtn.dataset.useruid;
            const depositId = deleteBtn.dataset.depositid;
            document.getElementById('depositDeleteOverlay').classList.add('active');
            document.getElementById('depositDeleteOverlay').dataset.targetUserUid = userUid;
            document.getElementById('depositDeleteOverlay').dataset.targetDepositId = depositId;
        }

        if (e.target.id === 'depositDeleteConfirm') {
            const overlay = document.getElementById('depositDeleteOverlay');
            const userUid = overlay.dataset.targetUserUid;
            const depositId = overlay.dataset.targetDepositId;
            overlay.classList.remove('active');

            try {
                showToast("Deleting deposit...", "info");
                await remove(ref(db, `users/${userUid}/allDeposits/${depositId}`));
                showToast("Deposit deleted", "success");
            } catch (error) {
                showToast("Delete failed", "error");
            }
        }

        if (e.target.id === 'depositDeleteCancel') {
            document.getElementById('depositDeleteOverlay').classList.remove('active');
        }

        // EDIT
        const editBtn = e.target.closest('.admin-actions-btn.edit');
        if (editBtn) {
            const userUid = editBtn.dataset.useruid;
            const depositId = editBtn.dataset.depositid;
            const overlay = document.getElementById('depositEditOverlay');
            overlay.classList.add('active');
            overlay.dataset.targetUserUid = userUid;
            overlay.dataset.targetDepositId = depositId;

            const depositSnap = await get(ref(db, `users/${userUid}/allDeposits/${depositId}`));
            const deposit = depositSnap.val() || {};

            document.getElementById('depositUid').value = depositId;
            document.getElementById('depositAmount').value = deposit.amount || 0;
            document.getElementById('depositCryptoName').value = deposit.cryptoName || '';
            document.getElementById('depositStatus').value = deposit.status || 'pending';

            if (deposit.timestamp) {
                const date = new Date(deposit.timestamp);
                const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                document.getElementById('depositTimestamp').value = local.toISOString().slice(0,16);
            } else {
                document.getElementById('depositTimestamp').value = '';
            }
        }

        if (e.target.id === 'closeDepositModal') {
            document.getElementById('depositEditOverlay').classList.remove('active');
        }
    });

    // EDIT FORM SUBMIT
    document.getElementById('adminDepositForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const overlay = document.getElementById('depositEditOverlay');
        const userUid = overlay.dataset.targetUserUid;
        const depositId = overlay.dataset.targetDepositId;

        try {
            showToast("Saving deposit changes...", "info");

            const timestampStr = document.getElementById('depositTimestamp').value;
            const timestamp = timestampStr ? new Date(timestampStr).getTime() : Date.now();

            const updates = {
                amount: parseFloat(document.getElementById('depositAmount').value) || 0,
                cryptoName: document.getElementById('depositCryptoName').value.trim() || null,
                timestamp: timestamp,
                status: document.getElementById('depositStatus').value
            };

            await update(ref(db, `users/${userUid}/allDeposits/${depositId}`), updates);

            showToast("Deposit updated!", "success");
            overlay.classList.remove('active');

        } catch (error) {
            console.error("Edit failed:", error);
            showToast("Update failed", "error");
        }
    });
});