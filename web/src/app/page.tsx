type TeamListItem = {
  id: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
};

async function fetchTeams(): Promise<TeamListItem[]> {
  const res = await fetch("http://localhost:3000/teams", {
    // Adjust port if your backend runs elsewhere
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function Home() {
  const teams = await fetchTeams();

  return (
    <main style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
      <h1>Youth Football Coach – Teams</h1>
      <p>Click a team to see players and sessions.</p>
      {teams.length === 0 ? (
        <p>No teams yet. Create one via the API/backend.</p>
      ) : (
        <ul style={{ marginTop: "1.5rem", listStyle: "none", padding: 0 }}>
          {teams.map((team) => (
            <li key={team.id} style={{ marginBottom: "0.75rem" }}>
              <a
                href={`/teams/${team.id}`}
                style={{
                  display: "block",
                  padding: "0.75rem 1rem",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <strong>{team.name}</strong> – {team.ageGroup} (
                {team.competitionLevel})
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
