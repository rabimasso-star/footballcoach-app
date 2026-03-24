"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  sessionId: string;
  blockId: string;
};

type RegenerateResponse = {
  id?: string;
  block?: {
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
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

      const result = (await apiFetch(
        `/sessions/${sessionId}/blocks/${blockId}/regenerate`,
        {
          method: "POST",
        },
      )) as RegenerateResponse;

      console.log("Regenerate block success", {
        sessionId,
        requestedBlockId: blockId,
        response: result,
        returnedId: result?.id,
        returnedBlockId: result?.block?.id,
      });

      router.refresh();
    } catch (error) {
      console.error("Regenerate block failed", {
        sessionId,
        blockId,
        error,
      });

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