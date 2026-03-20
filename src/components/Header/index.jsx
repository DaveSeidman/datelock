import DateDisplay from '../Date/index.jsx';
import Share from '../Share/index.jsx';
import Timer from '../Timer/index.jsx';
import './index.scss';

function Header({
  selection,
  timerStartedAt,
  isSolved,
  timerText,
  shareFeedback,
  onShare,
  onReset,
}) {
  return (
    <section className="controls">
      <div className="controls-summary">
        <DateDisplay selection={selection}>
          <Timer timerStartedAt={timerStartedAt} isSolved={isSolved} timerText={timerText} />
        </DateDisplay>
      </div>
      <div className="controls-actions">
        <Share isSolved={isSolved} shareFeedback={shareFeedback} onShare={onShare} />
        <button className="controls-button controls-button-muted reset" type="button" onClick={onReset}>
          Reset pieces
        </button>
      </div>
    </section>
  );
}

export default Header;
