import { annotateCells } from '../../lib/puzzleGeometry.js';
import './index.scss';

function GhostOverlay({ ghostPlacement, gameRect, boardGridRect }) {
  if (!ghostPlacement || !gameRect || !boardGridRect) {
    return null;
  }

  const cellSize = boardGridRect.width / 7;
  const offsetLeft = boardGridRect.left - gameRect.left;
  const offsetTop = boardGridRect.top - gameRect.top;

  return annotateCells(ghostPlacement.cells).map((segment) => {
    const edgeInset = Math.max(1, cellSize * 0.08);

    return (
      <span
        key={`ghost-${ghostPlacement.pieceId}-${segment.index}`}
        className="ghost-cell"
        style={{
          left: `${offsetLeft + (ghostPlacement.placement.col + segment.x) * cellSize + (segment.hasLeft ? 0 : edgeInset)}px`,
          top: `${offsetTop + (ghostPlacement.placement.row + segment.y) * cellSize + (segment.hasTop ? 0 : edgeInset)}px`,
          width: `${cellSize - (segment.hasLeft ? 0 : edgeInset) - (segment.hasRight ? 0 : edgeInset)}px`,
          height: `${cellSize - (segment.hasTop ? 0 : edgeInset) - (segment.hasBottom ? 0 : edgeInset)}px`,
        }}
      />
    );
  });
}

export default GhostOverlay;
