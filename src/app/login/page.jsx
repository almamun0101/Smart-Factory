"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Factory, Gauge } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);
  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }
  return <div className="flex min-h-screen items-center justify-center bg-steel-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-instrument-600">
            <Factory className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Production Control</h1>
          <p className="mt-1 text-sm text-steel-400">Sign in to the operator dashboard</p>
        </div>

        <form
    onSubmit={onSubmit}
    className="rounded-panel border border-steel-800 bg-steel-900 p-6 shadow-panel-dark"
  >
          <div className="mb-4">
            <Label className="text-steel-400">Email</Label>
            <Input
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="operator@factory.com"
    className="bg-steel-950 border-steel-700 text-steel-100"
  />
          </div>
          <div className="mb-6">
            <Label className="text-steel-400">Password</Label>
            <Input
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="••••••••"
    className="bg-steel-950 border-steel-700 text-steel-100"
  />
          </div>
          <Button type="submit" loading={submitting} className="w-full justify-center">
            <Gauge className="h-4 w-4" />
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-steel-500">
          Accounts are created by an administrator in the Firebase console.
        </p>
      </div>
    </div>;
}
export {
  LoginPage as default
};
