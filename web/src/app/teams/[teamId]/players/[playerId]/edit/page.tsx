"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Player = {
  id: string;
  name: string;
  dateOfBirth?: string | null;
  positions?: string | null;
  dominantFoot?: string | null;
  notes?: string | null;
  attributes?: {
    speed: number;
    endurance: number;
    strength: number;
    dribbling: number;
    passing: number;
    shooting: number;
    firstTouch: number;
    tackling: number;
    positioning: number;
    decisionMaking: number;
    confidence: number;
    attitude: number;
    strengths?: string | null;
    weaknesses?: string | null;
  } | null;
};

const attributeFields = [
  { name: "speed", label: "Speed" },
  { name: "endurance", label: "Endurance" },
  { name: "strength", label: "Strength" },
  { name: "dribbling", label: "Dribbling" },
  { name: "passing", label: "Passing" },
  { name: "shooting", label: "Shooting" },
  { name: "firstTouch", label: "First touch" },
  { name: "tackling", label: "Tackling" },
  { name: "positioning", label: "Positioning" },
  { name: "decisionMaking", label: "Decision making" },
  { name: "confidence", label: "Confidence" },
  { name: "attitude", label: "Attitude" },
] as const;

export default function EditPlayerPage() {
  const params = useParams<{ teamId: string; playerId: string }>();
  const router = useRouter();

  const teamId = useMemo(() => String(params.teamId || ""), [params.teamId]);
  const playerId = useMemo(() => String(params.playerId || ""), [params.playerId]);

  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPlayer() {
      try {
        const data = await apiFetch<Player>(`/players/${playerId}`);
        setPlayer(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load player.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (playerId) {
      loadPlayer();
    }
  }, [playerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") || ""),
      dateOfBirth: String(formData.get("dateOfBirth") || "") || undefined,
      positions: String(formData.get("positions") || "") || undefined,
      dominantFoot: String(formData.get("dominantFoot") || "") || undefined,
      notes: String(formData.get("notes") || "") || undefined,
      attributes: {
        speed: Number(formData.get("speed") || 5),
        endurance: Number(formData.get("endurance") || 5),
        strength: Number(formData.get("strength") || 5),
        dribbling: Number(formData.get("dribbling") || 5),
        passing: Number(formData.get("passing") || 5),
        shooting: Number(formData.get("shooting") || 5),
        firstTouch: Number(formData.get("firstTouch") || 5),
        tackling: Number(formData.get("tackling") || 5),
        positioning: Number(formData.get("positioning") || 5),
        decisionMaking: Number(formData.get("decisionMaking") || 5),
        confidence: Number(formData.get("confidence") || 5),
        attitude: Number(formData.get("attitude") || 5),
        strengths: String(formData.get("strengths") || "") || undefined,
        weaknesses: String(formData.get("weaknesses") || "") || undefined,
      },
    };

    try {
      await apiFetch(`/players/${playerId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      router.push(`/teams/${teamId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update player.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <p>Loading player...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="page-shell">
        <p>Player not found.</p>
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

      <section className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 28 }}>
          <p className="badge badge-blue" style={{ marginBottom: 12 }}>
            Player profile
          </p>
          <h1 className="section-title">Edit player</h1>
          <p className="section-subtitle">
            Update role, notes and attribute scores for this player.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
          <div className="form-grid">
            <Field label="Player name" htmlFor="name">
              <input id="name" name="name" required defaultValue={player.name} />
            </Field>

            <Field label="Date of birth" htmlFor="dateOfBirth">
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={player.dateOfBirth ? player.dateOfBirth.slice(0, 10) : ""}
              />
            </Field>
          </div>

          <div className="form-grid">
            <Field label="Positions" htmlFor="positions">
              <input
                id="positions"
                name="positions"
                defaultValue={player.positions || ""}
              />
            </Field>

            <Field label="Dominant foot" htmlFor="dominantFoot">
              <select
                id="dominantFoot"
                name="dominantFoot"
                defaultValue={player.dominantFoot || ""}
              >
                <option value="">Choose foot</option>
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both</option>
              </select>
            </Field>
          </div>

          <Field label="Coach notes" htmlFor="notes">
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={player.notes || ""}
            />
          </Field>

          <section className="card" style={{ padding: 20, background: "#f8fafc" }}>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Attribute scores</h2>
            <p style={{ color: "#64748b", marginBottom: 18 }}>
              Use a 1–10 scale.
            </p>

            <div className="form-grid">
              {attributeFields.map((field) => (
                <Field key={field.name} label={field.label} htmlFor={field.name}>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={1}
                    max={10}
                    defaultValue={
                      player.attributes?.[field.name as keyof NonNullable<Player["attributes"]>] as number ?? 5
                    }
                  />
                </Field>
              ))}
            </div>

            <div className="form-grid" style={{ marginTop: 18 }}>
              <Field label="Main strengths" htmlFor="strengths">
                <textarea
                  id="strengths"
                  name="strengths"
                  rows={3}
                  defaultValue={player.attributes?.strengths || ""}
                />
              </Field>

              <Field label="Main weaknesses" htmlFor="weaknesses">
                <textarea
                  id="weaknesses"
                  name="weaknesses"
                  rows={3}
                  defaultValue={player.attributes?.weaknesses || ""}
                />
              </Field>
            </div>
          </section>

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
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>

            <Link href={`/teams/${teamId}`} className="secondary-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label htmlFor={htmlFor} style={{ fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}