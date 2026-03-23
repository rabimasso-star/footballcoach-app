"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type TeamListItem = {
  id: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string | null;
  trainingDaysPerWeek?: number | null;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState("");

useEffect(() => {
  async function loadTeams() {
    try {
      const token = localStorage.getItem("accessToken");
      const coachRaw = localStorage.getItem("coach");

      if (!token) {
        console.error("No access token found in localStorage");
        setTeams([]);
        setLoading(false);
        return;
      }

      if (coachRaw) {
        try {
          const coach = JSON.parse(coachRaw);
          setCoachName(coach?.name || "");
        } catch {
          setCoachName("");
        }
      }

      const response = await fetch(`${API_BASE_URL}/teams`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Teams fetch failed:", response.status, text);
        setTeams([]);
        return;
      }

      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Could not load teams:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }

  loadTeams();
}, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("coach");
    window.location.href = "/login";
  }

  return (
    <ProtectedRoute>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {coachName ? `Logged in as ${coachName}` : "Coach dashboard"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#0f172a",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>

        {loading ? (
          <main style={{ padding: "12px 0" }}>
            <p>Loading teams...</p>
          </main>
        ) : (
          <>
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
                formation, training frequency and season goals.
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
                  marginBottom: 20,
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ fontSize: 24, margin: 0 }}>Your teams</h2>
                  <p style={{ color: "#64748b", marginTop: 6 }}>
                    Open a team to review players and prepare the next training
                    session.
                  </p>
                </div>

                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "#f8fafc",
                    color: "#334155",
                    fontWeight: 600,
                    height: "fit-content",
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
                  No teams yet. Create your first team profile.
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
                      <h3 style={{ fontSize: 20, marginTop: 0 }}>{team.name}</h3>

                      <p style={{ color: "#475569" }}>
                        {team.ageGroup} · {team.competitionLevel}
                      </p>

                      <p>
                        <strong>Formation:</strong>{" "}
                        {team.primaryFormation || "Not set"}
                      </p>

                      <p>
                        <strong>Training days/week:</strong>{" "}
                        {team.trainingDaysPerWeek ?? "Not set"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}