import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type Drill = {
  id: string;
  title: string;
  description?: string | null;
  coachingPoints?: string | null;
  durationMinutes?: number | null;
};

type TrainingBlockDrill = {
  id: string;
  order: number;
  customNotes?: string | null;
  drill: Drill;
};

type TrainingBlock = {
  id: string;
  type: string;
  order: number;
  durationMinutes: number;
  focusTags?: string | null;
  description?: string | null;
  drills: TrainingBlockDrill[];
};

type TrainingSession = {
  id: string;
  title: string;
  objective?: string | null;
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string | null;
  blocks: TrainingBlock[];
};

async function fetchSession(id: string): Promise<TrainingSession | null> {
  const response = await fetch(`${API_BASE_URL}/sessions/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await fetchSession(id);

  if (!session) {
    return (
      <main className="page-shell">
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>

        <h1 className="section-title" style={{ marginTop: 24 }}>
          Session not found
        </h1>

        <p className="section-subtitle">
          Check that the backend returned a session and that the route exists.
        </p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <p className="badge badge-blue" style={{ marginBottom: 12 }}>
          Training session
        </p>

        <h1 className="section-title">{session.title}</h1>

        <p className="section-subtitle" style={{ marginBottom: 20 }}>
          {session.objective || "AI-generated training session"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <InfoCard label="Date" value={formatDate(session.date)} />
          <InfoCard label="Duration" value={`${session.durationMinutes} min`} />
          <InfoCard label="Intensity" value={formatIntensity(session.intensity)} />
        </div>

        {session.mainFocusTags ? (
          <div
            style={{
              marginTop: 20,
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: 16,
            }}
          >
            <p style={{ margin: 0, color: "#334155" }}>
              <strong>Main focus:</strong> {session.mainFocusTags}
            </p>
          </div>
        ) : null}
      </section>

      <section className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 26, marginBottom: 18 }}>Session blocks</h2>

        <div style={{ display: "grid", gap: 18 }}>
          {session.blocks.map((block, index) => (
            <article
              key={block.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 20,
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#64748b",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Block {index + 1}
                  </p>

                  <h3 style={{ fontSize: 22, margin: 0 }}>
                    {formatBlockType(block.type)}
                  </h3>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    fontWeight: 700,
                  }}
                >
                  {block.durationMinutes} min
                </div>
              </div>

              {block.focusTags ? (
                <p style={{ color: "#475569", marginBottom: 10 }}>
                  <strong>Focus:</strong> {block.focusTags}
                </p>
              ) : null}

              {block.description ? (
                <p style={{ color: "#334155", marginBottom: 16 }}>
                  {block.description}
                </p>
              ) : null}

              {block.drills.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {block.drills.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: 14,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        padding: 14,
                      }}
                    >
                      <h4 style={{ margin: "0 0 8px", fontSize: 18 }}>
                        {item.drill.title}
                      </h4>

                      {item.drill.description ? (
                        <p style={{ color: "#475569", marginBottom: 8 }}>
                          {item.drill.description}
                        </p>
                      ) : null}

                      {item.drill.coachingPoints ? (
                        <p style={{ color: "#334155", marginBottom: 8 }}>
                          <strong>Coaching points:</strong>{" "}
                          {item.drill.coachingPoints}
                        </p>
                      ) : null}

                      {item.customNotes ? (
                        <p style={{ color: "#334155", margin: 0 }}>
                          <strong>Notes:</strong> {item.customNotes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748b", margin: 0 }}>
                  No drills were attached to this block.
                </p>
              )}
            </article>
          ))}
        </div>
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatIntensity(value: number) {
  if (value === 1) return "Low";
  if (value === 2) return "Medium";
  if (value === 3) return "High";
  return String(value);
}

function formatBlockType(value: string) {
  switch (value) {
    case "warmup":
      return "Warm-up";
    case "technical":
      return "Technical";
    case "possession":
      return "Possession";
    case "game":
      return "Game";
    case "finishing":
      return "Finishing";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}