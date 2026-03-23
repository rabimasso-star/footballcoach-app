"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession, getTeam, updateSession } from "@/lib/api";

const FOCUS_TAG_OPTIONS = [
  "passing",
  "first touch",
  "dribbling",
  "finishing",
  "possession",
  "defending",
  "pressing",
  "transition",
  "movement",
  "scanning",
  "speed",
  "coordination",
  "1v1",
  "small sided games",
];

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = useMemo(() => String(params.teamId), [params.teamId]);
  const sessionId = useMemo(() => String(params.id), [params.id]);

  const [teamName, setTeamName] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [intensity, setIntensity] = useState("Medium");
  const [selectedFocusTags, setSelectedFocusTags] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function toggleFocusTag(tag: string) {
    setSelectedFocusTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag],
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [team, session] = await Promise.all([
          getTeam(teamId),
          getSession(teamId, sessionId),
        ]);

        if (!isMounted) return;

        setTeamName(team.name);
        setTitle(session.title || "");
        setDate(formatDateForInput(session.date));
        setDurationMinutes(
          session.durationMinutes ? String(session.durationMinutes) : "",
        );
        setIntensity(session.intensity || "Medium");

        const parsedFocusTags =
          typeof session.mainFocus === "string" && session.mainFocus.trim()
            ? session.mainFocus
                .split(",")
                .map((tag: string) => tag.trim().toLowerCase())
                .filter(Boolean)
            : [];

        setSelectedFocusTags(parsedFocusTags);
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load the session.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [teamId, sessionId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorMessage("");

      await updateSession(sessionId, {
        title: title.trim(),
        date: date || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        intensity: intensity || undefined,
        mainFocus:
          selectedFocusTags.length > 0
            ? selectedFocusTags.join(", ")
            : undefined,
      });

      router.push(`/teams/${teamId}/sessions/${sessionId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save session.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <Link
          href={`/teams/${teamId}/sessions/${sessionId}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to session
        </Link>
        <h1 className="section-title" style={{ marginTop: 24 }}>
          Loading session...
        </h1>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/teams/${teamId}/sessions/${sessionId}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to session
        </Link>
      </div>

      <section className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 28 }}>
          <p className="badge badge-green" style={{ marginBottom: 12 }}>
            Edit session
          </p>

          <h1 className="section-title">Edit training session</h1>
          <p className="section-subtitle">
            {teamName ? `${teamName} · ` : ""}Update the core session details.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="title" style={{ fontWeight: 600 }}>
              Session title
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              style={inputStyle}
              placeholder="Example: Transition under pressure"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="date" style={{ fontWeight: 600 }}>
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="durationMinutes" style={{ fontWeight: 600 }}>
                Duration (minutes)
              </label>
              <input
                id="durationMinutes"
                type="number"
                min={1}
                max={240}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                style={inputStyle}
                placeholder="75"
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="intensity" style={{ fontWeight: 600 }}>
                Intensity
              </label>
              <select
                id="intensity"
                value={intensity}
                onChange={(event) => setIntensity(event.target.value)}
                style={inputStyle}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ fontWeight: 600 }}>Main focus</label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {FOCUS_TAG_OPTIONS.map((tag) => {
                const isSelected = selectedFocusTags.includes(tag);

                return (
                  <label
                    key={tag}
                    style={{
                      display: "grid",
                      justifyItems: "center",
                      alignContent: "center",
                      gap: 10,
                      minHeight: 92,
                      padding: "14px 12px",
                      borderRadius: 14,
                      border: isSelected
                        ? "2px solid #1d4ed8"
                        : "1px solid #e2e8f0",
                      background: isSelected ? "#eff6ff" : "#f8fafc",
                      cursor: "pointer",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFocusTag(tag)}
                      style={{
                        margin: 0,
                        width: 16,
                        height: 16,
                      }}
                    />
                    <span
                      style={{
                        lineHeight: 1.2,
                        fontWeight: isSelected ? 700 : 500,
                        color: "#0f172a",
                        wordBreak: "break-word",
                      }}
                    >
                      {capitalizeWords(tag)}
                    </span>
                  </label>
                );
              })}
            </div>
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
            <button
              type="submit"
              disabled={isSaving}
              style={{
                border: "none",
                borderRadius: 14,
                background: "#0f172a",
                color: "#fff",
                padding: "14px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>

            <Link
              href={`/teams/${teamId}/sessions/${sessionId}`}
              style={{
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                padding: "14px 18px",
                textDecoration: "none",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

function formatDateForInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
  background: "#fff",
  color: "#0f172a",
};