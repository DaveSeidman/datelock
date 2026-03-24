import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Attract from './components/Attract/index.jsx';
import Board from './components/Board/index.jsx';
import GhostOverlay from './components/GhostOverlay/index.jsx';
import Header from './components/Header/index.jsx';
import PieceControlsOverlay from './components/PieceControlsOverlay/index.jsx';
import PieceLayer from './components/PieceLayer/index.jsx';
import Share from './components/Share/index.jsx';
import Tray from './components/Tray/index.jsx';
import { BOARD_ROWS, PIECES } from './data/puzzle.js';
import { useActivePieceKeyboardControls, useOutsidePieceDeselect, usePieceMotion } from './hooks/usePieceEffects.js';
import usePuzzleTimer from './hooks/usePuzzleTimer.js';
import {
  BOARD_COLS,
  buildBoardCells,
  cellKey,
  clamp,
  createInitialPlacements,
  getDropPlacement,
  getPieceBounds,
  getPieceDimensions,
  getTodaySelection,
  getTransformedGeometry,
  getViewportSize,
  isPlacementPristine,
  isTargetCell,
} from './lib/puzzleGeometry.js';
import { solveDailyPuzzle } from './lib/puzzleSolver.js';
import { copyTextFallback } from './lib/share.js';
import { buildTrayLayout, clampTrayPosition as clampTrayPositionToBounds, getTrayCellSize, getTrayDropPosition } from './lib/trayLayout.js';

const TAP_ROTATE_MS = 280;
const MOVE_THRESHOLD = 8;
const CONFETTI_COLORS = ['#f7e0a3', '#e8bf7a', '#cf9f67', '#8e5e33', '#c5533d', '#6a8b55'];
const SHARE_URL = 'https://daveseidman.github.io/datelock/';
const SHARE_PUZZLE_NAME = 'DateLock';

