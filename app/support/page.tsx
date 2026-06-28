"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import {
  useMarketplace,
  type SupportTicketRecord,
} from "@/components/marketplace/marketplace-provider";
import { PolicyNotice } from "@/components/legal/policy-notice";
import { SupportCard } from "@/components/support/support-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

type SupportFormState = {
  name: string;
  contact: string;
  userType: "Buyer" | "Seller";
  issueType: string;
  orderId: string;
  message: string;
};

const initialForm: SupportFormState = {
  name: "Demo Buyer",
  contact: "demo-buyer@skxnz.local",
  userType: "Buyer",
  issueType: "Sizing guidance",
  orderId: "",
  message: "",
};

const supportAreas = [
  ["Order help", "Demo order status and checkout questions only. Live delivery tracking is not connected."],
  ["Returns help", "Return windows and refund conditions are draft and must be finalized before public launch."],
  ["Seller help", "Seller onboarding is currently in review/beta and does not imply approval."],
  ["Account help", "Real authentication is not connected yet; account pages are beta foundations."],
  ["AI Assistant help", "AI Assistant Beta uses current catalog data and does not provide live try-on."],
  ["Community/reporting", "Signal Community is beta; report and moderation workflows are being prepared."],
];

export default function SupportPage() {
  const { createSupportTicket } = useMarketplace();
  const [form, setForm] = useState(initialForm);
  const [createdTicket, setCreatedTicket] = useState<SupportTicketRecord | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTicket = createSupportTicket({
      name: form.name,
      contact: form.contact,
      userType: form.userType,
      issueType: form.issueType,
      orderId: form.orderId,
      message: form.message,
    });

    setCreatedTicket(nextTicket);
    setForm(initialForm);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="rounded-[36px] border border-[var(--skxnz-border)] bg-[linear-gradient(135deg,var(--skxnz-maroon-deep),var(--skxnz-maroon),var(--skxnz-obsidian))] p-6 text-pearlcream shadow-[0_28px_70px_rgba(26,3,11,0.22)] sm:p-8">
        <p className="section-kicker text-[0.68rem] font-bold uppercase tracking-[0.24em] text-pearlcream/70">
          Support
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl uppercase leading-[0.95] tracking-[0.04em] text-pearlcream sm:text-5xl">
          Help without fake live-service claims.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-pearlcream/78 sm:text-base">
          SKXNZ support is a draft MVP foundation for order help, returns questions,
          seller help, account help, AI Assistant Beta, and community/reporting
          support before public launch.
        </p>
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {supportAreas.map(([title, description]) => (
          <SupportCard key={title} title={title} description={description} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <PolicyNotice tone="warning">
            Support tickets are created in browser-local MVP state only. No real
            support email, CRM, or admin notification system is connected yet.
          </PolicyNotice>
          <div className="flex flex-wrap gap-3">
            <Link href="/account" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Buyer Account
            </Link>
            <Link href="/faq" className={buttonVariants({ variant: "ghost", size: "lg" })}>
              Read FAQ
            </Link>
          </div>
        </div>

        <Card className="section-border rounded-[36px] bg-white p-6 sm:p-8">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-teal">
            MVP Support Intake
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
                  Name
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Demo Buyer"
                  className={fieldClassName}
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
                  Email or phone
                </span>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact: event.target.value }))
                  }
                  placeholder="demo-buyer@skxnz.local"
                  className={fieldClassName}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
                  User type
                </span>
                <select
                  value={form.userType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      userType: event.target.value as "Buyer" | "Seller",
                    }))
                  }
                  className={fieldClassName}
                >
                  <option>Buyer</option>
                  <option>Seller</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
                  Issue type
                </span>
                <select
                  value={form.issueType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, issueType: event.target.value }))
                  }
                  className={fieldClassName}
                >
                  <option>Sizing guidance</option>
                  <option>Order status</option>
                  <option>Delivery placeholder</option>
                  <option>Return question</option>
                  <option>Seller approval question</option>
                  <option>AI Assistant Beta</option>
                  <option>Community report</option>
                  <option>General support</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
                Order ID optional
              </span>
              <input
                type="text"
                value={form.orderId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, orderId: event.target.value }))
                }
                placeholder="SKX-1008"
                className={fieldClassName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
                Message
              </span>
              <textarea
                rows={6}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                placeholder="Tell SKXNZ what support you need."
                className={`${fieldClassName} rounded-[24px]`}
                required
              />
            </label>

            {createdTicket ? (
              <div className="rounded-[24px] border border-teal/20 bg-teal/10 p-4 text-sm leading-6 text-midnightbrown break-words">
                Support ticket created in MVP mode. Ticket ID: {createdTicket.id}
              </div>
            ) : null}

            <button
              type="submit"
              className={`${buttonVariants({ variant: "primary", size: "lg" })} w-full sm:w-auto`}
            >
              Create Demo Support Ticket
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
