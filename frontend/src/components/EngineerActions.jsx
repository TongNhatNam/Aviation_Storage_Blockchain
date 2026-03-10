import { useMemo, useState, useEffect } from "react";
import { SectionCard } from "./SectionCard.jsx";
import { TransactionInfo } from "./TransactionInfo.jsx";
import { formatError } from "../utils/error.js";
import { isItemLocked } from "../utils/itemState.js";
import QRScannerModal from "./QRScannerModal.jsx";

const FALLBACK_WAREHOUSE_LOCATIONS = [
  "HAN-WH-A1",
  "HAN-WH-A2",
  "HAN-WH-B1",
  "SGN-WH-B3",
  "SGN-WH-C2",
  "DAD-WH-LM1",
];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  return fallback;
}

function formatInspectionStatus(value) {
  const n = Number(value);
  if (n === 1) return "Serviceable";
  if (n === 2) return "Unserviceable (AOG)";
  return "Unknown (Mới nhập/Pending)";
}

export function EngineerActions({ api, disabled, onActionDone, addNotification }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);
  const [txReceipt, setTxReceipt] = useState(undefined);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState(null); // 'INSPECT' | 'DEMOUNT'


  const [activeTab, setActiveTab] = useState("INSPECT"); // INSPECT, DEMOUNT

  const [inspectForm, setInspectForm] = useState({
    code: "",
    status: 1,
    notesHash: "",
  });

  // Tự động tạo notesHash khi thay đổi code hoặc status
  useEffect(() => {
    if (inspectForm.code && inspectForm.status) {
      const statusText = inspectForm.status === 1 ? 'PASS' : 'FAIL';
      const timestamp = Date.now().toString(36);
      setInspectForm(prev => ({
        ...prev,
        notesHash: `ipfs://QmINSPECT-${statusText}-${prev.code}-${timestamp}`
      }));
    }
  }, [inspectForm.code, inspectForm.status]);

  const [pendingItems, setPendingItems] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const canUseApi = useMemo(() => Boolean(api?.isDeployedOnThisChain) && !disabled, [api, disabled]);

  async function fetchPendingItems() {
    if (!canUseApi) return;
    setLoadingPending(true);
    try {
      const data = await api.listItems({ limit: 100 });
      // Chỉ lấy những item chưa kiểm định (0) hoặc hỏng hóc (2)
      const pending = data.items.filter(({ item }) => {
        const status = Number(item.lastInspectionStatus);
        // Không lấy Scrapped (3)
        return (status === 0 || status === 2) && status !== 3 && !isItemLocked(item);
      });
      setPendingItems(pending);
    } catch (e) {
      console.error("Failed to load pending items:", e);
    } finally {
      setLoadingPending(false);
    }
  }

  const [lockedItems, setLockedItems] = useState([]);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [locations, setLocations] = useState([]);

  const [demountForm, setDemountForm] = useState({
    code: "",
    newLocation: ""
  });

  async function fetchLockedItemsAndLocations() {
    if (!canUseApi) return;
    setLoadingLocked(true);
    try {
      const data = await api.listItems({ limit: 100 });
      // Lấy danh sách item đã locked (trên máy bay) và chưa bị tiêu huỷ
      const locked = data.items.filter(({ item }) => {
        const status = Number(item.lastInspectionStatus);
        return isItemLocked(item) && status !== 3; // 3 = Scrapped
      });
      setLockedItems(locked);

      if (api.listWarehouseLocations) {
        const { locations } = await api.listWarehouseLocations();
        const finalLocs = locations?.length > 0 ? locations : FALLBACK_WAREHOUSE_LOCATIONS;
        setLocations(finalLocs);
        if (finalLocs.length > 0 && !demountForm.newLocation) {
          setDemountForm(s => ({ ...s, newLocation: finalLocs[0] }));
        }
      } else {
        setLocations(FALLBACK_WAREHOUSE_LOCATIONS);
        if (!demountForm.newLocation) {
          setDemountForm(s => ({ ...s, newLocation: FALLBACK_WAREHOUSE_LOCATIONS[0] }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLocked(false);
    }
  }

  // Tự động fetch khi component load hoặc khi canUseApi hoặc activeTab thay đổi
  useEffect(() => {
    if (activeTab === "INSPECT") {
      fetchPendingItems();
    } else if (activeTab === "DEMOUNT") {
      fetchLockedItemsAndLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseApi, activeTab]);

  async function run(action) {
    setMessage(undefined);
    setTxReceipt(undefined);
    setBusy(true);
    try {
      const receipt = await action();
      setMessage("OK");
      setTxReceipt(receipt);
      onActionDone?.();
      if (typeof addNotification === 'function') {
        addNotification('Giao dịch đã được xác nhận trên blockchain', 'success');
      }
      await fetchPendingItems();
      await fetchLockedItemsAndLocations();
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

  const handleScanSuccess = (code) => {
    if (scanTarget === "INSPECT") {
      setInspectForm(s => ({ ...s, code }));
    } else if (scanTarget === "DEMOUNT") {
      setDemountForm(s => ({ ...s, code }));
    }
  };

  const openScanner = (target) => {
    setScanTarget(target);
    setScannerOpen(true);
  };

  return (
    <div className="avi-grid">
      <QRScannerModal 
        isOpen={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      <div className="avi-tabs">
        <button
          onClick={() => setActiveTab("INSPECT")}
          className={`avi-tab ${activeTab === "INSPECT" ? "active" : ""}`}
          title="Kiểm định kỹ thuật và danh sách chờ">
          <span className="avi-tabIcon avi-tabIcon--register" aria-hidden="true" />
          <span>Kiểm định Kỹ thuật</span>
        </button>
        <button
          onClick={() => setActiveTab("DEMOUNT")}
          className={`avi-tab ${activeTab === "DEMOUNT" ? "active" : ""}`}
          title="Tháo dỡ thiết bị từ máy bay">
          <span className="avi-tabIcon avi-tabIcon--transfer" aria-hidden="true" />
          <span>Tháo dỡ (Demount)</span>
        </button>
      </div>

      {activeTab === "INSPECT" && (
        <>
          <SectionCard title="Kiểm định Kỹ thuật" subtitle="Quét mã QR hoặc chọn từ danh sách để kiểm định và cấp biên bản">
            <div className="avi-formGrid">
          <div style={{ display: 'flex', gap: '8px', gridColumn: 'span 2' }}>
            <input
              placeholder="Mã (code)"
              value={inspectForm.code}
              onChange={(e) => setInspectForm((s) => ({ ...s, code: e.target.value }))}
              style={{
                flex: 1,
                background: 'rgba(5, 15, 30, 0.8)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
                fontFamily: 'Space Mono, monospace'
              }}
            />
            <button 
              className="avi-btn" 
              onClick={() => openScanner('INSPECT')}
              title="Quét mã bằng Camera"
              style={{ padding: '0 16px', fontSize: '1.2rem' }}
            >
              📷
            </button>
          </div>
          <select
            value={inspectForm.status}
            onChange={(e) => {
              const newStatus = toNumber(e.target.value, 1);
              const statusText = newStatus === 1 ? 'PASS' : 'FAIL';
              const timestamp = Date.now().toString(36);
              setInspectForm((s) => ({
                ...s,
                status: newStatus,
                notesHash: s.code ? `ipfs://QmINSPECT-${statusText}-${s.code}-${timestamp}` : s.notesHash
              }));
            }}
            style={{
              background: 'rgba(5, 15, 30, 0.8)',
              border: inspectForm.status === 2 ? '1px solid rgba(255, 51, 102, 0.5)' : '1px solid rgba(0, 255, 136, 0.5)',
              color: inspectForm.status === 2 ? '#ff3366' : '#00ff88',
              padding: '10px',
              fontFamily: 'Space Mono, monospace',
              fontWeight: 'bold',
              outline: 'none',
              boxShadow: inspectForm.status === 2 ? '0 0 10px rgba(255, 51, 102, 0.2)' : '0 0 10px rgba(0, 255, 136, 0.2)'
            }}
          >
            <option value={1} style={{ background: '#050f1e', color: '#00ff88' }}>🟢 SERVICEABLE (Dùng tốt)</option>
            <option value={2} style={{ background: '#050f1e', color: '#ff3366', fontWeight: 'bold' }}>🔴 UNSERVICEABLE (AOG/Red-Tag)</option>
          </select>
          <input
            className="avi-span2"
            placeholder="notesHash (Tự động tạo)"
            value={inspectForm.notesHash}
            readOnly
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'Space Mono, monospace',
              cursor: 'not-allowed'
            }}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 20 }}>
          <button
            className="avi-btn avi-btn--primary"
            disabled={!canUseApi || busy}
            style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
            onClick={() =>
              run(async () => {
                const item = await api.getItem({ code: inspectForm.code });
                if (isItemLocked(item)) throw new Error("Thiết bị đã gửi lên máy bay (Locked) nên không thể sửa/kiểm định nữa.");
                return api.inspectItem(inspectForm);
              })
            }
          >
            Gửi giao dịch
          </button>
          
          {inspectForm.status === 2 && (
            <button
              className="avi-btn"
              disabled={!canUseApi || busy}
              style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(255, 51, 102, 0.2)', color: '#ff3366', border: '1px solid rgba(255, 51, 102, 0.5)', boxShadow: '0 0 15px rgba(255, 51, 102, 0.2)' }}
              onClick={() => {
                if (window.confirm("CẢNH BÁO: Hành động đánh dấu TIÊU HỦY (SCRAP) không thể đảo ngược! Bạn có chắc chắn muốn huỷ vĩnh viễn thiết bị này?")) {
                  run(() => api.scrapItem(inspectForm.code));
                }
              }}
            >
              🗑️ Tiêu Hủy (Scrap)
            </button>
          )}

          <button className="avi-btn" disabled={!canUseApi || loadingPending} onClick={fetchPendingItems} style={{ padding: '10px 20px', letterSpacing: 1 }}>
            Làm mới danh sách
          </button>
          {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
        </div>
        <TransactionInfo receipt={txReceipt} />
      </SectionCard>

      <SectionCard title="Cần kiểm định (Pending)" subtitle="Danh sách thiết bị mới lưu kho hoặc đang hỏng">
        {loadingPending ? (
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tải danh sách...</div>
        ) : pendingItems.length === 0 ? (
          <div style={{ color: '#00ff88', fontWeight: 'bold', padding: 16, background: 'rgba(0, 255, 136, 0.05)', borderRadius: 8, border: '1px solid rgba(0, 255, 136, 0.2)' }}>Tất cả thiết bị đều đã được kiểm duyệt Tốt (Serviceable)!</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {pendingItems.map(({ itemId, item }) => (
              <div
                key={itemId}
                className="avi-card"
                style={{
                  cursor: 'pointer',
                  background: 'rgba(5, 15, 30, 0.95)',
                  borderTop: '1px solid rgba(0, 240, 255, 0.2)',
                  borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRight: '1px solid rgba(0, 240, 255, 0.2)',
                  borderLeft: Number(item.lastInspectionStatus) === 2 ? '4px solid #ff3366' : '4px solid #ffaa00',
                  boxShadow: '0 0 15px rgba(0, 240, 255, 0.05)',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(5, 15, 30, 0.95)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.05)';
                }}
                onClick={(e) => {
                  if (e.target.closest('button')) return; // Không trigger khi click nút chia sẻ QR
                  const statusText = inspectForm.status === 1 ? 'PASS' : 'FAIL';
                  const timestamp = Date.now().toString(36);
                  setInspectForm({
                    code: item.code,
                    status: inspectForm.status,
                    notesHash: `ipfs://QmINSPECT-${statusText}-${item.code}-${timestamp}`
                  });
                }}
              >
                <div className="avi-cardBody" style={{ padding: "16px" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#00f0ff', fontFamily: 'Space Mono, monospace', fontSize: '1.1rem', letterSpacing: 1, wordBreak: 'break-all' }}>{item.code}</strong>
                      <button
                        className="avi-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const baseUrl = `${window.location.origin}${window.location.pathname}`;
                          const url = `${baseUrl}#/?lookup=${encodeURIComponent(item.code)}`;
                          navigator.clipboard.writeText(url);
                          alert('✅ Đã copy link tra cứu!\n\n' + url + '\n\nPaste vào browser để xem kết quả.');
                        }}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: 6 }}
                        title="Copy link tra cứu mã QR"
                      >
                        📱 Copy QR Link
                      </button>
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontWeight: 'bold',
                      background: Number(item.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                      border: `1px solid ${Number(item.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.3)' : 'rgba(255, 170, 0, 0.3)'}`,
                      color: Number(item.lastInspectionStatus) === 2 ? '#ff3366' : '#ffaa00',
                      boxShadow: Number(item.lastInspectionStatus) === 2 ? '0 0 10px rgba(255, 51, 102, 0.2)' : 'none'
                    }}>
                      {formatInspectionStatus(item.lastInspectionStatus)}
                    </span>
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.95rem', marginTop: 12 }}>{item.name} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({item.partNumber})</span></div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📍 Kho: {item.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
        </>
      )}

      {activeTab === "DEMOUNT" && (
        <SectionCard title="Tháo dỡ Kỹ thuật (Demount)" subtitle="Tháo dỡ thiết bị từ máy bay về kho">
        <div className="avi-formGrid" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="Mã (code)"
                value={demountForm.code}
                onChange={(e) => setDemountForm((s) => ({ ...s, code: e.target.value }))}
                style={{
                  flex: 1,
                  background: 'rgba(5, 15, 30, 0.8)',
                  border: '1px solid rgba(0, 240, 255, 0.4)',
                  color: '#00f0ff',
                  fontFamily: 'Space Mono, monospace'
                }}
              />
              <button 
                className="avi-btn" 
                onClick={() => openScanner('DEMOUNT')}
                title="Quét mã bằng Camera"
                style={{ padding: '0 16px', fontSize: '1.2rem' }}
              >
                📷
              </button>
            </div>
            <select
              value={demountForm.newLocation}
              onChange={(e) => setDemountForm((s) => ({ ...s, newLocation: e.target.value }))}
              style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#fff', outline: 'none' }}
            >
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <option key={loc} value={loc} style={{ background: '#050f1e', color: '#fff' }}>
                    📦 Dỡ về kho: {loc}
                  </option>
                ))
              ) : (
                <option value="" disabled style={{ background: '#050f1e', color: '#fff' }}>Chưa có Kho nào được cấu hình</option>
              )}
            </select>
            <button
              className="avi-btn avi-btn--primary"
              disabled={!canUseApi || busy || !demountForm.code || !demountForm.newLocation}
              style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', boxShadow: '0 0 15px rgba(255, 170, 0, 0.3)', border: '1px solid rgba(255, 170, 0, 0.8)', background: 'rgba(255, 170, 0, 0.15)', color: '#ffaa00' }}
              onClick={() => run(() => api.demountItem(demountForm.code, demountForm.newLocation))}
            >
              🔧 Xác nhận tháo dỡ
            </button>
        </div>

        {loadingLocked ? (
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tải danh sách...</div>
        ) : lockedItems.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', padding: 16, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>Không có thiết bị cấu hình nào trên máy bay lúc này.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {lockedItems.map(({ itemId, item }) => (
              <div
                key={itemId}
                className="avi-card"
                style={{
                  cursor: 'pointer',
                  background: 'rgba(5, 15, 30, 0.95)',
                  border: '1px solid rgba(255, 170, 0, 0.3)',
                  borderLeft: '4px solid #ffaa00',
                  boxShadow: '0 0 15px rgba(255, 170, 0, 0.05)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 170, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 170, 0, 0.05)';
                }}
                onClick={() => setDemountForm(s => ({ ...s, code: item.code }))}
              >
                <div className="avi-cardBody" style={{ padding: "16px" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ color: '#00f0ff', fontFamily: 'Space Mono, monospace', fontSize: '1.1rem', letterSpacing: 1, wordBreak: 'break-all' }}>{item.code}</strong>
                    <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 4, background: 'rgba(255, 170, 0, 0.1)', color: '#ffaa00', border: '1px solid rgba(255, 170, 0, 0.3)'}}>
                      LOCKED
                    </span>
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.95rem', marginTop: 12 }}>{item.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 6 }}>
                    📍 Máy bay: <span style={{ color: '#00f0ff' }}>{item.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      )}
    </div>
  );
}
