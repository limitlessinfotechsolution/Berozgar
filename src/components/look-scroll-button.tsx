"use client";

export function LookScrollButton() {
  return (
    <button
      className="btn"
      onClick={() => document.getElementById("look-items")?.scrollIntoView({ behavior: "smooth" })}
    >
      SHOP THIS LOOK
    </button>
  );
}
