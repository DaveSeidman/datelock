import PieceTiles from '../PieceTiles/index.jsx';
import './index.scss';

function Piece({
  piece,
  area,
  isActive,
  isDragging,
  placementStyle,
  rotatedGeometry,
  rotatedCells,
  invalidSegmentIndexes,
  setPieceRef,
  setPieceBodyRef,
  onStartDrag,
  onFocusPiece,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
}) {
  const showPieceControls = isActive && !isDragging;
  const handleControlPointerDown = (event) => {
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
      className={`piece ${piece.id} piece-${area} ${isDragging ? 'piece-dragging' : ''} ${isActive ? 'piece-active' : ''}`}
      ref={setPieceRef}
      style={placementStyle}
      onPointerDown={onStartDrag}
      onFocus={onFocusPiece}
      onDoubleClick={onRotateRight}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          onFocusPiece();
          onRotateRight();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${piece.name}. Drag to move. Double tap or double click to rotate right. Arrow left or right rotates. Arrow up or down flips vertically. Corner controls on the selected piece rotate and flip it.`}
    >
      <div
        className="piece-body"
        ref={setPieceBodyRef}
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: `calc((${rotatedGeometry.pivot[0]} + 0.5) * var(--piece-unit)) calc((${rotatedGeometry.pivot[1]} + 0.5) * var(--piece-unit))`,
        }}
      >
        <PieceTiles
          pieceId={piece.id}
          rotatedCells={rotatedCells}
          invalidSegmentIndexes={invalidSegmentIndexes}
        />
      </div>
      {showPieceControls ? (
        <div className="piece-controls">
          <button
            type="button"
            className="piece-control piece-control-rotate-left"
            aria-label="Rotate left"
            onPointerDown={handleControlPointerDown}
            onClick={(event) => handleControlClick(event, onRotateLeft)}
          >
            ↺
          </button>
          <button
            type="button"
            className="piece-control piece-control-rotate-right"
            aria-label="Rotate right"
            onPointerDown={handleControlPointerDown}
            onClick={(event) => handleControlClick(event, onRotateRight)}
          >
            ↻
          </button>
          <button
            type="button"
            className="piece-control piece-control-flip-horizontal"
            aria-label="Flip horizontally"
            onPointerDown={handleControlPointerDown}
            onClick={(event) => handleControlClick(event, onFlipHorizontal)}
          >
            ⇄
          </button>
          <button
            type="button"
            className="piece-control piece-control-flip-vertical"
            aria-label="Flip vertically"
            onPointerDown={handleControlPointerDown}
            onClick={(event) => handleControlClick(event, onFlipVertical)}
          >
            ⇅
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Piece;
