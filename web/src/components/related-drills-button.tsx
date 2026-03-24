"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Drill = {
  id: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  coachingPoints?: string | null;
  durationMin?: number | null;
  durationMinutes?: number | null;
  focusTags?: string | null;
  category?: string | null;
  relatedScore?: number;
};

type RelatedDrillsResponse = {
  blockId: string;
  currentDrillId?: string | null;
  drills: Drill[];
};

type Props = {
  sessionId: string;
  blockId: string;
};

export default function RelatedDrillsButton({
  sessionId,
  blockId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [drills, setDrills] = useState<Drill[]>([]);

  async function handleClick() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = (await apiFetch(
        `/sessions/${sessionId}/blocks/${blockId}/related-drills`,
        {
          method: "GET",
        },
      )) as RelatedDrillsResponse;

      setDrills(Array.isArray(result?.drills) ? result.drills : []);
      setIsOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load related drills.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8, minWidth: 220 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="secondary-button"
      >
        {isLoading
          ? "Loading..."
          : isOpen
            ? "Hide related drills"
            : "View related drills"}
      </button>

      {errorMessage ? (
        <p style={{ margin: 0, color: "#991b1b", fontSize: 14 }}>
          {errorMessage}
        </p>
      ) : null}

      {isOpen ? (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            background: "#fff",
            padding: 12,
            display: "grid",
            gap: 10,
          }}
        >
          {drills.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>
              No related drills found.
            </p>
          ) : (
            drills.map((drill) => (
              <div
                key={drill.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                  background: "#f8fafc",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#0f172a",
                  }}
                >
                  {drill.title || drill.name || "Untitled drill"}
                </p>

                {drill.category ? (
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
                    Category: {drill.category}
                  </p>
                ) : null}

                {(drill.durationMin ?? drill.durationMinutes) ? (
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
                    Duration: {drill.durationMin ?? drill.durationMinutes} min
                  </p>
                ) : null}

                {drill.description ? (
                  <p style={{ margin: "8px 0 0", color: "#334155", fontSize: 14 }}>
                    {drill.description}
                  </p>
                ) : null}

                {drill.coachingPoints ? (
                  <p style={{ margin: "8px 0 0", color: "#334155", fontSize: 14 }}>
                    <strong>Coaching points:</strong> {drill.coachingPoints}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}