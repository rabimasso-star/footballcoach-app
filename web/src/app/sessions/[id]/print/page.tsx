import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type Drill = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  coachingPoints?: string | null;
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

export default async function SessionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await fetchSession(id);

  if (!session) {
    return (
      <main style={pageStyle}>
        <div style={toolbarStyle}>
          <Link href={`/sessions/${id}`} style={linkStyle}>
            ← Back to session
          </Link>
        </div>

        <section style={paperStyle}>
          <h1 style={titleStyle}>Session not found</h1>
          <p style={mutedStyle}>
            Check that the session exists and the backend is running.
          </p>
        </section>
      </main>
    );
  }

  const drillLayouts = await fetchLayoutsForSession(session);

  return (
    <main style={pageStyle}>
      <div style={toolbarStyle}>
        <Link href={`/sessions/${session.id}`} style={linkStyle}>
          ← Back to session
        </Link>
      </div>

      <section style={paperStyle}>
        <div style={printOnlyHeaderStyle}>
          <h1 style={titleStyle}>{session.title}</h1>
          <p style={mutedStyle}>
            {session.objective || "AI-generated training session"}
          </p>
        </div>

        <div style={helperBoxStyle}>
          Open your browser print dialog and choose <strong>Save as PDF</strong>.
        </div>

        <div style={metaGridStyle}>
          <PrintMeta label="Date" value={formatDate(session.date)} />
          <PrintMeta label="Duration" value={`${session.durationMinutes} min`} />
          <PrintMeta label="Intensity" value={formatIntensity(session.intensity)} />
        </div>

        {session.mainFocusTags ? (
          <div style={focusBoxStyle}>
            <strong>Main focus:</strong> {session.mainFocusTags}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 24 }}>
          {session.blocks.map((block, index) => (
            <section key={block.id} style={blockStyle}>
              <div style={blockHeaderStyle}>
                <div>
                  <p style={blockIndexStyle}>Block {index + 1}</p>
                  <h2 style={blockTitleStyle}>{formatBlockType(block.type)}</h2>
                </div>

                <div style={durationPillStyle}>{block.durationMinutes} min</div>
              </div>

              {block.focusTags ? (
                <p style={paragraphStyle}>
                  <strong>Focus:</strong> {block.focusTags}
                </p>
              ) : null}

              {block.description ? (
                <p style={paragraphStyle}>{block.description}</p>
              ) : null}

              {block.drills.length > 0 ? (
                <div style={{ display: "grid", gap: 18 }}>
                  {block.drills.map((item) => {
                    const layout = drillLayouts[item.drill.id];
                    const hasLayout =
                      !!layout &&
                      ((Array.isArray(layout.items) && layout.items.length > 0) ||
                        (Array.isArray(layout.lines) && layout.lines.length > 0));

                    return (
                      <article key={item.id} style={drillCardStyle}>
                        <h3 style={drillTitleStyle}>{getDrillName(item.drill)}</h3>

                        {hasLayout && layout ? (
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: `${FIELD_WIDTH} / ${FIELD_HEIGHT}`,
                              background: "#3f8f47",
                              borderRadius: 16,
                              overflow: "hidden",
                              border: "3px solid #d1fae5",
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
                                  id={`print-arrowhead-${item.id}`}
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
                                      markerEnd={`url(#print-arrowhead-${item.id})`}
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
                        ) : null}

                        {item.drill.description ? (
                          <p style={paragraphStyle}>{item.drill.description}</p>
                        ) : null}

                        {item.drill.coachingPoints ? (
                          <p style={paragraphStyle}>
                            <strong>Coaching points:</strong>{" "}
                            {item.drill.coachingPoints}
                          </p>
                        ) : null}

                        {item.customNotes ? (
                          <p style={paragraphStyle}>
                            <strong>Notes:</strong> {item.customNotes}
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p style={mutedStyle}>No drills attached to this block.</p>
              )}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function PrintMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaCardStyle}>
      <p style={metaLabelStyle}>{label}</p>
      <p style={metaValueStyle}>{value}</p>
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
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 12,
          border: "2px solid #fff",
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
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderBottom: "26px solid #fb923c",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        border: "2px solid #0f172a",
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

const pageStyle: React.CSSProperties = {
  background: "#eef2ff",
  minHeight: "100vh",
  padding: "32px 20px",
};

const toolbarStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const paperStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: 20,
  padding: 32,
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  display: "grid",
  gap: 24,
};

const printOnlyHeaderStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const helperBoxStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 14,
  color: "#334155",
};

const titleStyle: React.CSSProperties = {
  fontSize: 36,
  lineHeight: 1.1,
  margin: 0,
  color: "#0f172a",
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
};

const metaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const metaCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

const metaLabelStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#64748b",
};

const metaValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#0f172a",
};

const focusBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 16,
  color: "#334155",
};

const blockStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 20,
  background: "#ffffff",
  display: "grid",
  gap: 12,
};

const blockHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const blockIndexStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#64748b",
  fontWeight: 600,
};

const blockTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: "#0f172a",
};

const durationPillStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontWeight: 700,
  color: "#0f172a",
};

const drillCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

const drillTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 20,
  color: "#0f172a",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#334155",
  lineHeight: 1.5,
};

const linkStyle: React.CSSProperties = {
  color: "#334155",
  textDecoration: "none",
  fontWeight: 600,
};