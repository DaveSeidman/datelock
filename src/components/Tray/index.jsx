import './index.scss';

function Tray({ trayRef }) {
  return (
    <aside className="tray">
      <div ref={trayRef} className="tray-grid" />
    </aside>
  );
}

export default Tray;
