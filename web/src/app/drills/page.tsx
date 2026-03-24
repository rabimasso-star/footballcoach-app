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
  const [errorMessage, setErrorMessage] = useState("");

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
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load drills.",
        );
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
        !category || drill.category.toLowerCase() === category.toLowerCase();

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

  function clearFilters() {
    setSearch("");
    setCategory("");
    setDifficulty("");
    setIntensity("");
    setAge("");
  }

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
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
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Filters</h2>

        <div className="form-grid">
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="search" style={{ fontWeight: 600 }}>
              Search
            </label>
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="passing, rondo, finishing..."
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="category" style={{ fontWeight: 600 }}>
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              <option value="warmup">Warmup</option>
              <option value="technical">Technical</option>
              <option value="possession">Possession</option>
              <option value="finishing">Finishing</option>
              <option value="game">Game</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="difficulty" style={{ fontWeight: 600 }}>
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="intensity" style={{ fontWeight: 600 }}>
              Intensity
            </label>
            <select
              id="intensity"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="age" style={{ fontWeight: 600 }}>
              Age
            </label>
            <input
              id="age"
              type="number"
              min={4}
              max={18}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 24, margin: 0 }}>Results</h2>

          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "#f8fafc",
              color: "#334155",
              fontWeight: 700,
            }}
          >
            {filteredDrills.length} drill{filteredDrills.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p style={{ color: "#64748b" }}>Loading drills...</p>
        ) : errorMessage ? (
          <div
            style={{
              borderRadius: 14,
              background: "#fef2f2",
              color: "#991b1b",
              padding: "12px 14px",
              border: "1px solid #fecaca",
            }}
          >
            {errorMessage}
          </div>
        ) : filteredDrills.length === 0 ? (
          <p style={{ color: "#64748b" }}>No drills match your filters.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredDrills.map((drill) => (
              <article
                key={drill.id}
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
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: 22, margin: "0 0 6px" }}>
                      {drill.name}
                    </h2>
                    <p style={{ color: "#475569", margin: 0 }}>
                      {capitalize(drill.category)} · {drill.durationMin} min ·
                      Difficulty {drill.difficulty}/5
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      href={`/drills/${drill.id}`}
                      className="secondary-button"
                    >
                      View drill
                    </Link>

                    <Link
                      href={`/drills/${drill.id}/builder`}
                      className="secondary-button"
                      style={{ textDecoration: "none" }}
                    >
                      Open builder
                    </Link>
                  </div>
                </div>

                {drill.description ? (
                  <p style={{ color: "#334155", marginBottom: 10 }}>
                    {drill.description}
                  </p>
                ) : null}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  <Meta label="Focus" value={drill.focusTags || "Not set"} />
                  <Meta
                    label="Players"
                    value={`${drill.minPlayers}-${drill.maxPlayers}`}
                  />
                  <Meta
                    label="Age"
                    value={
                      drill.ageMin != null && drill.ageMax != null
                        ? `${drill.ageMin}-${drill.ageMax}`
                        : "Not set"
                    }
                  />
                  <Meta label="Intensity" value={`${drill.intensity}/3`} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "#fff",
        border: "1px solid #e2e8f0",
        padding: "12px 14px",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 6 }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}