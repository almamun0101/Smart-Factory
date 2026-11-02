// Plain-English fixes for the Firebase error codes people actually hit when
// setting up a brand-new project. Shared by the connection diagnostics panel
// and the save-error toasts so the message is consistent everywhere.
export const FIREBASE_ERROR_HINTS = {
  "permission-denied":
    "Your Firestore security rules are blocking this. In the Firebase console: Firestore Database → Rules tab → paste in this project's firestore.rules → Publish.",
  "not-found":
    "This Firestore database doesn't exist yet. In the Firebase console: Build → Firestore Database → Create database.",
  unavailable:
    "Can't reach Firestore. Check your internet connection, and confirm Firestore Database has been created for this project (Build → Firestore Database).",
  unauthenticated:
    "You're not signed in. Log out and log back in.",
  "invalid-api-key":
    "The Firebase API key in .env.local doesn't match this project. Recheck it against Firebase console → Project settings → General → Your apps.",
  "auth/invalid-api-key":
    "The Firebase API key in .env.local doesn't match this project. Recheck it against Firebase console → Project settings → General → Your apps.",
};

export function explainFirebaseError(err) {
  if (!err) return "Unknown error.";
  const hint = FIREBASE_ERROR_HINTS[err.code];
  return hint ? `[${err.code}] ${hint}` : `[${err.code ?? "error"}] ${err.message}`;
}
