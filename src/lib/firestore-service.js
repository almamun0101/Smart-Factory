import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { explainFirebaseError } from "./firebase-error-hints";
// Wraps a promise so it rejects with a clear, actionable message after `ms`
// milliseconds instead of hanging forever. This matters because a
// misconfigured Firestore (database not created, rules blocking the write,
// no network) makes the Firestore SDK retry silently -- from the UI it just
// looks like the form "won't close" with a spinner stuck forever. Failing
// loudly turns that into a toast the user can actually act on.
function withTimeout(promise, ms = 1e4) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(
        new Error(
          "Request timed out. Check that Firestore Database is created in the Firebase console (Build \u2192 Firestore Database) and that firestore.rules has been published."
        )
      ),
      ms
    );
  });
  return Promise.race([promise, timeout]).then(
    (result) => {
      clearTimeout(timer);
      return result;
    },
    (err) => {
      clearTimeout(timer);
      // Surface the real Firebase error code (e.g. "permission-denied",
      // "unavailable") directly in the message so it shows up in the toast
      // itself, not just the browser console — no dev tools needed to see
      // what actually went wrong.
      if (err?.code) err.message = explainFirebaseError(err);
      throw err;
    }
  );
}
function subscribeCollection(collectionName, onData, constraints = [orderBy("created_at", "desc")], onError) {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(items);
    },
    (err) => {
      console.error(`[firestore] subscribe failed for ${collectionName}: ${err.code} — ${err.message}`);
      onData([]);
      if (onError) onError(err);
    }
  );
}
async function createDoc(collectionName, data) {
  const ref = await withTimeout(addDoc(collection(db, collectionName), data));
  return ref.id;
}
async function updateDocById(collectionName, id, data) {
  await withTimeout(updateDoc(doc(db, collectionName, id), data));
}
async function setDocById(collectionName, id, data) {
  await withTimeout(setDoc(doc(db, collectionName, id), data));
}
async function deleteDocById(collectionName, id) {
  await withTimeout(deleteDoc(doc(db, collectionName, id)));
}
export {
  createDoc,
  deleteDocById,
  setDocById,
  subscribeCollection,
  updateDocById
};
