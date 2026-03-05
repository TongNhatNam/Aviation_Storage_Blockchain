import { HashLink } from "../router/hashRouter.jsx";

function shortAddress(value) {
  if (!value) return "-";
  const s = String(value);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function AviationShell({ wallet, roles, library, onLibraryChange, children }) {
  const roleLabels = [];
  if (roles?.isAdmin) roleLabels.push({ label: "Admin", tone: "info" });
  if (roles?.isWarehouse) roleLabels.push({ label: "Warehouse", tone: "ok" });
  if (roles?.isEngineer) roleLabels.push({ label: "Engineer", tone: "warn" });
  if (!roleLabels.length && wallet?.account) roleLabels.push({ label: "No role", tone: "muted" });
  const isConnected = Boolean(wallet?.account);
  const isGanache = wallet?.chainId === 1337;
  const ganacheRpcUrl = wallet?.ganache?.rpcUrl;

  return (
    <div className="avi-app avi-layout">
      <aside className="avi-sidebar">
        <div className="avi-brand">
          <div className="avi-title">Aviation Console</div>
          <div className="avi-subtitle">Kho vật tư & kiểm định</div>
        </div>

        <nav className="avi-nav">
          <HashLink className="avi-navLink" to="/">
            <span className="avi-navIcon avi-navIcon--home" aria-hidden="true" />
            <span>Tổng quan</span>
          </HashLink>
          <HashLink className="avi-navLink" to="/warehouse">
            <span className="avi-navIcon avi-navIcon--warehouse" aria-hidden="true" />
            <span>Kho hàng</span>
          </HashLink>
          <HashLink className="avi-navLink" to="/engineer">
            <span className="avi-navIcon avi-navIcon--engineer" aria-hidden="true" />
            <span>Kỹ sư</span>
          </HashLink>
          <HashLink className="avi-navLink" to="/admin">
            <span className="avi-navIcon avi-navIcon--admin" aria-hidden="true" />
            <span>Quản trị Radar</span>
          </HashLink>
        </nav>

        <div className="avi-wallet">
          <div className="avi-meta">
            <div className="avi-metaRow">
              <span className="avi-metaKey">Account</span>
              <span className="avi-metaVal">{shortAddress(wallet?.account)}</span>
            </div>
            <div className="avi-metaRow">
              <span className="avi-metaKey">Chain ID</span>
              <span className="avi-metaVal">{wallet?.chainId ?? "-"}</span>
            </div>
          </div>

          <div className="avi-badges">
            {roleLabels.map((r) => (
              <span key={r.label} className={`avi-badge avi-badge--${r.tone}`}>
                {r.label}
              </span>
            ))}
          </div>

          <div className="avi-actions">
            <select className="avi-select" value={library} onChange={(e) => onLibraryChange(e.target.value)}>
              <option value="ethers">Library: Ethers</option>
              <option value="web3">Library: Web3</option>
            </select>
            <button className="avi-btn" onClick={wallet?.connect} disabled={!wallet?.isAvailable}>
              Connect Wallet
            </button>
            <button className="avi-btn avi-btn--primary" onClick={wallet?.connectAndSwitchGanache} disabled={!wallet?.isAvailable}>
              Switch to Ganache
            </button>
          </div>
        </div>
      </aside>

      <div className="avi-main-wrapper">
        <main className="avi-main">
          {!wallet?.isAvailable ? (
            <div className="avi-alert avi-alert--warn" style={{ marginBottom: 20 }}>
              Chưa phát hiện MetaMask (window.ethereum). Hãy cài MetaMask và mở lại trang bằng Chrome/Edge.
            </div>
          ) : null}
          {isConnected && !isGanache ? (
            <div className="avi-alert avi-alert--warn" style={{ marginBottom: 20 }}>
              Bạn đang ở network khác. Demo này cần Ganache chainId 1337 (RPC {ganacheRpcUrl}).
            </div>
          ) : null}
          {wallet?.error ? <div className="avi-alert avi-alert--error" style={{ marginBottom: 20 }}>{wallet.error}</div> : null}
          {roles?.error ? <div className="avi-alert avi-alert--error" style={{ marginBottom: 20 }}>{roles.error}</div> : null}

          {children}
        </main>
      </div>

      <footer className="avi-statusbar">
        <div className="avi-statusbar-item ok">SYSTEM: ONLINE</div>
        <div className={`avi-statusbar-item ${isConnected ? "ok" : "warn"}`}>
          LINK: {isConnected ? "ESTABLISHED" : "DISCONNECTED"}
        </div>
        <div className={`avi-statusbar-item ${isGanache ? "ok" : "error"}`}>
          NODE: {wallet?.chainId ?? "N/A"}
        </div>
      </footer>
    </div>
  );
}
