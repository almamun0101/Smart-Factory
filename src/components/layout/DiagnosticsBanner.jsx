"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { runDiagnostics } from "@/lib/diagnostics";
import { Button } from "@/components/ui/Button";

/**
 * Runs on every authenticated page load and stays visible (not a toast that
 * can be missed) whenever something's actually broken. Dismissible per
 * session once you've seen it, but re-checks on every fresh page load in
 * case the underlying problem is still there.
 */
export function DiagnosticsBanner() {
  const [status, setStatus] = useState("checking"); // checking | ok | problem
  const [results, setResults] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    const r = await runDiagnostics();
    setResults(r);
    const allOk = r.auth?.ok && r.read?.ok && r.write?.ok;
    setStatus(allOk ? "ok" : "problem");
    setChecking(false);
  }

  useEffect(() => {
    check();
  }, []);

  if (status === "checking" || status === "ok" || dismissed) return null;

  const failures = ["auth", "read", "write"].filter((k) => results?.[k] && !results[k].ok);

  return (
    <div className="mb-4 rounded-panel border border-danger/30 bg-danger/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-danger">
            Firebase connection problem — this is why your data isn't saving.
          </p>
          <div className="mt-2 space-y-1.5">
            {failures.map((key) => (
              <p key={key} className="text-steel-700 dark:text-steel-300">
                <span className="font-mono text-xs uppercase text-steel-400">{key}: </span>
                {results[key].message}
              </p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={check} loading={checking}>
              <RefreshCw className="h-3.5 w-3.5" /> Re-check now
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              <X className="h-3.5 w-3.5" /> Dismiss for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
