"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { PLANS } from "@/lib/constants";
import { changePlan } from "@/lib/api/services";
import type { PlanId } from "@/types";
import { Check, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  "Business information",
  "WhatsApp connection",
  "AI assistant",
  "Product catalog",
  "Subscription plan",
  "Test AI response",
  "Complete setup",
];

export default function OnboardingPage() {
  const { user, patchUser } = useAuth();
  const { waStatus, refreshWaStatus } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(user?.onboardingStep ?? 1);
  const [businessName, setBusinessName] = useState(user?.businessName ?? "");
  const [ownerName, setOwnerName] = useState(user?.ownerName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [botEnabled, setBotEnabled] = useState(user?.botEnabled ?? true);
  const [aiTone, setAiTone] = useState("Friendly Roman-Urdu + English");
  const [catalogNote, setCatalogNote] = useState("");
  const [plan, setPlan] = useState<PlanId>(user?.plan ?? "professional");
  const [testReply, setTestReply] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const goNext = async () => {
    setSaving(true);
    try {
      if (step === 1) {
        if (!businessName.trim() || !ownerName.trim()) {
          toast.error("Business and owner name are required");
          return;
        }
        patchUser({ businessName, ownerName, phone, onboardingStep: 2 });
      } else if (step === 2) {
        await refreshWaStatus();
        patchUser({
          whatsappConnected: Boolean(waStatus?.connected),
          onboardingStep: 3,
        });
      } else if (step === 3) {
        patchUser({ botEnabled, onboardingStep: 4 });
      } else if (step === 4) {
        patchUser({ onboardingStep: 5 });
      } else if (step === 5) {
        await changePlan(plan);
        patchUser({ plan, onboardingStep: 6 });
      } else if (step === 6) {
        if (!testReply.trim()) {
          toast.error("Try a sample customer message first");
          return;
        }
        patchUser({ onboardingStep: 7 });
      } else {
        patchUser({ onboardingComplete: true, onboardingStep: 7 });
        toast.success("Setup complete");
        router.push("/overview");
        return;
      }
      setStep((s) => Math.min(7, s + 1));
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-secondary">Welcome to WhatsRep</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Set up your merchant workspace</h1>
        <p className="mt-2 text-sm text-ink-muted">
          You can continue later — progress is saved on this device until backend onboarding APIs exist.
        </p>
      </div>

      <div className="mb-8 grid gap-2 sm:grid-cols-7">
        {STEPS.map((label, index) => {
          const n = index + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label} className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-center gap-2">
                {done ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Circle className={cn("h-4 w-4", active ? "text-brand-green" : "text-ink-muted")} />
                )}
                <span className="text-xs font-semibold text-ink">Step {n}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Business information</h2>
            <Input label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            <Input label="Owner name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            <Input label="Business phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="92xxxxxxxxxx" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">WhatsApp Business connection</h2>
            <p className="text-sm text-ink-muted">
              Your Meta Cloud API credentials are configured on the FastAPI backend. We verify connection via{" "}
              <code className="rounded bg-brand-app px-1">GET /status</code>.
            </p>
            <div className="rounded-xl border border-line bg-brand-app p-4">
              <div className="text-sm font-semibold text-ink">
                {waStatus?.connected ? "Connected" : "Not connected / unreachable"}
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                {waStatus?.verified_name || "—"} · {waStatus?.display_phone_number || "No number"}
              </div>
              {waStatus?.error && <p className="mt-2 text-xs text-danger">{waStatus.error}</p>}
            </div>
            <Button variant="secondary" onClick={() => refreshWaStatus()}>
              Refresh connection status
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">AI assistant configuration</h2>
            <Toggle checked={botEnabled} onChange={setBotEnabled} label="Enable AI bot by default" />
            <Input label="Response style" value={aiTone} onChange={(e) => setAiTone(e.target.value)} />
            <p className="text-xs text-ink-muted">
              Full AI preference persistence requires merchant settings APIs (planned Phase 3/4).
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Product catalog upload</h2>
            <p className="text-sm text-ink-muted">
              Catalog upload API is not available yet. Add a note for now, then upload files from Product Catalog.
            </p>
            <Textarea
              label="Catalog notes"
              value={catalogNote}
              onChange={(e) => setCatalogNote(e.target.value)}
              placeholder="e.g. Will upload Excel catalog after setup"
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose a subscription plan</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {(Object.keys(PLANS) as PlanId[]).map((id) => {
                const p = PLANS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPlan(id)}
                    className={cn(
                      "rounded-card border p-4 text-left transition",
                      plan === id ? "border-brand-green bg-brand-soft" : "border-line bg-white hover:border-brand-secondary/40"
                    )}
                  >
                    <div className="text-sm font-semibold text-ink">{p.name}</div>
                    <div className="mt-1 text-2xl font-semibold">${p.price}<span className="text-sm text-ink-muted">/mo</span></div>
                    <p className="mt-2 text-xs text-ink-muted">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test AI response</h2>
            <Input
              label="Sample customer message"
              value={testReply}
              onChange={(e) => setTestReply(e.target.value)}
              placeholder="Price of kurti set?"
            />
            {testReply && (
              <div className="rounded-xl border border-line bg-brand-soft p-4 text-sm text-ink">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-secondary">Demo AI reply</div>
                Assalam o Alaikum! Cotton Kurti Set currently PKR 3,200 with free delivery over PKR 5,000. Shall I reserve one for you?
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">You&apos;re ready</h2>
            <p className="text-sm text-ink-muted">
              WhatsRep workspace for <strong>{businessName || user.businessName}</strong> is configured.
              Live inbox uses your FastAPI `/messages` and `/send-message` endpoints.
            </p>
            <ul className="space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Business profile saved</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Plan selected: {PLANS[plan].name}</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Dashboard unlocked</li>
            </ul>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={goBack} disabled={step === 1 || saving}>
            Back
          </Button>
          <Button onClick={goNext} loading={saving}>
            {step === 7 ? "Go to dashboard" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
