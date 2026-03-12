type Player = {
  id: string;
  name: string;
  dominantFoot: string | null;
};

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  players: Player[];
};

type TrainingSession = {
  id: string;
  date: string;
  title: string;
  durationMinutes: number;
  intensity: number;
};

async function fetchTeam(id: string): Promise<Team | null> {
  const res = await fetch(`http://localhost:3000/teams/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchSessions(teamId: string): Promise<TrainingSession[]> {
  const res = await fetch(
    `http://localhost:3000/sessions/team/${teamId}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function TeamPage({
  params,
}: {
  params: { id: string };
}) {
  const team = await fetchTeam(params.id);
  const sessions = team ? await fetchSessions(team.id) : [];

  if (!team) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Team not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
      <h1>
        {team.name} – {team.ageGroup} ({team.competitionLevel})
      </h1>

      <section style={{ marginTop: "2rem" }}>
        <h2>Players</h2>
        {team.players.length === 0 ? (
          <p>No players yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {team.players.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong>{p.name}</strong>{" "}
                {p.dominantFoot ? `(${p.dominantFoot})` : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Sessions</h2>
        {sessions.length === 0 ? (
          <p>No sessions planned yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sessions.map((s) => (
              <li
                key={s.id}
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  marginBottom: "0.75rem",
                }}
              >
                <strong>{s.title}</strong> –{" "}
                {new Date(s.date).toLocaleDateString()} – {s.durationMinutes}{" "}
                min – intensity {s.intensity}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

