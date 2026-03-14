"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

type CreatedDrill = {
  id: string;
};

export default function NewDrillPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      coachId: String(formData.get("coachId") || "").trim() || undefined,
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      objectives: String(formData.get("objectives") || ""),
      category: String(formData.get("category") || "technical"),
      focusTags: String(formData.get("focusTags") || ""),
      difficulty: Number(formData.get("difficulty") || 1),
      minPlayers: Number(formData.get("minPlayers") || 4),
      maxPlayers: Number(formData.get("maxPlayers") || 12),
      durationMin: Number(formData.get("durationMin") || 10),
      intensity: Number(formData.get("intensity") || 1),
      equipment: String(formData.get("equipment") || ""),
      pitchArea: String(formData.get("pitchArea") || ""),
      ageMin: String(formData.get("ageMin") || ""),
      ageMax: String(formData.get("ageMax") || ""),
    };

    try {
      const drill = await apiFetch<CreatedDrill>("/drills", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push(`/drills/${drill.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create drill.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link href="/drills" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to drill library
        </Link>
      </div>

      <section className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 28 }}>
          <p className="badge badge-blue" style={{ marginBottom: 12 }}>
            Drill library
          </p>
          <h1 className="section-title">Add new drill</h1>
          <p className="section-subtitle">
            Add your own football drill to the library.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="coachId" style={{ fontWeight: 600 }}>
              Coach ID
            </label>
            <input id="coachId" name="coachId" placeholder="Leave empty for demo coach" />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="name" style={{ fontWeight: 600 }}>
              Drill name
            </label>
            <input id="name" name="name" required />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="description" style={{ fontWeight: 600 }}>
              Description
            </label>
            <textarea id="description" name="description" rows={4} />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="objectives" style={{ fontWeight: 600 }}>
              Objectives
            </label>
            <textarea id="objectives" name="objectives" rows={3} />
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="category" style={{ fontWeight: 600 }}>
                Category
              </label>
              <select id="category" name="category" defaultValue="technical">
                <option value="warmup">Warmup</option>
                <option value="technical">Technical</option>
                <option value="possession">Possession</option>
                <option value="finishing">Finishing</option>
                <option value="game">Game</option>
              </select>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="focusTags" style={{ fontWeight: 600 }}>
                Focus tags
              </label>
              <input
                id="focusTags"
                name="focusTags"
                placeholder="passing, scanning, possession"
              />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="difficulty" style={{ fontWeight: 600 }}>
                Difficulty
              </label>
              <input id="difficulty" name="difficulty" type="number" min={1} max={5} defaultValue={1} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="intensity" style={{ fontWeight: 600 }}>
                Intensity
              </label>
              <input id="intensity" name="intensity" type="number" min={1} max={3} defaultValue={1} />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="minPlayers" style={{ fontWeight: 600 }}>
                Min players
              </label>
              <input id="minPlayers" name="minPlayers" type="number" min={1} defaultValue={4} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="maxPlayers" style={{ fontWeight: 600 }}>
                Max players
              </label>
              <input id="maxPlayers" name="maxPlayers" type="number" min={1} defaultValue={12} />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="durationMin" style={{ fontWeight: 600 }}>
                Duration
              </label>
              <input id="durationMin" name="durationMin" type="number" min={1} defaultValue={10} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="pitchArea" style={{ fontWeight: 600 }}>
                Pitch area
              </label>
              <input id="pitchArea" name="pitchArea" />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="ageMin" style={{ fontWeight: 600 }}>
                Age min
              </label>
              <input id="ageMin" name="ageMin" type="number" min={4} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="ageMax" style={{ fontWeight: 600 }}>
                Age max
              </label>
              <input id="ageMax" name="ageMax" type="number" min={4} />
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="equipment" style={{ fontWeight: 600 }}>
              Equipment
            </label>
            <input id="equipment" name="equipment" />
          </div>

          {errorMessage ? (
            <div
              style={{
                borderRadius: 14,
                background: "#fef2f2",
                color: "#991b1b",
                padding: "12px 14px",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" disabled={isSubmitting} className="primary-button">
              {isSubmitting ? "Saving..." : "Save drill"}
            </button>

            <Link href="/drills" className="secondary-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}