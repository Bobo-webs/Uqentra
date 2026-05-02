// USERS-MGT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, get, set, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js"; // ← ADDED update
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const usersBody = document.getElementById('adminUsersBody');
    if (!usersBody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const usersRef = ref(db, 'users');

        onValue(usersRef, (snapshot) => {
            usersBody.innerHTML = '';

            if (!snapshot.exists()) {
                usersBody.innerHTML = '<tr><td colspan="7">No users found</td></tr>';
                return;
            }

            snapshot.forEach(child => {
                const uid = child.key;
                const data = child.val() || {};

                if (data.role === "admin") {
                    return;
                }

                const row = document.createElement('tr');
                row.dataset.uid = uid;
                row.innerHTML = `
                    <td>
                        <div class="admin-actions">
                            <button class="admin-actions-btn edit" data-uid="${uid}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="admin-actions-btn delete" data-uid="${uid}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                    <td>${data.lastname || 'No data'}</td>
                    <td>${data.email || 'No data'}</td>
                    <td>$${Number(data.balance || 0).toFixed(2)}</td>
                    <td>$${Number(data.deposits || 0).toFixed(2)}</td>
                    <td>$${Number(data.withdrawals || 0).toFixed(2)}</td>
                    <td>${uid}</td>
                `;
                usersBody.appendChild(row);
            });
        });
    });

    // EVENT DELEGATION
    document.body.addEventListener('click', async (e) => {
        // DELETE
        const deleteBtn = e.target.closest('.admin-actions-btn.delete');
        if (deleteBtn) {
            const uid = deleteBtn.dataset.uid;
            document.getElementById('deletePopupOverlay').classList.add('active');
            document.getElementById('deletePopupOverlay').dataset.targetUid = uid;
        }

        if (e.target.id === 'deleteConfirm') {
            const overlay = document.getElementById('deletePopupOverlay');
            const uid = overlay.dataset.targetUid;
            overlay.classList.remove('active');

            try {
                showToast("Deleting user...", "info");
                await remove(ref(db, `users/${uid}`));
                showToast("User deleted", "success");
            } catch (error) {
                showToast("Delete failed", "error");
            }
        }

        if (e.target.id === 'deleteCancel') {
            document.getElementById('deletePopupOverlay').classList.remove('active');
        }

        // EDIT
        const editBtn = e.target.closest('.admin-actions-btn.edit');
        if (editBtn) {
            const uid = editBtn.dataset.uid;
            const overlay = document.getElementById('editModalOverlay');
            overlay.classList.add('active');
            overlay.dataset.targetUid = uid;

            const snap = await get(ref(db, `users/${uid}`));
            const data = snap.val() || {};

            document.getElementById('editLastname').value = data.lastname || '';
            document.getElementById('editBalance').value = data.balance || 0;
            document.getElementById('editDeposits').value = data.deposits || 0;
            document.getElementById('editWithdrawals').value = data.withdrawals || 0;
            document.getElementById('editCryptoSignal').value = data.cryptoSignal || '';
            document.getElementById('editIndexSignal').value = data.indexSignal || '';
            document.getElementById('editStockSignal').value = data.stockSignal || '';
        }

        if (e.target.id === 'closeEditModal') {
            document.getElementById('editModalOverlay').classList.remove('active');
        }
    });

    // EDIT FORM SUBMIT
    document.getElementById('adminEditForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const overlay = document.getElementById('editModalOverlay');
        const uid = overlay.dataset.targetUid;

        try {
            showToast("Saving changes...", "info");

            const updates = {
                lastname: document.getElementById('editLastname').value.trim() || null,
                balance: parseFloat(document.getElementById('editBalance').value) || 0,
                deposits: parseFloat(document.getElementById('editDeposits').value) || 0,
                withdrawals: parseFloat(document.getElementById('editWithdrawals').value) || 0,
                cryptoSignal: document.getElementById('editCryptoSignal').value.trim() || null,
                indexSignal: document.getElementById('editIndexSignal').value.trim() || null,
                stockSignal: document.getElementById('editStockSignal').value.trim() || null
            };

            await update(ref(db, `users/${uid}`), updates);

            showToast("User updated!", "success");
            overlay.classList.remove('active');

        } catch (error) {
            console.error("Edit failed:", error);
            showToast("Update failed", "error");
        }
    });
});