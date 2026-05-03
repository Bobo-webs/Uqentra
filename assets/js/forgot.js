import { auth } from "/assets/js/firebase-init.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

console.log(
  "%cFORGOT PASSWORD MODULE LOADED",
  "color:#32cd32;font-weight:bold;font-size:14px;background:#000;padding:6px 12px;border-radius:6px;"
);

const emailInput = document.getElementById("fp-email");
const btnReset = document.getElementById("btn-reset");
const formView = document.getElementById("form-view");
const successView = document.getElementById("success-view");
const btnResend = document.getElementById("btn-resend");
const resendTimer = document.getElementById("resend-timer");

const isValidEmail = (val) =>
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    String(val).toLowerCase()
  );

const setError = (inputEl, message) => {
  const field = inputEl.closest(".field");
  if (!field) return;
  inputEl.style.borderColor = "var(--error)";
  inputEl.style.boxShadow = "0 0 0 3px rgba(255,77,77,.15)";
  let errEl = field.querySelector(".field-error");
  if (!errEl) {
    errEl = document.createElement("p");
    errEl.className = "field-error";
    errEl.style.cssText = "color:var(--error);font-size:.75rem;margin-top:.3rem;";
    field.appendChild(errEl);
  }
  errEl.textContent = message;
};

const clearError = (inputEl) => {
  inputEl.style.borderColor = "";
  inputEl.style.boxShadow = "";
  const errEl = inputEl.closest(".field")?.querySelector(".field-error");
  if (errEl) errEl.textContent = "";
};

let isSubmitting = false;
let lastEmail = "";

const lockBtn = (text) => {
  isSubmitting = true;
  btnReset.disabled = true;
  btnReset.innerHTML = `<span class="btn-spinner"></span>${text}`;
};

const unlockBtn = () => {
  isSubmitting = false;
  btnReset.disabled = false;
  btnReset.innerHTML = "Send Reset Instructions";
};

const showSuccess = () => {
  formView.style.display = "none";
  successView.classList.add("show");
};

const sendReset = async (emailVal, isRetry = false) => {
  try {
    await sendPasswordResetEmail(auth, emailVal);
  } catch (error) {
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-email"
    ) {
      return;
    }

    if (!isRetry && (error.code === "auth/error-code:-26" || error.message?.includes("503"))) {
      console.warn("Firebase cold start detected — retrying in 1.5s…");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return sendReset(emailVal, true);
    }

    throw error;
  }
};

// ── Main submit ──
btnReset.addEventListener("click", async () => {
  if (isSubmitting) return;

  const emailVal = emailInput.value.trim();

  if (!emailVal) {
    setError(emailInput, "Email address is required.");
    return;
  }
  if (!isValidEmail(emailVal)) {
    setError(emailInput, "Enter a valid email address.");
    return;
  }

  clearError(emailInput);
  lastEmail = emailVal;

  lockBtn("Sending…");
  showToast("Sending reset instructions…", "info");

  try {
    await sendReset(emailVal);
    unlockBtn();
    showToast("Instructions sent! Check your inbox.", "success");
    showSuccess();
    startResendCooldown();
  } catch (error) {
    unlockBtn();
    console.error("PASSWORD RESET ERROR:", error);

    if (error.code === "auth/network-request-failed") {
      showToast("No internet connection. Please try again.", "error");
    } else if (error.code === "auth/too-many-requests") {
      showToast("Too many attempts. Please wait and try again.", "error");
    } else {
      showToast("Something went wrong. Please try again.", "error");
    }
  }
});

emailInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnReset.click();
});

emailInput.addEventListener("input", () => clearError(emailInput));

let cooldownInterval = null;

const startResendCooldown = () => {
  let seconds = 60;
  btnResend.disabled = true;
  resendTimer.textContent = ` (${seconds}s)`;

  cooldownInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(cooldownInterval);
      btnResend.disabled = false;
      resendTimer.textContent = "";
    } else {
      resendTimer.textContent = ` (${seconds}s)`;
    }
  }, 1000);
};

btnResend.addEventListener("click", async () => {
  if (!lastEmail || btnResend.disabled) return;

  btnResend.disabled = true;
  showToast("Resending instructions…", "info");

  try {
    await sendReset(lastEmail);
    showToast("Instructions resent. Check your inbox.", "success");
  } catch (error) {
    console.error("RESEND ERROR:", error);
    if (error.code === "auth/network-request-failed") {
      showToast("No internet connection. Please try again.", "error");
    } else if (error.code === "auth/too-many-requests") {
      showToast("Too many attempts. Please wait before trying again.", "error");
    } else {
      showToast("Could not resend. Please try again.", "error");
    }
  }

  startResendCooldown();
});