import BoardTiles from '../BoardTiles/index.jsx';
import './index.scss';

function Board({ boardRef, boardGridRef, boardCells, selection, occupiedMap, cellKey, isTargetCell }) {
  return (
    <div className="board-panel">
      <div className="board-frame">
        <div ref={boardRef} className="board">
          <div ref={boardGridRef} className="board-grid" aria-hidden="true">
            <BoardTiles
              boardCells={boardCells}
              selection={selection}
              occupiedMap={occupiedMap}
              cellKey={cellKey}
              isTargetCell={isTargetCell}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Board;
