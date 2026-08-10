import { KeyRound, ShieldCheck, Warehouse } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Mark, Wordmark } from "@/components/brand";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: "Roles decide what you can change",
    body: "Admins move stock and prices. Editors write specifications. Everyone else reads.",
  },
  {
    icon: KeyRound,
    title: "Every change is confirmed with a PIN",
    body: "Saving asks for your PIN, so the log names who authorised each entry.",
  },
  {
    icon: Warehouse,
    title: "One record across three sites",
    body: "Bangkok, Chiang Mai and Phuket counts roll up into a single stock position.",
  },
];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_28rem]">
      {/* Identity panel — the one place the wordmark gets room to breathe. */}
      <section className="relative hidden flex-col justify-between bg-chrome px-10 py-12 lg:flex xl:px-14">
        <Wordmark alt="RaasPal — Robot as a Service" className="h-14" priority />

        <div className="max-w-lg">
          <p className="eyebrow !text-[var(--brand-400)]">Internal system</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-white xl:text-5xl">
            Robot Inventory
            <br />
            Management System
          </h1>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/60">
            The single record of what RaasPal holds, what it costs and who
            changed it. Sign in with your work account to continue.
          </p>

          <ul className="mt-10 space-y-5 border-t border-white/10 pt-8">
            {ASSURANCES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-[var(--brand-400)]">
                  <Icon size={16} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.875rem] font-medium text-white/90">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-white/50">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[0.6875rem] text-white/30">
          RaasPal Co., Ltd. · Authorised personnel only
        </p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark className="size-10" priority />
            <Wordmark className="h-7" priority />
          </div>

          <p className="eyebrow">Sign in</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">
            Welcome back
          </h2>
          <p className="mt-1.5 text-[0.875rem] text-muted lg:hidden">
            Robot Inventory Management System
          </p>

          <div className="mt-7">
            <SignInForm />
          </div>

          <p className="mt-8 border-t border-line pt-5 text-[0.75rem] leading-relaxed text-muted">
            Lost your password or PIN? Ask an admin to reset it in{" "}
            <span className="font-medium text-fg">Accounts</span>. PINs are never
            sent by email.
          </p>
        </div>
      </section>
    </div>
  );
}
