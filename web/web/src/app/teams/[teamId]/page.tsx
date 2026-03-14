import Link from "next/link";
import { API_BASE_URL } from "@/src/lib/api";

type PlayerAttributeSet = {
  speed: number;
  endurance: number;
  strength: number;
  dribbling: number;
  passing: number;
  shooting: number;
  firstTouch: number;
  tackling: number;
  positioning: number;
  decisionMaking: number;
  confidence: number;
  attitude: number;
  strengths?: string | null;
  weaknesses?: string | null;
};

type Player = {
  id: string;
  name: string;
  positions?: string | null;
  dominantFoot?: string | null;
  notes?: string | null;
  attributes?: PlayerAttributeSet | null;
};

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string | null;
  trainingDaysPerWeek?: number | null;
  primaryGoals?: string | null;
  players: Player[];
};

async function fetchTeam(teamId: string): Promise<Team | null> {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await fetchTeam(teamId);

  if (!team) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ fontSize: 32, marginTop: 24 }}>Team not found</h1>
        <p style={{ color: "#475569", marginTop: 8 }}>
          Check that the backend is running and the team exists in the database.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 20 }}>
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
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                display: "inline-block",
                marginBottom: 12,
                padding: "6px 10px",
                borderRadius: 999,
                background: "#ede9fe",
                color: "#5b21b6",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Team profile
            </p>
            <h1 style={{ fontSize: 36, marginBottom: 10 }}>{team.name}</h1>
            <p style={{ color: "#475569", fontSize: 18 }}>
              {team.ageGroup} · {team.competitionLevel}
            </p>
          </div>

          <Link
            href="/teams/new"
            style={{
              textDecoration: "none",
              background: "#0f172a",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: 14,
              fontWeight: 700,
            }}
          >
            Create another team
          </Link>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <InfoCard label="Formation" value={team.primaryFormation || "Not set"} />
          <InfoCard
            label="Training days/week"
            value={
              team.trainingDaysPerWeek
                ? String(team.trainingDaysPerWeek)
                : "Not set"
            }
          />
          <InfoCard label="Players" value={String(team.players.length)} />
        </div>

        <div
          style={{
            marginTop: 24,
            borderRadius: 18,
            background: "#f8fafc",
            padding: 18,
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Primary goals</h2>
          <p style={{ color: "#334155", lineHeight: 1.6 }}>
            {team.primaryGoals || "No season goals have been added yet."}
          </p>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 24,
          padding: 28,
          background: "#fff",
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
            <h2 style={{ fontSize: 26, marginBottom: 6 }}>Players</h2>
            <p style={{ color: "#64748b" }}>
              Next step: build a player creation form so attributes can drive AI planning.
            </p>
          </div>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "#f8fafc",
              color: "#334155",
              fontWeight: 700,
            }}
          >
            {team.players.length} player{team.players.length === 1 ? "" : "s"}
          </span>
        </div>

        {team.players.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 16,
              padding: 20,
              color: "#475569",
            }}
          >
            No players yet. This page is now ready for the next feature: adding players
            and their attributes.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {team.players.map((player) => (
              <article
                key={player.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 18,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 6 }}>{player.name}</h3>
                    <p style={{ color: "#475569" }}>
                      {player.positions || "No positions set"} ·{" "}
                      {player.dominantFoot || "Foot not set"}
                    </p>
                  </div>
                </div>

                {player.notes ? (
                  <p style={{ color: "#334155", marginBottom: 12 }}>{player.notes}</p>
                ) : null}

                {player.attributes ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {renderAttribute("Speed", player.attributes.speed)}
                    {renderAttribute("Passing", player.attributes.passing)}
                    {renderAttribute("Dribbling", player.attributes.dribbling)}
                    {renderAttribute("First touch", player.attributes.firstTouch)}
                    {renderAttribute("Decision making", player.attributes.decisionMaking)}
                    {renderAttribute("Confidence", player.attributes.confidence)}
                  </div>
                ) : (
                  <p style={{ color: "#64748b" }}>No player attributes added yet.</p>
                )}
              </article>
            ))}
          </div>
        )}
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

function renderAttribute(label: string, value: number) {
  return (
    <div
      key={label}
      style={{
        borderRadius: 14,
        background: "#fff",
        padding: "12px 14px",
        border: "1px solid #e2e8f0",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700 }}>{value}/10</p>
    </div>
  );
}
