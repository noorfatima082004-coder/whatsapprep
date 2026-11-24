import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-app">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,211,102,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(20,45,43,0.08),_transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 md:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-navy text-sm font-bold text-white">
            WR
          </div>
          <div>
            <Link href="/" className="text-lg font-semibold text-brand-navy">
              {APP_NAME}
            </Link>
            <p className="text-sm text-ink-muted">AI WhatsApp operations for social commerce</p>
          </div>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-card bg-brand-navy p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-brand-green">Merchant SaaS</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Run WhatsApp sales, AI replies, orders, and recovery in one place.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                Built for Pakistani and regional sellers who need Roman-Urdu understanding,
                payment verification workflows, and a premium operations inbox.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 text-center">
              {[
                ["Inbox", "Live"],
                ["AI Bot", "Ready"],
                ["PKR Ops", "Native"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/5 px-3 py-4">
                  <div className="text-lg font-semibold text-brand-green">{value}</div>
                  <div className="mt-1 text-xs text-white/60">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-ink">{title}</h1>
            <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
