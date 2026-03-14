"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type TeamPlayer = {
  id: string;
  name: string;
  positions?: string | null;
};

type FormationPlayer = {
  id: string;
  playerId: string | null;
  name: string;
  x: number;
  y: number;
  role: string;
};

type FormationResponse = {
  teamId: string;
  formation: string | null;
  layout: {
    formation?: string | null;
    players?: FormationPlayer[];
    updatedAt?: string;
  } | null;
  players: TeamPlayer[];
};

const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 560;

const FORMATIONS: Record<string, Array<{ role: string; x: number; y: number }>> = {
  "3-4-1": [
    { role: "GK", x: 80, y: 280 },
    { role: "CB", x: 230, y: 140 },
    { role: "CB", x: 230, y: 280 },
    { role: "CB", x: 230, y: 420 },
    { role: "LM", x: 430, y: 90 },
    { role: "CM", x: 430, y: 220 },
    { role: "CM", x: 430, y: 340 },
    { role: "RM", x: 430, y: 470 },
    { role: "AM", x: 630, y: 280 },
    { role: "ST", x: 790, y: 280 },
  ],
  "4-3-3": [
    { role: "GK", x: 80, y: 280 },
    { role: "LB", x: 230, y: 80 },
    { role: "CB", x: 230, y: 220 },
    { role: "CB", x: 230, y: 340 },
    { role: "RB", x: 230, y: 480 },
    { role: "CM", x: 470, y: 140 },
    { role: "CM", x: 470, y: 280 },
    { role: "CM", x: 470, y: 420 },
    { role: "LW", x: 760, y: 100 },
    { role: "ST", x: 800, y: 280 },
    { role: "RW", x: 760, y: 460 },
  ],
  "4-2-3-1": [
    { role: "GK", x: 80, y: 280 },
    { role: "LB", x: 230, y: 80 },
    { role: "CB", x: 230, y: 220 },
    { role: "CB", x: 230, y: 340 },
    { role: "RB", x: 230, y: 480 },
    { role: "DM", x: 430, y: 220 },
    { role: "DM", x: 430, y: 340 },
    { role: "LW", x: 650, y: 100 },
    { role: "AM", x: 620, y: 280 },
    { role: "RW", x: 650, y: 460 },
    { role: "ST", x: 800, y: 280 },
  ],
};

