// APP.JS

document.addEventListener("DOMContentLoaded", () => {
    const siteHeader = document.getElementById("site-header");

    const tradableTrigger = document.getElementById("marketsDropdown");
    const tradableDropdown = tradableTrigger?.nextElementSibling;
    const tradableArrow = tradableTrigger?.querySelector(".dropdown-arrow");

    // ======== Markets (CLICK ONLY) =========
    if (tradableTrigger && tradableDropdown && tradableArrow) {
        tradableTrigger.addEventListener("click", (e) => {
            e.preventDefault();

            const isOpen = tradableDropdown.classList.contains("show");

            // Close first (clean toggle)
            tradableDropdown.classList.remove("show");
            tradableArrow.classList.remove("rotate");

            // Re-open only if it was closed
            if (!isOpen) {
                tradableDropdown.classList.add("show");
                tradableArrow.classList.add("rotate");
            }
        });

        // Click outside closes dropdown
        document.addEventListener("click", (e) => {
            if (!tradableTrigger.contains(e.target) &&
                !tradableDropdown.contains(e.target)) {
                tradableDropdown.classList.remove("show");
                tradableArrow.classList.remove("rotate");
            }
        });
    }

    // ========= HEADER SCROLL EFFECT (SAFE) =======
    window.addEventListener("scroll", () => {
        if (window.scrollY >= 80) {
            siteHeader.classList.add("nav-fixed");
        } else {
            siteHeader.classList.remove("nav-fixed");
        }
    });

    // ========= NEWSLETTER =========
    const newsletterForm = document.querySelector(".subscribe");
    const newsletterInput = newsletterForm?.querySelector("input[type='email']");
    const newsletterBtn = newsletterForm?.querySelector("button");

    const isValidEmail = (val) =>
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            String(val).toLowerCase()
        );

    if (newsletterForm && newsletterInput && newsletterBtn) {

        newsletterForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailVal = newsletterInput.value.trim();

            if (!emailVal) {
                showToast("Please enter your email address.", "error");
                return;
            }

            if (!isValidEmail(emailVal)) {
                showToast("Please enter a valid email address.", "error");
                return;
            }

            // Lock button while submitting
            newsletterBtn.disabled = true;
            newsletterBtn.style.opacity = "0.6";
            newsletterBtn.style.cursor = "not-allowed";

            showToast("Subscribing to newsletter…", "info");

            try {
                // ── TODO: wire up your actual newsletter service here ──
                // e.g. Mailchimp, EmailJS, Firebase RTDB list, your own API etc.
                // Simulating async operation for now:
                await new Promise((resolve) => setTimeout(resolve, 1500));

                showToast("You're in! Expect the latest updates in your inbox.", "success");
                newsletterInput.value = "";

            } catch (error) {
                console.error("NEWSLETTER ERROR:", error);
                showToast("Something went wrong. Please try again.", "error");
            } finally {
                // Always unlock button whether success or failure
                newsletterBtn.disabled = false;
                newsletterBtn.style.opacity = "";
                newsletterBtn.style.cursor = "";
            }
        });
    }
});



// ========= ACCORDION ==========
document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
        const item = header.parentElement;

        // Close others (optional — remove this block if you want multi-open)
        document.querySelectorAll(".accordion-item").forEach(i => {
            if (i !== item) i.classList.remove("active");
        });

        item.classList.toggle("active");
    });
});