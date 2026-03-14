"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string | null;
  trainingDaysPerWeek?: number | null;
  primaryGoals?: string | null;
};

export default function EditTeamPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = useMemo(() => String(params.teamId || ""), [params.teamId]);

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await apiFetch<Team>(`/teams/${teamId}`);
        setTeam(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load team.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") || ""),
      ageGroup: String(formData.get("ageGroup") || ""),
      competitionLevel: String(formData.get("competitionLevel") || ""),
      primaryFormation: String(formData.get("primaryFormation") || ""),
      trainingDaysPerWeek:
        Number(formData.get("trainingDaysPerWeek") || 0) || undefined,
      primaryGoals: String(formData.get("primaryGoals") || ""),
    };

    try {
      await apiFetch(`/teams/${teamId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      router.push(`/teams/${teamId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <p>Loading team...</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="page-shell">
        <p>Team not found.</p>
      </main>
    );
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
            Team profile
          </p>

          <h1 className="section-title">Edit team</h1>

          <p className="section-subtitle">
            Update team details, formation, weekly schedule and goals.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="name" style={{ fontWeight: 600 }}>
              Team name
            </label>
            <input id="name" name="name" required defaultValue={team.name} />
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="ageGroup" style={{ fontWeight: 600 }}>
                Age group
              </label>
              <input
                id="ageGroup"
                name="ageGroup"
                required
                defaultValue={team.ageGroup}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="competitionLevel" style={{ fontWeight: 600 }}>
                Competition level
              </label>
              <select
                id="competitionLevel"
                name="competitionLevel"
                defaultValue={team.competitionLevel}
              >
                <option>Development</option>
                <option>Grassroots</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Elite academy</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="primaryFormation" style={{ fontWeight: 600 }}>
                Primary formation
              </label>
              <input
                id="primaryFormation"
                name="primaryFormation"
                defaultValue={team.primaryFormation || ""}
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
                defaultValue={team.trainingDaysPerWeek || ""}
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
              defaultValue={team.primaryGoals || ""}
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

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
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