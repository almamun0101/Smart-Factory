import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { explainFirebaseError } from "./firebase-error-hints";

/**
 * Runs three live checks against the current Firebase project and returns
 * a plain-English result for each, instead of the app just quietly failing
 * to save. Meant to be shown as a persistent on-screen panel (not a toast
 * that can be missed or dismissed) so a non-technical operator can see
 * exactly what's broken and what to do about it.
 */
export async function runDiagnostics() {
  const results = { auth: null, read: null, write: null };

  if (auth.currentUser) {
    results.auth = { ok: true, message: `Signed in as ${auth.currentUser.email}` };
  } else {
    results.auth = {
      ok: false,
      message: "Not signed in. This page should have redirected you to login — try logging out and back in.",
    };
    // No point testing Firestore without an authenticated user.
    results.read = { ok: false, message: "Skipped — not signed in." };
    results.write = { ok: false, message: "Skipped — not signed in." };
    return results;
  }

  const testRef = doc(db, "_diagnostics", "connectivity_test");

  try {
    await getDoc(testRef);
    results.read = { ok: true, message: "Firestore reads are working." };
  } catch (err) {
    results.read = { ok: false, message: explainFirebaseError(err), code: err.code };
  }

  try {
    await setDoc(testRef, { lastCheckedBy: auth.currentUser.uid, lastCheckedAt: Date.now() });
    results.write = { ok: true, message: "Firestore writes are working." };
  } catch (err) {
    results.write = { ok: false, message: explainFirebaseError(err), code: err.code };
  }

  return results;
}
