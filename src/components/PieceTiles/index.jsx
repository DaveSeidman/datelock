import './index.scss';

function PieceTiles({ pieceId, rotatedCells, invalidSegmentIndexes }) {
  return rotatedCells.map(([x, y], index) => (
    <span
      key={`${pieceId}-${index}`}
      className={`piece-segment ${invalidSegmentIndexes.has(index) ? 'piece-segment-error' : ''}`}
      style={{
        left: `calc(${x} * var(--piece-unit))`,
        top: `calc(${y} * var(--piece-unit))`,
        '--grain-x': `calc(${x} * -1 * var(--piece-unit))`,
        '--grain-y': `calc(${y} * -1 * var(--piece-unit))`,
      }}
    />
  ));
}

export default PieceTiles;
