/**
 * Optional one-time seed script: creates 3 machines, 12 workers, and a
 * starter product list in Firestore so the app isn't empty on first run.
 *
 * SETUP (one time):
 *   1. Firebase console → Project settings → Service accounts →
 *      "Generate new private key". Save the downloaded file as
 *      `service-account.json` in the project root (same folder as this
 *      script's parent directory). This file is already gitignored.
 *   2. npm install firebase-admin --no-save
 *   3. node scripts/seed.mjs
 *
 * Safe to run once. Re-running will create duplicate documents, since it
 * doesn't check for existing data first — delete the collections in the
 * Firestore console first if you want to reseed from scratch.
 */

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url)));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  const now = Date.now();

  const machines = [
    { name: "Machine 1", status: "running" },
    { name: "Machine 2", status: "running" },
    { name: "Machine 3", status: "idle" },
  ];

  const workers = Array.from({ length: 12 }).map((_, i) => ({
    name: `Worker ${i + 1}`,
    employee_id: `EMP-${String(i + 1).padStart(3, "0")}`,
    phone: "01700000000",
    status: "active",
  }));

  const products = [
    { name: "Product A", price_per_piece: 2.5, rate_per_minute: 3 },
    { name: "Product B", price_per_piece: 4.0, rate_per_minute: 1.5 },
    { name: "Product C", price_per_piece: 1.75, rate_per_minute: 5 },
  ];

  const batch = db.batch();

  machines.forEach((m) => {
    const ref = db.collection("machines").doc();
    batch.set(ref, { ...m, created_at: now });
  });

  workers.forEach((w) => {
    const ref = db.collection("workers").doc();
    batch.set(ref, { ...w, created_at: now });
  });

  products.forEach((p) => {
    const ref = db.collection("products").doc();
    batch.set(ref, { ...p, created_at: now });
  });

  batch.set(db.doc("app_config/settings"), {
    factory_name: "My Factory",
    day_shift_start: "09:00",
    night_shift_start: "21:00",
    currency: "BDT",
    theme: "system",
  });

  await batch.commit();
  console.log("Seeded 3 machines, 12 workers, 3 products, and default settings.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
