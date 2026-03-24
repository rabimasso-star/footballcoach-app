import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type Drill = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  coachingPoints?: string | null;
  durationMinutes?: number | null;
  durationMin?: number | null;
};

type TrainingBlockDrill = {
  id: string;
  order: number;
  customNotes?: string | null;
  drill: Drill;
};

type TrainingBlock = {
  id: string;
  type: string;
  order: number;
  durationMinutes: number;
  focusTags?: string | null;
  description?: string | null;
  drills: TrainingBlockDrill[];
};

type TrainingSession = {
  id: string;
  title: string;
  objective?: string | null;
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string | null;
  blocks: TrainingBlock[];
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
  updatedAt?: string;
};

const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 560;

async function fetchSession(id: string): Promise<TrainingSession | null> {
  const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchDrillLayout(drillId: string): Promise<DrillLayout | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/drills/${drillId}/layout`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();

    if (!text.trim()) {
      return null;
    }

    const data = JSON.parse(text) as DrillLayout | null;

    if (!data) {
      return null;
    }

    return {
      items: Array.isArray(data.items) ? data.items : [],
      lines: Array.isArray(data.lines) ? data.lines : [],
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}

async function fetchLayoutsForSession(
  session: TrainingSession,
): Promise<Record<string, DrillLayout | null>> {
  const drillIds = Array.from(
    new Set(
      session.blocks.flatMap((block) =>
        block.drills.map((item) => item.drill.id).filter(Boolean),
      ),
    ),
  );

  const results = await Promise.all(
    drillIds.map(async (drillId) => {
      const layout = await fetchDrillLayout(drillId);
      return [drillId, layout] as const;
    }),
  );

  return Object.fromEntries(results);
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await fetchSession(id);

  if (!session) {
    return (
      <main className="page-shell">
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>

        <h1 className="section-title" style={{ marginTop: 24 }}>
          Session not found
        </h1>

        <p className="section-subtitle">
          Check that the backend returned a session and that the route exists.
        </p>
      </main>
    );
  }

  const drillLayouts = await fetchLayoutsForSession(session);

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <p className="badge badge-blue" style={{ marginBottom: 12 }}>
          Training session
        </p>

        <h1 className="section-title">{session.title}</h1>

        <p className="section-subtitle" style={{ marginBottom: 20 }}>
          {session.objective || "AI-generated training session"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <InfoCard label="Date" value={formatDate(session.date)} />
          <InfoCard label="Duration" value={`${session.durationMinutes} min`} />
          <InfoCard label="Intensity" value={formatIntensity(session.intensity)} />
        </div>

        {session.mainFocusTags ? (
          <div
            style={{
              marginTop: 20,
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: 16,
            }}
          >
            <p style={{ margin: 0, color: "#334155" }}>
              <strong>Main focus:</strong> {session.mainFocusTags}
            </p>
          </div>
        ) : null}
      </section>

      <section className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 26, marginBottom: 18 }}>Session blocks</h2>

        <div style={{ display: "grid", gap: 18 }}>
          {session.blocks.map((block, index) => (
            <article
              key={block.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 20,
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#64748b",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Block {index + 1}
                  </p>

                  <h3 style={{ fontSize: 22, margin: 0 }}>
                    {formatBlockType(block.type)}
                  </h3>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    fontWeight: 700,
                  }}
                >
                  {block.durationMinutes} min
                </div>
              </div>

              {block.focusTags ? (
                <p style={{ color: "#475569", marginBottom: 10 }}>
                  <strong>Focus:</strong> {block.focusTags}
                </p>
              ) : null}

              {block.description ? (
                <p style={{ color: "#334155", marginBottom: 16 }}>
                  {block.description}
                </p>
              ) : null}

              {block.drills.length > 0 ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {block.drills.map((item) => {
                    const layout = drillLayouts[item.drill.id];
                    const hasLayout =
                      !!layout &&
                      ((Array.isArray(layout.items) && layout.items.length > 0) ||
                        (Array.isArray(layout.lines) && layout.lines.length > 0));

                    return (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: 14,
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <h4 style={{ margin: 0, fontSize: 18 }}>
                            {getDrillName(item.drill)}
                          </h4>

                          <Link
                            href={`/drills/${item.drill.id}`}
                            className="secondary-button"
                            style={{ textDecoration: "none" }}
                          >
                            View drill
                          </Link>
                        </div>

                        {hasLayout && layout ? (
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: `${FIELD_WIDTH} / ${FIELD_HEIGHT}`,
                              background: "#3f8f47",
                              borderRadius: 20,
                              overflow: "hidden",
                              border: "4px solid #d1fae5",
                              marginBottom: 12,
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
                                  id={`arrowhead-${item.id}`}
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
                                      markerEnd={`url(#arrowhead-${item.id})`}
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
                              {layout.items.map((boardItem) => (
                                <div
                                  key={boardItem.id}
                                  style={{
                                    position: "absolute",
                                    left: `${(boardItem.x / FIELD_WIDTH) * 100}%`,
                                    top: `${(boardItem.y / FIELD_HEIGHT) * 100}%`,
                                    transform: "translate(-50%, -50%)",
                                  }}
                                >
                                  {renderBoardItem(boardItem)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              borderRadius: 14,
                              background: "#f8fafc",
                              border: "1px dashed #cbd5e1",
                              padding: 14,
                              marginBottom: 12,
                              color: "#64748b",
                            }}
                          >
                            No saved drill diagram for this exercise yet.
                          </div>
                        )}

                        {item.drill.description ? (
                          <p style={{ color: "#475569", marginBottom: 8 }}>
                            {item.drill.description}
                          </p>
                        ) : null}

                        {item.drill.coachingPoints ? (
                          <p style={{ color: "#334155", marginBottom: 8 }}>
                            <strong>Coaching points:</strong>{" "}
                            {item.drill.coachingPoints}
                          </p>
                        ) : null}

                        {item.customNotes ? (
                          <p style={{ color: "#334155", margin: 0 }}>
                            <strong>Notes:</strong> {item.customNotes}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "#64748b", margin: 0 }}>
                  No drills were attached to this block.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
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
      <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{value}</p>
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

function getDrillName(drill: Drill) {
  return drill.title || drill.name || "Untitled drill";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatIntensity(value: number) {
  if (value === 1) return "Low";
  if (value === 2) return "Medium";
  if (value === 3) return "High";
  return String(value);
}

function formatBlockType(value: string) {
  switch (value) {
    case "warmup":
      return "Warm-up";
    case "technical":
      return "Technical";
    case "possession":
      return "Possession";
    case "transition":
      return "Transition";
    case "game":
      return "Game";
    case "finishing":
      return "Finishing";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}