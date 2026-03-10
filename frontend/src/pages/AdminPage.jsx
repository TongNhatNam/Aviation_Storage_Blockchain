import { BrowserProvider, Contract, isAddress } from "ethers";
import { useEffect, useMemo, useState } from "react";
import abi from "../contracts/AviationStorage.abi.json";
import { SectionCard } from "../components/SectionCard.jsx";
import { ItemViewer } from "../components/ItemViewer.jsx";
import { Breadcrumb } from "../components/Breadcrumb.jsx";
import { formatError } from "../utils/error.js";

export function AdminPage({ wallet, roles, contractAddress, onRoleChanged, api, addNotification }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);
  const [activeTab, setActiveTab] = useState("PERMISSIONS");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDestination, setSearchDestination] = useState("");

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
      if (typeof addNotification === 'function') {
        addNotification('Giao dịch đã được xác nhận trên blockchain', 'success');
      }
      onRoleChanged?.();
    } catch (e) {
      const errorMsg = formatError(e);
      setMessage(errorMsg);
      if (typeof addNotification === 'function') {
        addNotification(errorMsg, 'error');
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, contractAddress]);

  const filteredLocations = warehouseLocationCatalog.locations?.filter(loc => 
    loc.toLowerCase().includes(searchLocation.toLowerCase())
  ) || [];

  const filteredDestinations = destinationCatalog.destinations?.filter(dest => 
    dest.toLowerCase().includes(searchDestination.toLowerCase())
  ) || [];

  const breadcrumbItems = [
    { label: "Home", link: "/" },
    { label: "Admin", link: "/admin" },
    { label: activeTab === "PERMISSIONS" ? "Quyền Hạn" : activeTab === "CATALOG" ? "Danh Mục" : "Chính Sách" }
  ];

  return (
    <div className="avi-grid">
      <Breadcrumb items={breadcrumbItems} />

      <SectionCard
        title={
          <span className="avi-pageTitle">
            <span className="avi-pageIcon avi-pageIcon--admin" aria-hidden="true" />
            <span>Quản trị Hệ thống</span>
          </span>
        }
        subtitle="Quản lý quyền hạn, danh mục và chính sách"
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
        <>
          <div className="avi-tabs">
            <button
              onClick={() => setActiveTab("PERMISSIONS")}
              className={`avi-tab ${activeTab === "PERMISSIONS" ? "active" : ""}`}
              title="Quản lý quyền hạn">
              <span className="avi-tabIcon avi-tabIcon--admin" aria-hidden="true" />
              <span>Quyền Hạn</span>
            </button>
            <button
              onClick={() => setActiveTab("CATALOG")}
              className={`avi-tab ${activeTab === "CATALOG" ? "active" : ""}`}
              title="Quản lý danh mục">
              <span className="avi-tabIcon avi-tabIcon--register" aria-hidden="true" />
              <span>Danh Mục</span>
            </button>
            <button
              onClick={() => setActiveTab("POLICY")}
              className={`avi-tab ${activeTab === "POLICY" ? "active" : ""}`}
              title="Quản lý chính sách">
              <span className="avi-tabIcon avi-tabIcon--update" aria-hidden="true" />
              <span>Chính Sách</span>
            </button>
          </div>

          {activeTab === "PERMISSIONS" && (
            <div className="avi-columns">
              <div className="avi-col">
                <SectionCard title="🔑 Chuyển Admin" subtitle="Chuyển quyền quản trị sang địa chỉ khác">
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

                <SectionCard title="👷 Cấp quyền Warehouse" subtitle="Bật/tắt quyền thao tác kho">
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
              </div>

              <div className="avi-col">
                <SectionCard title="🔧 Cấp quyền Engineer" subtitle="Bật/tắt quyền kiểm định">
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
          )}

          {activeTab === "CATALOG" && (
            <div className="avi-columns">
              <div className="avi-col">
                <SectionCard title="📦 Danh mục vị trí kho" subtitle="Chuẩn hoá vị trí cho nghiệp vụ nhập kho">
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

                  <div style={{ marginTop: 14 }}>
                    <input
                      placeholder="🔍 Tìm kiếm vị trí..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(5, 15, 30, 0.8)',
                        border: '1px solid rgba(0, 240, 255, 0.4)',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-sans)',
                        marginBottom: '12px'
                      }}
                    />
                  </div>

                  {filteredLocations?.length ? (
                    <div style={{ display: "grid", gap: 8, maxHeight: '400px', overflowY: 'auto' }}>
                      {filteredLocations.map((loc) => {
                        const origIdx = warehouseLocationCatalog.locations.indexOf(loc);
                        const enabled = Boolean(warehouseLocationCatalog.enabled?.[origIdx]);
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
                              {enabled ? "✓ Enabled" : "✗ Disabled"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)" }}>Không tìm thấy vị trí.</div>
                  )}
                </SectionCard>
              </div>

              <div className="avi-col">
                <SectionCard title="✈️ Danh mục điểm đến" subtitle="Điểm đến nội bộ / Aircraft (để lock khi lắp đặt)">
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

                  <div style={{ marginTop: 14 }}>
                    <input
                      placeholder="🔍 Tìm kiếm điểm đến..."
                      value={searchDestination}
                      onChange={(e) => setSearchDestination(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(5, 15, 30, 0.8)',
                        border: '1px solid rgba(0, 240, 255, 0.4)',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-sans)',
                        marginBottom: '12px'
                      }}
                    />
                  </div>

                  {filteredDestinations?.length ? (
                    <div style={{ display: "grid", gap: 8, maxHeight: '400px', overflowY: 'auto' }}>
                      {filteredDestinations.map((dest) => {
                        const origIdx = destinationCatalog.destinations.indexOf(dest);
                        const enabled = Boolean(destinationCatalog.enabled?.[origIdx]);
                        const kind = Number(destinationCatalog.kinds?.[origIdx]);
                        return (
                          <div key={`${dest}-${origIdx}`} className="avi-card" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ display: "grid", gap: 4, flex: 1 }}>
                              <div className="avi-mono">{dest}</div>
                              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                                {kind === 1 ? "✈️ Aircraft" : "🏢 Internal"}
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
                              {enabled ? "✓ Enabled" : "✗ Disabled"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)" }}>Không tìm thấy điểm đến.</div>
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === "POLICY" && (
            <SectionCard title="⚙️ Chính Sách Hệ Thống" subtitle="Bật/tắt rule nghiệp vụ ở mức smart contract">
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  { key: 'requireLocationWhitelisted', label: '📍 Chỉ cho nhập kho vào vị trí đã khai báo' },
                  { key: 'requireDestinationWhitelisted', label: '✈️ Chỉ cho transfer đến điểm đến đã khai báo' },
                  { key: 'requireMetadataOnRegister', label: '📋 Bắt buộc metadataHash khi nhập kho' },
                  { key: 'requireNotesOnInspect', label: '✍️ Bắt buộc notesHash khi kiểm định' },
                  { key: 'lockOnAircraftDestination', label: '🔒 Khóa tài sản khi transfer đến Aircraft' }
                ].map(({ key, label }) => (
                  <label key={key} style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: '12px',
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.15)';
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={policies[key]}
                      onChange={(e) => setPolicies((s) => ({ ...s, [key]: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1 }}>{label}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                      {policies[key] ? '✓ ON' : '✗ OFF'}
                    </span>
                  </label>
                ))}
              </div>
              <div className="avi-inline" style={{ marginTop: 20 }}>
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
                  💾 Lưu Chính Sách
                </button>
                <button className="avi-btn" disabled={!ready || busy} onClick={() => refreshAdminConfig()}>
                  🔄 Làm mới
                </button>
              </div>
            </SectionCard>
          )}

          <div className="avi-columns">
            <div className="avi-col">
              <SectionCard title="🔍 Tra cứu & Danh sách" subtitle="Xem lịch sử cập nhật và trạng thái tài sản">
                <ItemViewer api={api} />
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
