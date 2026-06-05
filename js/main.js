import { onAuthChange, loginUser, registerUser, logoutUser } from "./auth-service.js";
import {
  listenUserHabits,
  addHabit,
  checkHabit,
  uncheckHabit,
  updateHabit,
  deleteHabit,
} from "./habit-service.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const authScreen       = document.getElementById("authScreen");
const authForm         = document.getElementById("authForm");
const authEmail        = document.getElementById("authEmail");
const authPassword     = document.getElementById("authPassword");
const authError        = document.getElementById("authError");
const authSubmit       = document.getElementById("authSubmit");
const tabLogin         = document.getElementById("tabLogin");
const tabRegister      = document.getElementById("tabRegister");
const btnLogout        = document.getElementById("btnLogout");
const sidebarUser      = document.getElementById("sidebarUser");
const userAvatar       = document.getElementById("userAvatar");
const userEmailDisplay = document.getElementById("userEmailDisplay");

// ── Auth form mode ────────────────────────────────────────────────────────────
let mode = "login";

function setMode(m) {
  mode = m;
  tabLogin.classList.toggle("active", m === "login");
  tabRegister.classList.toggle("active", m === "register");
  authSubmit.textContent = m === "login" ? "Se connecter" : "S'inscrire";
  authPassword.autocomplete = m === "login" ? "current-password" : "new-password";
  authError.textContent = "";
}

tabLogin.addEventListener("click",    () => setMode("login"));
tabRegister.addEventListener("click", () => setMode("register"));

// ── Auth form submit ──────────────────────────────────────────────────────────
authForm.addEventListener("submit", async e => {
  e.preventDefault();
  authError.textContent = "";
  authSubmit.disabled   = true;
  authSubmit.textContent = "...";

  const email    = authEmail.value.trim();
  const password = authPassword.value;

  try {
    if (mode === "login") await loginUser(email, password);
    else                  await registerUser(email, password);
    authPassword.value = "";
  } catch (err) {
    authError.textContent = friendlyError(err.code);
    authSubmit.disabled   = false;
    setMode(mode);
  }
});

function friendlyError(code) {
  const map = {
    "auth/invalid-email":          "Email invalide.",
    "auth/user-not-found":         "Aucun compte avec cet email.",
    "auth/wrong-password":         "Mot de passe incorrect.",
    "auth/email-already-in-use":   "Cet email est déjà utilisé.",
    "auth/weak-password":          "Le mot de passe doit contenir au moins 6 caractères.",
    "auth/invalid-credential":     "Email ou mot de passe incorrect.",
    "auth/too-many-requests":      "Trop de tentatives. Réessaie dans quelques minutes.",
    "auth/network-request-failed": "Problème de connexion réseau.",
  };
  return map[code] ?? "Une erreur s'est produite. Réessaie.";
}

// ── Logout ────────────────────────────────────────────────────────────────────
btnLogout.addEventListener("click", () => logoutUser());

// ── App/auth visibility ───────────────────────────────────────────────────────
function showApp(user) {
  authScreen.classList.add("hidden");
  sidebarUser.classList.add("visible");
  btnLogout.classList.add("visible");
  userAvatar.textContent       = (user.email ?? "?")[0].toUpperCase();
  userEmailDisplay.textContent = user.email ?? "";
}

function showAuth() {
  authScreen.classList.remove("hidden");
  authSubmit.disabled = false;
  setMode("login");
  sidebarUser.classList.remove("visible");
  btnLogout.classList.remove("visible");
}

// ── Bridge: Firebase ↔ app.js ─────────────────────────────────────────────────
//
// Source of truth: Firestore.
// app.js continues to own the UI and writes to localStorage on every action.
// main.js intercepts window.save() to detect WHAT changed and fires the
// minimal, precise Firestore operations (no full-document rewrites for toggles).
//
// Read flow:  onSnapshot → syncToLocalStorage → window.load + renderAll
// Write flow: window.save (patched) → applyDiff → targeted Firestore ops

let unsubscribeHabits     = null;
let currentUid            = null;
let knownFirestoreIds     = new Set(); // Firestore doc IDs confirmed by last onSnapshot
let isSavePatched         = false;
let previousHabitsSnapshot = null;    // null = Firebase initial data not yet received

// Deep clone for snapshot comparison (only the fields we diff on)
function cloneHabits(habits) {
  return habits.map(h => ({
    id:          h.id,
    name:        h.name,
    emoji:       h.emoji,
    color:       h.color,
    desc:        h.desc,
    freq:        h.freq,
    completions: [...(h.completions ?? [])],
  }));
}

