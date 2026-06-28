"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openQuestion, setOpenQuestion] = useState(items[0]?.question ?? "");

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const isOpen = openQuestion === item.question;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-[24px] border border-[var(--skxnz-border)] bg-white shadow-[0_12px_28px_rgba(58,8,24,0.05)]"
          >
            <button
              type="button"
              onClick={() => setOpenQuestion(isOpen ? "" : item.question)}
              className="flex w-full min-w-0 items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="min-w-0 break-words text-sm font-bold uppercase tracking-[0.12em] text-sangria">
                {item.question}
              </span>
              <span className="shrink-0 text-xl text-teal">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <p className="border-t border-[var(--skxnz-border)] px-5 py-4 text-sm leading-7 text-midnightbrown/72">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
