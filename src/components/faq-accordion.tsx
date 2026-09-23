"use client";

import { useState } from "react";

export type FaqGroup = { category: string; items: [string, string][] };

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      {groups.map((group) => (
        <section key={group.category} style={{ marginBottom: "36px" }} data-rev="true">
          <h2 className="cap mut" style={{ marginBottom: "12px" }}>{group.category}</h2>
          {group.items.map(([question, answer]) => {
            const key = `${group.category}:${question}`;
            return (
              <div className={`acc ${open === key ? "open" : ""}`.trim()} key={question}>
                <button className="acc-h" onClick={() => setOpen(open === key ? null : key)}>
                  {question}<i>+</i>
                </button>
                <div className="acc-b"><p>{answer}</p></div>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