// Called by the Firebase listener: overwrites localStorage with Firestore state
// then asks app.js to re-render.
function syncToLocalStorage(habits) {
  knownFirestoreIds = new Set(habits.map(h => h.id));

  const raw        = localStorage.getItem("habitflow_v2");
  const localTheme = raw ? (JSON.parse(raw).theme ?? "dark") : "dark";

  const normalized = habits.map(h => ({
    id:          h.id,
    name:        h.name        ?? "",
    emoji:       h.emoji       ?? "⚡",
    color:       h.color       ?? "#7c6af7",
    desc:        h.desc        ?? "",
    freq:        h.freq        ?? 7,
    createdAt:   h.createdAt   ?? "",
    completions: h.completions ?? [],
  }));

  localStorage.setItem("habitflow_v2", JSON.stringify({
    theme:  localTheme,
    habits: normalized,
  }));

  // Advance the snapshot to match what Firebase just gave us.
  // This prevents the patched save() from treating Firebase-driven changes
  // as local changes and re-syncing them back.
  previousHabitsSnapshot = cloneHabits(normalized);

  if (window.load)      window.load();
  if (window.renderAll) window.renderAll();
}

// Compares two habits snapshots and fires only the necessary Firestore ops.
async function applyDiff(uid, prev, curr) {
  const prevMap = new Map(prev.map(h => [h.id, h]));
  const currMap = new Map(curr.map(h => [h.id, h]));
  const ops     = [];

  // ── Deletions ────────────────────────────────────────────────
  // A habit disappeared from local state and exists in Firestore → delete it.
  for (const [id] of prevMap) {
    if (!currMap.has(id) && knownFirestoreIds.has(id)) {
      ops.push(deleteHabit(uid, id));
    }
  }

  // ── Additions and updates ─────────────────────────────────────
  for (const [id, habit] of currMap) {
    const prevHabit = prevMap.get(id);
    const existsInFirestore = knownFirestoreIds.has(id);

    if (!prevHabit && !existsInFirestore) {
      // Brand-new habit: create in Firestore.
      // onSnapshot will fire and replace the local uid with the Firestore id.
      ops.push(addHabit(uid, habit));

    } else if (prevHabit && existsInFirestore) {
      const prevDates = new Set(prevHabit.completions ?? []);
      const currDates = new Set(habit.completions ?? []);

      // Completion toggles — one atomic Firestore op per changed date
      for (const date of currDates) {
        if (!prevDates.has(date)) ops.push(checkHabit(uid, id, date));
      }
      for (const date of prevDates) {
        if (!currDates.has(date)) ops.push(uncheckHabit(uid, id, date));
      }

      // Metadata update only if something actually changed
      if (
        habit.name  !== prevHabit.name  ||
        habit.emoji !== prevHabit.emoji ||
        habit.color !== prevHabit.color ||
        habit.desc  !== prevHabit.desc  ||
        habit.freq  !== prevHabit.freq
      ) {
        ops.push(updateHabit(uid, id, {
          name:  habit.name,
          emoji: habit.emoji,
          color: habit.color,
          desc:  habit.desc,
          freq:  habit.freq,
        }));
      }
    }
    // Cases not handled (intentionally skipped):
    // - prevHabit exists but NOT in Firestore: habit was created locally but
    //   Firestore hasn't confirmed it yet — we already called addHabit on the
    //   previous save; wait for onSnapshot to give it a real Firestore id.
    // - no prevHabit but IS in Firestore: shouldn't happen in normal flow.
  }

  if (ops.length > 0) {
    await Promise.all(ops).catch(err =>
      console.error("[HabitFlow] Sync error:", err)
    );
  }
}

// Wraps window.save (the app.js global) once.
// Every subsequent call from app.js will now also trigger applyDiff.
function patchSave() {
  if (isSavePatched || !window.save) return;
  isSavePatched = true;

  const originalSave = window.save;

  window.save = function () {
    originalSave(); // always persist to localStorage first

    // Skip Firebase sync until the initial onSnapshot has established
    // a baseline (previousHabitsSnapshot !== null).
    if (!currentUid || previousHabitsSnapshot === null) return;

    const raw = localStorage.getItem("habitflow_v2");
    if (!raw) return;
    const { habits = [] } = JSON.parse(raw);

    // Advance snapshot immediately so back-to-back saves don't re-process
    // the same diff (e.g., two rapid toggles).
    const baseline = previousHabitsSnapshot;
    previousHabitsSnapshot = cloneHabits(habits);

    applyDiff(currentUid, baseline, habits);
  };
}

// ── Auth state listener ───────────────────────────────────────────────────────
onAuthChange(user => {
  if (user) {
    currentUid = user.uid;
    showApp(user);
    patchSave();

    if (typeof window.showToast === "function") {
      window.showToast(`Connecté · ${user.email}`);
    }

    // Start the real-time Firestore listener.
    // The first onSnapshot call fires immediately with current Firestore state,
    // loading today's completions (and all historical ones) into app.js.
    if (unsubscribeHabits) unsubscribeHabits();
    unsubscribeHabits = listenUserHabits(user.uid, habits => {
      syncToLocalStorage(habits);
    });

  } else {
    if (unsubscribeHabits) {
      unsubscribeHabits();
      unsubscribeHabits = null;
    }

    currentUid             = null;
    previousHabitsSnapshot = null;
    knownFirestoreIds.clear();

    localStorage.removeItem("habitflow_v2");
    if (window.load)      window.load();
    if (window.renderAll) window.renderAll();

    showAuth();
  }
});
