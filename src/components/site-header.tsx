"use client";

import Image from "next/image";
import { SignOutButton } from "@/components/sign-out-button";

export function SiteHeader({ email }: { email?: string | null }) {
  return (
    <header className="border-b-2 border-bhp-gold bg-bhp-navy text-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="Bridge Hospitality Partners"
            width={48}
            height={34}
            className="h-9 w-auto"
            priority
          />
          <p className="hidden truncate font-[family-name:var(--font-display)] text-xs font-medium tracking-[0.18em] sm:block">
            BRIDGE HOSPITALITY PARTNERS
          </p>
        </div>
        {email ? (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-white/90 sm:inline">
              {email.toLowerCase() === "jankirre@gmail.com"
                ? "partners@bridgehosp.com"
                : email}
            </span>
            <SignOutButton />
          </div>
        ) : null}
      </div>
    </header>
  );
}
