import './index.scss';

function Timer({ timerStartedAt, isSolved, timerText }) {
  return (
    <div
      className={`controls-timer-inline ${timerStartedAt ? 'controls-timer-inline-running' : ''} ${isSolved ? 'controls-timer-inline-solved' : ''}`}
    >
      <span>Time</span>
      <strong>{timerText}</strong>
    </div>
  );
}

export default Timer;
