"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        border: "none",
        borderRadius: 12,
        background: "#0f172a",
        color: "#ffffff",
        padding: "12px 16px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Print / Save as PDF
    </button>
  );
}