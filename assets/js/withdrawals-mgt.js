// WITHDRAWALS-MGT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const withdrawalsBody = document.getElementById('adminWithdrawalsBody');
    if (!withdrawalsBody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const usersRef = ref(db, 'users');

        onValue(usersRef, (snapshot) => {
            withdrawalsBody.innerHTML = '';

            let withdrawalsList = [];

            snapshot.forEach(userSnap => {
                const userUid = userSnap.key;
                const userData = userSnap.val() || {};

                const lastname = userData.lastname || 'No data';
                const email = userData.email || 'No data';

                const withdrawalsRef = userSnap.child('allWithdrawals');
                if (!withdrawalsRef.exists()) return;

                withdrawalsRef.forEach(withdrawalSnap => {
                    const withdrawalId = withdrawalSnap.key;
                    const withdrawal = withdrawalSnap.val() || {};

                    withdrawalsList.push({
                        userUid,
                        withdrawalId,
                        lastname,
                        email,
                        amount: withdrawal.amount || 0,
                        crypto: withdrawal.crypto || 'No data',
                        walletAddress: withdrawal.walletAddress || 'No data',
                        timestamp: withdrawal.timestamp || 0,
                        status: withdrawal.status || 'pending'
                    });
                });
            });

            if (withdrawalsList.length === 0) {
                withdrawalsBody.innerHTML = '<tr><td colspan="9">No withdrawals found</td></tr>';
                return;
            }

            // Sort newest first
            withdrawalsList.sort((a, b) => b.timestamp - a.timestamp);

            withdrawalsList.forEach(w => {
                let formattedDate = 'No data';
                if (w.timestamp) {
                    const date = new Date(w.timestamp);
                    formattedDate = date.toLocaleString();
                }

                const row = document.createElement('tr');
                row.dataset.userUid = w.userUid;
                row.dataset.withdrawalId = w.withdrawalId;

                row.innerHTML = `
                    <td>
                        <div class="admin-actions">
                            <button class="admin-actions-btn edit" data-useruid="${w.userUid}" data-withdrawalid="${w.withdrawalId}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="admin-actions-btn delete" data-useruid="${w.userUid}" data-withdrawalid="${w.withdrawalId}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                    <td>${w.lastname}</td>
                    <td>${formattedDate}</td>
                    <td>${w.withdrawalId}</td>
                    <td><span class="deposits-status ${w.status}">${w.status}</span></td>
                    <td>$${Number(w.amount).toFixed(2)}</td>
                    <td>${w.crypto}</td>
                    <td>${w.walletAddress}</td>
                    <td>${w.email}</td>
                `;
                withdrawalsBody.appendChild(row);
            });
        });
    });

    // EVENT DELEGATION
    document.body.addEventListener('click', async (e) => {
        // DELETE
        const deleteBtn = e.target.closest('.admin-actions-btn.delete');
        if (deleteBtn) {
            const userUid = deleteBtn.dataset.useruid;
            const withdrawalId = deleteBtn.dataset.withdrawalid;
            document.getElementById('withdrawalDeleteOverlay').classList.add('active');
            document.getElementById('withdrawalDeleteOverlay').dataset.targetUserUid = userUid;
            document.getElementById('withdrawalDeleteOverlay').dataset.targetWithdrawalId = withdrawalId;
        }

        if (e.target.id === 'withdrawalDeleteConfirm') {
            const overlay = document.getElementById('withdrawalDeleteOverlay');
            const userUid = overlay.dataset.targetUserUid;
            const withdrawalId = overlay.dataset.targetWithdrawalId;
            overlay.classList.remove('active');

            try {
                showToast("Deleting withdrawal...", "info");
                await remove(ref(db, `users/${userUid}/allWithdrawals/${withdrawalId}`));
                showToast("Withdrawal deleted", "success");
            } catch (error) {
                showToast("Delete failed", "error");
            }
        }

        if (e.target.id === 'withdrawalDeleteCancel') {
            document.getElementById('withdrawalDeleteOverlay').classList.remove('active');
        }

        // EDIT
        const editBtn = e.target.closest('.admin-actions-btn.edit');
        if (editBtn) {
            const userUid = editBtn.dataset.useruid;
            const withdrawalId = editBtn.dataset.withdrawalid;
            const overlay = document.getElementById('withdrawalEditOverlay');
            overlay.classList.add('active');
            overlay.dataset.targetUserUid = userUid;
            overlay.dataset.targetWithdrawalId = withdrawalId;

            const withdrawalSnap = await get(ref(db, `users/${userUid}/allWithdrawals/${withdrawalId}`));
            const withdrawal = withdrawalSnap.val() || {};

            document.getElementById('withdrawalId').value = withdrawalId;
            document.getElementById('withdrawalAmount').value = withdrawal.amount || 0;
            document.getElementById('withdrawalCrypto').value = withdrawal.crypto || '';
            document.getElementById('withdrawalWallet').value = withdrawal.walletAddress || '';
            document.getElementById('withdrawalStatus').value = withdrawal.status || 'pending';

            if (withdrawal.timestamp) {
                const date = new Date(withdrawal.timestamp);
                const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                document.getElementById('withdrawalTimestamp').value = local.toISOString().slice(0, 16);
            } else {
                document.getElementById('withdrawalTimestamp').value = '';
            }
        }

        if (e.target.id === 'closeWithdrawalModal') {
            document.getElementById('withdrawalEditOverlay').classList.remove('active');
        }
    });

    // EDIT FORM SUBMIT
    document.getElementById('adminWithdrawalForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const overlay = document.getElementById('withdrawalEditOverlay');
        const userUid = overlay.dataset.targetUserUid;
        const withdrawalId = overlay.dataset.targetWithdrawalId;

        try {
            showToast("Saving withdrawal changes...", "info");

            const timestampStr = document.getElementById('withdrawalTimestamp').value;
            const timestamp = timestampStr ? new Date(timestampStr).getTime() : Date.now();

            const updates = {
                amount: parseFloat(document.getElementById('withdrawalAmount').value) || 0,
                crypto: document.getElementById('withdrawalCrypto').value.trim() || null,
                walletAddress: document.getElementById('withdrawalWallet').value.trim() || null,
                timestamp: timestamp,
                status: document.getElementById('withdrawalStatus').value
            };

            await update(ref(db, `users/${userUid}/allWithdrawals/${withdrawalId}`), updates);

            showToast("Withdrawal updated!", "success");
            overlay.classList.remove('active');

        } catch (error) {
            console.error("Edit failed:", error);
            showToast("Update failed", "error");
        }
    });
});