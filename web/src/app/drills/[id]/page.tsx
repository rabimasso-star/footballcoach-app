"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { apiFetch } from "@/lib/api";

type Drill = {
  id: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
  category: string;
  focusTags?: string | null;
  difficulty: number;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  intensity: number;
  equipment?: string | null;
  pitchArea?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
};

type BoardItemType = "player" | "cone" | "ball";

type BoardItem = {
  id: string;
  type: BoardItemType;
  x: number;
  y: number;
  label?: string;
};

type BoardLine = {
  id: string;
  type: "arrow" | "movement";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type DrillLayout = {
  items: BoardItem[];
  lines: BoardLine[];
  updatedAt: string;
};

const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 560;

export default function DrillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [drillId, setDrillId] = useState("");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [layout, setLayout] = useState<DrillLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadPage() {
      const resolved = await params;
      setDrillId(resolved.id);

      try {
        const [drillData, layoutData] = await Promise.all([
          apiFetch<Drill>(`/drills/${resolved.id}`),
          loadLayoutSafe(resolved.id),
        ]);

        setDrill(drillData);
        setLayout(layoutData);
      } catch {
        setDrill(null);
        setLayout(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [params]);

  async function handleExportImage() {
    if (!exportRef.current || !drill) return;

    try {
      setIsExporting(true);

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `drill-${slugify(drill.name)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Could not export image.");
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <p style={{ color: "#64748b" }}>Loading drill...</p>
      </main>
    );
  }

  if (!drill) {
    return (
      <main className="page-shell">
        <Link href="/drills" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to drill library
        </Link>
        <h1 className="section-title" style={{ marginTop: 24 }}>
          Drill not found
        </h1>
      </main>
    );
  }

  const hasLayout =
    !!layout &&
    ((Array.isArray(layout.items) && layout.items.length > 0) ||
      (Array.isArray(layout.lines) && layout.lines.length > 0));

  return (
    <main className="page-shell">
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link href="/drills" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to drill library
        </Link>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href={`/drills/builder?drillId=${drillId}`}
            className="secondary-button"
            style={{ textDecoration: "none" }}
          >
            Open builder
          </Link>

          <button
            type="button"
            className="primary-button"
            onClick={handleExportImage}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export as image"}
          </button>
        </div>
      </div>

      <div ref={exportRef} style={{ display: "grid", gap: 24 }}>
        <section className="card" style={{ padding: 28, background: "#ffffff" }}>
          <p className="badge badge-blue" style={{ marginBottom: 12 }}>
            Drill
          </p>

          <h1 className="section-title">{drill.name}</h1>

          <p className="section-subtitle" style={{ marginBottom: 20 }}>
            {drill.description || "No description added."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <Meta label="Category" value={capitalize(drill.category)} />
            <Meta label="Duration" value={`${drill.durationMin} min`} />
            <Meta label="Difficulty" value={`${drill.difficulty}/5`} />
            <Meta label="Intensity" value={`${drill.intensity}/3`} />
            <Meta label="Players" value={`${drill.minPlayers}-${drill.maxPlayers}`} />
            <Meta
              label="Age"
              value={
                drill.ageMin != null && drill.ageMax != null
                  ? `${drill.ageMin}-${drill.ageMax}`
                  : "Not set"
              }
            />
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <Block title="Objectives" content={drill.objectives || "Not set"} />
            <Block title="Focus tags" content={drill.focusTags || "Not set"} />
            <Block title="Equipment" content={drill.equipment || "Not set"} />
            <Block title="Pitch area" content={drill.pitchArea || "Not set"} />
          </div>
        </section>

        <section className="card" style={{ padding: 28, background: "#ffffff" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div>
              <h2 style={{ fontSize: 24, margin: 0 }}>Saved layout</h2>
              <p style={{ margin: "8px 0 0", color: "#64748b" }}>
                View the saved drill setup and movement pattern.
              </p>
            </div>

            <Link
              href={`/drills/builder?drillId=${drill.id}`}
              className="secondary-button"
              style={{ textDecoration: "none" }}
            >
              Edit layout
            </Link>
          </div>

          {hasLayout && layout ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: `${FIELD_WIDTH} / ${FIELD_HEIGHT}`,
                  background: "#3f8f47",
                  borderRadius: 24,
                  overflow: "hidden",
                  border: "4px solid #d1fae5",
                }}
              >
                <PitchLines />

                <svg
                  viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead-readonly"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 8 3, 0 6" fill="#0f172a" />
                    </marker>
                  </defs>

                  {layout.lines.map((line) => {
                    if (line.type === "arrow") {
                      return (
                        <line
                          key={line.id}
                          x1={line.x1}
                          y1={line.y1}
                          x2={line.x2}
                          y2={line.y2}
                          stroke="#0f172a"
                          strokeWidth={4}
                          markerEnd="url(#arrowhead-readonly)"
                        />
                      );
                    }

                    return (
                      <line
                        key={line.id}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#ffffff"
                        strokeWidth={4}
                        strokeDasharray="10 8"
                      />
                    );
                  })}
                </svg>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                  }}
                >
                  {layout.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        position: "absolute",
                        left: `${(item.x / FIELD_WIDTH) * 100}%`,
                        top: `${(item.y / FIELD_HEIGHT) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {renderBoardItem(item)}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <Meta label="Objects" value={String(layout.items.length)} />
                <Meta label="Lines" value={String(layout.lines.length)} />
                <Meta
                  label="Last updated"
                  value={formatUpdatedAt(layout.updatedAt)}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 18,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: 18,
              }}
            >
              <p style={{ margin: 0, color: "#64748b" }}>
                No saved layout yet for this drill.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

async function loadLayoutSafe(id: string): Promise<DrillLayout | null> {
  try {
    const data = await apiFetch<DrillLayout | null>(`/drills/${id}/layout`);

    if (!data) {
      return null;
    }

    return {
      items: Array.isArray(data.items) ? data.items : [],
      lines: Array.isArray(data.lines) ? data.lines : [],
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
    };
  } catch {
    return null;
  }
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        background: "#f8fafc",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  );
}

function Block({ title, content }: { title: string; content: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: 18,
      }}
    >
      <h2 style={{ fontSize: 20, marginBottom: 10 }}>{title}</h2>
      <p style={{ margin: 0, color: "#334155" }}>{content}</p>
    </div>
  );
}

function PitchLines() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: "3px solid rgba(255,255,255,0.85)",
          borderRadius: 16,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 18,
          bottom: 18,
          width: 3,
          background: "rgba(255,255,255,0.85)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 110,
          height: 110,
          border: "3px solid rgba(255,255,255,0.85)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          top: "50%",
          width: 120,
          height: 220,
          border: "3px solid rgba(255,255,255,0.85)",
          borderLeft: "none",
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 18,
          top: "50%",
          width: 120,
          height: 220,
          border: "3px solid rgba(255,255,255,0.85)",
          borderRight: "none",
          transform: "translateY(-50%)",
        }}
      />
    </>
  );
}

function renderBoardItem(item: BoardItem) {
  if (item.type === "player") {
    return (
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          border: "2px solid #fff",
          boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
        }}
      >
        {item.label || "P"}
      </div>
    );
  }

  if (item.type === "cone") {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderBottom: "30px solid #fb923c",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        border: "2px solid #0f172a",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    />
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatUpdatedAt(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}