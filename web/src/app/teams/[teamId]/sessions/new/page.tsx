"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type SessionDraft = {
  title: string;
  teamId: string;
  coachId: string;
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string;
  createdBy: string;
  blocks: {
    type: string;
    order: number;
    durationMinutes: number;
    focusTags?: string;
    description?: string;
    drills: {
      drillId: string;
      order: number;
      customNotes?: string;
    }[];
  }[];
};

type CreatedSession = {
  id: string;
};

export default function NewSessionPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = useMemo(() => String(params.teamId || ""), [params.teamId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const coachId = String(formData.get("coachId") || "").trim() || undefined;
    const date = String(formData.get("date") || "");
    const durationMinutes = Number(formData.get("durationMinutes") || 75);
    const intensityText = String(formData.get("intensity") || "medium");
    const mainFocusTags = String(formData.get("mainFocusTags") || "").trim();

    const intensityMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };

    const autoPlanPayload = {
      teamId,
      coachId,
      date,
      durationMinutes,
      intensity: intensityMap[intensityText] ?? 2,
      mainFocusTags,
    };

    try {
      const draft = await apiFetch<SessionDraft>("/sessions/auto-plan", {
        method: "POST",
        body: JSON.stringify(autoPlanPayload),
      });

      const created = await apiFetch<CreatedSession>("/sessions", {
        method: "POST",
        body: JSON.stringify(draft),
      });

      router.push(`/sessions/${created.id}`);
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
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/teams/${teamId}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to team
        </Link>
      </div>

      <section className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 28 }}>
          <p className="badge badge-green" style={{ marginBottom: 12 }}>
            Session planner
          </p>

          <h1 className="section-title">Generate training session</h1>

          <p className="section-subtitle">
            Choose the date, intensity, duration and focus areas.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="coachId" style={{ fontWeight: 600 }}>
                Coach ID
              </label>
              <input
                id="coachId"
                name="coachId"
                placeholder="Leave empty for demo coach"
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="date" style={{ fontWeight: 600 }}>
                Session date
              </label>
              <input id="date" name="date" type="date" required />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="durationMinutes" style={{ fontWeight: 600 }}>
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
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="intensity" style={{ fontWeight: 600 }}>
                Intensity
              </label>
              <select id="intensity" name="intensity" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="mainFocusTags" style={{ fontWeight: 600 }}>
              Main focus tags
            </label>
            <input
              id="mainFocusTags"
              name="mainFocusTags"
              placeholder="Example: passing, first touch, possession"
            />
            <p style={{ color: "#64748b", margin: 0 }}>
              Separate focus areas with commas.
            </p>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button"
            >
              {isSubmitting ? "Generating session..." : "Generate session"}
            </button>

            <Link href={`/teams/${teamId}`} className="secondary-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}