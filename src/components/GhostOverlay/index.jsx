import './index.scss';

function GhostOverlay({ ghostPlacement, gameRect, boardGridRect }) {
  if (!ghostPlacement || !gameRect || !boardGridRect) {
    return null;
  }

  const cellSize = boardGridRect.width / 7;
  const offsetLeft = boardGridRect.left - gameRect.left;
  const offsetTop = boardGridRect.top - gameRect.top;

  return ghostPlacement.cells.map(([x, y], index) => (
    <span
      key={`ghost-${ghostPlacement.pieceId}-${index}`}
      className="ghost-cell"
      style={{
        left: `${offsetLeft + (ghostPlacement.placement.col + x) * cellSize}px`,
        top: `${offsetTop + (ghostPlacement.placement.row + y) * cellSize}px`,
        width: `${cellSize}px`,
        height: `${cellSize}px`,
      }}
    />
  ));
}

export default GhostOverlay;
