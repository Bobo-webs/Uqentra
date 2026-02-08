// APP.JS

document.addEventListener("DOMContentLoaded", () => {
    const siteHeader = document.getElementById("site-header");

    const tradableTrigger = document.getElementById("marketsDropdown");
    const tradableDropdown = tradableTrigger?.nextElementSibling;
    const tradableArrow = tradableTrigger?.querySelector(".dropdown-arrow");

    // ======== TRADABLE MARKETS (CLICK ONLY) =========
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

    // ========= HEADER SCROLL EFFECT (SAFE)=======
    window.addEventListener("scroll", () => {
        if (window.scrollY >= 80) {
            siteHeader.classList.add("nav-fixed");
        } else {
            siteHeader.classList.remove("nav-fixed");
        }
    });
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