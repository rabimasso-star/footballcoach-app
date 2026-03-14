"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type WeeklyPlanResponse = {
  weeks: {
    weekNumber: number;
    sessions: {
      title: string;
      focus: string;
      durationMinutes: number;
      intensity: string;
    }[];
  }[];
};

export default function NewPlanPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = useMemo(() => String(params.teamId || ""), [params.teamId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<WeeklyPlanResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setResult(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      teamId,
      weeks: Number(formData.get("weeks") || 4),
      sessionsPerWeek: Number(formData.get("sessionsPerWeek") || 2),
      defaultDurationMinutes: Number(formData.get("defaultDurationMinutes") || 75),
      mainFocus: String(formData.get("mainFocus") || "").trim(),
    };

    try {
      const response = await apiFetch<WeeklyPlanResponse>("/plans/weekly", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setResult(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not generate weekly plan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/teams/${teamId}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to team
        </Link>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ marginBottom: 28 }}>
          <p className="badge badge-green" style={{ marginBottom: 12 }}>
            Weekly planner
          </p>

          <h1 className="section-title">Generate weekly training plan</h1>

          <p className="section-subtitle">
            Build a multi-week training plan based on your team and player profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="weeks" style={{ fontWeight: 600 }}>
                Number of weeks
              </label>
              <input id="weeks" name="weeks" type="number" min={1} max={12} defaultValue={4} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="sessionsPerWeek" style={{ fontWeight: 600 }}>
                Sessions per week
              </label>
              <input
                id="sessionsPerWeek"
                name="sessionsPerWeek"
                type="number"
                min={1}
                max={7}
                defaultValue={2}
              />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="defaultDurationMinutes" style={{ fontWeight: 600 }}>
                Default duration (minutes)
              </label>
              <input
                id="defaultDurationMinutes"
                name="defaultDurationMinutes"
                type="number"
                min={30}
                max={180}
                defaultValue={75}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="mainFocus" style={{ fontWeight: 600 }}>
                Main focus
              </label>
              <input
                id="mainFocus"
                name="mainFocus"
                placeholder="Example: passing, positioning, confidence"
              />
            </div>
          </div>

          {errorMessage ? (
            <div
              style={{
                borderRadius: 14,
                background: "#fef2f2",
                color: "#991b1b",
                padding: "12px 14px",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" disabled={isSubmitting} className="primary-button">
              {isSubmitting ? "Generating plan..." : "Generate weekly plan"}
            </button>

            <Link href={`/teams/${teamId}`} className="secondary-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>

      {result ? (
        <section className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 28, marginBottom: 18 }}>Weekly plan</h2>

          <div style={{ display: "grid", gap: 18 }}>
            {result.weeks.map((week) => (
              <article
                key={week.weekNumber}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 20,
                  background: "#f8fafc",
                }}
              >
                <h3 style={{ fontSize: 22, marginBottom: 12 }}>
                  Week {week.weekNumber}
                </h3>

                <div style={{ display: "grid", gap: 12 }}>
                  {week.sessions.map((session, index) => (
                    <div
                      key={index}
                      style={{
                        borderRadius: 14,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        padding: 14,
                      }}
                    >
                      <h4 style={{ margin: "0 0 8px", fontSize: 18 }}>{session.title}</h4>
                      <p style={{ margin: "0 0 6px", color: "#334155" }}>
                        <strong>Focus:</strong> {session.focus}
                      </p>
                      <p style={{ margin: "0 0 6px", color: "#334155" }}>
                        <strong>Duration:</strong> {session.durationMinutes} min
                      </p>
                      <p style={{ margin: 0, color: "#334155" }}>
                        <strong>Intensity:</strong> {session.intensity}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}