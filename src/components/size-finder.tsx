"use client";

import { useState } from "react";
import { SIZE_CHART, SIZES } from "@/lib/pdp";
import { showToast } from "@/lib/ui-events";

/* Shared by the PDP's size-guide modal and /help/size-guide. */
export function SizeChartTable() {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }} className="num">
      <thead>
        <tr style={{ borderBottom: "2px solid var(--bk)", textAlign: "left" }}>
          <th style={{ padding: "10px 6px" }}>SIZE</th>
          <th style={{ padding: "10px 6px" }}>CHEST</th>
          <th style={{ padding: "10px 6px" }}>LENGTH</th>
        </tr>
      </thead>
      <tbody>
        {SIZE_CHART.map(([size, chest, length]) => (
          <tr key={size} style={{ borderBottom: "1px solid var(--gy)" }}>
            <td style={{ padding: "10px 6px", fontWeight: 800 }}>{size}</td>
            <td style={{ padding: "10px 6px" }}>{chest}</td>
            <td style={{ padding: "10px 6px" }}>{length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HowToMeasure() {
  return (
    <>
      <div
        style={{
          aspectRatio: "16 / 7",
          border: "1px solid var(--gy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--of)",
        }}
      >
        <span className="d-md" style={{ opacity: 0.25 }}>DIAGRAM</span>
      </div>
      <p className="small mut" style={{ marginTop: "12px" }}>
        Chest: measure 1&quot; below the armpit, straight across. Length: from highest shoulder
        point to hem.
      </p>
    </>
  );
}

/* Height/weight/usual-size heuristic, lifted from the reference's PDP. */
export function SizeFinder({ fit = "oversized" }: { fit?: string }) {
  const [result, setResult] = useState("");

  function findSize(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const height = Number(form.get("h"));
    const weight = Number(form.get("w"));
    const usual = String(form.get("u") || "");
    const preferred = String(form.get("pf"));

    let i = usual ? SIZES.indexOf(usual) : 1;
    if (weight >= 85 || height >= 185) i++;
    if (weight >= 95) i++;
    if (preferred === "RELAXED") i++;
    if (preferred === "SNUG") i = Math.max(0, i - 1);
    i = Math.min(4, Math.max(0, i));

    setResult(SIZES[i]);
    showToast(`SIZE FOUND: ${SIZES[i]}`);
  }

  return (
    <div className="sfind" data-rev="true">
      <form className="frow" onSubmit={findSize}>
        <div className="fgrp">
          <label className="fl" htmlFor="sf-h">HEIGHT (CM)</label>
          <input className="inp" id="sf-h" name="h" type="number" placeholder="175" required />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="sf-w">WEIGHT (KG)</label>
          <input className="inp" id="sf-w" name="w" type="number" placeholder="70" required />
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="sf-u">USUAL SIZE</label>
          <select className="inp" id="sf-u" name="u" defaultValue="">
            <option value="">SELECT</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="fgrp">
          <label className="fl" htmlFor="sf-p">PREFERRED FIT</label>
          <select className="inp" id="sf-p" name="pf" defaultValue="TRUE TO SIZE">
            <option>TRUE TO SIZE</option>
            <option>RELAXED</option>
            <option>SNUG</option>
          </select>
        </div>
        <button className="btn" style={{ gridColumn: "1 / -1" }} type="submit">FIND MY SIZE</button>
      </form>

      {result && (
        <p className="sfind-res">
          RECOMMENDED: <b>{result}</b>{" "}
          <span className="mut small">— true to size for the {fit} cut</span>
        </p>
      )}
    </div>
  );
}
