"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Drill = {
  id: string;
  title?: string | null;
  name?: string | null;
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
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string | null;
  blocks: TrainingBlock[];
};

export default function EditSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params?.id ?? "";

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await apiFetch<TrainingSession>(`/sessions/${sessionId}`);
        setSession(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load session.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const totalBlockMinutes = useMemo(() => {
    if (!session) return 0;
    return session.blocks.reduce(
      (sum, block) => sum + Number(block.durationMinutes || 0),
      0,
    );
  }, [session]);

  function updateSessionField<K extends keyof TrainingSession>(
    field: K,
    value: TrainingSession[K],
  ) {
    setSession((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateBlockField(
    blockId: string,
    field: keyof TrainingBlock,
    value: string | number,
  ) {
    setSession((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId ? { ...block, [field]: value } : block,
        ),
      };
    });
  }

  function updateDrillNote(
    blockId: string,
    drillId: string,
    value: string,
  ) {
    setSession((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                drills: block.drills.map((drill) =>
                  drill.id === drillId
                    ? { ...drill, customNotes: value }
                    : drill,
                ),
              }
            : block,
        ),
      };
    });
  }

  function mapIntensityToLabel(value: number) {
    if (value === 1) return "Low";
    if (value === 2) return "Medium";
    if (value === 3) return "High";
    return "Medium";
  }

  function mapIntensityToNumber(value: string) {
    if (value === "Low") return 1;
    if (value === "High") return 3;
    return 2;
  }

  function formatDateInput(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiFetch(`/sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: session.title,
          date: session.date,
          durationMinutes: Number(session.durationMinutes),
          intensity: Number(session.intensity),
          mainFocusTags: session.mainFocusTags || "",
          blocks: session.blocks.map((block) => ({
            id: block.id,
            order: Number(block.order),
            durationMinutes: Number(block.durationMinutes),
            focusTags: block.focusTags || "",
            description: block.description || "",
            drills: block.drills.map((drill) => ({
              id: drill.id,
              order: Number(drill.order),
              customNotes: drill.customNotes || "",
            })),
          })),
        }),
      });

      setSuccessMessage("Session updated successfully.");
      router.push(`/sessions/${session.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update session.",
      );
    } finally {
      setIsSaving(false);
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
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/sessions/${session.id}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to session
        </Link>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <p className="badge badge-blue" style={{ marginBottom: 12 }}>
          Edit session
        </p>

        <h1 className="section-title" style={{ marginBottom: 8 }}>
          Update training session
        </h1>

        <p className="section-subtitle">
          Adjust the title, date, intensity, duration and block details.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="title" style={{ fontWeight: 600 }}>
                Session title
              </label>
              <input
                id="title"
                value={session.title}
                onChange={(e) => updateSessionField("title", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="date" style={{ fontWeight: 600 }}>
                Session date
              </label>
              <input
                id="date"
                type="date"
                value={formatDateInput(session.date)}
                onChange={(e) =>
                  updateSessionField("date", e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="durationMinutes" style={{ fontWeight: 600 }}>
                Total duration
              </label>
              <input
                id="durationMinutes"
                type="number"
                min={30}
                max={180}
                value={session.durationMinutes}
                onChange={(e) =>
                  updateSessionField(
                    "durationMinutes",
                    Number(e.target.value),
                  )
                }
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="intensity" style={{ fontWeight: 600 }}>
                Intensity
              </label>
              <select
                id="intensity"
                value={mapIntensityToLabel(session.intensity)}
                onChange={(e) =>
                  updateSessionField(
                    "intensity",
                    mapIntensityToNumber(e.target.value),
                  )
                }
                style={inputStyle}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="mainFocusTags" style={{ fontWeight: 600 }}>
              Main focus tags
            </label>
            <input
              id="mainFocusTags"
              value={session.mainFocusTags || ""}
              onChange={(e) =>
                updateSessionField("mainFocusTags", e.target.value)
              }
              placeholder="passing, defending, first touch"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: 16,
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>
              Block duration summary
            </p>
            <p style={{ margin: 0, color: "#334155" }}>
              Blocks total: <strong>{totalBlockMinutes} min</strong> · Session total:{" "}
              <strong>{session.durationMinutes} min</strong>
            </p>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {session.blocks.map((block, index) => (
              <section
                key={block.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 20,
                  background: "#f8fafc",
                  display: "grid",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
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
                    <h2 style={{ margin: 0, fontSize: 24 }}>
                      {formatBlockType(block.type)}
                    </h2>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontWeight: 600 }}>Duration</label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={block.durationMinutes}
                      onChange={(e) =>
                        updateBlockField(
                          block.id,
                          "durationMinutes",
                          Number(e.target.value),
                        )
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontWeight: 600 }}>Focus tags</label>
                    <input
                      value={block.focusTags || ""}
                      onChange={(e) =>
                        updateBlockField(block.id, "focusTags", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontWeight: 600 }}>Description</label>
                  <textarea
                    rows={4}
                    value={block.description || ""}
                    onChange={(e) =>
                      updateBlockField(block.id, "description", e.target.value)
                    }
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                {block.drills.length > 0 ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {block.drills.map((drill) => (
                      <div
                        key={drill.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          background: "#fff",
                          padding: 14,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 700 }}>
                          {getDrillName(drill.drill)}
                        </p>

                        <div style={{ display: "grid", gap: 8 }}>
                          <label style={{ fontWeight: 600 }}>Drill notes</label>
                          <textarea
                            rows={3}
                            value={drill.customNotes || ""}
                            onChange={(e) =>
                              updateDrillNote(
                                block.id,
                                drill.id,
                                e.target.value,
                              )
                            }
                            style={{ ...inputStyle, resize: "vertical" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", margin: 0 }}>
                    No drills attached to this block.
                  </p>
                )}
              </section>
            ))}
          </div>

          {errorMessage ? (
            <div
              style={{
                borderRadius: 14,
                background: "#fef2f2",
                color: "#991b1b",
                padding: "12px 14px",
                border: "1px solid #fecaca",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div
              style={{
                borderRadius: 14,
                background: "#f0fdf4",
                color: "#166534",
                padding: "12px 14px",
                border: "1px solid #bbf7d0",
              }}
            >
              {successMessage}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSaving}
              className="primary-button"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>

            <Link
              href={`/sessions/${session.id}`}
              className="secondary-button"
              style={{ textDecoration: "none" }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

function getDrillName(drill: Drill) {
  return drill.title || drill.name || "Untitled drill";
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
  background: "#fff",
  color: "#0f172a",
};