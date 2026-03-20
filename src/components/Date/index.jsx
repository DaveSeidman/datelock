import './index.scss';

function DateDisplay({ selection, children }) {
  return (
    <div className="controls-field controls-field-static">
      <span>Today</span>
      <strong>
        {selection.month} {selection.day} {selection.weekday}
      </strong>
      {children}
    </div>
  );
}

export default DateDisplay;
