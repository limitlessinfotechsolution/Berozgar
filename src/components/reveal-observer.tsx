"use client";

import { useEffect } from "react";

/*
 * Scroll reveal. The stylesheet hides [data-rev] and dims .manif-line until the
 * element picks up `.in`, so this must run on every page that uses either.
 */
export function RevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.15 }
    );

    document.querySelectorAll("[data-rev]").forEach((el) => observer.observe(el));
    document.querySelectorAll<HTMLElement>(".manif-line").forEach((el, i) => {
      el.style.transitionDelay = `${0.12 * i}s`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
