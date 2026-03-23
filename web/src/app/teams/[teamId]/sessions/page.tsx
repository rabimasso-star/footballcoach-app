import Link from "next/link";
import { getTeam, getTeamSessions } from "@/lib/api";

export default async function TeamSessionsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  let team;
  let sessions;

  try {
    [team, sessions] = await Promise.all([
      getTeam(teamId),
      getTeamSessions(teamId),
    ]);
  } catch {
    return (
      <main className="page-shell">
        <Link
          href={`/teams/${teamId}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to team
        </Link>
        <h1 className="section-title" style={{ marginTop: 24 }}>
          Could not load sessions
        </h1>
        <p className="section-subtitle">
          Check that the backend is running and that the sessions endpoint exists.
        </p>
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

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
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
            <p className="badge badge-green" style={{ marginBottom: 12 }}>
              Session library
            </p>
            <h1 className="section-title">{team.name} sessions</h1>
            <p className="section-subtitle">
              All saved training sessions for this team.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href={`/teams/${team.id}/sessions/new`}
              className="primary-button"
              style={{ textDecoration: "none" }}
            >
              Generate new session
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <InfoCard label="Total sessions" value={String(sessions.length)} />
          <InfoCard label="Age group" value={team.ageGroup} />
          <InfoCard label="Level" value={team.competitionLevel} />
        </div>
      </section>

      <section className="card" style={{ padding: 28 }}>
        {sessions.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 16,
              padding: 20,
              color: "#475569",
            }}
          >
            No saved sessions yet. Generate your first training session to start
            building the team library.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {sessions.map((session) => (
              <article
                key={session.id}
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
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: 22, marginBottom: 8 }}>
                      {session.title}
                    </h2>
                    <p style={{ color: "#475569", marginBottom: 6 }}>
                      {session.mainFocus || "No main focus set"}
                    </p>
                    <p style={{ color: "#64748b", margin: 0 }}>
                      {session.date || "No date"} ·{" "}
                      {session.durationMinutes
                        ? `${session.durationMinutes} min`
                        : "Duration not set"}{" "}
                      · {session.intensity || "Intensity not set"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      href={`/teams/${team.id}/sessions/${session.id}`}
                      className="primary-button"
                      style={{ textDecoration: "none" }}
                    >
                      Open session
                    </Link>
                  </div>
                </div>

                {session.blocks?.length ? (
                  <div style={{ marginTop: 16 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        fontWeight: 700,
                      }}
                    >
                      {session.blocks.length} block
                      {session.blocks.length === 1 ? "" : "s"}
                    </span>
                  </div>
                ) : null}
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