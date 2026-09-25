/*
 * Swatch colours for the free-text colour names the ERP stores on variants.
 * Only names we can show truthfully are listed; anything else (a print name,
 * a typo) falls back to the text code, never to a guessed colour.
 */
const HEX: Record<string, string> = {
  BLACK: "#111111",
  "JET BLACK": "#0a0a0a",
  WHITE: "#ffffff",
  "OFF WHITE": "#f3efe6",
  CREAM: "#f1e8d6",
  IVORY: "#f6f1e3",
  BEIGE: "#d9c7a5",
  SAND: "#cdb991",
  KHAKI: "#b8a47a",
  BROWN: "#6b4a2f",
  CHOCOLATE: "#4a2f1f",
  GREY: "#8a8a8a",
  GRAY: "#8a8a8a",
  "LIGHT GREY": "#c9c9c9",
  "HEATHER GREY": "#b5b5b2",
  "DARK GREY": "#4a4a4a",
  CHARCOAL: "#36383b",
  NAVY: "#1c2541",
  "NAVY BLUE": "#1c2541",
  BLUE: "#2f5fb3",
  "ROYAL BLUE": "#2446a6",
  "SKY BLUE": "#8cc4e8",
  "BABY BLUE": "#a9cdec",
  TEAL: "#1f7a7a",
  GREEN: "#2f7d4a",
  "BOTTLE GREEN": "#12402a",
  OLIVE: "#5d6532",
  SAGE: "#9caf88",
  MINT: "#b7e4c7",
  RED: "#c0262d",
  MAROON: "#6d1a24",
  WINE: "#5a1a2a",
  BURGUNDY: "#6b1c2b",
  PINK: "#f2a7c3",
  "BABY PINK": "#f6c9d6",
  LAVENDER: "#b9a6d8",
  PURPLE: "#5e3a8c",
  ORANGE: "#e36a1e",
  RUST: "#a8431d",
  MUSTARD: "#d1a12a",
  YELLOW: "#f2c80f",
};

export function swatchFor(name: string): string | null {
  return HEX[name.trim().toUpperCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ")] ?? null;
}

/* Light swatches need an outline to read against the white page. */
export function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 200;
}
