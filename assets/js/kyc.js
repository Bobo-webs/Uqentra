// KYC.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const kycCard = document.querySelector('.kyc-card');
    const kycForm = document.getElementById('kycForm');

    if (!kycCard || !kycForm) {
        console.error("KYC card or form not found");
        return;
    }

    const statusContainer = document.createElement('div');
    statusContainer.className = 'kyc-status-container';
    statusContainer.style.display = 'none';
    kycCard.appendChild(statusContainer);

    // LOCALSTORAGE KEY
    const STORAGE_KEY = 'kycStatusCache';

    // SAVE STATUS TO LOCALSTORAGE
    function saveStatusToCache(status, html, className) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            status,
            html,
            className,
            timestamp: Date.now()
        }));
    }

    // LOAD FROM LOCALSTORAGE (INSTANT)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
        const cache = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - cache.timestamp < 300000) {
            kycForm.style.display = 'none';
            statusContainer.style.display = 'flex';
            statusContainer.className = `kyc-status-container ${cache.className}`;
            statusContainer.innerHTML = cache.html;

            // Re-attach refill button listener
            const refillBtn = statusContainer.querySelector('.refresh-btn');
            if (refillBtn) {
                refillBtn.addEventListener('click', handleRefill);
            }
        }
    }

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const kycRef = ref(db, `kycSubmissions/${user.uid}`);

        onValue(kycRef, (snapshot) => {
            const data = snapshot.val();

            if (!data || !data.status) {
                kycForm.style.display = 'block';
                statusContainer.style.display = 'none';
                localStorage.removeItem(STORAGE_KEY); // Clear cache
                initFormLogic();
                return;
            }

            kycForm.style.display = 'none';
            statusContainer.style.display = 'flex';

            let html = '';
            let className = '';

            if (data.status === "pending") {
                className = 'pending';
                html = `
                    <i class="fa-solid fa-hourglass-half status-icon"></i>
                    <h3>KYC Being Verified</h3>
                    <p>Your documents are under review. This usually takes  1 - 7 days.</p>
                `;
            } else if (data.status === "success") {
                className = 'success';
                html = `
                    <i class="fa-solid fa-check-circle status-icon"></i>
                    <h3>KYC Verification Successful</h3>
                    <p>Congratulations! Your identity has been verified.</p>
                `;
            } else if (data.status === "failed") {
                className = 'failed';
                html = `
                    <i class="fa-solid fa-times-circle status-icon"></i>
                    <h3>KYC Verification Failed</h3>
                    <p>Your submission didn't meet requirements.</p>
                    <p>Please try again with clear documents.</p>
                    <button class="refresh-btn">Refill Form</button>
                `;
            }

            statusContainer.className = `kyc-status-container ${className}`;
            statusContainer.innerHTML = html;

            // Save to cache
            saveStatusToCache(data.status, html, className);

            // Refill button
            const refillBtn = statusContainer.querySelector('.refresh-btn');
            if (refillBtn) {
                refillBtn.addEventListener('click', handleRefill);
            }
        });
    });

    // REFILL FORM — DELETE SUBMISSION
    async function handleRefill() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            showToast("Preparing new form...", "info");
            await remove(ref(db, `kycSubmissions/${user.uid}`));
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        } catch (error) {
            showToast("Failed to reset", "error");
        }
    }

    function initFormLogic() {
        const steps = ['stepPersonal', 'stepAddress', 'stepDocuments', 'stepReview'];
        const stepEls = steps.map(id => document.getElementById(id));
        const stepCircles = [
            document.getElementById('kycStep1'),
            document.getElementById('kycStep2'),
            document.getElementById('kycStep3'),
            document.getElementById('kycStep4')
        ];

        let current = 0;

        function validateCurrentStep() {
            const inputs = stepEls[current].querySelectorAll('input[required], select[required]');
            let valid = true;
            inputs.forEach(input => {
                if (input.type === 'file') {
                    if (!input.files || input.files.length === 0) { valid = false; input.style.borderColor = '#ef4444'; }
                    else input.style.borderColor = '';
                } else {
                    if (!input.value.trim()) { valid = false; input.style.borderColor = '#ef4444'; }
                    else input.style.borderColor = '';
                }
            });
            return valid;
        }

        function updateStepCircles() {
            stepCircles.forEach((c, i) => c.classList.toggle('active', i <= current));
        }

        function goToStep(n) {
            if (n > current && !validateCurrentStep()) {
                showToast("Please fill all required fields", "error");
                return;
            }
            stepEls.forEach((el, i) => el.classList.toggle('active', i === n));
            current = n;
            updateStepCircles();
        }

        const nav = { 'toAddress': 1, 'backToPersonal': 0, 'toDocuments': 2, 'backToAddress': 1, 'toReview': 3, 'backToDocs': 2 };
        Object.keys(nav).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = () => goToStep(nav[id]);
        });

        document.getElementById('kycSubmitBtn').onclick = async (e) => {
            e.preventDefault();

            let allValid = true;
            stepEls.forEach((step, i) => {
                if (i < 3) {
                    const inputs = step.querySelectorAll('input[required], select[required]');
                    inputs.forEach(input => {
                        if ((input.type === 'file' && input.files.length === 0) || (input.type !== 'file' && !input.value.trim())) {
                            allValid = false;
                        }
                    });
                }
            });

            if (!allValid) {
                showToast("Please complete all required fields", "error");
                return;
            }

            const user = auth.currentUser;
            if (!user) return;

            try {
                const fileToBase64 = (file) => new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });

                showToast("Submitting KYC...", "info");

                const frontFile = document.getElementById('kycFront').files[0];
                const backFile = document.getElementById('kycBack').files[0];

                const kycData = {
                    uid: user.uid,
                    fullName: document.getElementById('kycName').value.trim(),
                    dateOfBirth: document.getElementById('kycDOB').value,
                    phone: document.getElementById('kycPhone').value.trim(),
                    street: document.getElementById('kycStreet').value.trim(),
                    city: document.getElementById('kycCity').value.trim(),
                    state: document.getElementById('kycState').value.trim(),
                    postalCode: document.getElementById('kycPostal').value.trim(),
                    country: document.getElementById('kycCountry').value,
                    documentType: document.getElementById('kycDocType').value,
                    idFront: await fileToBase64(frontFile),
                    idBack: backFile ? await fileToBase64(backFile) : null,
                    status: "pending",
                    timestamp: Date.now(),
                    submittedAt: new Date().toISOString()
                };

                await set(ref(db, `kycSubmissions/${user.uid}`), kycData);

                showToast("KYC Submitted Successfully!", "success");

            } catch (error) {
                console.error("KYC FAILED:", error);
                showToast("Submission failed. Try again.", "error");
            }
        };

        goToStep(0);
    }
});