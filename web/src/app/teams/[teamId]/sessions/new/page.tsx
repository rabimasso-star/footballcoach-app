"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type FocusOption = {
  value: string;
  label: string;
};

const FOCUS_OPTIONS: FocusOption[] = [
  { value: "passing", label: "Passing" },
  { value: "first touch", label: "First touch" },
  { value: "dribbling", label: "Dribbling" },
  { value: "finishing", label: "Finishing" },
  { value: "possession", label: "Possession" },
  { value: "transition", label: "Transition" },
  { value: "pressing", label: "Pressing" },
  { value: "defending", label: "Defending" },
  { value: "attacking", label: "Attacking" },
  { value: "movement", label: "Movement" },
  { value: "scanning", label: "Scanning" },
  { value: "decision making", label: "Decision making" },
  { value: "speed", label: "Speed" },
  { value: "endurance", label: "Endurance" },
  { value: "communication", label: "Communication" },
  { value: "small-sided games", label: "Small-sided games" },
];

export default function NewTrainingSessionPage() {
  const router = useRouter();
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);
  const [customFocuses, setCustomFocuses] = useState("");

  const today = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  function toggleFocus(value: string) {
    setSelectedFocuses((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }

  function mapIntensityToNumber(value: string) {
    switch (value) {
      case "Low":
        return 1;
      case "High":
        return 3;
      case "Medium":
      default:
        return 2;
    }
  }

  function extractSessionId(response: unknown): string | null {
    if (!response || typeof response !== "object") {
      return null;
    }

    const data = response as {
      id?: unknown;
      sessionId?: unknown;
      session?: { id?: unknown };
    };

    if (typeof data.id === "string" && data.id.trim()) {
      return data.id;
    }

    if (typeof data.sessionId === "string" && data.sessionId.trim()) {
      return data.sessionId;
    }

    if (typeof data.session?.id === "string" && data.session.id.trim()) {
      return data.session.id;
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const extraFocuses = customFocuses
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const combinedFocuses = Array.from(
      new Set([...selectedFocuses, ...extraFocuses]),
    );

    const intensityLabel = String(formData.get("intensity") || "Medium").trim();

    const payload = {
      coachId: String(formData.get("coachId") || "").trim() || undefined,
      teamId,
      date: String(formData.get("date") || "").trim(),
      durationMinutes: Number(formData.get("durationMinutes") || 75),
      intensity: mapIntensityToNumber(intensityLabel),
      mainFocusTags: combinedFocuses.join(", "),
    };

    try {
      const response = await apiFetch<unknown>("/sessions/auto-plan", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const sessionId = extractSessionId(response);

      if (!sessionId) {
        console.error("Unexpected auto-plan response:", response);
        setErrorMessage(
          "Session was generated, but no session ID was returned from the server.",
        );
        return;
      }

      router.push(`/sessions/${sessionId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not generate training session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/teams/${teamId}`} style={backLinkStyle}>
          ← Back to team
        </Link>
      </div>

      <section style={cardStyle}>
        <div style={{ marginBottom: 28 }}>
          <p style={badgeStyle}>Session planner</p>
          <h1 style={{ fontSize: 34, marginBottom: 10 }}>
            Generate training session
          </h1>
          <p style={{ color: "#475569", maxWidth: 720, margin: 0 }}>
            Choose the date, intensity, duration and focus areas for the session.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 22 }}>
          <div style={twoColumnGridStyle}>
            <div style={fieldStyle}>
              <label htmlFor="coachId" style={labelStyle}>
                Coach ID
              </label>
              <input
                id="coachId"
                name="coachId"
                placeholder="Leave empty for demo coach"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="date" style={labelStyle}>
                Session date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={twoColumnGridStyle}>
            <div style={fieldStyle}>
              <label htmlFor="durationMinutes" style={labelStyle}>
                Duration (minutes)
              </label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={30}
                max={180}
                defaultValue={75}
                required
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="intensity" style={labelStyle}>
                Intensity
              </label>
              <select
                id="intensity"
                name="intensity"
                defaultValue="Medium"
                style={inputStyle}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Main focus areas</label>

            <div style={chipGridStyle}>
              {FOCUS_OPTIONS.map((option) => {
                const active = selectedFocuses.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleFocus(option.value)}
                    style={{
                      ...chipStyle,
                      background: active ? "#0f172a" : "#ffffff",
                      color: active ? "#ffffff" : "#0f172a",
                      border: active
                        ? "1px solid #0f172a"
                        : "1px solid #cbd5e1",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
              Select one or more common training elements.
            </p>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="customFocuses" style={labelStyle}>
              Additional custom focus areas
            </label>
            <input
              id="customFocuses"
              value={customFocuses}
              onChange={(e) => setCustomFocuses(e.target.value)}
              placeholder="Optional, e.g. weak foot, build-up, crossing"
              style={inputStyle}
            />
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
              Optional. Separate extra focus areas with commas.
            </p>
          </div>

          <div
            style={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              padding: 16,
            }}
          >
            <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Selected focus</p>
            <p style={{ margin: 0, color: "#334155" }}>
              {selectedFocuses.length > 0 || customFocuses.trim()
                ? [
                    ...selectedFocuses,
                    ...customFocuses
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  ].join(", ")
                : "No focus areas selected yet."}
            </p>
          </div>

          {errorMessage ? <div style={errorBoxStyle}>{errorMessage}</div> : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...primaryButtonStyle,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Generating..." : "Generate session"}
            </button>

            <Link href={`/teams/${teamId}`} style={secondaryButtonStyle}>
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 820,
  margin: "0 auto",
  padding: "48px 24px",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  padding: 28,
  background: "#ffffff",
  color: "#0f172a",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
};

const backLinkStyle: React.CSSProperties = {
  color: "#334155",
  textDecoration: "none",
  fontWeight: 600,
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const twoColumnGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 18,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
  background: "#ffffff",
  color: "#0f172a",
};

const chipGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#ffffff",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 14,
  background: "#0f172a",
  color: "#ffffff",
  padding: "14px 18px",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  padding: "14px 18px",
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 700,
};

const errorBoxStyle: React.CSSProperties = {
  borderRadius: 14,
  background: "#fef2f2",
  color: "#991b1b",
  padding: "12px 14px",
  border: "1px solid #fecaca",
};