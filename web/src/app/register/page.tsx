import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type TeamListItem = {
  id: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string | null;
  trainingDaysPerWeek?: number | null;
};

async function fetchTeams(): Promise<TeamListItem[]> {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export default async function HomePage() {
  const teams = await fetchTeams();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <section style={{ marginBottom: 32 }}>
        <p
          style={{
            display: "inline-block",
            marginBottom: 12,
            padding: "6px 10px",
            borderRadius: 999,
            background: "#eef2ff",
            color: "#3730a3",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          Football Coach AI
        </p>

        <h1 style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 12 }}>
          Build better training sessions for your team.
        </h1>

        <p style={{ fontSize: 18, color: "#475569", maxWidth: 760 }}>
          Start by creating a team profile. Add the age group, level,
          formation, training frequency and season goals. This becomes the
          foundation for player profiles and AI-generated training sessions.
        </p>

        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/teams/new"
            style={{
              background: "#0f172a",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Create team profile
          </Link>

          <Link
            href="/drills"
            style={{
              background: "#e2e8f0",
              color: "#0f172a",
              padding: "12px 18px",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Drill library
          </Link>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: 24,
          background: "#fff",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 4 }}>Your teams</h2>
            <p style={{ color: "#64748b" }}>
              Open a team to review players and prepare the next training session.
            </p>
          </div>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "#f8fafc",
              color: "#334155",
              fontWeight: 600,
            }}
          >
            {teams.length} team{teams.length === 1 ? "" : "s"}
          </span>
        </div>

        {teams.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 16,
              padding: 24,
              color: "#475569",
            }}
          >
            No teams yet. Create your first team profile to get started.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                style={{
                  display: "block",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 18,
                  textDecoration: "none",
                  color: "inherit",
                  background: "#f8fafc",
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 20, marginBottom: 6 }}>{team.name}</h3>
                  <p style={{ color: "#475569" }}>
                    {team.ageGroup} · {team.competitionLevel}
                  </p>
                </div>

                <div style={{ display: "grid", gap: 8, color: "#334155" }}>
                  <p>
                    <strong>Formation:</strong>{" "}
                    {team.primaryFormation || "Not set"}
                  </p>
                  <p>
                    <strong>Training days/week:</strong>{" "}
                    {team.trainingDaysPerWeek ?? "Not set"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}