import { BOARD_ROWS } from '../data/puzzle.js';
import {
  BOARD_COLS,
  cellKey,
  getPieceBounds,
  getTransformedGeometry,
  isTargetCell,
} from './puzzleGeometry.js';

const getOrientationVariants = (piece) => {
  const seen = new Set();
  const variants = [];
  const mirrorOptions = piece.canFlip === false ? [false] : [false, true];

  for (let rotation = 0; rotation < 4; rotation += 1) {
    mirrorOptions.forEach((mirrored) => {
      const geometry = getTransformedGeometry(piece.cells, piece.pivot, rotation, mirrored);
      const signature = geometry.cells
        .slice()
        .sort(([leftX, leftY], [rightX, rightY]) => leftY - rightY || leftX - rightX)
        .map(([x, y]) => `${x},${y}`)
        .join('|');

      if (seen.has(signature)) {
        return;
      }

      seen.add(signature);

      const bounds = getPieceBounds(geometry.cells);

      variants.push({
        rotation,
        mirrored,
        cells: geometry.cells,
        pivot: geometry.pivot,
        width: bounds.maxX - bounds.minX + 1,
        height: bounds.maxY - bounds.minY + 1,
      });
    });
  }

  return variants;
};

export const solveDailyPuzzle = ({ boardCells, pieces, selection }) => {
  const fillableCells = boardCells.filter((cell) => cell.playable && !isTargetCell(cell, selection));
  const fillableKeys = fillableCells.map((cell) => cellKey(cell.row, cell.col));
  const fillableSet = new Set(fillableKeys);
  const candidatesByCell = new Map(fillableKeys.map((key) => [key, []]));

  pieces.forEach((piece) => {
    getOrientationVariants(piece).forEach((variant) => {
      for (let row = 0; row <= BOARD_ROWS.length - variant.height; row += 1) {
        for (let col = 0; col <= BOARD_COLS - variant.width; col += 1) {
          const coveredKeys = variant.cells.map(([x, y]) => cellKey(row + y, col + x));

          if (!coveredKeys.every((key) => fillableSet.has(key))) {
            continue;
          }

          const candidate = {
            pieceId: piece.id,
            row,
            col,
            rotation: variant.rotation,
            mirrored: variant.mirrored,
            pivot: variant.pivot,
            coveredKeys,
          };

          coveredKeys.forEach((key) => candidatesByCell.get(key)?.push(candidate));
        }
      }
    });
  });

  const usedPieces = new Set();
  const usedCells = new Set();
  const solution = [];

  const findNextCandidates = () => {
    let bestCandidates = null;

    for (const key of fillableKeys) {
      if (usedCells.has(key)) {
        continue;
      }

      const candidates = (candidatesByCell.get(key) ?? []).filter(
        (candidate) =>
          !usedPieces.has(candidate.pieceId) &&
          candidate.coveredKeys.every((coveredKey) => !usedCells.has(coveredKey)),
      );

      if (!candidates.length) {
        return [];
      }

      if (!bestCandidates || candidates.length < bestCandidates.length) {
        bestCandidates = candidates;

        if (bestCandidates.length === 1) {
          break;
        }
      }
    }

    return bestCandidates ?? [];
  };

  const search = () => {
    if (usedCells.size === fillableKeys.length) {
      return solution.length === pieces.length;
    }

    const nextCandidates = findNextCandidates();

    if (!nextCandidates.length) {
      return false;
    }

    for (const candidate of nextCandidates) {
      usedPieces.add(candidate.pieceId);
      candidate.coveredKeys.forEach((key) => usedCells.add(key));
      solution.push(candidate);

      if (search()) {
        return true;
      }

      solution.pop();
      candidate.coveredKeys.forEach((key) => usedCells.delete(key));
      usedPieces.delete(candidate.pieceId);
    }

    return false;
  };

  if (!search()) {
    return null;
  }

  return solution.reduce((result, candidate) => {
    result[candidate.pieceId] = candidate;
    return result;
  }, {});
};
