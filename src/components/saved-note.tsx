"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * "Saved" beside a form's button for a few seconds after it saves. The live
 * region is always rendered (empty when idle) so screen readers announce the
 * change — a region that appears with its text already in it is often missed.
 */
export function useSavedNote(ms = 3000): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const flash = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaved(true);
    timer.current = setTimeout(() => setSaved(false), ms);
  }, [ms]);
  return [saved, flash];
}

export function SavedNote({ show, text = "Saved" }: { show: boolean; text?: string }) {
  return (
    <span className="saved" role="status">
      {show ? text : ""}
    </span>
  );
}
