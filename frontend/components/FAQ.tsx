"use client";
import React, { useId, useRef, useState, type KeyboardEvent } from "react";
import { HOW_IT_WORKS_CONTENT, type FAQItem } from "../data/howItWorksContent";

export interface FAQProps {
  theme: "dark" | "light";
  items?: FAQItem[];
  filterCategory?: string;
}

export default function FAQ({ theme, items = HOW_IT_WORKS_CONTENT.faq.items, filterCategory }: FAQProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const displayedItems = filterCategory && filterCategory !== "All"
    ? items.filter((item) => item.category === filterCategory)
    : items;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = displayedItems.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;

    if (next !== null) {
      event.preventDefault();
      buttonRefs.current[next]?.focus();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3" data-testid="faq-accordion-container">
      {displayedItems.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-question-${index}`;
        const panelId = `${baseId}-answer-${index}`;

        return (
          <div
            key={item.id || item.question}
            className={`rounded-2xl border transition-colors ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.025]"
                : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            <h3>
              <button
                ref={(element) => {
                  buttonRefs.current[index] = element;
                }}
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  theme === "dark" ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"
                }`}
                data-testid={`faq-question-btn-${index}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span>{item.question}</span>
                  {item.category && (
                    <span
                      className={`inline-block w-fit text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        theme === "dark"
                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {item.category}
                    </span>
                  )}
                </div>

                <span
                  aria-hidden="true"
                  className={`shrink-0 text-xl font-bold text-purple-400 transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={`px-6 pb-5 text-sm leading-6 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
              data-testid={`faq-answer-panel-${index}`}
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
