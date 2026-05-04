/**
 * Lifted from packages/core/src/components/windows/ResizeHandles.tsx in
 * memelliio/memelli-os-disconnected (Prozilla core). Identical math, kept
 * separate so the OS surface owns its own copy.
 */

export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type ResizeStartArgs = {
  dir: ResizeDir;
  originX: number;
  originY: number;
  startW: number;
  startH: number;
  startPosX: number;
  startPosY: number;
};

export type ResizeBounds = {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  minTopY: number;
};

export type ResizeMoveResult = {
  width: number;
  height: number;
  posX: number;
  posY: number;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export function computeResize(
  args: ResizeStartArgs,
  currentX: number,
  currentY: number,
  bounds: ResizeBounds,
): ResizeMoveResult {
  const dx = currentX - args.originX;
  const dy = currentY - args.originY;

  let width = args.startW;
  let height = args.startH;
  let posX = args.startPosX;
  let posY = args.startPosY;

  if (args.dir.includes("e")) {
    width = clamp(args.startW + dx, bounds.minWidth, bounds.maxWidth);
  }
  if (args.dir.includes("s")) {
    height = clamp(args.startH + dy, bounds.minHeight, bounds.maxHeight);
  }
  if (args.dir.includes("w")) {
    const proposed = clamp(args.startW - dx, bounds.minWidth, bounds.maxWidth);
    const consumed = args.startW - proposed;
    width = proposed;
    posX = args.startPosX + consumed;
  }
  if (args.dir.includes("n")) {
    const proposed = clamp(
      args.startH - dy,
      bounds.minHeight,
      bounds.maxHeight,
    );
    const consumed = args.startH - proposed;
    height = proposed;
    const candidate = args.startPosY + consumed;
    if (candidate < bounds.minTopY) {
      const overflow = bounds.minTopY - candidate;
      height = Math.max(bounds.minHeight, height - overflow);
      posY = bounds.minTopY;
    } else {
      posY = candidate;
    }
  }

  return { width, height, posX, posY };
}

export const CURSORS: Record<ResizeDir, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

export const MELLI_BAR_HEIGHT = 96;
export const TASKBAR_HEIGHT = 52;
export const SIGNIN_RAIL_WIDTH = 0; // tabs are floating overlays now

export const MIN_W = 320;
export const MIN_H = 200;

export function viewportBounds(): ResizeBounds {
  if (typeof window === "undefined") {
    return {
      minWidth: MIN_W,
      minHeight: MIN_H,
      maxWidth: 1440,
      maxHeight: 900,
      minTopY: 0,
    };
  }
  return {
    minWidth: MIN_W,
    minHeight: MIN_H,
    // Popups can cover header + footer, so use the full viewport.
    maxWidth: Math.max(MIN_W, window.innerWidth),
    maxHeight: Math.max(MIN_H, window.innerHeight),
    minTopY: 0,
  };
}
