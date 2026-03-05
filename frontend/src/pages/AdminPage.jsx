import { BrowserProvider, Contract, isAddress } from "ethers";
import { useMemo, useState } from "react";
import abi from "../contracts/AviationStorage.abi.json";
import { SectionCard } from "../components/SectionCard.jsx";
import { formatError } from "../utils/error.js";

export function AdminPage({ wallet, roles, contractAddress, onRoleChanged }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);

  const [transferAdminTo, setTransferAdminTo] = useState("");
  const [warehouseAccount, setWarehouseAccount] = useState("");
  const [warehouseEnabled, setWarehouseEnabled] = useState(true);
  const [engineerAccount, setEngineerAccount] = useState("");
  const [engineerEnabled, setEngineerEnabled] = useState(true);

  const ready = Boolean(wallet?.account) && wallet?.chainId === 1337;
  const allowed = Boolean(roles?.isAdmin);

  const signerContractFactory = useMemo(() => {
    return async () => {
      if (!window.ethereum) throw new Error("Chưa có MetaMask.");
      if (!contractAddress) throw new Error("Chưa có address contract.");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new Contract(contractAddress, abi, signer);
    };
  }, [contractAddress]);

  async function run(action) {
    setMessage(undefined);
    setBusy(true);
    try {
      await action();
      setMessage("OK");
      onRoleChanged?.();
    } catch (e) {
      setMessage(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avi-grid">
      <SectionCard title="Quản trị" subtitle="Quản lý quyền và chuyển Admin">
        {!ready ? <div className="avi-alert avi-alert--warn">Hãy connect MetaMask và chuyển sang Ganache 1337.</div> : null}
        {ready && !allowed ? <div className="avi-alert avi-alert--error">Chỉ Admin mới thao tác được. Hãy chuyển sang Admin (0xf39f…).</div> : null}
        <div className="avi-muted" style={{ marginTop: 10 }}>
          Contract: <span className="avi-mono">{contractAddress ?? "-"}</span>
        </div>
        <div className="avi-muted">
          Admin hiện tại: <span className="avi-mono">{roles?.admin ?? "-"}</span>
        </div>
        {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
      </SectionCard>

      <div className="avi-columns">
        <div className="avi-col">
          <SectionCard title="Chuyển Admin" subtitle="Chuyển quyền quản trị sang địa chỉ khác">
            <div className="avi-formGrid">
              <input className="avi-span2" placeholder="Địa chỉ admin mới (0x...)" value={transferAdminTo} onChange={(e) => setTransferAdminTo(e.target.value)} />
            </div>
            <div className="avi-inline" style={{ marginTop: 10 }}>
              <button
                className="avi-btn avi-btn--primary"
                disabled={!ready || !allowed || busy || !isAddress(transferAdminTo)}
                onClick={() =>
                  run(async () => {
                    const contract = await signerContractFactory();
                    const tx = await contract.transferAdmin(transferAdminTo);
                    await tx.wait();
                  })
                }
              >
                Chuyển
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="avi-col">
          <SectionCard title="Cấp quyền Warehouse" subtitle="Bật/tắt quyền thao tác kho">
            <div className="avi-formGrid">
              <input placeholder="Địa chỉ (0x...)" value={warehouseAccount} onChange={(e) => setWarehouseAccount(e.target.value)} />
              <select value={warehouseEnabled ? "on" : "off"} onChange={(e) => setWarehouseEnabled(e.target.value === "on")}>
                <option value="on">Enabled</option>
                <option value="off">Disabled</option>
              </select>
            </div>
            <div className="avi-inline" style={{ marginTop: 10 }}>
              <button
                className="avi-btn avi-btn--primary"
                disabled={!ready || !allowed || busy || !isAddress(warehouseAccount)}
                onClick={() =>
                  run(async () => {
                    const contract = await signerContractFactory();
                    const tx = await contract.setWarehouseStaff(warehouseAccount, warehouseEnabled);
                    await tx.wait();
                  })
                }
              >
                Cập nhật
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Cấp quyền Engineer" subtitle="Bật/tắt quyền kiểm định">
            <div className="avi-formGrid">
              <input placeholder="Địa chỉ (0x...)" value={engineerAccount} onChange={(e) => setEngineerAccount(e.target.value)} />
              <select value={engineerEnabled ? "on" : "off"} onChange={(e) => setEngineerEnabled(e.target.value === "on")}>
                <option value="on">Enabled</option>
                <option value="off">Disabled</option>
              </select>
            </div>
            <div className="avi-inline" style={{ marginTop: 10 }}>
              <button
                className="avi-btn avi-btn--primary"
                disabled={!ready || !allowed || busy || !isAddress(engineerAccount)}
                onClick={() =>
                  run(async () => {
                    const contract = await signerContractFactory();
                    const tx = await contract.setEngineer(engineerAccount, engineerEnabled);
                    await tx.wait();
                  })
                }
              >
                Cập nhật
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
