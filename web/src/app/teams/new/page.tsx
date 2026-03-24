"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type CreateTeamPayload = {
  coachId?: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string;
  trainingDaysPerWeek?: number;
  primaryGoals?: string;
};

type CreateTeamResponse = {
  id: string;
};

export default function NewTeamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload: CreateTeamPayload = {
      coachId: String(formData.get("coachId") || "").trim() || undefined,
      name: String(formData.get("name") || "").trim(),
      ageGroup: String(formData.get("ageGroup") || "").trim(),
      competitionLevel: String(formData.get("competitionLevel") || "").trim(),
      primaryFormation:
        String(formData.get("primaryFormation") || "").trim() || undefined,
      trainingDaysPerWeek:
        Number(formData.get("trainingDaysPerWeek") || 0) || undefined,
      primaryGoals:
        String(formData.get("primaryGoals") || "").trim() || undefined,
    };

    try {
      const team = await apiFetch<CreateTeamResponse>("/teams", {
        method: "POST",
        body: JSON.stringify(payload),
      });

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
    <main style={pageStyle}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={backLinkStyle}>
          ← Back to dashboard
        </Link>
      </div>

      <section style={cardStyle}>
        <div style={{ marginBottom: 28 }}>
          <p style={badgeStyle}>Team profile</p>

          <h1 style={{ fontSize: 34, marginBottom: 10 }}>Create a new team</h1>

          <p style={{ color: "#475569", maxWidth: 700, margin: 0 }}>
            Fill in the team details that should guide future training plans,
            drill suggestions and team-specific recommendations.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
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
            <label htmlFor="name" style={labelStyle}>
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

          <div style={twoColumnGridStyle}>
            <div style={fieldStyle}>
              <label htmlFor="ageGroup" style={labelStyle}>
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

            <div style={fieldStyle}>
              <label htmlFor="competitionLevel" style={labelStyle}>
                Competition level
              </label>
              <select
                id="competitionLevel"
                name="competitionLevel"
                defaultValue="Development"
                style={inputStyle}
              >
                <option value="Development">Development</option>
                <option value="Grassroots">Grassroots</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Elite academy">Elite academy</option>
              </select>
            </div>
          </div>

          <div style={twoColumnGridStyle}>
            <div style={fieldStyle}>
              <label htmlFor="primaryFormation" style={labelStyle}>
                Primary formation
              </label>
              <input
                id="primaryFormation"
                name="primaryFormation"
                placeholder="Example: 4-3-3"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor="trainingDaysPerWeek" style={labelStyle}>
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

          <div style={fieldStyle}>
            <label htmlFor="primaryGoals" style={labelStyle}>
              Primary goals
            </label>
            <textarea
              id="primaryGoals"
              name="primaryGoals"
              rows={5}
              placeholder="Example: Improve first touch under pressure"
              style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
            />
          </div>

          {errorMessage ? (
            <div style={errorBoxStyle}>{errorMessage}</div>
          ) : null}

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
              {isSubmitting ? "Saving..." : "Save team profile"}
            </button>

            <Link href="/" style={secondaryButtonStyle}>
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
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
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
  outline: "none",
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