export default function TeamFormationPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const [teamId, setTeamId] = useState("");
  const [formation, setFormation] = useState("4-3-3");
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [boardPlayers, setBoardPlayers] = useState<FormationPlayer[]>([]);
  const [selectedBoardPlayerId, setSelectedBoardPlayerId] = useState<string | null>(null);
  const [draggingBoardPlayerId, setDraggingBoardPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedBoardPlayer = useMemo(
    () => boardPlayers.find((player) => player.id === selectedBoardPlayerId) || null,
    [boardPlayers, selectedBoardPlayerId],
  );

  useEffect(() => {
    async function loadFormation() {
      const resolved = await params;
      setTeamId(resolved.teamId);

      try {
        const data = await apiFetch<FormationResponse>(`/teams/${resolved.teamId}/formation`);

        const formationValue =
          typeof data?.formation === "string" && FORMATIONS[data.formation]
            ? data.formation
            : "4-3-3";

        setFormation(formationValue);
        setPlayers(Array.isArray(data?.players) ? data.players : []);

        const layoutPlayers =
          data?.layout &&
          Array.isArray(data.layout.players) &&
          data.layout.players.length > 0
            ? data.layout.players
            : createFormationPlayers(formationValue);

        setBoardPlayers(layoutPlayers);
      } catch {
        setFormation("4-3-3");
        setPlayers([]);
        setBoardPlayers(createFormationPlayers("4-3-3"));
      } finally {
        setIsLoading(false);
      }
    }

    loadFormation();
  }, [params]);

  function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function createFormationPlayers(formationKey: string): FormationPlayer[] {
    const template = FORMATIONS[formationKey] || FORMATIONS["4-3-3"];

    return template.map((slot) => ({
      id: createId(),
      playerId: null,
      name: slot.role,
      role: slot.role,
      x: slot.x,
      y: slot.y,
    }));
  }

  function getRelativePosition(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * FIELD_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * FIELD_HEIGHT;

    return {
      x: clamp(x, 40, FIELD_WIDTH - 40),
      y: clamp(y, 40, FIELD_HEIGHT - 40),
    };
  }

  function handleMouseDownOnPlayer(
    event: React.MouseEvent<HTMLDivElement>,
    boardPlayerId: string,
  ) {
    event.stopPropagation();
    setSelectedBoardPlayerId(boardPlayerId);
    setDraggingBoardPlayerId(boardPlayerId);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!draggingBoardPlayerId) return;

    const { x, y } = getRelativePosition(event);

    setBoardPlayers((prev) =>
      prev.map((player) =>
        player.id === draggingBoardPlayerId
          ? {
              ...player,
              x,
              y,
            }
          : player,
      ),
    );
  }

  function handleMouseUp() {
    setDraggingBoardPlayerId(null);
  }

  function handleChangeFormation(value: string) {
    setFormation(value);
    setBoardPlayers(createFormationPlayers(value));
    setSelectedBoardPlayerId(null);
    setSaveMessage("");
  }

  function assignPlayerToSlot(playerId: string) {
    if (!selectedBoardPlayerId) return;

    const selectedPlayer = players.find((player) => player.id === playerId);
    if (!selectedPlayer) return;

    setBoardPlayers((prev) =>
      prev.map((player) =>
        player.id === selectedBoardPlayerId
          ? {
              ...player,
              playerId: selectedPlayer.id,
              name: selectedPlayer.name,
            }
          : player,
      ),
    );
  }

  function clearAssignedPlayer() {
    if (!selectedBoardPlayerId) return;

    setBoardPlayers((prev) =>
      prev.map((player) =>
        player.id === selectedBoardPlayerId
          ? {
              ...player,
              playerId: null,
              name: player.role,
            }
          : player,
      ),
    );
  }

  async function saveFormationLayout() {
    if (!teamId) {
      setSaveMessage("No team selected.");
      return;
    }

    try {
      setIsSaving(true);

      await apiFetch(`/teams/${teamId}/formation`, {
        method: "PUT",
        body: JSON.stringify({
          formation,
          players: boardPlayers,
        }),
      });

      setSaveMessage("Formation saved.");
    } catch {
      setSaveMessage("Could not save formation.");
    } finally {
      setIsSaving(false);
    }
  }

  function resetFormation() {
    setBoardPlayers(createFormationPlayers(formation));
    setSelectedBoardPlayerId(null);
    setSaveMessage("");
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <p style={{ color: "#64748b" }}>Loading formation board...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link href="/teams" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to teams
        </Link>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={resetFormation}
          >
            Reset formation
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={saveFormationLayout}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save formation"}
          </button>
        </div>
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
              Team tactics
            </p>
            <h1 className="section-title">Formation board</h1>
            <p className="section-subtitle">
              Choose a formation, drag players on the pitch and assign squad players to roles.
            </p>
          </div>

          <div style={{ display: "grid", gap: 8, minWidth: 220 }}>
            <label htmlFor="formation" style={{ fontWeight: 600 }}>
              Formation
            </label>
            <select
              id="formation"
              value={formation}
              onChange={(e) => handleChangeFormation(e.target.value)}
            >
              {Object.keys(FORMATIONS).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 20,
          alignItems: "start",
        }}
      >
        <section className="card" style={{ padding: 20 }}>
          <div
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: `${FIELD_WIDTH} / ${FIELD_HEIGHT}`,
              background: "#3f8f47",
              borderRadius: 24,
              overflow: "hidden",
              border: "4px solid #d1fae5",
              userSelect: "none",
            }}
          >
            <PitchLines />

            {boardPlayers.map((player) => {
              const isSelected = player.id === selectedBoardPlayerId;

              return (
                <div
                  key={player.id}
                  onMouseDown={(event) => handleMouseDownOnPlayer(event, player.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBoardPlayerId(player.id);
                  }}
                  style={{
                    position: "absolute",
                    left: `${(player.x / FIELD_WIDTH) * 100}%`,
                    top: `${(player.y / FIELD_HEIGHT) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "grab",
                    zIndex: isSelected ? 4 : 3,
                  }}
                >
                  <div
                    style={{
                      minWidth: 50,
                      minHeight: 50,
                      borderRadius: "50%",
                      background: isSelected ? "#1d4ed8" : "#0f172a",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: 8,
                      fontWeight: 700,
                      fontSize: 12,
                      border: isSelected ? "3px solid #bfdbfe" : "2px solid #fff",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                      lineHeight: 1.1,
                    }}
                  >
                    {player.name}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Formation tools</h2>

          <div style={{ display: "grid", gap: 14 }}>
            <InfoRow label="Formation" value={formation} />
            <InfoRow label="Players on board" value={String(boardPlayers.length)} />

            <div
              style={{
                borderRadius: 14,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "12px 14px",
                display: "grid",
                gap: 10,
              }}
            >
              <h3 style={{ fontSize: 18, margin: 0 }}>Save status</h3>
              <p style={{ margin: 0, color: "#475569" }}>
                Save your visual team setup for this formation.
              </p>
              {saveMessage ? (
                <p style={{ margin: 0, color: "#0f172a", fontWeight: 600 }}>
                  {saveMessage}
                </p>
              ) : null}
            </div>

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <h3 style={{ fontSize: 18, margin: 0 }}>Selected slot</h3>

              {selectedBoardPlayer ? (
                <>
                  <InfoRow label="Role" value={selectedBoardPlayer.role} />
                  <InfoRow label="Assigned" value={selectedBoardPlayer.name} />

                  <div style={{ display: "grid", gap: 8 }}>
                    <label htmlFor="assign-player" style={{ fontWeight: 600 }}>
                      Assign player
                    </label>
                    <select
                      id="assign-player"
                      value={selectedBoardPlayer.playerId || ""}
                      onChange={(e) => assignPlayerToSlot(e.target.value)}
                    >
                      <option value="">Select player</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={clearAssignedPlayer}
                  >
                    Clear player
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, color: "#64748b" }}>
                  Click a player marker on the pitch to assign a squad player.
                </p>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: 14,
                display: "grid",
                gap: 8,
              }}
            >
              <h3 style={{ fontSize: 18, margin: 0 }}>Squad players</h3>
              {players.length === 0 ? (
                <p style={{ margin: 0, color: "#64748b" }}>
                  No players found in this team yet.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {players.map((player) => (
                    <div
                      key={player.id}
                      style={{
                        borderRadius: 14,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "10px 12px",
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700 }}>{player.name}</p>
                      <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                        {player.positions || "No positions set"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function PitchLines() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: "3px solid rgba(255,255,255,0.85)",
          borderRadius: 16,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 18,
          bottom: 18,
          width: 3,
          background: "rgba(255,255,255,0.85)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 110,
          height: 110,
          border: "3px solid rgba(255,255,255,0.85)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          top: "50%",
          width: 120,
          height: 220,
          border: "3px solid rgba(255,255,255,0.85)",
          borderLeft: "none",
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 18,
          top: "50%",
          width: 120,
          height: 220,
          border: "3px solid rgba(255,255,255,0.85)",
          borderRight: "none",
          transform: "translateY(-50%)",
        }}
      />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "12px 14px",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 6 }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 700 }}>{value}</p>
    </div>
  );
}