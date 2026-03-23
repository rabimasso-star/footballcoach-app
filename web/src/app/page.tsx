import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 40,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <h1 style={{ fontSize: 24 }}>⚽ Football Coach AI</h1>

          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/login" style={secondaryButton}>
              Log in
            </Link>

            <Link href="/teams" style={primaryButton}>
              Demo
            </Link>
          </div>
        </header>

        <section style={{ maxWidth: 800 }}>
          <h2
            style={{
              fontSize: 52,
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Plan better football training sessions
          </h2>

          <p
            style={{
              fontSize: 20,
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            Create teams, design training sessions, visualize drills and
            structure your coaching in one modern platform built for football
            coaches.
          </p>

          <div style={{ marginTop: 28, display: "flex", gap: 14 }}>
            <Link href="/login" style={primaryButton}>
              Log in as coach
            </Link>

            <Link href="/teams" style={secondaryButton}>
              Try demo
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 20,
          }}
        >
          <Feature
            title="Session Builder"
            description="Build structured training sessions with blocks and drills."
          />

          <Feature
            title="Drill Library"
            description="Store drills with diagrams, notes and coaching points."
          />

          <Feature
            title="Team Profiles"
            description="Adapt sessions based on age group, level and goals."
          />
        </section>
      </div>
    </main>
  );
}

function Feature({ title, description }: any) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        padding: 22,
        background: "#fff",
      }}
    >
      <h3 style={{ marginBottom: 10 }}>{title}</h3>
      <p style={{ color: "#475569" }}>{description}</p>
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  padding: "14px 20px",
  background: "#0f172a",
  color: "#fff",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryButton: React.CSSProperties = {
  padding: "14px 20px",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 600,
};