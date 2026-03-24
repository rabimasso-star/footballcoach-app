"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  sessionId: string;
  blockId: string;
};

export default function GenerateAlternativeBlockButton({
  sessionId,
  blockId,
}: Props) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleClick() {
    try {
      setIsGenerating(true);
      setErrorMessage("");

      await apiFetch(`/sessions/${sessionId}/blocks/${blockId}/alternative`, {
        method: "POST",
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not generate alternative block.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isGenerating}
        className="secondary-button"
      >
        {isGenerating ? "Generating..." : "Generate alternative"}
      </button>

      {errorMessage ? (
        <p style={{ margin: 0, color: "#991b1b", fontSize: 14 }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}