//  SIGN_UP_IN.JS

import { auth, db } from "/assets/js/firebase-init.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

import {
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

console.log(
  "%cAUTH MODULE LOADED",
  "color:#32cd32;font-weight:bold;font-size:16px;background:#000;padding:8px 16px;border-radius:8px;"
);


// HASH-BASED TAB ROUTING
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash === "#signin") switchTab("signin");
  if (window.location.hash === "#signup") switchTab("signup");
});


// LOADING OVERLAY
const showLoading = () =>
  document.getElementById("loading-overlay")?.classList.add("show");

const hideLoading = () =>
  document.getElementById("loading-overlay")?.classList.remove("show");


// SUBMISSION LOCK + BUTTON SPINNER
let isSubmitting = false;

const injectSpinnerStyle = () => {
  if (document.getElementById("__spinner-style")) return;
  const style = document.createElement("style");
  style.id = "__spinner-style";
  style.textContent = `
    @keyframes __btn-spin {
      to { transform: rotate(360deg); }
    }
    .__btn-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(10,10,10,0.3);
      border-top-color: #0a0a0a;
      border-radius: 50%;
      animation: __btn-spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
};

const lockSubmit = (btn, loadingText) => {
  injectSpinnerStyle();
  isSubmitting = true;
  btn.disabled = true;
  btn.style.opacity = "0.75";
  btn.style.cursor = "not-allowed";
  btn.dataset.originalText = btn.textContent;
  btn.innerHTML = `<span class="__btn-spinner"></span>${loadingText}`;
};

const unlockSubmit = (btn) => {
  isSubmitting = false;
  btn.disabled = false;
  btn.style.opacity = "";
  btn.style.cursor = "";
  btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
};


// VALIDATION HELPERS
const isValidEmail = (val) =>
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    String(val).toLowerCase()
  );

const isValidUsername = (val) => /^[a-zA-Z][a-zA-Z0-9._]{1,15}$/.test(val);

const setError = (inputEl, message) => {
  const field = inputEl.closest(".field");
  if (!field) return;
  inputEl.style.borderColor = "var(--error)";
  inputEl.style.boxShadow = "0 0 0 3px rgba(255,77,77,.15)";
  let errEl = field.querySelector(".field-error");
  if (!errEl) {
    errEl = document.createElement("p");
    errEl.className = "field-error";
    errEl.style.cssText =
      "color:var(--error);font-size:.75rem;margin-top:.3rem;";
    field.appendChild(errEl);
  }
  errEl.textContent = message;
};

const setSuccess = (inputEl) => {
  const field = inputEl.closest(".field");
  if (!field) return;
  inputEl.style.borderColor = "var(--brand)";
  inputEl.style.boxShadow = "0 0 0 3px var(--brand-glow)";
  const errEl = field.querySelector(".field-error");
  if (errEl) errEl.textContent = "";
};

const clearFieldState = (inputEl) => {
  inputEl.style.borderColor = "";
  inputEl.style.boxShadow = "";
  const field = inputEl.closest(".field");
  const errEl = field?.querySelector(".field-error");
  if (errEl) errEl.textContent = "";
};

const clearAllFields = () => {
  document
    .querySelectorAll(".input-wrap input")
    .forEach((el) => clearFieldState(el));
};


// GOOGLE AUTH  (sign up + sign in)
const googleProvider = new GoogleAuthProvider();

const handleGoogleAuth = async () => {
  if (isSubmitting) return;

  const btnGoogleSignup = document.getElementById("btn-google-signup");
  const btnGoogleSignin = document.getElementById("btn-google-signin");
  lockSubmit(btnGoogleSignup, "Connecting…");
  lockSubmit(btnGoogleSignin, "Connecting…");
  showLoading();
  showToast("Opening Google sign-in…", "info");

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log(
      "%cGOOGLE AUTH — UID: " + user.uid,
      "color:#32cd32;font-weight:bold;"
    );

    showToast("Checking your account…", "info");

    const snapshot = await get(ref(db, "users/" + user.uid));

    if (!snapshot.exists()) {
      showToast("Setting up your account…", "info");

      const displayName = user.displayName || "";
      const nameParts = displayName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const rawUsername = (user.email || "").split("@")[0].replace(/[^a-zA-Z0-9._]/g, "").slice(0, 16);
      const username = /^[a-zA-Z]/.test(rawUsername) ? rawUsername : "user_" + rawUsername.slice(0, 11);

      await set(ref(db, "users/" + user.uid), {
        username: username,
        fullname: displayName,
        email: user.email || "",
        balance: 0,
        deposits: 0,
        withdrawals: 0,
        cryptoSignal: "",
        forexSignal: "",
        indexSignal: "",
        stockSignal: "",
        referrals: 0,
        role: "user",
      });

      hideLoading();
      showToast("Welcome! Taking you to your dashboard…", "success");

      setTimeout(() => {
        window.location.href = "dashboard-crypto.html";
      }, 2000);

    } else {
      const role = snapshot.val().role || "user";
      hideLoading();
      showToast("Welcome back! Redirecting…", "success");

      setTimeout(() => {
        window.location.href =
          role === "admin" ? "admin.html" : "dashboard-crypto.html";
      }, 2000);
    }

  } catch (error) {
    hideLoading();
    unlockSubmit(document.getElementById("btn-google-signup"));
    unlockSubmit(document.getElementById("btn-google-signin"));
    console.error("GOOGLE AUTH ERROR:", error);

    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      showToast("Google sign-in was cancelled.", "info");
    } else if (error.code === "auth/network-request-failed") {
      showToast("No internet connection. Please try again.", "error");
    } else if (error.code === "auth/popup-blocked") {
      showToast("Popup was blocked by your browser. Please allow popups and try again.", "error");
    } else {
      showToast("Google sign-in failed. Please try again.", "error");
    }
  }
};

document.getElementById("btn-google-signup")?.addEventListener("click", handleGoogleAuth);
document.getElementById("btn-google-signin")?.addEventListener("click", handleGoogleAuth);


// SIGN UP
const suUsername = document.getElementById("su-username");
const suFullname = document.getElementById("su-fullname");
const suEmail = document.getElementById("su-email");
const suPassword = document.getElementById("su-password");
const suConfirm = document.getElementById("su-confirm");
const suTerms = document.getElementById("su-terms");
const btnSignup = document.getElementById("btn-signup-submit");

const validateSignUp = () => {
  let valid = true;

  const u = suUsername.value.trim();
  const f = suFullname.value.trim();
  const e = suEmail.value.trim();
  const p = suPassword.value;
  const c = suConfirm.value;

  if (!u) {
    setError(suUsername, "Username is required.");
    valid = false;
  } else if (!isValidUsername(u)) {
    setError(suUsername, "2–16 chars, start with a letter. Letters, numbers, _ and . only.");
    valid = false;
  } else {
    setSuccess(suUsername);
  }

  if (!f) {
    setError(suFullname, "Full name is required.");
    valid = false;
  } else if (f.length < 2) {
    setError(suFullname, "Enter your real full name.");
    valid = false;
  } else {
    setSuccess(suFullname);
  }

  if (!e) {
    setError(suEmail, "Email address is required.");
    valid = false;
  } else if (!isValidEmail(e)) {
    setError(suEmail, "Enter a valid email address.");
    valid = false;
  } else {
    setSuccess(suEmail);
  }

  if (!p) {
    setError(suPassword, "Password is required.");
    valid = false;
  } else if (p.length < 8) {
    setError(suPassword, "Password must be at least 8 characters.");
    valid = false;
  } else {
    setSuccess(suPassword);
  }

  if (!c) {
    setError(suConfirm, "Please confirm your password.");
    valid = false;
  } else if (c !== p) {
    setError(suConfirm, "Passwords do not match.");
    valid = false;
  } else {
    setSuccess(suConfirm);
  }

  if (!suTerms.checked) {
    showToast("You must accept the Terms of Service to continue.", "error");
    valid = false;
  }

  return valid;
};

btnSignup.addEventListener("click", async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  if (!validateSignUp()) return;

  const emailVal = suEmail.value.trim();
  const usernameVal = suUsername.value.trim();
  const fullnameVal = suFullname.value.trim();
  const passwordVal = suPassword.value;

  lockSubmit(btnSignup, "Creating account…");
  showLoading();
  showToast("Creating your account…", "info");

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailVal,
      passwordVal
    );
    const user = userCredential.user;

    console.log(
      "%cUSER REGISTERED — UID: " + user.uid,
      "color:#32cd32;font-weight:bold;"
    );

    await set(ref(db, "users/" + user.uid), {
      username: usernameVal,
      fullname: fullnameVal,
      email: emailVal,
      balance: 0,
      deposits: 0,
      withdrawals: 0,
      cryptoSignal: "",
      forexSignal: "",
      indexSignal: "",
      stockSignal: "",
      referrals: 0,
      role: "user",
    });

    hideLoading();
    showToast("Welcome! Taking you to your dashboard…", "success");

    setTimeout(() => {
      window.location.href = "dashboard-crypto.html";
    }, 2000);

  } catch (error) {
    hideLoading();
    unlockSubmit(btnSignup);
    console.error("REGISTRATION ERROR:", error);

    if (error.code === "auth/email-already-in-use") {
      setError(suEmail, "This email is already registered.");
      showToast("Email already in use.", "error");
    } else if (error.code === "auth/network-request-failed") {
      showToast("No internet connection. Please try again.", "error");
    } else {
      showToast(error.message || "Registration failed. Try again.", "error");
    }
  }
});


// SIGN IN
const siEmail = document.getElementById("si-email");
const siPassword = document.getElementById("si-password");
const btnSignin = document.getElementById("btn-signin-submit");

const validateSignIn = () => {
  let valid = true;

  const e = siEmail.value.trim();
  const p = siPassword.value;

  if (!e) {
    setError(siEmail, "Email address is required.");
    valid = false;
  } else if (!isValidEmail(e)) {
    setError(siEmail, "Enter a valid email address.");
    valid = false;
  } else {
    setSuccess(siEmail);
  }

  if (!p) {
    setError(siPassword, "Password is required.");
    valid = false;
  } else {
    setSuccess(siPassword);
  }

  return valid;
};

btnSignin.addEventListener("click", async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  if (!validateSignIn()) return;

  const emailVal = siEmail.value.trim();
  const passwordVal = siPassword.value;

  lockSubmit(btnSignin, "Signing in…");
  showLoading();
  showToast("Signing you in…", "info");

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailVal,
      passwordVal
    );
    const user = userCredential.user;

    console.log(
      "%cUSER SIGNED IN — UID: " + user.uid,
      "color:#32cd32;font-weight:bold;"
    );

    showToast("Verifying your account…", "info");

    const snapshot = await get(ref(db, `users/${user.uid}`));

    if (!snapshot.exists()) {
      hideLoading();
      unlockSubmit(btnSignin);
      showToast("Account error — please contact support.", "error");
      return;
    }

    const role = snapshot.val().role || "user";
    hideLoading();
    showToast("Welcome back! Redirecting…", "success");

    setTimeout(() => {
      window.location.href =
        role === "admin" ? "admin.html" : "dashboard-crypto.html";
    }, 2000);

  } catch (error) {
    hideLoading();
    unlockSubmit(btnSignin);
    console.error("LOGIN ERROR:", error);

    switch (error.code) {
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-credential":
        showToast("Invalid email or password.", "error");
        setError(siEmail, " ");
        setError(siPassword, " ");
        break;
      case "auth/too-many-requests":
        showToast("Too many failed attempts. Try again later.", "error");
        break;
      case "auth/network-request-failed":
        showToast("No internet connection. Please try again.", "error");
        break;
      default:
        showToast("Sign in failed. Please try again.", "error");
    }
  }
});


// CLEARING STATES
const _originalSwitchTab = window.switchTab;
window.switchTab = (tab) => {
  _originalSwitchTab(tab);
  clearAllFields();
};

[suUsername, suFullname, suEmail, suPassword, suConfirm, siEmail, siPassword]
  .forEach((el) => {
    el?.addEventListener("input", () => clearFieldState(el));
  });