import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Référence à la sous-collection d'habitudes d'un utilisateur
function habitsRef(uid) {
  return collection(db, "users", uid, "habits");
}

function habitDoc(uid, habitId) {
  return doc(db, "users", uid, "habits", habitId);
}

/**
 * Ajoute une nouvelle habitude dans Firestore.
 * Retourne la DocumentReference créée (avec son id généré).
 *
 * @param {string} uid
 * @param {{ name, emoji, color, desc, freq, createdAt }} habitData
 */
export async function addHabit(uid, habitData) {
  const ref = await addDoc(habitsRef(uid), {
    name: habitData.name,
    emoji: habitData.emoji ?? "⚡",
    color: habitData.color ?? "#7c6af7",
    desc: habitData.desc ?? "",
    freq: habitData.freq ?? 7,
    createdAt: habitData.createdAt ?? new Date().toISOString().slice(0, 10),
    completions: habitData.completions ?? [],
    updatedAt: serverTimestamp(),
  });
  return ref;
}

/**
 * Récupère une seule fois toutes les habitudes de l'utilisateur.
 * Retourne un tableau d'objets avec la propriété `id` ajoutée.
 *
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function getUserHabits(uid) {
  const q = query(habitsRef(uid), orderBy("createdAt"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Écoute en temps réel les habitudes de l'utilisateur.
 * Appelle `callback` à chaque changement avec le tableau d'habitudes.
 * Retourne la fonction d'arrêt de l'écoute (unsubscribe).
 *
 * @param {string} uid
 * @param {(habits: Array) => void} callback
 * @returns {() => void}
 */
export function listenUserHabits(uid, callback) {
  const q = query(habitsRef(uid), orderBy("createdAt"));
  return onSnapshot(q, snapshot => {
    const habits = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(habits);
  });
}

/**
 * Coche une habitude pour une date donnée (ajoute la date dans `completions`).
 *
 * @param {string} uid
 * @param {string} habitId
 * @param {string} date  - format "YYYY-MM-DD"
 */
export function checkHabit(uid, habitId, date) {
  return updateDoc(habitDoc(uid, habitId), {
    completions: arrayUnion(date),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Décoche une habitude pour une date donnée (retire la date de `completions`).
 *
 * @param {string} uid
 * @param {string} habitId
 * @param {string} date  - format "YYYY-MM-DD"
 */
export function uncheckHabit(uid, habitId, date) {
  return updateDoc(habitDoc(uid, habitId), {
    completions: arrayRemove(date),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Bascule l'état d'une habitude pour une date donnée.
 *
 * @param {string} uid
 * @param {string} habitId
 * @param {string} date         - format "YYYY-MM-DD"
 * @param {boolean} isCurrentlyDone - état actuel (true = déjà cochée)
 */
export function toggleHabitCompletion(uid, habitId, date, isCurrentlyDone) {
  return isCurrentlyDone
    ? uncheckHabit(uid, habitId, date)
    : checkHabit(uid, habitId, date);
}

/**
 * Met à jour les métadonnées d'une habitude (nom, emoji, couleur, etc.).
 *
 * @param {string} uid
 * @param {string} habitId
 * @param {Partial<{name, emoji, color, desc, freq}>} updates
 */
export function updateHabit(uid, habitId, updates) {
  return updateDoc(habitDoc(uid, habitId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Supprime une habitude et toutes ses données.
 *
 * @param {string} uid
 * @param {string} habitId
 */
export function deleteHabit(uid, habitId) {
  return deleteDoc(habitDoc(uid, habitId));
}