function App() {
  const gameRef = useRef(null);
  const boardRef = useRef(null);
  const boardGridRef = useRef(null);
  const trayRef = useRef(null);
  const pieceRefs = useRef({});
  const pieceBodyRefs = useRef({});
  const trayMetricsRef = useRef(null);
  const touchInfoRef = useRef({ pieceId: null, time: 0 });
  const shareFeedbackTimeoutRef = useRef(null);
  const autoSolveTimeoutsRef = useRef([]);
  const wasSolvedRef = useRef(false);
  const [selection] = useState(getTodaySelection);
  const [placements, setPlacements] = useState(createInitialPlacements);
  const [dragState, setDragState] = useState(null);
  const [activePieceId, setActivePieceId] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [viewportSize, setViewportSize] = useState(getViewportSize);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAttractScreen, setShowAttractScreen] = useState(true);
  const [attractMode, setAttractMode] = useState('start');
  const [confettiBurstKey, setConfettiBurstKey] = useState(0);
  const [sharePulseKey, setSharePulseKey] = useState(0);
  const [shareFeedback, setShareFeedback] = useState('idle');
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const [hasUsedAutoSolve, setHasUsedAutoSolve] = useState(false);
  const boardCells = useMemo(buildBoardCells, []);
  const piecesById = useMemo(
    () => Object.fromEntries(PIECES.map((piece) => [piece.id, piece])),
    [],
  );
  const boardCellMap = useMemo(
    () => new Map(boardCells.map((cell) => [cellKey(cell.row, cell.col), cell])),
    [boardCells],
  );
  const trayLayout = layoutReady ? buildTrayLayout(trayRef.current?.getBoundingClientRect()) : null;
  const getDefaultTrayPosition = (pieceId) => trayLayout?.positions[pieceId] ?? { x: 12, y: 12 };
  const measureTrayMetrics = () => {
    const trayRect = trayRef.current?.getBoundingClientRect();

    if (!trayRect) {
      return null;
    }

    const layout = buildTrayLayout(trayRect);

    return {
      width: trayRect.width,
      height: trayRect.height,
      pieceUnit: layout?.pieceUnit ?? getTrayCellSize(trayRect),
    };
  };

  const buildReflowTrayPositions = (sourcePlacements) => {
    const trayRect = trayRef.current?.getBoundingClientRect();

    if (!trayRect) {
      return null;
    }

    const pack = (pieceUnit) => {
      const padding = Math.max(4, pieceUnit * 0.14);
      const gapX = Math.max(6, pieceUnit * 0.22);
      const gapY = Math.max(8, pieceUnit * 0.28);
      const availableWidth = Math.max(pieceUnit * 4, trayRect.width - padding * 2);
      const trayPieceIds = PIECES.map((piece) => piece.id).filter((pieceId) => sourcePlacements[pieceId].col === null);
      const rows = [];
      let currentRow = { items: [], width: 0, height: 0 };

      trayPieceIds.forEach((pieceId) => {
        const piece = piecesById[pieceId];
        const placement = sourcePlacements[pieceId];
        const { widthCells, heightCells } = getPieceDimensions(piece, placement.rotation, placement.mirrored);
        const item = {
          id: pieceId,
          width: widthCells * pieceUnit,
          height: heightCells * pieceUnit,
        };
        const nextWidth = currentRow.items.length ? currentRow.width + gapX + item.width : item.width;

        if (currentRow.items.length && nextWidth > availableWidth) {
          rows.push(currentRow);
          currentRow = { items: [], width: 0, height: 0 };
        }

        currentRow.items.push(item);
        currentRow.width = currentRow.items.length === 1 ? item.width : currentRow.width + gapX + item.width;
        currentRow.height = Math.max(currentRow.height, item.height);
      });

      if (currentRow.items.length) {
        rows.push(currentRow);
      }

      const positions = {};
      let y = padding;

      rows.forEach((row) => {
        let x = padding + Math.max(0, (availableWidth - row.width) / 2);

        row.items.forEach((item) => {
          positions[item.id] = {
            x,
            y: y + (row.height - item.height) / 2,
          };
          x += item.width + gapX;
        });

        y += row.height + gapY;
      });

      return {
        pieceUnit,
        positions,
        height: y - gapY + padding,
      };
    };

    const basePieceUnit = getTrayCellSize(trayRect);
    let layout = pack(basePieceUnit);

    if (trayRect.height && layout.height > trayRect.height) {
      const scale = Math.max(0.68, (trayRect.height - 6) / layout.height);
      layout = pack(basePieceUnit * scale);
    }

    return layout.positions;
  };

  const reflowTrayPieces = (sourcePlacements) => {
    const positions = buildReflowTrayPositions(sourcePlacements);

    if (!positions) {
      return sourcePlacements;
    }

    const nextPlacements = { ...sourcePlacements };

    Object.entries(positions).forEach(([pieceId, position]) => {
      nextPlacements[pieceId] = {
        ...nextPlacements[pieceId],
        col: null,
        row: null,
        boardAnchorX: null,
        boardAnchorY: null,
        trayX: position.x,
        trayY: position.y,
      };
    });

    return nextPlacements;
  };

  useLayoutEffect(() => {
    if (!layoutReady && gameRef.current && boardGridRef.current && trayRef.current) {
      setLayoutReady(true);
    }
  }, [layoutReady]);

  useLayoutEffect(() => {
    if (!layoutReady) {
      return;
    }

    trayMetricsRef.current = measureTrayMetrics();
  }, [layoutReady, viewportSize.height, viewportSize.width]);

  const canPlacePiece = (pieceId, placement, rotatedCells, candidatePlacements = placements) => {
    return rotatedCells.every(([x, y]) => {
      const row = placement.row + y;
      const col = placement.col + x;
      return row >= 0 && row < BOARD_ROWS.length && col >= 0 && col < BOARD_COLS;
    });
  };

  const isPointInsidePieceShape = (pieceId, clientX, clientY) => {
    const element = pieceRefs.current[pieceId];
    const piece = piecesById[pieceId];
    const placement = placements[pieceId];

    if (!element || !piece || !placement) {
      return false;
    }

    const rect = element.getBoundingClientRect();

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return false;
    }

    const geometry = getTransformedGeometry(
      piece.cells,
      piece.pivot,
      placement.rotation,
      placement.mirrored,
    );
    const bounds = getPieceBounds(geometry.cells);
    const width = bounds.maxX - bounds.minX + 1;
    const height = bounds.maxY - bounds.minY + 1;

    if (!width || !height || !rect.width || !rect.height) {
      return false;
    }

    const unitX = rect.width / width;
    const unitY = rect.height / height;
    const localX = clamp(clientX - rect.left, 0, Math.max(0, rect.width - 0.001));
    const localY = clamp(clientY - rect.top, 0, Math.max(0, rect.height - 0.001));
    const hitCellX = Math.floor(localX / unitX);
    const hitCellY = Math.floor(localY / unitY);

    return geometry.cells.some(([x, y]) => x === hitCellX && y === hitCellY);
  };

  const resolvePieceAtPoint = (clientX, clientY, fallbackPieceId = null) => {
    if (typeof document === 'undefined') {
      return fallbackPieceId;
    }

    const seen = new Set();
    const candidateIds = [];

    document.elementsFromPoint(clientX, clientY).forEach((element) => {
      const pieceElement = element.closest?.('.piece[data-piece-id]');
      const pieceId = pieceElement?.dataset?.pieceId;

      if (pieceId && !seen.has(pieceId)) {
        seen.add(pieceId);
        candidateIds.push(pieceId);
      }
    });

    if (fallbackPieceId && !seen.has(fallbackPieceId)) {
      candidateIds.push(fallbackPieceId);
    }

    return candidateIds.find((pieceId) => isPointInsidePieceShape(pieceId, clientX, clientY)) ?? null;
  };

  const preservePieceAnchor = (pieceId, currentPlacement, nextPlacement) => {
    const piece = piecesById[pieceId];
    const currentGeometry = getTransformedGeometry(
      piece.cells,
      piece.pivot,
      currentPlacement.rotation,
      currentPlacement.mirrored,
    );
    const nextGeometry = getTransformedGeometry(
      piece.cells,
      piece.pivot,
      nextPlacement.rotation,
      nextPlacement.mirrored,
    );

    if (currentPlacement.col !== null && currentPlacement.row !== null) {
      const anchorX =
        currentPlacement.boardAnchorX ?? currentPlacement.col + currentGeometry.pivot[0];
      const anchorY =
        currentPlacement.boardAnchorY ?? currentPlacement.row + currentGeometry.pivot[1];

      return {
        ...nextPlacement,
        col: Math.round(anchorX - nextGeometry.pivot[0]),
        row: Math.round(anchorY - nextGeometry.pivot[1]),
        boardAnchorX: anchorX,
        boardAnchorY: anchorY,
      };
    }

    const currentBounds = getPieceBounds(currentGeometry.cells);
    const currentWidth = currentBounds.maxX - currentBounds.minX + 1;
    const nextBounds = getPieceBounds(nextGeometry.cells);
    const nextWidth = nextBounds.maxX - nextBounds.minX + 1;
    const nextHeight = nextBounds.maxY - nextBounds.minY + 1;
    const pieceRect = pieceRefs.current[pieceId]?.getBoundingClientRect();
    const trayRect = trayRef.current?.getBoundingClientRect();
    const pieceUnit =
      pieceRect?.width && currentWidth
        ? pieceRect.width / currentWidth
        : trayRect
          ? getTrayCellSize(trayRect)
          : 0;
    const currentX = currentPlacement.trayX ?? getDefaultTrayPosition(pieceId).x;
    const currentY = currentPlacement.trayY ?? getDefaultTrayPosition(pieceId).y;
    const nextX = currentX + (currentGeometry.pivot[0] - nextGeometry.pivot[0]) * pieceUnit;
    const nextY = currentY + (currentGeometry.pivot[1] - nextGeometry.pivot[1]) * pieceUnit;
    const clampedPosition = clampTrayPositionToBounds({
      x: nextX,
      y: nextY,
      width: nextWidth,
      height: nextHeight,
      pieceUnit,
      trayWidth: trayRect?.width ?? 0,
      trayHeight: trayRect?.height ?? 0,
    });

    return {
      ...nextPlacement,
      trayX: clampedPosition.x,
      trayY: clampedPosition.y,
      boardAnchorX: null,
      boardAnchorY: null,
    };
  };

  const getPieceBoardCells = (piece, placement, geometryOverride = null) => {
    if (placement.col === null || placement.row === null) {
      return [];
    }

    const geometry =
      geometryOverride ??
      getTransformedGeometry(
        piece.cells,
        piece.pivot,
        placement.rotation,
        placement.mirrored,
      );

    return geometry.cells.map(([x, y], index) => {
      const row = placement.row + y;
      const col = placement.col + x;
      const onGrid = row >= 0 && row < BOARD_ROWS.length && col >= 0 && col < BOARD_COLS;
      const key = onGrid ? cellKey(row, col) : null;
      const boardCell = key ? boardCellMap.get(key) : null;

      return {
        index,
        row,
        col,
        key,
        onGrid,
        playable: Boolean(boardCell?.playable),
      };
    });
  };

  const occupiedMap = useMemo(() => {
    const map = new Map();

    PIECES.forEach((piece) => {
      const placement = placements[piece.id];

      if (placement.col === null || placement.row === null) {
        return;
      }

      const rotatedCells = getTransformedGeometry(
        piece.cells,
        piece.pivot,
        placement.rotation,
        placement.mirrored,
      ).cells;
      rotatedCells.forEach(([x, y]) => {
        map.set(cellKey(placement.row + y, placement.col + x), piece.id);
      });
    });

    return map;
  }, [placements]);

  const placedCellsByPiece = useMemo(
    () =>
      Object.fromEntries(
        PIECES.map((piece) => {
          const placement = placements[piece.id];

          return [piece.id, getPieceBoardCells(piece, placement)];
        }),
      ),
    [boardCellMap, placements],
  );

  const liveCellsByPiece = useMemo(() => {
    const result = { ...placedCellsByPiece };

    if (!dragState) {
      return result;
    }

    const boardRect = boardGridRef.current?.getBoundingClientRect();
    const piece = piecesById[dragState.pieceId];
    const geometry = getTransformedGeometry(
      piece.cells,
      piece.pivot,
      dragState.rotation,
      dragState.mirrored,
    );
    const projectedPlacement = getDropPlacement(
      dragState.pointerX,
      dragState.pointerY,
      boardRect,
      geometry.cells,
      dragState.pointerOffsetX,
      dragState.pointerOffsetY,
    );

    result[dragState.pieceId] = projectedPlacement
      ? getPieceBoardCells(piece, projectedPlacement, geometry)
      : [];

    return result;
  }, [dragState, getPieceBoardCells, piecesById, placedCellsByPiece]);

  const liveOccupiedCounts = useMemo(() => {
    const counts = new Map();

    Object.values(liveCellsByPiece).forEach((cells) => {
      cells.forEach(({ key, onGrid = true }) => {
        if (!key || !onGrid) {
          return;
        }

        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });

    return counts;
  }, [liveCellsByPiece]);

  const ghostPlacement = useMemo(() => {
    if (!dragState) {
      return null;
    }

    const boardRect = boardGridRef.current?.getBoundingClientRect();
    const piece = piecesById[dragState.pieceId];
    const rotatedCells = getTransformedGeometry(
      piece.cells,
      piece.pivot,
      dragState.rotation,
      dragState.mirrored,
    ).cells;
    const nextPlacement = getDropPlacement(
      dragState.pointerX,
      dragState.pointerY,
      boardRect,
      rotatedCells,
      dragState.pointerOffsetX,
      dragState.pointerOffsetY,
    );

    if (!nextPlacement || !canPlacePiece(dragState.pieceId, nextPlacement, rotatedCells)) {
      return null;
    }

    return {
      pieceId: dragState.pieceId,
      placement: nextPlacement,
      cells: rotatedCells,
      bounds: getPieceBounds(rotatedCells),
    };
  }, [dragState, piecesById, placements]);

  const isSolved = useMemo(() => {
    const playableCells = boardCells.filter((cell) => cell.playable);
    const uncoveredTargets = playableCells.filter((cell) => isTargetCell(cell, selection));
    const coveredTargets = uncoveredTargets.filter((cell) => occupiedMap.has(cellKey(cell.row, cell.col)));
    const coveredPlayableCells = playableCells.filter((cell) => occupiedMap.has(cellKey(cell.row, cell.col)));
    const allPiecesPlaced = PIECES.every((piece) => placements[piece.id].col !== null);
    return allPiecesPlaced && coveredTargets.length === 0 && coveredPlayableCells.length === playableCells.length - 3;
  }, [boardCells, occupiedMap, placements, selection]);

  const hasPuzzleStarted = useMemo(
    () => Object.values(placements).some((placement) => !isPlacementPristine(placement)),
    [placements],
  );

  const {
    freezeElapsedTime,
    resetTimer,
    resumeTimer,
    timerStartedAt,
    timerText,
  } = usePuzzleTimer({
    hasPuzzleStarted,
    isSolved,
    onRequestResumeOverlay: () => {
      setAttractMode('resume');
      setShowAttractScreen(true);
    },
  });

  const status = useMemo(() => {
    const playableCells = boardCells.filter((cell) => cell.playable);
    const uncoveredTargets = playableCells.filter((cell) => isTargetCell(cell, selection));
    const coveredTargets = uncoveredTargets.filter((cell) => occupiedMap.has(cellKey(cell.row, cell.col)));

    if (isSolved) {
      return `Solved for ${selection.month} ${selection.day} ${selection.weekday} in ${timerText}!`;
    }

    if (coveredTargets.length > 0) {
      return 'A target cell is covered. Leave today’s month, date, and weekday visible.';
    }

    return 'Drag pieces onto the board. As you move, a snapped outline shows exactly where the piece will land.';
  }, [boardCells, isSolved, occupiedMap, selection, timerText]);

  useEffect(() => {
    if (hasPuzzleStarted && attractMode === 'start') {
      setShowAttractScreen(false);
    }
  }, [attractMode, hasPuzzleStarted]);

  const dismissAttractScreen = () => {
    setShowAttractScreen(false);
    if (hasPuzzleStarted) {
      setAttractMode('resume');
    }
    resumeTimer();
  };

  const closeAttractScreen = () => {
    setShowAttractScreen(false);

    if (attractMode === 'solved') {
      setShowConfetti(false);
      return;
    }

    resumeTimer();
  };

  useEffect(() => {
    let resizeFrame = null;

    const handleResize = () => {
      setViewportSize(getViewportSize());

      if (!layoutReady || dragState) {
        return;
      }

      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        const previousMetrics = trayMetricsRef.current;
        const nextMetrics = measureTrayMetrics();

        trayMetricsRef.current = nextMetrics;

        if (!previousMetrics || !nextMetrics) {
          return;
        }

        setPlacements((current) => {
          let changed = false;
          const nextPlacements = { ...current };

          PIECES.forEach((piece) => {
            const placement = current[piece.id];

            if (
              placement.col !== null ||
              placement.row !== null ||
              placement.trayX === undefined ||
              placement.trayY === undefined
            ) {
              return;
            }

            const { widthCells, heightCells } = getPieceDimensions(
              piece,
              placement.rotation,
              placement.mirrored,
            );
            const previousMaxX = Math.max(0, previousMetrics.width - widthCells * previousMetrics.pieceUnit);
            const previousMaxY = Math.max(0, previousMetrics.height - heightCells * previousMetrics.pieceUnit);
            const nextMaxX = Math.max(0, nextMetrics.width - widthCells * nextMetrics.pieceUnit);
            const nextMaxY = Math.max(0, nextMetrics.height - heightCells * nextMetrics.pieceUnit);
            const xRatio = previousMaxX > 0 ? placement.trayX / previousMaxX : 0;
            const yRatio = previousMaxY > 0 ? placement.trayY / previousMaxY : 0;
            const clampedPosition = clampTrayPositionToBounds({
              x: nextMaxX * xRatio,
              y: nextMaxY * yRatio,
              width: widthCells,
              height: heightCells,
              pieceUnit: nextMetrics.pieceUnit,
              trayWidth: nextMetrics.width,
              trayHeight: nextMetrics.height,
            });

            if (
              Math.abs(clampedPosition.x - placement.trayX) > 0.5 ||
              Math.abs(clampedPosition.y - placement.trayY) > 0.5
            ) {
              nextPlacements[piece.id] = {
                ...placement,
                trayX: clampedPosition.x,
                trayY: clampedPosition.y,
              };
              changed = true;
            }
          });

          return changed ? nextPlacements : current;
        });
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      window.removeEventListener('resize', handleResize);
    };
  }, [dragState, layoutReady]);

  useEffect(() => {
    if (isSolved && !wasSolvedRef.current) {
      freezeElapsedTime();
      setShowConfetti(true);
      setAttractMode('solved');
      setShowAttractScreen(true);
      setConfettiBurstKey((current) => current + 1);
      setSharePulseKey((current) => current + 1);
    }

    if (!isSolved) {
      setShowConfetti(false);
    }

    wasSolvedRef.current = isSolved;
  }, [freezeElapsedTime, isSolved]);

  useEffect(
    () => () => {
      if (shareFeedbackTimeoutRef.current) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }

      autoSolveTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      autoSolveTimeoutsRef.current = [];
    },
    [],
  );

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      setDragState((current) => {
        if (!current) {
          return current;
        }

        const moved =
          current.moved ||
          Math.abs(event.clientX - current.startX) > MOVE_THRESHOLD ||
          Math.abs(event.clientY - current.startY) > MOVE_THRESHOLD;

        const nextState = {
          ...current,
          pointerX: event.clientX,
          pointerY: event.clientY,
          moved,
        };

        return nextState;
      });
    };

    const handlePointerUp = (event) => {
      const boardRect = boardGridRef.current?.getBoundingClientRect();
      const trayRect = trayRef.current?.getBoundingClientRect();
      const piece = piecesById[dragState.pieceId];
      const rotatedCells = getTransformedGeometry(
        piece.cells,
        piece.pivot,
        dragState.rotation,
        dragState.mirrored,
      ).cells;

      if (event.pointerType !== 'mouse' && !dragState.moved) {
        const lastTouch = touchInfoRef.current;
        const now = Date.now();

        if (lastTouch.pieceId === dragState.pieceId && now - lastTouch.time < TAP_ROTATE_MS) {
          setPlacements((current) => {
            const nextPlacement = preservePieceAnchor(
              dragState.pieceId,
              current[dragState.pieceId],
              {
                ...current[dragState.pieceId],
                rotation: (current[dragState.pieceId].rotation + 1) % 4,
              },
            );

            return {
              ...current,
              [dragState.pieceId]: {
                ...nextPlacement,
                motion: 'rotate-right',
                motionNonce: current[dragState.pieceId].motionNonce + 1,
              },
            };
          });
          touchInfoRef.current = { pieceId: null, time: 0 };
        } else {
          touchInfoRef.current = { pieceId: dragState.pieceId, time: now };
        }

        setActivePieceId(dragState.pieceId);
        setDragState(null);
        return;
      }

      const nextPlacement =
        ghostPlacement?.pieceId === dragState.pieceId
          ? ghostPlacement.placement
          : getDropPlacement(
              event.clientX,
              event.clientY,
              boardRect,
              rotatedCells,
              dragState.pointerOffsetX,
              dragState.pointerOffsetY,
            );
      const trayPieceUnit = trayLayout?.pieceUnit ?? (trayRect ? getTrayCellSize(trayRect) : 0);
      const nextTrayPosition = getTrayDropPosition(
        event.clientX,
        event.clientY,
        trayRect,
        dragState.width,
        dragState.height,
        trayPieceUnit,
        dragState.pointerOffsetX,
        dragState.pointerOffsetY,
      );

      setPlacements((current) => {
        const result = {
          ...current,
          [dragState.pieceId]: {
            ...current[dragState.pieceId],
            col: null,
            row: null,
          },
        };

        if (nextPlacement && canPlacePiece(dragState.pieceId, nextPlacement, rotatedCells, result)) {
          const geometry = getTransformedGeometry(
            piece.cells,
            piece.pivot,
            result[dragState.pieceId].rotation,
            result[dragState.pieceId].mirrored,
          );
          result[dragState.pieceId] = {
            ...result[dragState.pieceId],
            col: nextPlacement.col,
            row: nextPlacement.row,
            boardAnchorX: nextPlacement.col + geometry.pivot[0],
            boardAnchorY: nextPlacement.row + geometry.pivot[1],
          };
        } else if (nextTrayPosition && dragState.originBoardPosition) {
          return reflowTrayPieces(result);
        } else if (nextTrayPosition) {
          result[dragState.pieceId] = {
            ...result[dragState.pieceId],
            boardAnchorX: null,
            boardAnchorY: null,
            trayX: nextTrayPosition.x,
            trayY: nextTrayPosition.y,
          };
        } else if (dragState.originTrayPosition) {
          result[dragState.pieceId] = {
            ...result[dragState.pieceId],
            boardAnchorX: null,
            boardAnchorY: null,
            trayX: dragState.originTrayPosition.x,
            trayY: dragState.originTrayPosition.y,
          };
        } else if (dragState.originBoardPosition) {
          result[dragState.pieceId] = {
            ...result[dragState.pieceId],
            col: dragState.originBoardPosition.col,
            row: dragState.originBoardPosition.row,
            boardAnchorX: dragState.originBoardPosition.col + getTransformedGeometry(
              piece.cells,
              piece.pivot,
              dragState.rotation,
              dragState.mirrored,
            ).pivot[0],
            boardAnchorY: dragState.originBoardPosition.row + getTransformedGeometry(
              piece.cells,
              piece.pivot,
              dragState.rotation,
              dragState.mirrored,
            ).pivot[1],
          };
        }

        return result;
      });

      setActivePieceId(dragState.pieceId);
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, ghostPlacement, placements, preservePieceAnchor, piecesById, trayLayout]);

  const applyPieceTransform = (pieceId, updater, motion) => {
    if (isAutoSolving) {
      return;
    }

    setPlacements((current) => ({
      ...current,
      [pieceId]: {
        ...preservePieceAnchor(pieceId, current[pieceId], updater(current[pieceId])),
        motion,
        motionNonce: current[pieceId].motionNonce + 1,
      },
    }));
    setActivePieceId(pieceId);
  };

  usePieceMotion({
    layoutReady,
    dragPieceId: dragState?.pieceId,
    placements,
    pieceRefs,
    pieceBodyRefs,
  });

  useActivePieceKeyboardControls({
    activePieceId,
    piecesById,
    applyPieceTransform,
  });

  useOutsidePieceDeselect({
    activePieceId,
    setActivePieceId,
  });

  const rotatePieceLeft = (pieceId) =>
    applyPieceTransform(
      pieceId,
      (piece) => ({ ...piece, rotation: (piece.rotation + 1) % 4 }),
      'rotate-left',
    );

  const rotatePieceRight = (pieceId) =>
    applyPieceTransform(
      pieceId,
      (piece) => ({ ...piece, rotation: (piece.rotation + 3) % 4 }),
      'rotate-right',
    );

  const rotatePieceRightAtPointer = (event, fallbackPieceId) => {
    if (isAutoSolving) {
      return;
    }

    const resolvedPieceId = resolvePieceAtPoint(event.clientX, event.clientY, fallbackPieceId);

    if (!resolvedPieceId) {
      return;
    }

    rotatePieceRight(resolvedPieceId);
  };

  const flipPieceVertical = (pieceId) =>
    piecesById[pieceId]?.canFlip === false
      ? null
      : applyPieceTransform(
          pieceId,
          (piece) => ({
            ...piece,
            rotation: (piece.rotation + 2) % 4,
            mirrored: !piece.mirrored,
          }),
          'flip-vertical',
        );

  const flipPieceHorizontal = (pieceId) =>
    piecesById[pieceId]?.canFlip === false
      ? null
      : applyPieceTransform(
          pieceId,
          (piece) => ({
            ...piece,
            mirrored: !piece.mirrored,
          }),
          'flip-horizontal',
        );

  const sendPieceToTray = (pieceId) => {
    if (isAutoSolving) {
      return;
    }

    setPlacements((current) =>
      reflowTrayPieces({
        ...current,
        [pieceId]: {
          ...current[pieceId],
          col: null,
          row: null,
          boardAnchorX: null,
          boardAnchorY: null,
        },
      }),
    );
    setActivePieceId(pieceId);
  };

  const clearAutoSolveSequence = () => {
    autoSolveTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    autoSolveTimeoutsRef.current = [];
    setIsAutoSolving(false);
  };

  const clearBoard = () => {
    clearAutoSolveSequence();
    setPlacements(createInitialPlacements());
    setDragState(null);
    setActivePieceId(null);
    touchInfoRef.current = { pieceId: null, time: 0 };
  };

  const restartGame = () => {
    clearAutoSolveSequence();
    setPlacements(createInitialPlacements());
    setDragState(null);
    setActivePieceId(null);
    resetTimer();
    setShowConfetti(false);
    setAttractMode('start');
    setShareFeedback('idle');
    setHasUsedAutoSolve(false);
    touchInfoRef.current = { pieceId: null, time: 0 };

    if (shareFeedbackTimeoutRef.current) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
      shareFeedbackTimeoutRef.current = null;
    }
  };

  const autoSolvePuzzle = () => {
    const solution = solveDailyPuzzle({
      boardCells,
      pieces: PIECES,
      selection,
    });

    if (!solution) {
      return;
    }

    clearAutoSolveSequence();
    setIsAutoSolving(true);
    setHasUsedAutoSolve(true);
    setDragState(null);
    setActivePieceId(null);

    const orderedSolution = PIECES.map((piece) => solution[piece.id]).filter(Boolean);

    orderedSolution.forEach((candidate, index) => {
      const timeoutId = window.setTimeout(() => {
        setPlacements((current) => ({
          ...current,
          [candidate.pieceId]: {
            ...current[candidate.pieceId],
            rotation: candidate.rotation,
            mirrored: candidate.mirrored,
            col: candidate.col,
            row: candidate.row,
            boardAnchorX: candidate.col + candidate.pivot[0],
            boardAnchorY: candidate.row + candidate.pivot[1],
            motion:
              candidate.mirrored !== current[candidate.pieceId].mirrored
                ? 'flip-vertical'
                : candidate.rotation !== current[candidate.pieceId].rotation
                  ? 'rotate-right'
                  : null,
            motionNonce: current[candidate.pieceId].motionNonce + 1,
          },
        }));
        setActivePieceId(candidate.pieceId);

        if (index === orderedSolution.length - 1) {
          const finishTimeoutId = window.setTimeout(() => {
            setActivePieceId(null);
            setIsAutoSolving(false);
          }, 220);

          autoSolveTimeoutsRef.current.push(finishTimeoutId);
        }
      }, 180 + index * 320);

      autoSolveTimeoutsRef.current.push(timeoutId);
    });
  };

  const shareLink = async ({ title, text, trackFeedback = false }) => {
    const setFeedback = (value) => {
      if (trackFeedback) {
        setShareFeedback(value);
      }
    };

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
        });
        setFeedback('shared');
      } else if (await copyTextFallback(text)) {
        setFeedback('copied');
      } else {
        setFeedback('unavailable');
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      if (await copyTextFallback(text)) {
        setFeedback('copied');
      } else {
        setFeedback('unavailable');
      }
    }

    if (trackFeedback) {
      if (shareFeedbackTimeoutRef.current) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }

      shareFeedbackTimeoutRef.current = window.setTimeout(() => {
        setShareFeedback('idle');
        shareFeedbackTimeoutRef.current = null;
      }, 2200);
    }
  };

  const handleShare = async () => {
    const shouldUseSolvedShare = isSolved && !hasUsedAutoSolve;

    await shareLink({
      title: SHARE_PUZZLE_NAME,
      text: shouldUseSolvedShare
        ? `I solved today's ${SHARE_PUZZLE_NAME} puzzle in ${timerText}\n${SHARE_URL}`
        : `Try ${SHARE_PUZZLE_NAME} the puzzle that changes every day!\n${SHARE_URL}`,
      trackFeedback: true,
    });
  };

  const handleShareWithFriend = async () => {
    await shareLink({
      title: SHARE_PUZZLE_NAME,
      text: `Try ${SHARE_PUZZLE_NAME} the puzzle that changes every day!\n${SHARE_URL}`,
    });
  };

  const startDrag = (event, pieceId) => {
    if (isAutoSolving) {
      return;
    }

    const resolvedPieceId = resolvePieceAtPoint(event.clientX, event.clientY, pieceId);

    if (!resolvedPieceId) {
      return;
    }

    const piece = piecesById[resolvedPieceId];
    const placement = placements[resolvedPieceId];
    const rotatedCells = getTransformedGeometry(
      piece.cells,
      piece.pivot,
      placement.rotation,
      placement.mirrored,
    ).cells;
    const bounds = getPieceBounds(rotatedCells);
    const width = bounds.maxX - bounds.minX + 1;
    const height = bounds.maxY - bounds.minY + 1;
    const sourceRect = (pieceRefs.current[resolvedPieceId] ?? event.currentTarget).getBoundingClientRect();
    const boardGridRect = boardGridRef.current?.getBoundingClientRect();
    const pieceUnit =
      placement.col !== null && boardGridRect
        ? boardGridRect.width / 7
        : sourceRect.width / width;
    const pointerOffsetX = event.clientX - sourceRect.left;
    const pointerOffsetY = event.clientY - sourceRect.top;

    event.preventDefault();
    setActivePieceId(resolvedPieceId);

    const nextDragState = {
      pieceId: resolvedPieceId,
      rotation: placement.rotation,
      mirrored: placement.mirrored,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      pieceUnit,
      width,
      height,
      pointerOffsetX,
      pointerOffsetY,
      originTrayPosition:
        placement.col === null
          ? {
              x: placement.trayX ?? getDefaultTrayPosition(resolvedPieceId).x,
              y: placement.trayY ?? getDefaultTrayPosition(resolvedPieceId).y,
            }
          : null,
      originBoardPosition:
        placement.col !== null
          ? {
            col: placement.col,
            row: placement.row,
          }
          : null,
    };

    setDragState(nextDragState);
  };

  const gameRect = gameRef.current?.getBoundingClientRect();
  const boardGridRect = boardGridRef.current?.getBoundingClientRect();
  const trayRect = trayRef.current?.getBoundingClientRect();

  return (
    <main className="app-shell" onContextMenu={(event) => event.preventDefault()}>
      <Attract
        showConfetti={showConfetti}
        confettiBurstKey={confettiBurstKey}
        viewportSize={viewportSize}
        colors={CONFETTI_COLORS}
        showAttractScreen={showAttractScreen}
        attractMode={attractMode}
        selection={selection}
        timerText={timerText}
        onStart={() => {
          if (attractMode === 'solved') {
            restartGame();
            setShowAttractScreen(false);
            return;
          }

          dismissAttractScreen();
        }}
        onClose={closeAttractScreen}
        canShareSolvedTime={!hasUsedAutoSolve}
        onShare={attractMode === 'solved' ? handleShare : handleShareWithFriend}
      />

      <Header
        selection={selection}
        timerStartedAt={timerStartedAt}
        isSolved={isSolved}
        timerText={timerText}
        status={status}
        onReset={clearBoard}
        onAutoSolve={autoSolvePuzzle}
        showAttractScreen={showAttractScreen}
      />

      <div className="app-share-corner">
        <Share
          isSolved={isSolved}
          shareFeedback={shareFeedback}
          sharePulseKey={sharePulseKey}
          onShare={handleShare}
        />
      </div>

      <section ref={gameRef} className="game">
        <Board
          boardRef={boardRef}
          boardGridRef={boardGridRef}
          boardCells={boardCells}
          selection={selection}
          occupiedMap={occupiedMap}
          cellKey={cellKey}
          isTargetCell={isTargetCell}
        />

        <Tray trayRef={trayRef} />

        <div className="game-piece-layer">
          {layoutReady ? (
            <PieceLayer
              pieceIds={PIECES.filter((piece) => piece.id !== dragState?.pieceId).map((piece) => piece.id)}
              placements={placements}
              piecesById={piecesById}
              dragState={dragState}
              activePieceId={activePieceId}
              liveCellsByPiece={liveCellsByPiece}
              liveOccupiedCounts={liveOccupiedCounts}
              pieceRefs={pieceRefs}
              pieceBodyRefs={pieceBodyRefs}
              gameRect={gameRect}
              boardGridRect={boardGridRect}
              trayRect={trayRect}
              trayLayout={trayLayout}
              getDefaultTrayPosition={getDefaultTrayPosition}
              onStartDrag={startDrag}
              onFocusPiece={setActivePieceId}
              onRotateRight={rotatePieceRight}
              onRotateRightAtPointer={rotatePieceRightAtPointer}
            />
          ) : null}
        </div>
        <div className="game-ghost-layer" aria-hidden="true">
          {layoutReady ? (
            <GhostOverlay
              ghostPlacement={ghostPlacement}
              gameRect={gameRect}
              boardGridRect={boardGridRect}
            />
          ) : null}
        </div>
        <div className="game-controls-layer">
          {layoutReady ? (
            <PieceControlsOverlay
              activePieceId={activePieceId}
              dragPieceId={dragState?.pieceId}
              placements={placements}
              piecesById={piecesById}
              gameRect={gameRect}
              boardGridRect={boardGridRect}
              onSendToTray={sendPieceToTray}
              onRotateRight={rotatePieceRight}
              onFlipHorizontal={flipPieceHorizontal}
              onFlipVertical={flipPieceVertical}
            />
          ) : null}
        </div>
        <div className="game-drag-layer">
          {layoutReady && dragState ? (
            <PieceLayer
              pieceIds={[dragState.pieceId]}
              placements={placements}
              piecesById={piecesById}
              dragState={dragState}
              activePieceId={activePieceId}
              liveCellsByPiece={liveCellsByPiece}
              liveOccupiedCounts={liveOccupiedCounts}
              pieceRefs={pieceRefs}
              pieceBodyRefs={pieceBodyRefs}
              gameRect={gameRect}
              boardGridRect={boardGridRect}
              trayRect={trayRect}
              trayLayout={trayLayout}
              getDefaultTrayPosition={getDefaultTrayPosition}
              onStartDrag={startDrag}
              onFocusPiece={setActivePieceId}
              onRotateRight={rotatePieceRight}
              onRotateRightAtPointer={rotatePieceRightAtPointer}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default App;
