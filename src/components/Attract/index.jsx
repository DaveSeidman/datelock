import { useEffect, useMemo, useState } from 'react';
import Confetti from 'react-confetti';
import { PIECES } from '../../data/puzzle.js';
import './index.scss';

const ATTRACT_PIECE_IDS = ['piece-a', 'piece-b', 'piece-e', 'piece-g', 'piece-h'];
const ATTRACT_ZONES = [
  { x: 16, y: 14, rotation: -24 },
  { x: 48, y: 8, rotation: 12 },
  { x: 83, y: 16, rotation: 22 },
  { x: 92, y: 48, rotation: 88 },
  { x: 80, y: 82, rotation: 18 },
  { x: 48, y: 92, rotation: -9 },
  { x: 16, y: 80, rotation: -18 },
  { x: 7, y: 46, rotation: -84 },
];

const shuffle = (items) => {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
};

const randomBetween = (min, max) => min + Math.random() * (max - min);

const getPieceSize = (piece) => {
  const xs = piece.cells.map(([x]) => x);
  const ys = piece.cells.map(([, y]) => y);

  return {
    width: Math.max(...xs) + 1,
    height: Math.max(...ys) + 1,
  };
};

const createDecorativeLayout = (pieces) => {
  const shuffledZones = shuffle(ATTRACT_ZONES);

  return pieces.map((piece, index) => {
    const zone = shuffledZones[index % shuffledZones.length];

    return {
      id: piece.id,
      x: zone.x + randomBetween(-3.5, 3.5),
      y: zone.y + randomBetween(-3, 3),
      rotation: zone.rotation + randomBetween(-12, 12),
      flipX: Math.random() > 0.5 ? -1 : 1,
      flipY: Math.random() > 0.76 ? -1 : 1,
      scale: randomBetween(0.94, 1.05),
    };
  });
};

function Attract({
  showConfetti,
  confettiBurstKey,
  viewportSize,
  colors,
  showAttractScreen,
  attractMode,
  selection,
  timerText,
  onStart,
  onClose,
  canShareSolvedTime,
  onShare,
}) {
  const isResumeMode = attractMode === 'resume';
  const isSolvedMode = attractMode === 'solved';
  const decorativePieces = useMemo(
    () => ATTRACT_PIECE_IDS.map((pieceId) => PIECES.find((piece) => piece.id === pieceId)).filter(Boolean),
    [],
  );
  const [decorativeLayout, setDecorativeLayout] = useState(() => createDecorativeLayout(decorativePieces));

  useEffect(() => {
    if (!showAttractScreen) {
      return undefined;
    }

    setDecorativeLayout(createDecorativeLayout(decorativePieces));

    const intervalId = window.setInterval(() => {
      setDecorativeLayout(createDecorativeLayout(decorativePieces));
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [decorativePieces, showAttractScreen]);

  return (
    <>
      <Confetti
        key={confettiBurstKey}
        className={`attract-confetti ${showConfetti ? 'attract-confetti-visible' : 'attract-confetti-hidden'}`}
        width={viewportSize.width}
        height={viewportSize.height}
        run={showConfetti}
        recycle={showConfetti}
        numberOfPieces={520}
        tweenDuration={1400}
        gravity={0.24}
        initialVelocityY={20}
        initialVelocityX={9}
        colors={colors}
        confettiSource={{
          x: viewportSize.width * 0.5,
          y: 0,
          w: 0,
          h: 0,
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          pointerEvents: 'none',
        }}
      />

      <section
        className={`attract ${showAttractScreen ? 'attract-visible' : 'attract-hidden'}`}
        aria-hidden={!showAttractScreen}
      >
        <div className="attract-panel">
          <button
            type="button"
            className="attract-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
          <p className="attract-kicker">
            {isSolvedMode ? 'Puzzle Solved' : isResumeMode ? 'Game Paused' : 'Daily Logic Puzzle'}
          </p>
          <h1 className="attract-title">DateLock</h1>
          <p className="attract-copy">
            {isSolvedMode
              ? `You solved today's puzzle in ${timerText}!`
              : isResumeMode
                ? 'Your puzzle is paused where you left it. Jump back in when you are ready.'
                : 'Place all ten peices on the board without covering today\'s date!'}
          </p>

          <div className="attract-graphic" aria-hidden="true">
            {decorativePieces.map((piece, index) => {
              const layout = decorativeLayout[index];
              const pieceSize = getPieceSize(piece);

              if (!layout) {
                return null;
              }

              return (
                <div
                  key={piece.id}
                  className="attract-piece"
                  style={{
                    left: `${layout.x}%`,
                    top: `${layout.y}%`,
                    width: `calc(${pieceSize.width} * var(--attract-piece-unit))`,
                    height: `calc(${pieceSize.height} * var(--attract-piece-unit))`,
                    transform: `translate(-50%, -50%) rotate(${layout.rotation}deg) scale(${layout.scale}) scaleX(${layout.flipX}) scaleY(${layout.flipY})`,
                  }}
                >
                  <div className="attract-piece-body">
                    {piece.cells.map(([x, y], cellIndex) => (
                      <span
                        key={`${piece.id}-${cellIndex}`}
                        className="attract-piece-cell"
                        style={{
                          left: `calc(${x} * var(--attract-piece-unit))`,
                          top: `calc(${y} * var(--attract-piece-unit))`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="attract-board-preview">
              <div className="attract-board-preview-frame">
                <div className="attract-board-preview-grid">
                  <span>{selection.month}</span>
                  <span>{selection.day}</span>
                  <span>{selection.weekday}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="attract-actions">
            <button type="button" className="attract-button attract-button-primary" onClick={onStart}>
              {isSolvedMode ? 'Play Again' : isResumeMode ? 'Continue Game' : 'Play Today\'s Puzzle'}
            </button>
            <button type="button" className="attract-button attract-button-secondary" onClick={onShare}>
              {isSolvedMode && canShareSolvedTime ? 'Share Your Time' : 'Share with a Friend'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Attract;
