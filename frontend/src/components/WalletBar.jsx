export function WalletBar({ wallet }) {
  const isGanache = wallet.chainId === wallet.ganache?.chainIdDec;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <strong>MetaMask</strong>: {wallet.isAvailable ? "OK" : "Chưa có"}
        </div>
        <div>
          <strong>Account</strong>: {wallet.account ?? "-"}
        </div>
        <div>
          <strong>ChainId</strong>: {wallet.chainId ?? "-"}
        </div>

        <button onClick={wallet.connect} disabled={!wallet.isAvailable}>
          Connect
        </button>

        <button onClick={wallet.connectAndSwitchGanache} disabled={!wallet.isAvailable}>
          Connect + Ganache (1337)
        </button>

        <button onClick={wallet.addOrSwitchGanache} disabled={!wallet.isAvailable || !wallet.isConnected}>
          Chuyển network Ganache
        </button>
      </div>

      {!wallet.isAvailable ? (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ color: "crimson" }}>Bạn chưa cài MetaMask nên không thể ký giao dịch.</div>
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
            Cài MetaMask
          </a>
        </div>
      ) : null}

      {wallet.isAvailable && wallet.isConnected && !isGanache ? (
        <div style={{ color: "crimson" }}>
          Đang ở network khác. Demo này cần Ganache: RPC {wallet.ganache?.rpcUrl}, chainId {wallet.ganache?.chainIdDec}.
        </div>
      ) : null}

      {wallet.error ? <div style={{ color: "crimson" }}>{wallet.error}</div> : null}
    </div>
  );
}

