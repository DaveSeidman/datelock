import './index.scss';

function Instructions({ status, isSolved }) {
  if (isSolved) {
    return (
      <div className="status status-solved" aria-live="polite">
        <p className="status-line">{status}</p>
      </div>
    );
  }

  return (
    <div className="status" aria-live="polite">
      <p className="status-line">Cover every square except today&apos;s month, date, and weekday.</p>
      <p className="status-line">Every day of the year has at least one solution.</p>
    </div>
  );
}

export default Instructions;
