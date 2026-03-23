import Link from "next/link";
import { getSession, getTeam } from "@/lib/api";
import { getDefaultDrillLayout } from "@/lib/default-drill-layouts";

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
  items?: BoardItem[];
  lines?: BoardLine[];
};

const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 560;

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; id: string }>;
}) {
  const { teamId, id } = await params;

  let team = null;
  let session = null;

  try {
    [team, session] = await Promise.all([getTeam(teamId), getSession(teamId, id)]);
  } catch {
    return (
      <main className="page-shell">
        <Link
          href={`/teams/${teamId}/sessions`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to sessions
        </Link>

        <h1 className="section-title" style={{ marginTop: 24 }}>
          Session not found
        </h1>

        <p className="section-subtitle">
          Check that the session exists and that the backend route is available.
        </p>
      </main>
    );
  }

  if (!team || !session) {
    return (
      <main className="page-shell">
        <Link
          href={`/teams/${teamId}/sessions`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to sessions
        </Link>

        <h1 className="section-title" style={{ marginTop: 24 }}>
          Session not found
        </h1>

        <p className="section-subtitle">The session could not be loaded.</p>
      </main>
    );
  }

  const totalDrills =
    session.blocks?.reduce(
      (sum: number, block: any) => sum + (block.drills?.length || 0),
      0,
    ) || 0;

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
        <Link
          href={`/teams/${teamId}/sessions`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to sessions
        </Link>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={`/teams/${teamId}/sessions/${id}/builder`}
            className="secondary-button"
            style={{ textDecoration: "none" }}
          >
            Open session builder
          </Link>

          <Link
            href={`/teams/${teamId}/sessions/${id}/edit`}
            className="secondary-button"
            style={{ textDecoration: "none" }}
          >
            Edit session
          </Link>

          <Link
            href={`/teams/${teamId}/sessions/new`}
            className="primary-button"
            style={{ textDecoration: "none" }}
          >
            Generate new session
          </Link>
        </div>
      </div>

      <section
        className="card"
        style={{
          padding: 28,
          marginBottom: 24,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div>
            <p className="badge badge-green" style={{ marginBottom: 12 }}>
              Training session
            </p>

            <h1 className="section-title">{session.title}</h1>
            <p className="section-subtitle" style={{ marginBottom: 20 }}>
              {team.name}
            </p>

            <div
              style={{
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                padding: 16,
                background: "#ffffff",
              }}
            >
              <p style={{ margin: 0, color: "#334155" }}>
                <strong>Main focus:</strong> {session.mainFocus || "No focus set"}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            <InfoCard label="Date" value={formatDate(session.date)} />
            <InfoCard
              label="Duration"
              value={
                session.durationMinutes
                  ? `${session.durationMinutes} min`
                  : "Not set"
              }
            />
            <InfoCard label="Intensity" value={session.intensity || "Not set"} />
            <InfoCard label="Drills" value={String(totalDrills)} />
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 28, margin: 0 }}>Session blocks</h2>

          <div
            style={{
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            {session.blocks?.length || 0} block
            {(session.blocks?.length || 0) === 1 ? "" : "s"}
          </div>
        </div>

        {!session.blocks || session.blocks.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 16,
              padding: 20,
              color: "#475569",
              background: "#f8fafc",
            }}
          >
            This session has no blocks yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {session.blocks.map((block: any, index: number) => {
              const focusText =
                Array.isArray(block.focusTags) && block.focusTags.length > 0
                  ? block.focusTags.join(", ")
                  : block.focus || "No focus set";

              return (
                <article
                  key={block.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 20,
                    padding: 20,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#64748b",
                          marginBottom: 6,
                          fontWeight: 700,
                        }}
                      >
                        Block {index + 1}
                      </p>

                      <h3 style={{ fontSize: 26, marginBottom: 8 }}>
                        {block.title || formatBlockType(block.type) || "Untitled block"}
                      </h3>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 999,
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        Focus: {focusText}
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: 88,
                        height: 88,
                        borderRadius: 999,
                        border: "1px solid #dbe4f0",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        color: "#0f172a",
                        fontSize: 16,
                      }}
                    >
                      {block.durationMinutes ? `${block.durationMinutes} min` : "—"}
                    </div>
                  </div>

                  {block.description ? (
                    <p
                      style={{
                        color: "#334155",
                        lineHeight: 1.6,
                        marginBottom: 14,
                      }}
                    >
                      {block.description}
                    </p>
                  ) : null}

                  {block.notes ? (
                    <div
                      style={{
                        borderRadius: 14,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        padding: "14px 16px",
                        marginBottom: 14,
                      }}
                    >
                      <strong>Notes:</strong> {block.notes}
                    </div>
                  ) : null}

                  {block.drills && block.drills.length > 0 ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      {block.drills.map((item: any, drillIndex: number) => {
                        const drill = item.drill;
                        const layout =
                          drill?.layout || getDefaultDrillLayout(drill?.id);

                        return (
                          <div
                            key={item.id || drillIndex}
                            style={{
                              borderRadius: 16,
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              padding: 14,
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "130px minmax(0, 1fr)",
                                gap: 14,
                                alignItems: "start",
                              }}
                            >
                              <div>
                                {layout ? (
                                  <MiniPitch layout={layout} />
                                ) : (
                                  <div
                                    style={{
                                      height: 90,
                                      borderRadius: 14,
                                      border: "1px dashed #cbd5e1",
                                      background: "#f8fafc",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#64748b",
                                      fontSize: 12,
                                      textAlign: "center",
                                      padding: 8,
                                    }}
                                  >
                                    No layout
                                  </div>
                                )}
                              </div>

                              <div>
                                <p
                                  style={{
                                    marginBottom: 6,
                                    fontWeight: 800,
                                    fontSize: 18,
                                    color: "#0f172a",
                                  }}
                                >
                                  {drill?.title ||
                                    drill?.name ||
                                    `Drill ${drillIndex + 1}`}
                                </p>

                                <p style={{ margin: 0, color: "#64748b" }}>
                                  {drill?.category
                                    ? capitalize(drill.category)
                                    : "Drill"}{" "}
                                  ·{" "}
                                  {drill?.durationMin
                                    ? `${drill.durationMin} min`
                                    : "No duration"}
                                </p>

                                {drill?.focusTags ? (
                                  <p
                                    style={{
                                      color: "#64748b",
                                      marginTop: 6,
                                      marginBottom: 0,
                                    }}
                                  >
                                    Focus: {drill.focusTags}
                                  </p>
                                ) : null}

                                {drill?.description ? (
                                  <p
                                    style={{
                                      color: "#475569",
                                      marginTop: 10,
                                      marginBottom: item.customNotes ? 8 : 0,
                                    }}
                                  >
                                    {drill.description}
                                  </p>
                                ) : null}

                                {item.customNotes ? (
                                  <p style={{ color: "#334155", margin: 0 }}>
                                    <strong>Coach note:</strong> {item.customNotes}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRadius: 14,
                        border: "1px dashed #cbd5e1",
                        background: "#fff",
                        padding: 14,
                        color: "#64748b",
                      }}
                    >
                      No drills were attached to this block.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function MiniPitch({ layout }: { layout: DrillLayout }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 90,
        background: "linear-gradient(180deg, #4ea858 0%, #3d9447 100%)",
        borderRadius: 14,
        overflow: "hidden",
        border: "2px solid #d8f3dc",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 6,
          border: "1.5px solid rgba(255,255,255,0.85)",
          borderRadius: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 6,
          bottom: 6,
          width: 1.5,
          background: "rgba(255,255,255,0.85)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 18,
          height: 18,
          border: "1.5px solid rgba(255,255,255,0.85)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

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
        {(layout.lines || []).map((line) => {
          if (line.type === "arrow") {
            return (
              <line
                key={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#0f172a"
                strokeWidth={5}
                strokeLinecap="round"
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
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="10 9"
              opacity={0.95}
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
        {(layout.items || []).map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${(item.x / FIELD_WIDTH) * 100}%`,
              top: `${(item.y / FIELD_HEIGHT) * 100}%`,
              transform: "translate(-50%, -50%) scale(0.62)",
              transformOrigin: "center center",
            }}
          >
            {renderBoardItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderBoardItem(item: BoardItem) {
  if (item.type === "player") {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 11,
          border: "2px solid rgba(255,255,255,0.95)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
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
          borderBottom: "28px solid #fb923c",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.22))",
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
        background: "#ffffff",
        border: "2px solid #0f172a",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      }}
    />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "12px 14px",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 6 }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function CardBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "12px 14px",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 6 }}>{title}</p>
      <p style={{ margin: 0, color: "#334155", fontWeight: 600 }}>{children}</p>
    </div>
  );
}

function formatBlockType(value: string) {
  switch (value) {
    case "warmup":
      return "Warm-up";
    case "technical":
      return "Technical";
    case "possession":
      return "Possession";
    case "game":
      return "Game";
    case "finishing":
      return "Finishing";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
  background: "#fff",
  color: "#0f172a",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  background: "#fff",
  color: "#0f172a",
  resize: "vertical",
};
function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().split("T")[0];
}