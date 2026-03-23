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

export type DrillLayout = {
  items?: BoardItem[];
  lines?: BoardLine[];
  updatedAt?: string;
};

function now() {
  return new Date().toISOString();
}

export const DEFAULT_DRILL_LAYOUTS: Record<string, DrillLayout> = {
  "rondo-5v2": {
    updatedAt: now(),
    items: [
      { id: "p1", type: "player", x: 250, y: 120, label: "1" },
      { id: "p2", type: "player", x: 450, y: 120, label: "2" },
      { id: "p3", type: "player", x: 600, y: 260, label: "3" },
      { id: "p4", type: "player", x: 450, y: 400, label: "4" },
      { id: "p5", type: "player", x: 250, y: 400, label: "5" },
      { id: "d1", type: "player", x: 360, y: 240, label: "D1" },
      { id: "d2", type: "player", x: 470, y: 300, label: "D2" },
      { id: "b1", type: "ball", x: 250, y: 120 },
    ],
    lines: [],
  },

  "triangle-passing": {
    updatedAt: now(),
    items: [
      { id: "p1", type: "player", x: 250, y: 380, label: "1" },
      { id: "p2", type: "player", x: 450, y: 150, label: "2" },
      { id: "p3", type: "player", x: 650, y: 380, label: "3" },
      { id: "b1", type: "ball", x: 250, y: 380 },
      { id: "c1", type: "cone", x: 250, y: 380 },
      { id: "c2", type: "cone", x: 450, y: 150 },
      { id: "c3", type: "cone", x: 650, y: 380 },
    ],
    lines: [
      { id: "l1", type: "arrow", x1: 250, y1: 380, x2: 450, y2: 150 },
      { id: "l2", type: "arrow", x1: 450, y1: 150, x2: 650, y2: 380 },
      { id: "l3", type: "movement", x1: 250, y1: 380, x2: 320, y2: 300 },
    ],
  },

  "passing-square-rotation": {
    updatedAt: now(),
    items: [
      { id: "p1", type: "player", x: 280, y: 160, label: "1" },
      { id: "p2", type: "player", x: 620, y: 160, label: "2" },
      { id: "p3", type: "player", x: 620, y: 390, label: "3" },
      { id: "p4", type: "player", x: 280, y: 390, label: "4" },
      { id: "b1", type: "ball", x: 280, y: 160 },
      { id: "c1", type: "cone", x: 280, y: 160 },
      { id: "c2", type: "cone", x: 620, y: 160 },
      { id: "c3", type: "cone", x: 620, y: 390 },
      { id: "c4", type: "cone", x: 280, y: 390 },
    ],
    lines: [
      { id: "l1", type: "arrow", x1: 280, y1: 160, x2: 620, y2: 160 },
      { id: "l2", type: "arrow", x1: 620, y1: 160, x2: 620, y2: 390 },
      { id: "l3", type: "arrow", x1: 620, y1: 390, x2: 280, y2: 390 },
      { id: "l4", type: "arrow", x1: 280, y1: 390, x2: 280, y2: 160 },
      { id: "l5", type: "movement", x1: 280, y1: 160, x2: 360, y2: 160 },
    ],
  },

  "4v2-possession-box": {
    updatedAt: now(),
    items: [
      { id: "a1", type: "player", x: 280, y: 170, label: "1" },
      { id: "a2", type: "player", x: 620, y: 170, label: "2" },
      { id: "a3", type: "player", x: 620, y: 390, label: "3" },
      { id: "a4", type: "player", x: 280, y: 390, label: "4" },
      { id: "d1", type: "player", x: 380, y: 250, label: "D1" },
      { id: "d2", type: "player", x: 510, y: 310, label: "D2" },
      { id: "b1", type: "ball", x: 280, y: 170 },
    ],
    lines: [],
  },

  "possession-with-targets": {
    updatedAt: now(),
    items: [
      { id: "t1", type: "player", x: 120, y: 280, label: "T1" },
      { id: "t2", type: "player", x: 780, y: 280, label: "T2" },
      { id: "p1", type: "player", x: 280, y: 180, label: "1" },
      { id: "p2", type: "player", x: 420, y: 180, label: "2" },
      { id: "p3", type: "player", x: 560, y: 180, label: "3" },
      { id: "p4", type: "player", x: 340, y: 360, label: "4" },
      { id: "p5", type: "player", x: 500, y: 360, label: "5" },
      { id: "b1", type: "ball", x: 280, y: 180 },
    ],
    lines: [
      { id: "l1", type: "arrow", x1: 560, y1: 180, x2: 780, y2: 280 },
    ],
  },

  "finishing-from-cutbacks": {
    updatedAt: now(),
    items: [
      { id: "w1", type: "player", x: 720, y: 120, label: "W" },
      { id: "a1", type: "player", x: 520, y: 240, label: "9" },
      { id: "a2", type: "player", x: 430, y: 320, label: "10" },
      { id: "g1", type: "player", x: 850, y: 280, label: "GK" },
      { id: "b1", type: "ball", x: 720, y: 120 },
      { id: "c1", type: "cone", x: 670, y: 140 },
      { id: "c2", type: "cone", x: 620, y: 180 },
    ],
    lines: [
      { id: "l1", type: "arrow", x1: 720, y1: 120, x2: 560, y2: 260 },
      { id: "l2", type: "movement", x1: 430, y1: 320, x2: 610, y2: 300 },
      { id: "l3", type: "movement", x1: 520, y1: 240, x2: 690, y2: 240 },
    ],
  },

  "small-sided-game-4v4": {
    updatedAt: now(),
    items: [
      { id: "a1", type: "player", x: 260, y: 170, label: "A1" },
      { id: "a2", type: "player", x: 260, y: 380, label: "A2" },
      { id: "a3", type: "player", x: 420, y: 220, label: "A3" },
      { id: "a4", type: "player", x: 420, y: 330, label: "A4" },
      { id: "b1", type: "player", x: 640, y: 170, label: "B1" },
      { id: "b2", type: "player", x: 640, y: 380, label: "B2" },
      { id: "b3", type: "player", x: 500, y: 220, label: "B3" },
      { id: "b4", type: "player", x: 500, y: 330, label: "B4" },
      { id: "ball1", type: "ball", x: 450, y: 280 },
    ],
    lines: [],
  },

  "transition-4v4": {
    updatedAt: now(),
    items: [
      { id: "a1", type: "player", x: 260, y: 170, label: "A1" },
      { id: "a2", type: "player", x: 260, y: 380, label: "A2" },
      { id: "a3", type: "player", x: 400, y: 220, label: "A3" },
      { id: "a4", type: "player", x: 400, y: 330, label: "A4" },
      { id: "b1", type: "player", x: 640, y: 170, label: "B1" },
      { id: "b2", type: "player", x: 640, y: 380, label: "B2" },
      { id: "b3", type: "player", x: 500, y: 220, label: "B3" },
      { id: "b4", type: "player", x: 500, y: 330, label: "B4" },
      { id: "ball1", type: "ball", x: 450, y: 280 },
    ],
    lines: [
      { id: "l1", type: "arrow", x1: 450, y1: 280, x2: 730, y2: 280 },
    ],
  },

  "3v2-attack-to-goal": {
    updatedAt: now(),
    items: [
      { id: "a1", type: "player", x: 240, y: 180, label: "A1" },
      { id: "a2", type: "player", x: 240, y: 380, label: "A2" },
      { id: "a3", type: "player", x: 420, y: 280, label: "A3" },
      { id: "d1", type: "player", x: 620, y: 220, label: "D1" },
      { id: "d2", type: "player", x: 620, y: 340, label: "D2" },
      { id: "gk", type: "player", x: 840, y: 280, label: "GK" },
      { id: "ball1", type: "ball", x: 240, y: 180 },
    ],
    lines: [
      { id: "l1", type: "arrow", x1: 240, y1: 180, x2: 420, y2: 280 },
      { id: "l2", type: "arrow", x1: 420, y1: 280, x2: 780, y2: 280 },
      { id: "l3", type: "movement", x1: 240, y1: 380, x2: 500, y2: 360 },
    ],
  },
};

export function getDefaultDrillLayout(drillId?: string | null) {
  if (!drillId) return null;
  return DEFAULT_DRILL_LAYOUTS[drillId] || null;
}