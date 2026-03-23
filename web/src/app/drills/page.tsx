"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Drill = {
  id: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
  category: string;
  focusTags?: string | null;
  difficulty: number;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  intensity: number;
  equipment?: string | null;
  pitchArea?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
};

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [intensity, setIntensity] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    async function loadDrills() {
      try {
        const data = await apiFetch<Drill[]>("/drills");
        setDrills(data);
      } finally {
        setIsLoading(false);
      }
    }

    loadDrills();
  }, []);

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        drill.name.toLowerCase().includes(searchText) ||
        String(drill.description || "").toLowerCase().includes(searchText) ||
        String(drill.objectives || "").toLowerCase().includes(searchText) ||
        String(drill.focusTags || "").toLowerCase().includes(searchText);

      const matchesCategory =
        !category ||
        drill.category.toLowerCase() === category.toLowerCase();

      const matchesDifficulty =
        !difficulty || drill.difficulty === Number(difficulty);

      const matchesIntensity =
        !intensity || drill.intensity === Number(intensity);

      const selectedAge = age ? Number(age) : null;

      const matchesAge =
        selectedAge == null ||
        ((drill.ageMin == null || drill.ageMin <= selectedAge) &&
          (drill.ageMax == null || drill.ageMax >= selectedAge));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty &&
        matchesIntensity &&
        matchesAge
      );
    });
  }, [drills, search, category, difficulty, intensity, age]);

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/"
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to dashboard
        </Link>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p className="badge badge-blue" style={{ marginBottom: 12 }}>
              Drill library
            </p>

            <h1 className="section-title">Football drills</h1>

            <p className="section-subtitle">
              Browse, search and filter your coaching drill library.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/drills/new"
              className="primary-button"
              style={{ textDecoration: "none" }}
            >
              Add drill
            </Link>

            <Link
              href="/drills/builder"
              className="secondary-button"
              style={{ textDecoration: "none" }}
            >
              Open empty builder
            </Link>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <input
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            placeholder="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />

          <input
            placeholder="Intensity"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
          />

          <input
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
      </section>

      <section className="card" style={{ padding: 28 }}>
        {isLoading ? (
          <p>Loading drills...</p>
        ) : filteredDrills.length === 0 ? (
          <p>No drills found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            {filteredDrills.map((drill) => (
              <div
                key={drill.id}
                style={{
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  background: "#fff",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ marginBottom: 6 }}>{drill.name}</h3>

                  <p style={{ marginBottom: 8, color: "#475569" }}>
                    {drill.description || "No description yet."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      fontSize: 14,
                      color: "#64748b",
                    }}
                  >
                    <span>Category: {drill.category}</span>
                    <span>
                      Players: {drill.minPlayers}-{drill.maxPlayers}
                    </span>
                    <span>Duration: {drill.durationMin} min</span>
                    <span>Difficulty: {drill.difficulty}</span>
                    <span>Intensity: {drill.intensity}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link
                    href={`/drills/builder?drillId=${drill.id}`}
                    className="primary-button"
                    style={{ textDecoration: "none" }}
                  >
                    Open in builder
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}