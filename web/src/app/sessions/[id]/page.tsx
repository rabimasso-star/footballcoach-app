"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Drill = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  coachingPoints?: string | null;
  durationMinutes?: number | null;
  category?: string | null;
  focusTags?: string | null;
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

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replaceTarget, setReplaceTarget] = useState<{
    blockId: string;
    trainingBlockDrillId: string;
    currentDrillId: string;
  } | null>(null);
  const [alternatives, setAlternatives] = useState<Drill[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const resolved = await params;
      setSessionId(resolved.id);

      try {
        const data = await apiFetch<TrainingSession>(`/sessions/${resolved.id}`);
        setSession(data);
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [params]);

  async function openReplaceDrill(
    blockId: string,
    trainingBlockDrillId: string,
    currentDrillId: string,
  ) {
    if (!sessionId) return;

    setReplaceTarget({
      blockId,
      trainingBlockDrillId,
      currentDrillId,
    });
    setIsLoadingAlternatives(true);
    setAlternatives([]);

    try {
      const drills = await apiFetch<Drill[]>(
        `/sessions/${sessionId}/blocks/${blockId}/recommend-drills?excludeDrillId=${currentDrillId}`,
      );
      setAlternatives(drills);
    } catch {
      setAlternatives([]);
    } finally {
      setIsLoadingAlternatives(false);
    }
  }

  async function handleReplaceDrill(newDrillId: string) {
    if (!sessionId || !replaceTarget) return;

    try {
      setIsReplacing(true);

      const updated = await apiFetch<TrainingSession>(
        `/sessions/${sessionId}/blocks/${replaceTarget.blockId}/drills/${replaceTarget.trainingBlockDrillId}/replace`,
        {
          method: "POST",
          body: JSON.stringify({
            drillId: newDrillId,
          }),
        },
      );

      setSession(updated);
      setReplaceTarget(null);
      setAlternatives([]);
    } catch (error) {
      console.error("Could not replace drill:", error);
      alert("Could not replace drill.");
    } finally {
      setIsReplacing(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <p style={{ color: "#64748b" }}>Loading session...</p>
      </main>
    );
  }

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
                <div style={{ display: "grid", gap: 12 }}>
                  {block.drills.map((item) => {
                    const drillLabel = item.drill.title || item.drill.name || "Untitled drill";
                    const isCurrentReplaceTarget =
                      replaceTarget?.trainingBlockDrillId === item.id;

                    return (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: 14,
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          padding: 14,
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h4 style={{ margin: "0 0 8px", fontSize: 18 }}>
                              {drillLabel}
                            </h4>

                            {item.drill.durationMinutes ? (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                Suggested drill duration: {item.drill.durationMinutes} min
                              </p>
                            ) : null}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Link
                              href={`/drills/${item.drill.id}`}
                              className="secondary-button"
                              style={{ textDecoration: "none" }}
                            >
                              Open drill
                            </Link>

                            <Link
                              href={`/drills/builder?drillId=${item.drill.id}`}
                              className="secondary-button"
                              style={{ textDecoration: "none" }}
                            >
                              Open in builder
                            </Link>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                openReplaceDrill(block.id, item.id, item.drill.id)
                              }
                            >
                              Replace drill
                            </button>
                          </div>
                        </div>

                        {item.drill.description ? (
                          <p style={{ color: "#475569", margin: 0 }}>
                            {item.drill.description}
                          </p>
                        ) : null}

                        {item.drill.coachingPoints ? (
                          <div
                            style={{
                              borderRadius: 12,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              padding: 12,
                            }}
                          >
                            <p style={{ color: "#334155", margin: 0 }}>
                              <strong>Coaching points:</strong>{" "}
                              {item.drill.coachingPoints}
                            </p>
                          </div>
                        ) : null}

                        {item.customNotes ? (
                          <div
                            style={{
                              borderRadius: 12,
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              padding: 12,
                            }}
                          >
                            <p style={{ color: "#1e3a8a", margin: 0 }}>
                              <strong>Session notes:</strong> {item.customNotes}
                            </p>
                          </div>
                        ) : null}

                        {isCurrentReplaceTarget ? (
                          <div
                            style={{
                              borderRadius: 14,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              padding: 14,
                              display: "grid",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <h5 style={{ margin: 0, fontSize: 18 }}>
                                Recommended replacement drills
                              </h5>

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                  setReplaceTarget(null);
                                  setAlternatives([]);
                                }}
                              >
                                Close
                              </button>
                            </div>

                            {isLoadingAlternatives ? (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                Loading alternatives...
                              </p>
                            ) : alternatives.length === 0 ? (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                No similar drills found for this block.
                              </p>
                            ) : (
                              <div style={{ display: "grid", gap: 10 }}>
                                {alternatives.map((alternative) => {
                                  const alternativeLabel =
                                    alternative.title || alternative.name || "Untitled drill";

                                  return (
                                    <div
                                      key={alternative.id}
                                      style={{
                                        borderRadius: 12,
                                        background: "#fff",
                                        border: "1px solid #e2e8f0",
                                        padding: 12,
                                        display: "grid",
                                        gap: 10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          gap: 12,
                                          alignItems: "flex-start",
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <div>
                                          <h6 style={{ margin: "0 0 6px", fontSize: 16 }}>
                                            {alternativeLabel}
                                          </h6>

                                          <p style={{ margin: 0, color: "#64748b" }}>
                                            {alternative.category || "Drill"}
                                            {alternative.durationMinutes
                                              ? ` • ${alternative.durationMinutes} min`
                                              : ""}
                                          </p>
                                        </div>

                                        <button
                                          type="button"
                                          className="primary-button"
                                          disabled={isReplacing}
                                          onClick={() =>
                                            handleReplaceDrill(alternative.id)
                                          }
                                        >
                                          {isReplacing ? "Replacing..." : "Use this drill"}
                                        </button>
                                      </div>

                                      {alternative.description ? (
                                        <p style={{ margin: 0, color: "#475569" }}>
                                          {alternative.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
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
      <p style={{ fontSize: 22, fontWeight: 700 }}>{value}</p>
    </div>
  );
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
    case "game":
      return "Game";
    case "finishing":
      return "Finishing";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}