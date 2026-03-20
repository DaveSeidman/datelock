import './index.scss';

function BoardTiles({ boardCells, selection, occupiedMap, cellKey, isTargetCell }) {
  return boardCells.map((cell) => {
    if (!cell.label) {
      return <div key={cell.id} className="board-cell board-cell-void" aria-hidden="true" />;
    }

    const revealed = isTargetCell(cell, selection);
    const covered = occupiedMap.has(cellKey(cell.row, cell.col));

    return (
      <div
        key={cell.id}
        className={`board-cell board-cell-${cell.type} ${revealed ? 'board-cell-target' : ''} ${covered ? 'board-cell-covered' : ''}`}
      >
        {cell.label}
      </div>
    );
  });
}

export default BoardTiles;
