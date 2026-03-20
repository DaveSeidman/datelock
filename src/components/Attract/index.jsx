import Confetti from 'react-confetti';
import './index.scss';

function Attract({
  showConfetti,
  confettiBurstKey,
  viewportSize,
  colors,
  showAttractScreen,
  selection,
  onStart,
  onShare,
}) {
  return (
    <>
      {showConfetti ? (
        <Confetti
          key={confettiBurstKey}
          width={viewportSize.width}
          height={viewportSize.height}
          recycle={false}
          numberOfPieces={260}
          tweenDuration={7800}
          gravity={0.18}
          initialVelocityY={18}
          initialVelocityX={8}
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
      ) : null}

      {showAttractScreen ? (
        <section className="attract">
          <div className="attract-panel">
            <p className="attract-kicker">Daily Wooden Logic Puzzle</p>
            <h1 className="attract-title">Caesar&apos;s Calendar</h1>
            <p className="attract-copy">Leave today visible. Cover every other tile with the ten pieces.</p>

            <div className="attract-graphic" aria-hidden="true">
              <div className="attract-piece attract-piece-one" />
              <div className="attract-board-preview">
                <div className="attract-board-preview-frame">
                  <div className="attract-board-preview-grid">
                    <span>{selection.month}</span>
                    <span>{selection.day}</span>
                    <span>{selection.weekday}</span>
                  </div>
                </div>
              </div>
              <div className="attract-piece attract-piece-two" />
              <div className="attract-piece attract-piece-three" />
            </div>

            <div className="attract-actions">
              <button type="button" className="attract-button attract-button-primary" onClick={onStart}>
                Play today&apos;s Puzzle
              </button>
              <button type="button" className="attract-button attract-button-secondary" onClick={onShare}>
                Share with a friend
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default Attract;
