import { annotateCells } from '../../lib/puzzleGeometry.js';
import './index.scss';

function PieceTiles({ pieceId, rotatedCells, invalidSegmentIndexes }) {
  const segments = annotateCells(rotatedCells);

  const getSegmentStyle = (segment, insetVariable) => ({
    '--cell-x': segment.x,
    '--cell-y': segment.y,
    '--segment-left-inset': segment.hasLeft ? '0px' : insetVariable,
    '--segment-right-inset': segment.hasRight ? '0px' : insetVariable,
    '--segment-top-inset': segment.hasTop ? '0px' : insetVariable,
    '--segment-bottom-inset': segment.hasBottom ? '0px' : insetVariable,
    '--segment-radius-top-left': !segment.hasTop && !segment.hasLeft ? 'var(--segment-corner-radius)' : '0px',
    '--segment-radius-top-right': !segment.hasTop && !segment.hasRight ? 'var(--segment-corner-radius)' : '0px',
    '--segment-radius-bottom-right': !segment.hasBottom && !segment.hasRight ? 'var(--segment-corner-radius)' : '0px',
    '--segment-radius-bottom-left': !segment.hasBottom && !segment.hasLeft ? 'var(--segment-corner-radius)' : '0px',
  });

  return (
    <span className="piece-tiles">
      {segments.map((segment) => (
        <span
          key={`${pieceId}-outline-${segment.index}`}
          className="piece-segment piece-segment-outline"
          style={getSegmentStyle(segment, 'var(--piece-outline-inset)')}
        />
      ))}
      {segments.map((segment) => (
        <span
          key={`${pieceId}-${segment.index}`}
          className={`piece-segment piece-segment-fill ${invalidSegmentIndexes.has(segment.index) ? 'piece-segment-error' : ''}`}
          style={getSegmentStyle(segment, 'var(--piece-edge-inset)')}
        />
      ))}
    </span>
  );
}

export default PieceTiles;
