"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getSession } from "@/lib/api";
import { getDefaultDrillLayout } from "@/lib/default-drill-layouts";

type BoardItemType = "player" | "cone" | "ball";

type BoardItem = {
  id: string;
  type: BoardItemType;
  x: number;
  y: number;
  label?: string;
};

type BoardLine = {
  id: string;
  type: "arrow" | "movement";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type DrillLayout = {
  items?: BoardItem[];
  lines?: BoardLine[];
};

type Drill = {
  id: string;
  name: string;
  description?: string | null;
  durationMin?: number | null;
  category?: string | null;
  focusTags?: string | null;
  layout?: DrillLayout | null;
};

type TrainingBlockDrill = {
  id: string;
  order: number;
  customNotes?: string | null;
  drill: Drill;
};

type TrainingBlock = {
  id: string;
  type: string;
  order: number;
  durationMinutes: number;
  focusTags?: string | null;
  description?: string | null;
  drills: TrainingBlockDrill[];
};

type Session = {
  id: string;
  title: string;
  durationMinutes: number;
  intensity: number | string;
  blocks: TrainingBlock[];
};

type DragState = {
  sourceBlockId: string;
  sourceDrillId: string;
} | null;

const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 560;

export default function SessionBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = useMemo(() => String(params.teamId), [params.teamId]);
  const sessionId = useMemo(() => String(params.id), [params.id]);

  const [session, setSession] = useState<Session | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedDrillId, setSelectedDrillId] = useState("");
  const [previewDrillId, setPreviewDrillId] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dragState, setDragState] = useState<DragState>(null);
  const [dragOverDrillId, setDragOverDrillId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setLoadError("");
        setMessage("");

        const sessionData = await getSession(teamId, sessionId);
        setSession(sessionData);

        if (sessionData.blocks.length > 0) {
          setSelectedBlockId(sessionData.blocks[0].id);
        }

        const drillData = await apiFetch<Drill[]>("/drills");
        setDrills(Array.isArray(drillData) ? drillData : []);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load builder.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [teamId, sessionId]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(drills.map((d) => d.category || "").filter(Boolean)),
    ).sort();
  }, [drills]);

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        drill.name.toLowerCase().includes(query) ||
        String(drill.description || "").toLowerCase().includes(query) ||
        String(drill.focusTags || "").toLowerCase().includes(query);

      const matchesCategory =
        !categoryFilter || drill.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [drills, search, categoryFilter]);

  const dropdownDrill = useMemo(() => {
    return drills.find((d) => d.id === selectedDrillId) || null;
  }, [selectedDrillId, drills]);

  const blockPreviewDrill = useMemo(() => {
    if (!session) return null;

    for (const block of session.blocks) {
      const match = block.drills.find((d) => d.drill.id === previewDrillId);
      if (match) return match.drill;
    }

    return null;
  }, [previewDrillId, session]);

  const previewDrill = blockPreviewDrill || dropdownDrill;
  const effectiveLayout =
    previewDrill?.layout || getDefaultDrillLayout(previewDrill?.id);

  async function reloadSession() {
    const updated = await getSession(teamId, sessionId);
    setSession(updated);
  }

  async function addDrillToBlock() {
    if (!selectedBlockId || !selectedDrillId) {
      setMessage("Choose both a block and a drill.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const updated = await apiFetch<Session>(
        `/sessions/${sessionId}/blocks/${selectedBlockId}/drills`,
        {
          method: "POST",
          body: JSON.stringify({
            drillId: selectedDrillId,
            customNotes: customNotes || null,
          }),
        },
      );

      setSession(updated);
      setPreviewDrillId(selectedDrillId);
      setSelectedDrillId("");
      setCustomNotes("");
      setMessage("Drill added to block.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add drill.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function moveDrill(
    blockId: string,
    trainingBlockDrillId: string,
    direction: "up" | "down",
  ) {
    try {
      setIsSaving(true);
      setMessage("");

      const updated = await apiFetch<Session>(
        `/sessions/${sessionId}/blocks/${blockId}/drills/${trainingBlockDrillId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ direction }),
        },
      );

      setSession(updated);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not move drill.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeDrill(blockId: string, trainingBlockDrillId: string) {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `${getApiBaseUrl()}/sessions/${sessionId}/blocks/${blockId}/drills/${trainingBlockDrillId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Could not remove drill.");
      }

      const text = await response.text();
      const updated = text ? (JSON.parse(text) as Session) : null;

      if (updated) {
        setSession(updated);
      } else {
        await reloadSession();
      }

      setMessage("Drill removed.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not remove drill.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveNotes(
    blockId: string,
    trainingBlockDrillId: string,
    value: string,
  ) {
    try {
      setIsSaving(true);
      setMessage("");

      const updated = await apiFetch<Session>(
        `/sessions/${sessionId}/blocks/${blockId}/drills/${trainingBlockDrillId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            customNotes: value.trim() || null,
          }),
        },
      );

      setSession(updated);
      setMessage("Notes saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save notes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function reorderWithinBlock(
    blockId: string,
    draggedDrillId: string,
    targetDrillId: string,
  ) {
    if (!session) return;
    if (draggedDrillId === targetDrillId) return;

    const block = session.blocks.find((b) => b.id === blockId);
    if (!block) return;

    const fromIndex = block.drills.findIndex((d) => d.id === draggedDrillId);
    const toIndex = block.drills.findIndex((d) => d.id === targetDrillId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    try {
      setIsSaving(true);
      setMessage("");

      const working = [...block.drills];

      if (fromIndex < toIndex) {
        for (let i = fromIndex; i < toIndex; i += 1) {
          await apiFetch(
            `/sessions/${sessionId}/blocks/${blockId}/drills/${working[i].id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ direction: "down" }),
            },
          );
          const temp = working[i];
          working[i] = working[i + 1];
          working[i + 1] = temp;
        }
      } else {
        for (let i = fromIndex; i > toIndex; i -= 1) {
          await apiFetch(
            `/sessions/${sessionId}/blocks/${blockId}/drills/${working[i].id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ direction: "up" }),
            },
          );
          const temp = working[i];
          working[i] = working[i - 1];
          working[i - 1] = temp;
        }
      }

      await reloadSession();
      setMessage("Drill order updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not reorder drills.",
      );
    } finally {
      resetDragState();
      setIsSaving(false);
    }
  }

  async function moveAcrossBlocks(
    sourceBlockId: string,
    sourceDrillId: string,
    targetBlockId: string,
    targetDrillId?: string | null,
  ) {
    if (!session) return;
    if (sourceBlockId === targetBlockId && !targetDrillId) return;

    const sourceBlock = session.blocks.find((b) => b.id === sourceBlockId);
    const targetBlock = session.blocks.find((b) => b.id === targetBlockId);

    if (!sourceBlock || !targetBlock) return;

    const sourceIndex = sourceBlock.drills.findIndex((d) => d.id === sourceDrillId);
    if (sourceIndex === -1) return;

    const sourceItem = sourceBlock.drills[sourceIndex];

    try {
      setIsSaving(true);
      setMessage("");

      await apiFetch<Session>(
        `/sessions/${sessionId}/blocks/${targetBlockId}/drills`,
        {
          method: "POST",
          body: JSON.stringify({
            drillId: sourceItem.drill.id,
            customNotes: sourceItem.customNotes || null,
          }),
        },
      );

      let updated = await getSession(teamId, sessionId);
      setSession(updated);

      const newTargetBlock = updated.blocks.find((b) => b.id === targetBlockId);
      if (!newTargetBlock || newTargetBlock.drills.length === 0) {
        throw new Error("Could not find moved drill in target block.");
      }

      const movedItem = newTargetBlock.drills[newTargetBlock.drills.length - 1];

      if (targetDrillId && movedItem.id !== targetDrillId) {
        await reorderWithinBlock(targetBlockId, movedItem.id, targetDrillId);
        updated = await getSession(teamId, sessionId);
        setSession(updated);
      }

      await removeDrill(sourceBlockId, sourceDrillId);
      await reloadSession();

      setMessage("Drill moved to another block.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not move drill between blocks.",
      );
    } finally {
      resetDragState();
      setIsSaving(false);
    }
  }

  function resetDragState() {
    setDragState(null);
    setDragOverDrillId(null);
    setDragOverBlockId(null);
  }

  const totalBlockMinutes =
    session?.blocks.reduce((sum, block) => sum + block.durationMinutes, 0) ?? 0;

  const totalDrills =
    session?.blocks.reduce((sum, block) => sum + block.drills.length, 0) ?? 0;

  if (isLoading) {
    return (
      <main className="page-shell">
        <p style={{ color: "#64748b" }}>Loading session builder...</p>
      </main>
    );
  }

  if (loadError) {
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
          <h1 className="section-title">Could not load session builder</h1>
          <p className="section-subtitle">{loadError}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-shell">
        <p style={{ color: "#64748b" }}>Session not found</p>
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
        <Link
          href={`/teams/${teamId}/sessions/${sessionId}`}
          style={{ color: "#334155", textDecoration: "none" }}
        >
          ← Back to session
        </Link>

        <button
          type="button"
          className="secondary-button"
          onClick={() => router.refresh()}
        >
          Refresh
        </button>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <p className="badge badge-green" style={{ marginBottom: 12 }}>
          Session builder
        </p>

        <h1 className="section-title">{session.title}</h1>
        <p className="section-subtitle">
          Add drills to blocks, drag within or between blocks, and write session-specific notes.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          <InfoCard
            label="Session duration"
            value={`${session.durationMinutes} min`}
          />
          <InfoCard label="Block total" value={`${totalBlockMinutes} min`} />
          <InfoCard label="Total drills" value={String(totalDrills)} />
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.25fr) minmax(360px, 0.95fr)",
          gap: 24,
          alignItems: "start",
          marginBottom: 24,
        }}
      >
        <section className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Add drill to block</h2>

          <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <label htmlFor="block" style={{ fontWeight: 600 }}>
                  Block
                </label>
                <select
                  id="block"
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  style={inputStyle}
                >
                  {session.blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {formatBlockType(block.type)} ({block.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <label htmlFor="search" style={{ fontWeight: 600 }}>
                  Search drills
                </label>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, description or focus..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <label htmlFor="categoryFilter" style={{ fontWeight: 600 }}>
                  Category
                </label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {capitalize(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {filteredDrills.length} drill
              {filteredDrills.length === 1 ? "" : "s"} available
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label htmlFor="drill" style={{ fontWeight: 600 }}>
                Drill
              </label>
              <select
                id="drill"
                value={selectedDrillId}
                onChange={(e) => {
                  setSelectedDrillId(e.target.value);
                  setPreviewDrillId("");
                }}
                style={inputStyle}
              >
                <option value="">Select drill</option>
                {filteredDrills.map((drill) => (
                  <option key={drill.id} value={drill.id}>
                    {drill.name}
                    {drill.category ? ` • ${capitalize(drill.category)}` : ""}
                    {drill.durationMin ? ` • ${drill.durationMin} min` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            <label htmlFor="customNotes" style={{ fontWeight: 600 }}>
              Notes for this drill in the session
            </label>
            <textarea
              id="customNotes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={3}
              placeholder="Example: reduce touches, increase pressing distance"
              style={textareaStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="primary-button"
              onClick={addDrillToBlock}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Add drill"}
            </button>
          </div>

          {message ? (
            <p style={{ marginTop: 14, color: "#0f172a", fontWeight: 600 }}>
              {message}
            </p>
          ) : null}
        </section>

        <aside className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Drill preview</h2>

          {previewDrill ? (
            <div style={{ display: "grid", gap: 14 }}>
              <InfoRow label="Name" value={previewDrill.name} />
              <InfoRow
                label="Category"
                value={
                  previewDrill.category
                    ? capitalize(previewDrill.category)
                    : "Not set"
                }
              />
              <InfoRow
                label="Duration"
                value={
                  previewDrill.durationMin
                    ? `${previewDrill.durationMin} min`
                    : "Not set"
                }
              />

              <CardBlock title="Focus">
                {previewDrill.focusTags || "Not set"}
              </CardBlock>

              <CardBlock title="Description">
                {previewDrill.description || "No description available."}
              </CardBlock>

              <div
                style={{
                  borderRadius: 16,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: 12,
                }}
              >
                <p style={{ color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
                  Layout preview
                </p>

                {effectiveLayout ? (
                  <PreviewPitch layout={effectiveLayout} />
                ) : (
                  <div
                    style={{
                      borderRadius: 14,
                      background: "#fff",
                      border: "1px dashed #cbd5e1",
                      padding: 16,
                    }}
                  >
                    <p style={{ margin: 0, color: "#64748b" }}>
                      No layout available for this drill yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, color: "#64748b" }}>
              Select a drill above or click a drill in a block to preview it.
            </p>
          )}
        </aside>
      </div>

      <section className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 24, marginBottom: 18 }}>Session blocks</h2>

        <div style={{ display: "grid", gap: 20 }}>
          {session.blocks.map((block) => (
            <article
              key={block.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragState) {
                  setDragOverBlockId(block.id);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();

                if (!dragState) return;

                if (dragState.sourceBlockId !== block.id) {
                  await moveAcrossBlocks(
                    dragState.sourceBlockId,
                    dragState.sourceDrillId,
                    block.id,
                    null,
                  );
                } else {
                  resetDragState();
                }
              }}
              style={{
                border:
                  dragOverBlockId === block.id && dragState?.sourceBlockId !== block.id
                    ? "2px dashed #1d4ed8"
                    : "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 20,
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 22, margin: 0 }}>
                    {formatBlockType(block.type)}
                  </h3>
                  <p style={{ color: "#475569", margin: "6px 0 0" }}>
                    {block.durationMinutes} min
                  </p>
                </div>
              </div>

              {block.drills.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 14,
                    padding: 16,
                    color: "#64748b",
                    background: "#fff",
                  }}
                >
                  Drop a drill here.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {block.drills.map((item, index) => {
                    const isPreviewing = previewDrillId === item.drill.id;
                    const cardLayout =
                      item.drill.layout || getDefaultDrillLayout(item.drill.id);

                    return (
                      <div
                        key={item.id}
                        draggable={!isSaving}
                        onDragStart={() => {
                          setDragState({
                            sourceBlockId: block.id,
                            sourceDrillId: item.id,
                          });
                          setDragOverDrillId(item.id);
                          setDragOverBlockId(block.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverDrillId(item.id);
                          setDragOverBlockId(block.id);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();

                          if (!dragState) return;

                          if (dragState.sourceBlockId === block.id) {
                            if (dragState.sourceDrillId !== item.id) {
                              await reorderWithinBlock(
                                block.id,
                                dragState.sourceDrillId,
                                item.id,
                              );
                            } else {
                              resetDragState();
                            }
                          } else {
                            await moveAcrossBlocks(
                              dragState.sourceBlockId,
                              dragState.sourceDrillId,
                              block.id,
                              item.id,
                            );
                          }
                        }}
                        onDragEnd={() => {
                          resetDragState();
                        }}
                        style={{
                          borderRadius: 16,
                          background: isPreviewing ? "#eff6ff" : "#fff",
                          border:
                            dragOverDrillId === item.id
                              ? "2px dashed #1d4ed8"
                              : isPreviewing
                                ? "2px solid #1d4ed8"
                                : "1px solid #e2e8f0",
                          padding: 16,
                          display: "grid",
                          gap: 12,
                          boxShadow: isPreviewing
                            ? "0 6px 18px rgba(29,78,216,0.08)"
                            : "none",
                          opacity:
                            dragState?.sourceDrillId === item.id &&
                            dragState?.sourceBlockId === block.id
                              ? 0.75
                              : 1,
                          cursor: isSaving ? "default" : "grab",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "130px minmax(0, 1fr)",
                            gap: 14,
                            alignItems: "start",
                          }}
                        >
                          <div
                            onClick={() => {
                              setPreviewDrillId(item.drill.id);
                              setSelectedDrillId("");
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {cardLayout ? (
                              <MiniPitch layout={cardLayout} />
                            ) : (
                              <div
                                style={{
                                  height: 90,
                                  borderRadius: 14,
                                  border: "1px dashed #cbd5e1",
                                  background: "#f8fafc",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#64748b",
                                  fontSize: 12,
                                  textAlign: "center",
                                  padding: 8,
                                }}
                              >
                                No layout
                              </div>
                            )}
                          </div>

                          <div>
                            <div
                              onClick={() => {
                                setPreviewDrillId(item.drill.id);
                                setSelectedDrillId("");
                              }}
                              style={{
                                cursor: "pointer",
                                minWidth: 220,
                              }}
                            >
                              <h4 style={{ margin: "0 0 6px", fontSize: 18 }}>
                                {index + 1}. {item.drill.name}
                              </h4>

                              <p style={{ margin: 0, color: "#64748b" }}>
                                {item.drill.category
                                  ? capitalize(item.drill.category)
                                  : "Drill"}{" "}
                                ·{" "}
                                {item.drill.durationMin
                                  ? `${item.drill.durationMin} min`
                                  : "No duration"}
                              </p>

                              {item.drill.focusTags ? (
                                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                                  Focus: {item.drill.focusTags}
                                </p>
                              ) : null}

                              <p
                                style={{
                                  margin: "8px 0 0",
                                  color: isPreviewing ? "#1d4ed8" : "#475569",
                                  fontWeight: 700,
                                  fontSize: 14,
                                }}
                              >
                                {isPreviewing
                                  ? "Previewing this drill"
                                  : "Click to preview • drag to reorder or move"}
                              </p>
                            </div>

                            {item.drill.description ? (
                              <p style={{ margin: "10px 0 0", color: "#475569" }}>
                                {item.drill.description}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => moveDrill(block.id, item.id, "up")}
                            disabled={isSaving || index === 0}
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => moveDrill(block.id, item.id, "down")}
                            disabled={
                              isSaving || index === block.drills.length - 1
                            }
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => removeDrill(block.id, item.id)}
                            disabled={isSaving}
                          >
                            Remove
                          </button>
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          <label style={{ fontWeight: 600 }}>Custom notes</label>
                          <textarea
                            defaultValue={item.customNotes || ""}
                            rows={3}
                            style={textareaStyle}
                            placeholder="Add session-specific notes"
                            onBlur={(e) =>
                              saveNotes(block.id, item.id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PreviewPitch({ layout }: { layout: DrillLayout }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${FIELD_WIDTH} / ${FIELD_HEIGHT}`,
        background: "linear-gradient(180deg, #4ea858 0%, #3d9447 100%)",
        borderRadius: 20,
        overflow: "hidden",
        border: "3px solid #d8f3dc",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      <PitchLines />

      <svg
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <defs>
          <marker
            id="preview-arrowhead"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 10 4, 0 8" fill="#0f172a" />
          </marker>
        </defs>

        {(layout.lines || []).map((line) => {
          if (line.type === "arrow") {
            return (
              <line
                key={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#0f172a"
                strokeWidth={5}
                strokeLinecap="round"
                markerEnd="url(#preview-arrowhead)"
              />
            );
          }

          return (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#ffffff"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="12 10"
              opacity={0.95}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
        }}
      >
        {(layout.items || []).map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${(item.x / FIELD_WIDTH) * 100}%`,
              top: `${(item.y / FIELD_HEIGHT) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {renderBoardItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPitch({ layout }: { layout: DrillLayout }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 90,
        background: "linear-gradient(180deg, #4ea858 0%, #3d9447 100%)",
        borderRadius: 14,
        overflow: "hidden",
        border: "2px solid #d8f3dc",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 6,
          border: "1.5px solid rgba(255,255,255,0.85)",
          borderRadius: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 6,
          bottom: 6,
          width: 1.5,
          background: "rgba(255,255,255,0.85)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 18,
          height: 18,
          border: "1.5px solid rgba(255,255,255,0.85)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <svg
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {(layout.lines || []).map((line) => {
          if (line.type === "arrow") {
            return (
              <line
                key={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#0f172a"
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          }

          return (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#ffffff"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="10 9"
              opacity={0.95}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
        }}
      >
        {(layout.items || []).map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${(item.x / FIELD_WIDTH) * 100}%`,
              top: `${(item.y / FIELD_HEIGHT) * 100}%`,
              transform: "translate(-50%, -50%) scale(0.62)",
              transformOrigin: "center center",
            }}
          >
            {renderBoardItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PitchLines() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: "3px solid rgba(255,255,255,0.88)",
          borderRadius: 18,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 18,
          bottom: 18,
          width: 3,
          background: "rgba(255,255,255,0.88)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 112,
          height: 112,
          border: "3px solid rgba(255,255,255,0.88)",
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
          border: "3px solid rgba(255,255,255,0.88)",
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
          border: "3px solid rgba(255,255,255,0.88)",
          borderRight: "none",
          transform: "translateY(-50%)",
        }}
      />
    </>
  );
}

function renderBoardItem(item: BoardItem) {
  if (item.type === "player") {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 11,
          border: "2px solid rgba(255,255,255,0.95)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
        }}
      >
        {item.label || "P"}
      </div>
    );
  }

  if (item.type === "cone") {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderBottom: "28px solid #fb923c",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.22))",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#ffffff",
        border: "2px solid #0f172a",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      }}
    />
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        background: "#f8fafc",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
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

function CardBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "12px 14px",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 6 }}>{title}</p>
      <p style={{ margin: 0, color: "#334155", fontWeight: 600 }}>{children}</p>
    </div>
  );
}

function formatBlockType(value: string) {
  switch (value) {
    case "warmup":
      return "Warm-up";
    case "technical":
      return "Technical";
    case "possession":
      return "Possession";
    case "game":
      return "Game";
    case "finishing":
      return "Finishing";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getApiBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/v1";
  return raw.replace(/\/$/, "");
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

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  background: "#fff",
  color: "#0f172a",
  resize: "vertical",
};