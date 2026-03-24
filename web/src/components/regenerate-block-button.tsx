"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  sessionId: string;
  blockId: string;
};

export default function RegenerateBlockButton({
  sessionId,
  blockId,
}: Props) {
  const router = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleClick() {
    try {
      setIsRegenerating(true);
      setErrorMessage("");

      await apiFetch(`/sessions/${sessionId}/blocks/${blockId}/regenerate`, {
        method: "POST",
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not regenerate block.",
      );
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isRegenerating}
        className="secondary-button"
      >
        {isRegenerating ? "Regenerating..." : "Regenerate block"}
      </button>

      {errorMessage ? (
        <p style={{ margin: 0, color: "#991b1b", fontSize: 14 }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}