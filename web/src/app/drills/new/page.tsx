"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

type CreatedDrill = {
  id: string;
};

type GeneratedDrillDraft = {
  name?: string;
  description?: string;
  objectives?: string;
  category?: string;
  focusTags?: string;
  difficulty?: number;
  minPlayers?: number;
  maxPlayers?: number;
  durationMin?: number;
  intensity?: number;
  equipment?: string;
  pitchArea?: string;
  ageMin?: number | null;
  ageMax?: number | null;
};

type DrillFormState = {
  coachId: string;
  name: string;
  description: string;
  objectives: string;
  category: string;
  focusTags: string;
  difficulty: number;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  intensity: number;
  equipment: string;
  pitchArea: string;
  ageMin: string;
  ageMax: string;
};

const DEFAULT_FORM: DrillFormState = {
  coachId: "",
  name: "",
  description: "",
  objectives: "",
  category: "technical",
  focusTags: "",
  difficulty: 1,
  minPlayers: 4,
  maxPlayers: 12,
  durationMin: 10,
  intensity: 1,
  equipment: "",
  pitchArea: "",
  ageMin: "",
  ageMax: "",
};

export default function NewDrillPage() {
  const router = useRouter();

  const [form, setForm] = useState<DrillFormState>(DEFAULT_FORM);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");

  function updateField<K extends keyof DrillFormState>(
    key: K,
    value: DrillFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyGeneratedDraft(draft: GeneratedDrillDraft) {
    setForm((prev) => ({
      ...prev,
      name: draft.name ?? prev.name,
      description: draft.description ?? prev.description,
      objectives: draft.objectives ?? prev.objectives,
      category: draft.category ?? prev.category,
      focusTags: draft.focusTags ?? prev.focusTags,
      difficulty:
        typeof draft.difficulty === "number" ? draft.difficulty : prev.difficulty,
      minPlayers:
        typeof draft.minPlayers === "number" ? draft.minPlayers : prev.minPlayers,
      maxPlayers:
        typeof draft.maxPlayers === "number" ? draft.maxPlayers : prev.maxPlayers,
      durationMin:
        typeof draft.durationMin === "number"
          ? draft.durationMin
          : prev.durationMin,
      intensity:
        typeof draft.intensity === "number" ? draft.intensity : prev.intensity,
      equipment: draft.equipment ?? prev.equipment,
      pitchArea: draft.pitchArea ?? prev.pitchArea,
      ageMin:
        typeof draft.ageMin === "number"
          ? String(draft.ageMin)
          : draft.ageMin === null
            ? ""
            : prev.ageMin,
      ageMax:
        typeof draft.ageMax === "number"
          ? String(draft.ageMax)
          : draft.ageMax === null
            ? ""
            : prev.ageMax,
    }));
  }

  async function handleGenerateWithAi() {
    if (!aiPrompt.trim()) {
      setAiMessage(
        "Skriv en prompt först, till exempel: U12 passing drill for 8 players.",
      );
      return;
    }

    setIsGenerating(true);
    setAiMessage("");
    setErrorMessage("");

    try {
      const draft = await apiFetch<GeneratedDrillDraft>("/ai/drills/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
        }),
      });

      applyGeneratedDraft(draft);
      setAiMessage("AI-utkast skapat. Kontrollera och ändra innan du sparar.");
    } catch (error) {
      setAiMessage(
        error instanceof Error
          ? error.message
          : "Could not generate drill with AI.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const payload = {
      coachId: form.coachId.trim() || undefined,
      name: form.name,
      description: form.description,
      objectives: form.objectives,
      category: form.category,
      focusTags: form.focusTags,
      difficulty: Number(form.difficulty),
      minPlayers: Number(form.minPlayers),
      maxPlayers: Number(form.maxPlayers),
      durationMin: Number(form.durationMin),
      intensity: Number(form.intensity),
      equipment: form.equipment,
      pitchArea: form.pitchArea,
      ageMin: form.ageMin === "" ? undefined : Number(form.ageMin),
      ageMax: form.ageMax === "" ? undefined : Number(form.ageMax),
    };

    try {
      const drill = await apiFetch<CreatedDrill>("/drills", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push(`/drills/builder?drillId=${drill.id}`);
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
            Create a new football drill manually or generate a draft with AI.
          </p>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: 18,
            display: "grid",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Generate with AI</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Example prompt: U12 passing drill for 8 players, medium intensity,
              focus on scanning and first touch.
            </p>
          </div>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the drill you want the AI to create..."
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="primary-button"
              onClick={handleGenerateWithAi}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate with AI"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setAiPrompt("");
                setAiMessage("");
              }}
            >
              Clear prompt
            </button>
          </div>

          {aiMessage ? (
            <div
              style={{
                borderRadius: 14,
                background: "#eff6ff",
                color: "#1e3a8a",
                padding: "12px 14px",
              }}
            >
              {aiMessage}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="coachId" style={{ fontWeight: 600 }}>
              Coach ID
            </label>
            <input
              id="coachId"
              name="coachId"
              value={form.coachId}
              onChange={(e) => updateField("coachId", e.target.value)}
              placeholder="Leave empty for demo coach"
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="name" style={{ fontWeight: 600 }}>
              Drill name
            </label>
            <input
              id="name"
              name="name"
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="description" style={{ fontWeight: 600 }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="objectives" style={{ fontWeight: 600 }}>
              Objectives
            </label>
            <textarea
              id="objectives"
              name="objectives"
              rows={3}
              value={form.objectives}
              onChange={(e) => updateField("objectives", e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="category" style={{ fontWeight: 600 }}>
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
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
                value={form.focusTags}
                onChange={(e) => updateField("focusTags", e.target.value)}
                placeholder="passing, scanning, possession"
              />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="difficulty" style={{ fontWeight: 600 }}>
                Difficulty
              </label>
              <input
                id="difficulty"
                name="difficulty"
                type="number"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) =>
                  updateField("difficulty", Number(e.target.value || 1))
                }
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="intensity" style={{ fontWeight: 600 }}>
                Intensity
              </label>
              <input
                id="intensity"
                name="intensity"
                type="number"
                min={1}
                max={3}
                value={form.intensity}
                onChange={(e) =>
                  updateField("intensity", Number(e.target.value || 1))
                }
              />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="minPlayers" style={{ fontWeight: 600 }}>
                Min players
              </label>
              <input
                id="minPlayers"
                name="minPlayers"
                type="number"
                min={1}
                value={form.minPlayers}
                onChange={(e) =>
                  updateField("minPlayers", Number(e.target.value || 1))
                }
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="maxPlayers" style={{ fontWeight: 600 }}>
                Max players
              </label>
              <input
                id="maxPlayers"
                name="maxPlayers"
                type="number"
                min={1}
                value={form.maxPlayers}
                onChange={(e) =>
                  updateField("maxPlayers", Number(e.target.value || 1))
                }
              />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="durationMin" style={{ fontWeight: 600 }}>
                Duration
              </label>
              <input
                id="durationMin"
                name="durationMin"
                type="number"
                min={1}
                value={form.durationMin}
                onChange={(e) =>
                  updateField("durationMin", Number(e.target.value || 1))
                }
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="pitchArea" style={{ fontWeight: 600 }}>
                Pitch area
              </label>
              <input
                id="pitchArea"
                name="pitchArea"
                value={form.pitchArea}
                onChange={(e) => updateField("pitchArea", e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="ageMin" style={{ fontWeight: 600 }}>
                Age min
              </label>
              <input
                id="ageMin"
                name="ageMin"
                type="number"
                min={4}
                value={form.ageMin}
                onChange={(e) => updateField("ageMin", e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="ageMax" style={{ fontWeight: 600 }}>
                Age max
              </label>
              <input
                id="ageMax"
                name="ageMax"
                type="number"
                min={4}
                value={form.ageMax}
                onChange={(e) => updateField("ageMax", e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="equipment" style={{ fontWeight: 600 }}>
              Equipment
            </label>
            <input
              id="equipment"
              name="equipment"
              value={form.equipment}
              onChange={(e) => updateField("equipment", e.target.value)}
            />
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