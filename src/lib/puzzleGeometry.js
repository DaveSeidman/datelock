import { BOARD_ROWS, MONTHS, PIECES, WEEKDAYS } from '../data/puzzle.js';

export const BOARD_COLS = BOARD_ROWS[0].length;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getTodaySelection = () => {
  const now = new Date();

  return {
    month: MONTHS[now.getMonth()],
    day: String(now.getDate()),
    weekday: WEEKDAYS[now.getDay()],
  };
};

export const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const getPointerAnchoredPosition = (pointerX, pointerY, pointerOffsetX = 0, pointerOffsetY = 0) => ({
  left: pointerX - pointerOffsetX,
  top: pointerY - pointerOffsetY,
});

export const getPieceBounds = (cells) => {
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

export const annotateCells = (cells) => {
  const occupied = new Set(cells.map(([x, y]) => `${x}:${y}`));

  return cells.map(([x, y], index) => ({
    index,
    x,
    y,
    hasTop: occupied.has(`${x}:${y - 1}`),
    hasRight: occupied.has(`${x + 1}:${y}`),
    hasBottom: occupied.has(`${x}:${y + 1}`),
    hasLeft: occupied.has(`${x - 1}:${y}`),
  }));
};

export const getBoundsPivot = (cells) => {
  const bounds = getPieceBounds(cells);

  return [
    (bounds.minX + bounds.maxX) / 2,
    (bounds.minY + bounds.maxY) / 2,
  ];
};

export const transformPoint = ([x, y], rotation, mirrored = false) => {
  let nextPoint = [x, y];

  for (let index = 0; index < rotation; index += 1) {
    nextPoint = [nextPoint[1], -nextPoint[0]];
  }

  if (mirrored) {
    nextPoint = [-nextPoint[0], nextPoint[1]];
  }

  return nextPoint;
};

export const getTransformedGeometry = (cells, _pivot, rotation, mirrored = false) => {
  let nextCells = cells;
  const basePivot = getBoundsPivot(cells);

  for (let index = 0; index < rotation; index += 1) {
    nextCells = nextCells.map(([x, y]) => [y, -x]);
  }

  if (mirrored) {
    nextCells = nextCells.map(([x, y]) => [-x, y]);
  }

  const bounds = getPieceBounds(nextCells);
  const transformedPivot = transformPoint(basePivot, rotation, mirrored);

  return {
    cells: nextCells.map(([x, y]) => [x - bounds.minX, y - bounds.minY]),
    pivot: [transformedPivot[0] - bounds.minX, transformedPivot[1] - bounds.minY],
  };
};

export const getLabelType = (label) => {
  if (!label) return 'void';
  if (MONTHS.includes(label)) return 'month';
  if (WEEKDAYS.includes(label)) return 'weekday';
  return 'day';
};

export const buildBoardCells = () =>
  BOARD_ROWS.flatMap((row, rowIndex) =>
    row.map((label, colIndex) => ({
      id: `${rowIndex}-${colIndex}`,
      row: rowIndex,
      col: colIndex,
      label,
      type: getLabelType(label),
      playable: Boolean(label),
    })),
  );

export const createInitialPlacements = () =>
  PIECES.reduce((accumulator, piece, index) => {
    accumulator[piece.id] = {
      id: piece.id,
      rotation: 0,
      mirrored: false,
      col: null,
      row: null,
      boardAnchorX: null,
      boardAnchorY: null,
      traySlot: index,
      motion: null,
      motionNonce: 0,
    };

    return accumulator;
  }, {});

export const cellKey = (row, col) => `${row}-${col}`;

export const getPieceDimensions = (piece, rotation = 0, mirrored = false) => {
  const geometry = getTransformedGeometry(piece.cells, piece.pivot, rotation, mirrored);
  const bounds = getPieceBounds(geometry.cells);

  return {
    widthCells: bounds.maxX - bounds.minX + 1,
    heightCells: bounds.maxY - bounds.minY + 1,
  };
};

export const isTargetCell = (cell, selection) =>
  cell.label === selection.month ||
  cell.label === selection.day ||
  cell.label === selection.weekday;

export const isPlacementPristine = (placement) =>
  placement.rotation === 0 &&
  !placement.mirrored &&
  placement.col === null &&
  placement.row === null &&
  placement.trayX === undefined &&
  placement.trayY === undefined;

export function getDropPlacement(pointerX, pointerY, boardRect, rotatedCells, pointerOffsetX, pointerOffsetY) {
  if (!boardRect) {
    return null;
  }

  const cellSize = boardRect.width / 7;
  const boardTolerance = cellSize * 0.58;
  const anchoredPosition =
    typeof pointerOffsetX === 'number' && typeof pointerOffsetY === 'number'
      ? getPointerAnchoredPosition(pointerX, pointerY, pointerOffsetX, pointerOffsetY)
      : null;
  const boardX = anchoredPosition ? anchoredPosition.left - boardRect.left : pointerX - boardRect.left;
  const boardY = anchoredPosition ? anchoredPosition.top - boardRect.top : pointerY - boardRect.top;
  const bounds = getPieceBounds(rotatedCells);
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  const projectedLeft = anchoredPosition ? anchoredPosition.left : pointerX - (width * cellSize) / 2;
  const projectedTop = anchoredPosition ? anchoredPosition.top : pointerY - (height * cellSize) / 2;
  const projectedRight = projectedLeft + width * cellSize;
  const projectedBottom = projectedTop + height * cellSize;
  const intersectsBoard =
    projectedRight > boardRect.left - boardTolerance &&
    projectedLeft < boardRect.right + boardTolerance &&
    projectedBottom > boardRect.top - boardTolerance &&
    projectedTop < boardRect.bottom + boardTolerance;

  if (!intersectsBoard) {
    return null;
  }

  const rawCol = anchoredPosition ? Math.round(boardX / cellSize) : Math.round((boardX - (width * cellSize) / 2) / cellSize);
  const rawRow = anchoredPosition ? Math.round(boardY / cellSize) : Math.round((boardY - (height * cellSize) / 2) / cellSize);

  if (Number.isNaN(rawCol) || Number.isNaN(rawRow)) {
    return null;
  }

  return {
    col: clamp(rawCol, 0, Math.max(0, BOARD_COLS - width)),
    row: clamp(rawRow, 0, Math.max(0, BOARD_ROWS.length - height)),
  };
}
