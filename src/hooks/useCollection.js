"use client";
import { useEffect, useRef, useState } from "react";
import { orderBy } from "firebase/firestore";
import { toast } from "sonner";
import { subscribeCollection } from "@/lib/firestore-service";

// If Firestore rejects reads too (not just writes), the old behavior was to
// silently render an empty list — which looks identical to "there's just no
// data yet" and makes the real problem invisible. Toast it once per
// collection instead.
const warnedCollections = new Set();

function useCollection(collectionName, constraints = [orderBy("created_at", "desc")]) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeCollection(
      collectionName,
      (items) => {
        setData(items);
        setLoading(false);
      },
      constraints,
      (err) => {
        if (!warnedCollections.has(collectionName)) {
          warnedCollections.add(collectionName);
          const isPermission = err?.code === "permission-denied";
          toast.error(
            isPermission
              ? `Can't read "${collectionName}" — Firestore rules are blocking it. Publish firestore.rules in the Firebase console.`
              : `Can't read "${collectionName}": ${err?.message ?? "unknown error"}`
          );
        }
      }
    );
    return () => unsub();
  }, [collectionName]);
  return { data, loading };
}
export {
  useCollection
};
