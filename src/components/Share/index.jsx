import './index.scss';

function Share({ isSolved, shareFeedback, onShare }) {
  if (!isSolved) {
    return null;
  }

  return (
    <button className="controls-button controls-button-share" type="button" onClick={onShare}>
      {shareFeedback === 'shared' ? 'Shared' : shareFeedback === 'copied' ? 'Copied' : 'Share'}
    </button>
  );
}

export default Share;
