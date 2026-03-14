"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";

type CreateTeamPayload = {
  coachId: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string;
  trainingDaysPerWeek?: number;
  primaryGoals?: string;
};

const DEFAULT_COACH_ID = "demo-coach-id";

export default function NewTeamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);

    const payload: CreateTeamPayload = {
      coachId: String(formData.get("coachId") || DEFAULT_COACH_ID),
      name: String(formData.get("name") || ""),
      ageGroup: String(formData.get("ageGroup") || ""),
      competitionLevel: String(formData.get("competitionLevel") || ""),
      primaryFormation: String(formData.get("primaryFormation") || ""),
      trainingDaysPerWeek: Number(formData.get("trainingDaysPerWeek") || 0) || undefined,
      primaryGoals: String(formData.get("primaryGoals") || ""),
    };

    try {
      const team = await apiFetch<{ id: string }>("/teams", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccessMessage("Team profile created successfully.");
      router.push(`/teams/${team.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create team profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>
      </div>

      <section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 24,
          padding: 28,
          background: "#fff",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              display: "inline-block",
              marginBottom: 12,
              padding: "6px 10px",
              borderRadius: 999,
              background: "#dcfce7",
              color: "#166534",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Team profile
          </p>

          <h1 style={{ fontSize: 34, marginBottom: 10 }}>Create a new team</h1>
          <p style={{ color: "#475569", maxWidth: 700 }}>
            Fill in the team details that should guide future AI training
            suggestions. You can refine players and attributes next.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="coachId" style={{ fontWeight: 600 }}>
              Coach ID
            </label>
            <input
              id="coachId"
              name="coachId"
              defaultValue={DEFAULT_COACH_ID}
              placeholder="Replace with a real coach ID from your database"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="name" style={{ fontWeight: 600 }}>
              Team name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Example: Assyriska P12"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="ageGroup" style={{ fontWeight: 600 }}>
                Age group
              </label>
              <input
                id="ageGroup"
                name="ageGroup"
                required
                placeholder="Example: U12 / P12"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="competitionLevel" style={{ fontWeight: 600 }}>
                Competition level
              </label>
              <select
                id="competitionLevel"
                name="competitionLevel"
                defaultValue="Development"
                style={inputStyle}
              >
                <option>Development</option>
                <option>Grassroots</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Elite academy</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="primaryFormation" style={{ fontWeight: 600 }}>
                Primary formation
              </label>
              <input
                id="primaryFormation"
                name="primaryFormation"
                placeholder="Example: 4-3-3"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="trainingDaysPerWeek" style={{ fontWeight: 600 }}>
                Training days per week
              </label>
              <input
                id="trainingDaysPerWeek"
                name="trainingDaysPerWeek"
                type="number"
                min={1}
                max={7}
                placeholder="Example: 2"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="primaryGoals" style={{ fontWeight: 600 }}>
              Primary goals
            </label>
            <textarea
              id="primaryGoals"
              name="primaryGoals"
              rows={5}
              placeholder="Example: Improve first touch under pressure, team pressing and confidence in possession."
              style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
            />
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

          {successMessage ? (
            <div
              style={{
                borderRadius: 14,
                background: "#f0fdf4",
                color: "#166534",
                padding: "12px 14px",
              }}
            >
              {successMessage}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                border: "none",
                borderRadius: 14,
                background: "#0f172a",
                color: "#fff",
                padding: "14px 18px",
                fontWeight: 700,
                cursor: "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Creating team..." : "Save team profile"}
            </button>

            <Link
              href="/"
              style={{
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                padding: "14px 18px",
                textDecoration: "none",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
  background: "#fff",
};
