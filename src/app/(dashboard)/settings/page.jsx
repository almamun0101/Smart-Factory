"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR"];
function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!loading && !synced) {
      setForm(settings);
      setSynced(true);
    }
  }, [loading, synced, settings]);
  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }
  return <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Settings</h1>
        <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">Configure factory name, shift schedule, currency, and theme.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Factory</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>Factory Name</Label>
            <Input value={form.factory_name} onChange={(e) => setForm({ ...form, factory_name: e.target.value })} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Shift Schedule</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Day Shift Starts</Label>
            <Input type="time" value={form.day_shift_start} onChange={(e) => setForm({ ...form, day_shift_start: e.target.value })} />
          </div>
          <div>
            <Label>Night Shift Starts</Label>
            <Input type="time" value={form.night_shift_start} onChange={(e) => setForm({ ...form, night_shift_start: e.target.value })} />
          </div>
          <p className="sm:col-span-2 text-xs text-steel-400">
            The production entry form uses these times to auto-detect the current shift.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardBody>
          <Label>Theme</Label>
          <Select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
            <option value="system">Match System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </CardBody>
      </Card>

      <Button onClick={handleSave} loading={saving} size="lg">Save Settings</Button>
    </div>;
}
export {
  SettingsPage as default
};
