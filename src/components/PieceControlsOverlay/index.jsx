import { clamp, getPieceBounds, getTransformedGeometry } from '../../lib/puzzleGeometry.js';

function PieceControlsOverlay({
  activePieceId,
  dragPieceId,
  placements,
  piecesById,
  gameRect,
  boardGridRect,
  onSendToTray,
  onRotateRight,
  onFlipVertical,
}) {
  if (!activePieceId || dragPieceId === activePieceId) {
    return null;
  }

  const placement = placements[activePieceId];

  if (!placement || placement.col === null || !gameRect || !boardGridRect) {
    return null;
  }

  const piece = piecesById[activePieceId];
  const rotatedGeometry = getTransformedGeometry(
    piece.cells,
    piece.pivot,
    placement.rotation,
    placement.mirrored,
  );
  const bounds = getPieceBounds(rotatedGeometry.cells);
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  const pieceUnit = boardGridRect.width / 7;
  const left = boardGridRect.left - gameRect.left + placement.col * pieceUnit;
  const top = boardGridRect.top - gameRect.top + placement.row * pieceUnit;
  const pieceWidth = width * pieceUnit;
  const pieceHeight = height * pieceUnit;
  const boardLeft = boardGridRect.left - gameRect.left;
  const boardTop = boardGridRect.top - gameRect.top;
  const boardRight = boardLeft + boardGridRect.width;
  const boardBottom = boardTop + boardGridRect.height;
  const controlSize = clamp(pieceUnit * 0.88, 24, 34);
  const controlOffset = controlSize * 0.42;
  const controlMargin = Math.max(4, pieceUnit * 0.08);

  const getControlStyle = (desiredLeft, desiredTop) => ({
    left: `${clamp(desiredLeft, boardLeft + controlMargin, boardRight - controlSize - controlMargin)}px`,
    top: `${clamp(desiredTop, boardTop + controlMargin, boardBottom - controlSize - controlMargin)}px`,
    width: `${controlSize}px`,
    height: `${controlSize}px`,
  });

  const handleControlPointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleControlDoubleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleControlClick = (event, action) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  return (
    <div
      className="piece-controls piece-controls-overlay"
      style={{
        '--piece-unit': `${pieceUnit}px`,
        '--piece-control-size': `${controlSize}px`,
      }}
    >
      <button
        type="button"
        className="piece-control piece-control-return"
        aria-label="Return piece to tray"
        style={getControlStyle(left - controlOffset, top - controlOffset)}
        onPointerDown={handleControlPointerDown}
        onDoubleClick={handleControlDoubleClick}
        onClick={(event) => handleControlClick(event, () => onSendToTray(piece.id))}
      >
        ×
      </button>
      <button
        type="button"
        className="piece-control piece-control-rotate-right"
        aria-label="Rotate right"
        style={getControlStyle(left + pieceWidth - controlSize + controlOffset, top - controlOffset)}
        onPointerDown={handleControlPointerDown}
        onDoubleClick={handleControlDoubleClick}
        onClick={(event) => handleControlClick(event, () => onRotateRight(piece.id))}
      >
        ↻
      </button>
      {piece.canFlip !== false ? (
        <button
          type="button"
          className="piece-control piece-control-flip-vertical"
          aria-label="Flip vertically"
          style={getControlStyle(
            left + pieceWidth - controlSize + controlOffset,
            top + pieceHeight - controlSize + controlOffset,
          )}
          onPointerDown={handleControlPointerDown}
          onDoubleClick={handleControlDoubleClick}
          onClick={(event) => handleControlClick(event, () => onFlipVertical(piece.id))}
        >
          ⇅
        </button>
      ) : null}
    </div>
  );
}

export default PieceControlsOverlay;
