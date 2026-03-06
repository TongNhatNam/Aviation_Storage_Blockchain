import { BrowserProvider, Contract, isAddress } from "ethers";
import { useEffect, useMemo, useState } from "react";
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

  const [newWarehouseLocation, setNewWarehouseLocation] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newDestinationKind, setNewDestinationKind] = useState(1);

  const [warehouseLocationCatalog, setWarehouseLocationCatalog] = useState({ locations: [], enabled: [] });
  const [destinationCatalog, setDestinationCatalog] = useState({ destinations: [], kinds: [], enabled: [] });
  const [policies, setPolicies] = useState({
    requireLocationWhitelisted: true,
    requireDestinationWhitelisted: true,
    requireMetadataOnRegister: true,
    requireNotesOnInspect: true,
    lockOnAircraftDestination: true,
  });

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

  async function refreshAdminConfig() {
    if (!ready) return;
    if (!contractAddress) return;
    try {
      const contract = await signerContractFactory();
      const wl =
        contract.getWarehouseLocationCatalog ? await contract.getWarehouseLocationCatalog() : [[], []];
      const dc =
        contract.getDestinationCatalog ? await contract.getDestinationCatalog() : [[], [], []];
      const pl = contract.getPolicies ? await contract.getPolicies() : undefined;

      setWarehouseLocationCatalog({
        locations: wl?.[0] ?? [],
        enabled: wl?.[1] ?? [],
      });
      setDestinationCatalog({
        destinations: dc?.[0] ?? [],
        kinds: dc?.[1] ?? [],
        enabled: dc?.[2] ?? [],
      });
      if (pl) {
        setPolicies({
          requireLocationWhitelisted: Boolean(pl?.[0]),
          requireDestinationWhitelisted: Boolean(pl?.[1]),
          requireMetadataOnRegister: Boolean(pl?.[2]),
          requireNotesOnInspect: Boolean(pl?.[3]),
          lockOnAircraftDestination: Boolean(pl?.[4]),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refreshAdminConfig().catch(() => null);
  }, [ready, contractAddress]);

  return (
    <div className="avi-grid">
      <SectionCard
        title={
          <span className="avi-pageTitle">
            <span className="avi-pageIcon avi-pageIcon--admin" aria-hidden="true" />
            <span>Quản trị</span>
          </span>
        }
        subtitle="Quản lý quyền và chuyển Admin"
        right={<img className="avi-pageBadge" src="/role_admin.png" alt="Admin" style={{ width: 120, height: 120 }} />}
      >
        {!ready ? <div className="avi-alert avi-alert--warn">Hãy connect MetaMask và chuyển sang Ganache 1337.</div> : null}
        {ready && !allowed ? (
          <div>
            <div className="avi-alert avi-alert--error" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 8 }}>⚠️ Không có quyền truy cập</div>
              <div>Chỉ <strong>Admin</strong> mới có thể truy cập trang này.</div>
            </div>
            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', padding: 20 }}>
              <h3 style={{ color: 'var(--color-primary)', marginTop: 0 }}>🔑 Cách lấy quyền Admin:</h3>
              <ol style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
                <li>Mở MetaMask và chuyển sang <strong>Account #0</strong> (0xf39f…) - System Admin</li>
                <li>Hoặc liên hệ Admin hiện tại để chuyển quyền (transferAdmin)</li>
              </ol>
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(255, 50, 50, 0.1)', borderRadius: 4, borderLeft: '3px solid var(--color-danger)' }}>
                <strong>⚠️ Cảnh báo:</strong> Quyền Admin có thể thay đổi toàn bộ hệ thống. Chỉ cấp cho người tin cậy!
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="avi-muted">Contract: <span className="avi-mono">{contractAddress ?? "-"}</span></div>
              <div className="avi-muted">Admin hiện tại: <span className="avi-mono">{roles?.admin ?? "-"}</span></div>
            </div>
          </div>
        ) : (
          <div>
            <div className="avi-muted" style={{ marginTop: 10 }}>
              Contract: <span className="avi-mono">{contractAddress ?? "-"}</span>
            </div>
            <div className="avi-muted">
              Admin hiện tại: <span className="avi-mono">{roles?.admin ?? "-"}</span>
            </div>
            {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
          </div>
        )}
      </SectionCard>

      {ready && allowed && (
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

          <SectionCard title="Danh mục vị trí kho" subtitle="Chuẩn hoá vị trí cho nghiệp vụ nhập kho">
            <div className="avi-formGrid">
              <input
                className="avi-span2"
                placeholder="VD: HAN-WH-A1"
                value={newWarehouseLocation}
                onChange={(e) => setNewWarehouseLocation(e.target.value)}
              />
            </div>
            <div className="avi-inline" style={{ marginTop: 10 }}>
              <button
                className="avi-btn avi-btn--primary"
                disabled={!ready || !allowed || busy || !newWarehouseLocation.trim()}
                onClick={() =>
                  run(async () => {
                    const contract = await signerContractFactory();
                    const tx = await contract.setWarehouseLocation(newWarehouseLocation.trim(), true);
                    await tx.wait();
                    setNewWarehouseLocation("");
                    await refreshAdminConfig();
                  })
                }
              >
                Thêm vị trí
              </button>
              <button className="avi-btn" disabled={!ready || busy} onClick={() => refreshAdminConfig()}>
                Làm mới
              </button>
            </div>

            {warehouseLocationCatalog.locations?.length ? (
              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                {warehouseLocationCatalog.locations.map((loc, idx) => {
                  const enabled = Boolean(warehouseLocationCatalog.enabled?.[idx]);
                  return (
                    <div key={loc} className="avi-card" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div className="avi-mono">{loc}</div>
                      <button
                        className="avi-btn"
                        disabled={!ready || !allowed || busy}
                        onClick={() =>
                          run(async () => {
                            const contract = await signerContractFactory();
                            const tx = await contract.setWarehouseLocation(loc, !enabled);
                            await tx.wait();
                            await refreshAdminConfig();
                          })
                        }
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)" }}>Chưa có danh mục vị trí.</div>
            )}
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

          <SectionCard title="Danh mục điểm đến" subtitle="Điểm đến nội bộ / Aircraft (để lock khi lắp đặt)">
            <div className="avi-formGrid">
              <input
                className="avi-span2"
                placeholder="VD: Aircraft VN-A899 (A350) hoặc Hangar 1 - HAN"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
              />
              <select value={String(newDestinationKind)} onChange={(e) => setNewDestinationKind(Number(e.target.value))}>
                <option value="1">Aircraft (Lock)</option>
                <option value="0">Internal</option>
              </select>
            </div>
            <div className="avi-inline" style={{ marginTop: 10 }}>
              <button
                className="avi-btn avi-btn--primary"
                disabled={!ready || !allowed || busy || !newDestination.trim()}
                onClick={() =>
                  run(async () => {
                    const contract = await signerContractFactory();
                    const tx = await contract.setDestination(newDestination.trim(), newDestinationKind, true);
                    await tx.wait();
                    setNewDestination("");
                    await refreshAdminConfig();
                  })
                }
              >
                Thêm điểm đến
              </button>
              <button className="avi-btn" disabled={!ready || busy} onClick={() => refreshAdminConfig()}>
                Làm mới
              </button>
            </div>

            {destinationCatalog.destinations?.length ? (
              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                {destinationCatalog.destinations.map((dest, idx) => {
                  const enabled = Boolean(destinationCatalog.enabled?.[idx]);
                  const kind = Number(destinationCatalog.kinds?.[idx]);
                  return (
                    <div key={`${dest}-${idx}`} className="avi-card" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div className="avi-mono">{dest}</div>
                        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                          {kind === 1 ? "Aircraft" : "Internal"}
                        </div>
                      </div>
                      <button
                        className="avi-btn"
                        disabled={!ready || !allowed || busy}
                        onClick={() =>
                          run(async () => {
                            const contract = await signerContractFactory();
                            const tx = await contract.setDestination(dest, kind, !enabled);
                            await tx.wait();
                            await refreshAdminConfig();
                          })
                        }
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)" }}>Chưa có danh mục điểm đến.</div>
            )}
          </SectionCard>

          <SectionCard title="Policy" subtitle="Bật/tắt rule nghiệp vụ ở mức smart contract">
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={policies.requireLocationWhitelisted}
                  onChange={(e) => setPolicies((s) => ({ ...s, requireLocationWhitelisted: e.target.checked }))}
                />
                <span>Chỉ cho nhập kho vào vị trí đã khai báo</span>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={policies.requireDestinationWhitelisted}
                  onChange={(e) => setPolicies((s) => ({ ...s, requireDestinationWhitelisted: e.target.checked }))}
                />
                <span>Chỉ cho transfer đến điểm đến đã khai báo</span>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={policies.requireMetadataOnRegister}
                  onChange={(e) => setPolicies((s) => ({ ...s, requireMetadataOnRegister: e.target.checked }))}
                />
                <span>Bắt buộc metadataHash khi nhập kho</span>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={policies.requireNotesOnInspect}
                  onChange={(e) => setPolicies((s) => ({ ...s, requireNotesOnInspect: e.target.checked }))}
                />
                <span>Bắt buộc notesHash khi kiểm định</span>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={policies.lockOnAircraftDestination}
                  onChange={(e) => setPolicies((s) => ({ ...s, lockOnAircraftDestination: e.target.checked }))}
                />
                <span>Khóa tài sản khi transfer đến Aircraft</span>
              </label>
            </div>
            <div className="avi-inline" style={{ marginTop: 12 }}>
              <button
                className="avi-btn avi-btn--primary"
                disabled={!ready || !allowed || busy}
                onClick={() =>
                  run(async () => {
                    const contract = await signerContractFactory();
                    const tx = await contract.setPolicies(
                      policies.requireLocationWhitelisted,
                      policies.requireDestinationWhitelisted,
                      policies.requireMetadataOnRegister,
                      policies.requireNotesOnInspect,
                      policies.lockOnAircraftDestination
                    );
                    await tx.wait();
                    await refreshAdminConfig();
                  })
                }
              >
                Lưu policy
              </button>
              <button className="avi-btn" disabled={!ready || busy} onClick={() => refreshAdminConfig()}>
                Làm mới
              </button>
            </div>
          </SectionCard>
        </div>
        </div>
      )}
    </div>
  );
}
