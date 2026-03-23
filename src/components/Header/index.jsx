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
  onAutoSolve,
  showAttractScreen,
}) {
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [infoView, setInfoView] = useState(null);
  const menuPanelRef = useRef(null);
  const detailPanelRef = useRef(null);
  const infoButtonRef = useRef(null);
  const closeInfo = () => {
    setShowInfoMenu(false);
    setInfoView(null);
  };

  useEffect(() => {
    if (showAttractScreen) {
      closeInfo();
    }
  }, [showAttractScreen]);

  useEffect(() => {
    if (!showInfoMenu && !infoView) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        menuPanelRef.current?.contains(event.target) ||
        detailPanelRef.current?.contains(event.target) ||
        infoButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      closeInfo();
    };

    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [infoView, showInfoMenu]);

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
            className={`controls-button controls-button-muted controls-button-info ${showInfoMenu ? 'controls-button-info-open' : ''}`}
            type="button"
            ref={infoButtonRef}
            aria-expanded={showInfoMenu}
            aria-controls="instructions-menu"
            aria-label={showInfoMenu ? 'Hide menu' : 'Show menu'}
            onClick={() => {
              if (showInfoMenu) {
                closeInfo();
                return;
              }

              setShowInfoMenu(true);
              setInfoView(null);
            }}
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </section>
      {showInfoMenu ? (
        <div
          id="instructions-menu"
          ref={menuPanelRef}
          className="controls-menu-panel"
        >
          <button
            type="button"
            className={`controls-menu-item ${infoView === 'instructions' ? 'controls-menu-item-active' : ''}`}
            onClick={() => setInfoView((current) => (current === 'instructions' ? null : 'instructions'))}
          >
            How to play
          </button>
          <button
            type="button"
            className={`controls-menu-item ${infoView === 'auto-solve' ? 'controls-menu-item-active' : ''}`}
            onClick={() => setInfoView('auto-solve')}
          >
            Auto solve
          </button>
        </div>
      ) : null}
      {showInfoMenu && infoView === 'instructions' ? (
        <div
          id="instructions-panel"
          ref={detailPanelRef}
          className="controls-info-panel"
          onClick={closeInfo}
        >
          <Instructions status={status} isSolved={isSolved} />
        </div>
      ) : null}
      {showInfoMenu && infoView === 'auto-solve' ? (
        <div
          ref={detailPanelRef}
          className="controls-confirm-panel"
        >
          <p className="controls-confirm-copy">Are you sure?</p>
          <div className="controls-confirm-actions">
            <button
              type="button"
              className="controls-button controls-button-confirm"
              onClick={() => {
                closeInfo();
                onAutoSolve();
              }}
            >
              Auto solve
            </button>
            <button
              type="button"
              className="controls-button controls-button-muted"
              onClick={() => setInfoView(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Header;
