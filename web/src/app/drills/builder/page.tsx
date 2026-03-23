"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { apiFetch } from "@/lib/api";

type BoardItemType = "player" | "cone" | "ball";
type DrawingTool = BoardItemType | "arrow" | "movement";

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
  items: BoardItem[];
  lines: BoardLine[];
  updatedAt: string;
};

type DrillSummary = {
  id: string;
  name: string;
};

type DraggingLinePoint = {
  lineId: string;
  point: "start" | "end";
} | null;

const FIELD_WIDTH = 900;
const FIELD_HEIGHT = 560;

export default function DrillBuilderPage() {
  const searchParams = useSearchParams();
  const drillId = searchParams.get("drillId");
  const exportRef = useRef<HTMLDivElement | null>(null);

  const [selectedTool, setSelectedTool] = useState<DrawingTool>("player");
  const [items, setItems] = useState<BoardItem[]>([]);
  const [lines, setLines] = useState<BoardLine[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [draggingLinePoint, setDraggingLinePoint] =
    useState<DraggingLinePoint>(null);
  const [pendingLineStart, setPendingLineStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [saveMessage, setSaveMessage] = useState("");
  const [hasLoadedLayout, setHasLoadedLayout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [drillName, setDrillName] = useState("");
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );

  const selectedLine = useMemo(
    () => lines.find((line) => line.id === selectedLineId) || null,
    [lines, selectedLineId],
  );

  function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function getRelativePosition(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * FIELD_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * FIELD_HEIGHT;

    return {
      x: clamp(x, 20, FIELD_WIDTH - 20),
      y: clamp(y, 20, FIELD_HEIGHT - 20),
    };
  }

  function clearSelection() {
    setSelectedItemId(null);
    setSelectedLineId(null);
  }

  function handleFieldClick(event: React.MouseEvent<HTMLDivElement>) {
    if (draggingItemId || draggingLinePoint) return;

    const { x, y } = getRelativePosition(event);
    clearSelection();

    if (selectedTool === "arrow" || selectedTool === "movement") {
      if (!pendingLineStart) {
        setPendingLineStart({ x, y });
        return;
      }

      const newLine: BoardLine = {
        id: createId(),
        type: selectedTool,
        x1: pendingLineStart.x,
        y1: pendingLineStart.y,
        x2: x,
        y2: y,
      };

      setLines((prev) => [...prev, newLine]);
      setSelectedLineId(newLine.id);
      setPendingLineStart(null);
      return;
    }

    const newItem: BoardItem = {
      id: createId(),
      type: selectedTool,
      x,
      y,
      label:
        selectedTool === "player"
          ? String(items.filter((i) => i.type === "player").length + 1)
          : "",
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  }

  function handleMouseDownOnItem(
    event: React.MouseEvent<HTMLDivElement>,
    itemId: string,
  ) {
    event.stopPropagation();
    setSelectedItemId(itemId);
    setSelectedLineId(null);
    setDraggingItemId(itemId);
  }

  function handleMouseDownOnLinePoint(
    event: React.MouseEvent<HTMLButtonElement>,
    lineId: string,
    point: "start" | "end",
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedLineId(lineId);
    setSelectedItemId(null);
    setDraggingLinePoint({ lineId, point });
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { x, y } = getRelativePosition(event);

    if (draggingItemId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === draggingItemId ? { ...item, x, y } : item,
        ),
      );
      return;
    }

    if (draggingLinePoint) {
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== draggingLinePoint.lineId) return line;

          if (draggingLinePoint.point === "start") {
            return { ...line, x1: x, y1: y };
          }

          return { ...line, x2: x, y2: y };
        }),
      );
    }
  }

  function handleMouseUp() {
    setDraggingItemId(null);
    setDraggingLinePoint(null);
  }

  function updateSelectedLabel(value: string) {
    if (!selectedItemId) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemId ? { ...item, label: value } : item,
      ),
    );
  }

  function deleteSelectedItem() {
    if (!selectedItemId) return;
    setItems((prev) => prev.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
  }

  function deleteSelectedLine() {
    if (!selectedLineId) return;
    setLines((prev) => prev.filter((line) => line.id !== selectedLineId));
    setSelectedLineId(null);
  }

  function resetBoard() {
    setItems([]);
    setLines([]);
    setSelectedItemId(null);
    setSelectedLineId(null);
    setDraggingItemId(null);
    setDraggingLinePoint(null);
    setPendingLineStart(null);
    setSaveMessage("");
  }

  function cancelPendingLine() {
    setPendingLineStart(null);
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9åäö\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function exportBoardAsPng() {
    if (!exportRef.current) {
      setSaveMessage("Could not export board.");
      return;
    }

    try {
      setIsExporting(true);
      setSelectedItemId(null);
      setSelectedLineId(null);

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const filenameBase = drillName
        ? slugify(drillName)
        : drillId
          ? `drill-${drillId}`
          : "drill-board";

      link.download = `${filenameBase}.png`;
      link.href = dataUrl;
      link.click();

      setSaveMessage("Board exported as PNG.");
    } catch {
      setSaveMessage("Could not export board.");
    } finally {
      setIsExporting(false);
    }
  }

  async function saveLayout() {
    if (!drillId) {
      setSaveMessage("No drill selected. Open builder from a drill first.");
      return;
    }

    try {
      setIsSaving(true);

      const payload: DrillLayout = {
        items,
        lines,
        updatedAt: new Date().toISOString(),
      };

      await apiFetch(`/drills/${drillId}/layout`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setSaveMessage("Layout saved to database.");
    } catch {
      setSaveMessage("Could not save layout.");
    } finally {
      setIsSaving(false);
    }
  }

  async function loadLayout() {
    if (!drillId) {
      setSaveMessage("No drill selected. Open builder from a drill first.");
      return;
    }

    try {
      setIsLoadingLayout(true);

      const data = await apiFetch<DrillLayout | null>(
        `/drills/${drillId}/layout`,
      );

      if (!data) {
        setSaveMessage("No saved layout found for this drill.");
        return;
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setLines(Array.isArray(data.lines) ? data.lines : []);
      setSelectedItemId(null);
      setSelectedLineId(null);
      setDraggingItemId(null);
      setDraggingLinePoint(null);
      setPendingLineStart(null);
      setSaveMessage("Saved layout loaded.");
    } catch {
      setSaveMessage("Could not load saved layout.");
    } finally {
      setIsLoadingLayout(false);
    }
  }

  async function deleteSavedLayout() {
    if (!drillId) {
      setSaveMessage("No drill selected. Open builder from a drill first.");
      return;
    }

    try {
      setIsSaving(true);

      const payload: DrillLayout = {
        items: [],
        lines: [],
        updatedAt: new Date().toISOString(),
      };

      await apiFetch(`/drills/${drillId}/layout`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setItems([]);
      setLines([]);
      setSelectedItemId(null);
      setSelectedLineId(null);
      setDraggingItemId(null);
      setDraggingLinePoint(null);
      setPendingLineStart(null);
      setSaveMessage("Saved layout removed.");
    } catch {
      setSaveMessage("Could not delete saved layout.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!drillId) {
      setDrillName("");
      return;
    }

    let isMounted = true;

    async function loadDrill() {
      try {
        setIsLoadingDrill(true);
        const data = await apiFetch<DrillSummary>(`/drills/${drillId}`);
        if (!isMounted) return;
        setDrillName(data?.name || "");
      } catch {
        if (!isMounted) return;
        setDrillName("");
      } finally {
        if (!isMounted) return;
        setIsLoadingDrill(false);
      }
    }

    loadDrill();

    return () => {
      isMounted = false;
    };
  }, [drillId]);

  useEffect(() => {
    if (!drillId) return;
    setHasLoadedLayout(false);
  }, [drillId]);

  useEffect(() => {
    if (!drillId || hasLoadedLayout) return;

    let isMounted = true;

    async function autoLoad() {
      try {
        const data = await apiFetch<DrillLayout | null>(
          `/drills/${drillId}/layout`,
        );

        if (!isMounted) return;

        if (data) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setLines(Array.isArray(data.lines) ? data.lines : []);
          setSaveMessage("Saved layout loaded automatically.");
        }
      } catch {
        if (!isMounted) return;
        setSaveMessage("Could not auto-load saved layout.");
      } finally {
        if (!isMounted) return;
        setHasLoadedLayout(true);
      }
    }

    autoLoad();

    return () => {
      isMounted = false;
    };
  }, [drillId, hasLoadedLayout]);

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
        <Link href="/drills" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back to drill library
        </Link>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "#f8fafc",
            color: "#334155",
            fontWeight: 700,
          }}
        >
          {drillId
            ? isLoadingDrill
              ? "Loading drill..."
              : `Connected drill: ${drillName || drillId}`
            : "No drill selected"}
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
              Drill builder
            </p>
            <h1 className="section-title">Visual drill builder</h1>
            <p className="section-subtitle">
              Place players, cones, balls and draw arrows or movement lines.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ToolButton
              label="Add player"
              active={selectedTool === "player"}
              onClick={() => {
                setSelectedTool("player");
                setPendingLineStart(null);
              }}
            />
            <ToolButton
              label="Add cone"
              active={selectedTool === "cone"}
              onClick={() => {
                setSelectedTool("cone");
                setPendingLineStart(null);
              }}
            />
            <ToolButton
              label="Add ball"
              active={selectedTool === "ball"}
              onClick={() => {
                setSelectedTool("ball");
                setPendingLineStart(null);
              }}
            />
            <ToolButton
              label="Draw arrow"
              active={selectedTool === "arrow"}
              onClick={() => {
                setSelectedTool("arrow");
                setPendingLineStart(null);
              }}
            />
            <ToolButton
              label="Movement line"
              active={selectedTool === "movement"}
              onClick={() => {
                setSelectedTool("movement");
                setPendingLineStart(null);
              }}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={resetBoard}
            >
              Reset board
            </button>
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
            onClick={handleFieldClick}
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
              cursor: draggingLinePoint ? "grabbing" : "crosshair",
            }}
          >
            <div
              ref={exportRef}
              style={{
                position: "absolute",
                inset: 0,
                background: "#3f8f47",
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
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#0f172a" />
                  </marker>
                </defs>

                {lines.map((line) => {
                  const isSelected = line.id === selectedLineId;

                  if (line.type === "arrow") {
                    return (
                      <line
                        key={line.id}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={isSelected ? "#1d4ed8" : "#0f172a"}
                        strokeWidth={isSelected ? 5 : 4}
                        markerEnd="url(#arrowhead)"
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
                      stroke={isSelected ? "#1d4ed8" : "#ffffff"}
                      strokeWidth={isSelected ? 5 : 4}
                      strokeDasharray="10 8"
                    />
                  );
                })}

                {pendingLineStart &&
                (selectedTool === "arrow" || selectedTool === "movement") ? (
                  <circle
                    cx={pendingLineStart.x}
                    cy={pendingLineStart.y}
                    r="8"
                    fill="#f8fafc"
                    stroke="#1d4ed8"
                    strokeWidth="3"
                  />
                ) : null}
              </svg>

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                }}
              >
                {lines.map((line) => {
                  const isSelected = line.id === selectedLineId;
                  const midX = (line.x1 + line.x2) / 2;
                  const midY = (line.y1 + line.y2) / 2;

                  return (
                    <div key={`controls-${line.id}`}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedLineId(line.id);
                          setSelectedItemId(null);
                        }}
                        title="Select line"
                        style={{
                          position: "absolute",
                          left: `${(midX / FIELD_WIDTH) * 100}%`,
                          top: `${(midY / FIELD_HEIGHT) * 100}%`,
                          transform: "translate(-50%, -50%)",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: isSelected ? "3px solid #bfdbfe" : "2px solid #fff",
                          background: isSelected ? "#1d4ed8" : "rgba(15,23,42,0.72)",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />

                      {isSelected ? (
                        <>
                          <button
                            type="button"
                            onMouseDown={(event) =>
                              handleMouseDownOnLinePoint(event, line.id, "start")
                            }
                            onClick={(event) => event.stopPropagation()}
                            title="Drag line start"
                            style={{
                              position: "absolute",
                              left: `${(line.x1 / FIELD_WIDTH) * 100}%`,
                              top: `${(line.y1 / FIELD_HEIGHT) * 100}%`,
                              transform: "translate(-50%, -50%)",
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              border: "3px solid #1d4ed8",
                              background: "#ffffff",
                              cursor: "grab",
                              padding: 0,
                              zIndex: 5,
                              boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                            }}
                          />

                          <button
                            type="button"
                            onMouseDown={(event) =>
                              handleMouseDownOnLinePoint(event, line.id, "end")
                            }
                            onClick={(event) => event.stopPropagation()}
                            title="Drag line end"
                            style={{
                              position: "absolute",
                              left: `${(line.x2 / FIELD_WIDTH) * 100}%`,
                              top: `${(line.y2 / FIELD_HEIGHT) * 100}%`,
                              transform: "translate(-50%, -50%)",
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              border: "3px solid #1d4ed8",
                              background: "#ffffff",
                              cursor: "grab",
                              padding: 0,
                              zIndex: 5,
                              boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                            }}
                          />
                        </>
                      ) : null}
                    </div>
                  );
                })}

                {items.map((item) => {
                  const isSelected = item.id === selectedItemId;

                  return (
                    <div
                      key={item.id}
                      onMouseDown={(event) => handleMouseDownOnItem(event, item.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedItemId(item.id);
                        setSelectedLineId(null);
                      }}
                      style={{
                        position: "absolute",
                        left: `${(item.x / FIELD_WIDTH) * 100}%`,
                        top: `${(item.y / FIELD_HEIGHT) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        cursor: "grab",
                        zIndex: isSelected ? 4 : 3,
                      }}
                    >
                      {renderBoardItem(item, isSelected)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Board tools</h2>

          <div style={{ display: "grid", gap: 14 }}>
            <InfoRow label="Selected tool" value={capitalize(selectedTool)} />
            <InfoRow label="Objects on pitch" value={String(items.length)} />
            <InfoRow label="Lines on pitch" value={String(lines.length)} />

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
              <h3 style={{ fontSize: 18, margin: 0 }}>Save layout</h3>

              <p style={{ margin: 0, color: "#475569" }}>
                {drillId
                  ? `This board is linked to ${
                      drillName || "a specific drill"
                    }.`
                  : "Open the builder from a specific drill to save a linked layout."}
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={saveLayout}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save layout to drill"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={loadLayout}
                  disabled={isLoadingLayout}
                >
                  {isLoadingLayout ? "Loading..." : "Load saved layout"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={deleteSavedLayout}
                  disabled={isSaving}
                >
                  Delete saved layout
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={exportBoardAsPng}
                  disabled={isExporting}
                >
                  {isExporting ? "Exporting..." : "Export as PNG"}
                </button>
              </div>

              {saveMessage ? (
                <p style={{ margin: 0, color: "#0f172a", fontWeight: 600 }}>
                  {saveMessage}
                </p>
              ) : null}
            </div>

            {pendingLineStart ? (
              <div
                style={{
                  borderRadius: 14,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "12px 14px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>
                  First point selected
                </p>
                <p style={{ margin: 0, color: "#334155" }}>
                  Click a second point on the pitch to finish the line.
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelPendingLine}
                >
                  Cancel line
                </button>
              </div>
            ) : null}

            {selectedLine ? (
              <div
                style={{
                  borderRadius: 14,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "12px 14px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>Line editing enabled</p>
                <p style={{ margin: 0, color: "#334155" }}>
                  Click the middle marker to select a line. Then drag the two white
                  handles to move the start and end points.
                </p>
              </div>
            ) : null}

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <h3 style={{ fontSize: 18, margin: 0 }}>Selected object</h3>

              {selectedItem ? (
                <>
                  <InfoRow label="Type" value={capitalize(selectedItem.type)} />

                  <div style={{ display: "grid", gap: 8 }}>
                    <label htmlFor="label" style={{ fontWeight: 600 }}>
                      Label
                    </label>
                    <input
                      id="label"
                      value={selectedItem.label || ""}
                      onChange={(e) => updateSelectedLabel(e.target.value)}
                      placeholder="e.g. 7 or GK"
                    />
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ fontWeight: 600 }}>Position</label>
                    <p style={{ margin: 0, color: "#475569" }}>
                      X: {Math.round(selectedItem.x)} · Y: {Math.round(selectedItem.y)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={deleteSelectedItem}
                  >
                    Delete selected object
                  </button>
                </>
              ) : selectedLine ? (
                <>
                  <InfoRow label="Type" value={capitalize(selectedLine.type)} />
                  <InfoRow
                    label="Start"
                    value={`${Math.round(selectedLine.x1)}, ${Math.round(selectedLine.y1)}`}
                  />
                  <InfoRow
                    label="End"
                    value={`${Math.round(selectedLine.x2)}, ${Math.round(selectedLine.y2)}`}
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={deleteSelectedLine}
                  >
                    Delete selected line
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, color: "#64748b" }}>
                  Click an object or line on the pitch to edit it.
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
              <h3 style={{ fontSize: 18, margin: 0 }}>How to use</h3>
              <p style={{ margin: 0, color: "#475569" }}>
                1. Choose player, cone, ball, arrow or movement line.
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                2. Click on the pitch to place objects.
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                3. For arrows and movement lines, click twice.
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                4. Drag objects to move them.
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                5. Click the marker in the middle of a line to select it.
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                6. Drag the two white handles to edit the line.
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                7. Export the board as a PNG image.
              </p>
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

function renderBoardItem(item: BoardItem, isSelected: boolean) {
  if (item.type === "player") {
    return (
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: isSelected ? "#1d4ed8" : "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          border: isSelected ? "3px solid #bfdbfe" : "2px solid #fff",
          boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
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
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderBottom: isSelected ? "30px solid #f97316" : "30px solid #fb923c",
          filter: isSelected
            ? "drop-shadow(0 0 0.5rem rgba(249,115,22,0.55))"
            : "none",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        border: isSelected ? "3px solid #1d4ed8" : "2px solid #0f172a",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    />
  );
}

function ToolButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "primary-button" : "secondary-button"}
      onClick={onClick}
    >
      {label}
    </button>
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}