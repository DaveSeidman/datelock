import './index.scss';

function Instructions({ status, isSolved }) {
  return (
    <p className={`status status-floating ${isSolved ? 'status-solved' : ''}`} aria-live="polite">
      {status}
    </p>
  );
}

export default Instructions;
