(function () {
    let isOnline = navigator.onLine;

    // Toast container
    const toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
        position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
        z-index:99999;pointer-events:none;display:flex;flex-direction:column;
        gap:12px;align-items:center;font-family:Poppins,sans-serif;
    `;

    function showToast(message, color = "#c62828") {
        // Create the actual toast element directly
        const toast = document.createElement('div');

        const icon = color === "#c62828"
            ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
            : '<circle cx="12" cy="12" r="10"></circle><polyline points="20 6 9 17 4 12"></polyline>';

        toast.innerHTML = `
        <div class="custom-toast">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                ${icon}
            </svg>
            <span>${message}</span>
        </div>
    `;

        // Apply styles directly to the toast div
        Object.assign(toast.firstElementChild.style, {
            background: color,
            color: 'white',
            padding: '14px 24px',
            borderRadius: '14px',
            fontWeight: '600',
            fontSize: '15px',
            fontFamily: "'Poppins', sans-serif",
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.4s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            whiteSpace: 'nowrap',
            width: 'fit-content',
            minWidth: '240px',
            maxWidth: '90vw',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
        });

        // Add to container
        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.firstElementChild.style.opacity = '1';
            toast.firstElementChild.style.transform = 'translateY(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.firstElementChild.style.opacity = '0';
            toast.firstElementChild.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Only real submit buttons
    function getSubmitButtons() {
        return document.querySelectorAll(`
            button[type="submit"],
            input[type="submit"],
            button.submit-btn,
            #submitBtn,
            .withdraw-form button,
            .deposit-form button
        `);
    }

    function disableSubmitButtons() {
        getSubmitButtons().forEach(btn => {
            if (!btn.disabled) {
                btn.disabled = true;
                btn.dataset.wasEnabled = "true";
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            }
        });
    }

    function enableSubmitButtons() {
        getSubmitButtons().forEach(btn => {
            if (btn.dataset.wasEnabled === "true") {
                btn.disabled = false;
                btn.style.opacity = "";
                btn.style.cursor = "";
                delete btn.dataset.wasEnabled;
            }
        });
    }

    // Show toast when user clicks disabled button
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button[type="submit"], input[type="submit"], .submit-btn, #submitBtn');
        if (btn && btn.disabled && btn.dataset.wasEnabled === "true") {
            e.preventDefault();
            showToast("No internet — cannot submit");
        }
    }, true);

    // Network state handler
    function updateNetwork(online) {
        if (online && !isOnline) {
            isOnline = true;
            showToast("Back online!", "#2e7d32");   // GREEN TOAST FIXED
            enableSubmitButtons();
            console.log("ONLINE — Submit buttons re-enabled");
        } else if (!online && isOnline) {
            isOnline = false;
            showToast("Connection lost");
            disableSubmitButtons();
            console.log("OFFLINE — Submit buttons disabled");
        }
    }

    // Events
    window.addEventListener('online', () => updateNetwork(true));
    window.addEventListener('offline', () => updateNetwork(false));

    // Real ping every 5 seconds
    setInterval(() => {
        fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
            .then(() => updateNetwork(true))
            .catch(() => updateNetwork(false));
    }, 5000);

    // Initial state
    updateNetwork(navigator.onLine);

    // Add toast container
    if (document.body) {
        document.body.appendChild(toastContainer);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(toastContainer));
    }

    console.log("%cOFFLINE PROTECTION ACTIVE", "color:#00ff9d;font-weight:bold;");
})();