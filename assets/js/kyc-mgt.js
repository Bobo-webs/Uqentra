// KYC-MGT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, get, set, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const kycBody = document.getElementById('adminKycBody');
    if (!kycBody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const kycRef = ref(db, 'kycSubmissions');

        onValue(kycRef, (snapshot) => {
            kycBody.innerHTML = '';

            let kycList = [];

            snapshot.forEach(child => {
                const userUid = child.key;
                const kyc = child.val() || {};

                kycList.push({
                    userUid,
                    timestamp: kyc.timestamp || 0,
                    status: kyc.status || 'pending',
                    fullName: kyc.fullName || 'No data',
                    dateOfBirth: kyc.dateOfBirth || 'No data',
                    address: `${kyc.street || ''}, ${kyc.city || ''}, ${kyc.state || ''} ${kyc.postalCode || ''}, ${kyc.country || ''}`.trim() || 'No data',
                    phone: kyc.phone || 'No data',
                    documentType: kyc.documentType || 'No data',
                    idFront: kyc.idFront || '',
                    idBack: kyc.idBack || ''
                });
            });

            if (kycList.length === 0) {
                kycBody.innerHTML = '<tr><td colspan="11">No KYC submissions found</td></tr>';
                return;
            }

            // Sort newest first
            kycList.sort((a, b) => b.timestamp - a.timestamp);

            kycList.forEach(async (kyc) => {
                const userSnap = await get(ref(db, `users/${kyc.userUid}`));
                const userData = userSnap.val() || {};
                const lastname = userData.lastname || 'No data';

                let formattedDate = 'No data';
                if (kyc.timestamp) {
                    formattedDate = new Date(kyc.timestamp).toLocaleString();
                }

                const row = document.createElement('tr');
                row.dataset.userUid = kyc.userUid;

                row.innerHTML = `
                    <td>
                        <div class="admin-actions">
                            <button class="admin-actions-btn edit" data-useruid="${kyc.userUid}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="admin-actions-btn delete" data-useruid="${kyc.userUid}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                    <td>${lastname}</td>
                    <td>${formattedDate}</td>
                    <td><span class="deposits-status ${kyc.status}">${kyc.status}</span></td>
                    <td>${kyc.documentType}</td>
                    <td>
                        <div class="admin-image-actions">
                            <button class="admin-image-btn view" data-image="${kyc.idFront}">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <a class="admin-image-btn download" href="${kyc.idFront}" download="${kyc.userUid}-front.jpg">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>
                    </td>

                    <td>
                        <div class="admin-image-actions">
                            <button class="admin-image-btn view" data-image="${kyc.idBack || ''}">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <a class="admin-image-btn download" href="${kyc.idBack || '#'}" download="${kyc.userUid}-back.jpg" ${kyc.idBack ? '' : 'disabled'}>
                                <i class="fa-solid fa-download"></i>
                            </a>
                            ${kyc.idBack ? '' : '<span>No image</span>'}
                        </div>
                    </td>
                    <td>${kyc.fullName}</td>
                    <td>${kyc.dateOfBirth}</td>
                    <td>${kyc.address}</td>
                    <td>${kyc.phone}</td>
                `;
                kycBody.appendChild(row);
            });
        });
    });

    // EVENT DELEGATION
    document.body.addEventListener('click', async (e) => {
        // DELETE
        const deleteBtn = e.target.closest('.admin-actions-btn.delete');
        if (deleteBtn) {
            const userUid = deleteBtn.dataset.useruid;
            document.getElementById('kycDeleteOverlay').classList.add('active');
            document.getElementById('kycDeleteOverlay').dataset.targetUserUid = userUid;
        }

        if (e.target.id === 'kycDeleteConfirm') {
            const overlay = document.getElementById('kycDeleteOverlay');
            const userUid = overlay.dataset.targetUserUid;
            overlay.classList.remove('active');

            try {
                showToast("Deleting KYC...", "info");
                await remove(ref(db, `kycSubmissions/${userUid}`));
                showToast("KYC deleted", "success");
            } catch (error) {
                showToast("Delete failed", "error");
            }
        }

        if (e.target.id === 'kycDeleteCancel') {
            document.getElementById('kycDeleteOverlay').classList.remove('active');
        }

        // EDIT
        const editBtn = e.target.closest('.admin-actions-btn.edit');
        if (editBtn) {
            const userUid = editBtn.dataset.useruid;
            const overlay = document.getElementById('kycEditOverlay');
            overlay.classList.add('active');
            overlay.dataset.targetUserUid = userUid;

            const kycSnap = await get(ref(db, `kycSubmissions/${userUid}`));
            const kyc = kycSnap.val() || {};

            document.getElementById('kycUid').value = userUid;
            document.getElementById('kycFullName').value = kyc.fullName || '';
            document.getElementById('kycStatus').value = kyc.status || 'pending';
        }

        if (e.target.id === 'closeKycModal') {
            document.getElementById('kycEditOverlay').classList.remove('active');
        }

        // VIEW IMAGE
        const viewBtn = e.target.closest('.admin-image-btn.view');
        if (viewBtn) {
            const imageUrl = viewBtn.dataset.image;
            if (imageUrl) {
                document.getElementById('imageView').src = imageUrl;
                document.getElementById('imageViewOverlay').classList.add('active');
            }
        }

        if (e.target.id === 'closeImageModal') {
            document.getElementById('imageViewOverlay').classList.remove('active');
        }
    });

    // EDIT FORM SUBMIT
    document.getElementById('adminKycForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const overlay = document.getElementById('kycEditOverlay');
        const userUid = overlay.dataset.targetUserUid;

        try {
            showToast("Saving KYC changes...", "info");

            const updates = {
                status: document.getElementById('kycStatus').value
            };

            await update(ref(db, `kycSubmissions/${userUid}`), updates);

            showToast("KYC updated!", "success");
            overlay.classList.remove('active');

        } catch (error) {
            console.error("Edit failed:", error);
            showToast("Update failed", "error");
        }
    });
});