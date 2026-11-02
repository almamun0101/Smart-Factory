"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { DiagnosticsBanner } from "./DiagnosticsBanner";
import { Loader2 } from "lucide-react";
function DashboardShell({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);
  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center bg-steel-50 dark:bg-steel-950">
        <Loader2 className="h-6 w-6 animate-spin text-instrument-500" />
      </div>;
  }
  return <div className="flex min-h-screen bg-steel-50 dark:bg-steel-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">
          <DiagnosticsBanner />
          {children}
        </main>
      </div>
    </div>;
}
export {
  DashboardShell
};
