import { useEffect, useRef, useState } from 'react';
import DateDisplay from '../Date/index.jsx';
import Instructions from '../Instructions/index.jsx';
import Timer from '../Timer/index.jsx';
import './index.scss';

function Header({
  selection,
  timerStartedAt,
  isSolved,
  timerText,
  status,
  onReset,
  showAttractScreen,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const infoPanelRef = useRef(null);
  const infoButtonRef = useRef(null);

  useEffect(() => {
    if (showAttractScreen) {
      setShowInfo(false);
    }
  }, [showAttractScreen]);

  useEffect(() => {
    if (!showInfo) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        infoPanelRef.current?.contains(event.target) ||
        infoButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setShowInfo(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [showInfo]);

  return (
    <section className="controls-wrap">
      <section className="controls">
        <div className="controls-summary">
          <DateDisplay selection={selection}>
            <Timer timerStartedAt={timerStartedAt} isSolved={isSolved} timerText={timerText} />
          </DateDisplay>
        </div>
        <div className="controls-actions">
          <button className="controls-button controls-button-muted reset" type="button" onClick={onReset}>
            Reset
          </button>
          <button
            className={`controls-button controls-button-muted controls-button-info ${showInfo ? 'controls-button-info-open' : ''}`}
            type="button"
            ref={infoButtonRef}
            aria-expanded={showInfo}
            aria-controls="instructions-panel"
            aria-label={showInfo ? 'Hide instructions' : 'Show instructions'}
            onClick={() => setShowInfo((current) => !current)}
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </section>
      {showInfo ? (
        <div
          id="instructions-panel"
          ref={infoPanelRef}
          className="controls-info-panel"
          onClick={() => setShowInfo(false)}
        >
          <Instructions status={status} isSolved={isSolved} />
        </div>
      ) : null}
    </section>
  );
}

export default Header;
