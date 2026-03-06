import { useMemo, useState, useEffect } from "react";
import { SectionCard } from "./SectionCard.jsx";
import { TransactionInfo } from "./TransactionInfo.jsx";
import { formatError } from "../utils/error.js";
import { isItemLocked } from "../utils/itemState.js";

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

export function EngineerActions({ api, disabled, onActionDone }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);
  const [txReceipt, setTxReceipt] = useState(undefined);

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
        return (status === 0 || status === 2) && !isItemLocked(item);
      });
      setPendingItems(pending);
    } catch (e) {
      console.error("Failed to load pending items:", e);
    } finally {
      setLoadingPending(false);
    }
  }

  // Tự động fetch khi component load hoặc khi canUseApi thay đổi
  useEffect(() => {
    fetchPendingItems();
  }, [canUseApi]);

  async function run(action) {
    setMessage(undefined);
    setTxReceipt(undefined);
    setBusy(true);
    try {
      const receipt = await action();
      setMessage("OK");
      setTxReceipt(receipt);
      onActionDone?.();
      await fetchPendingItems();
    } catch (e) {
      setMessage(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avi-grid">
      <SectionCard title="Kiểm định Kỹ thuật" subtitle="Cập nhật trạng thái kiểm định và cấp biên bản (hash)">
        <div className="avi-formGrid">
          <input
            placeholder="Mã (code)"
            value={inspectForm.code}
            onChange={(e) => setInspectForm((s) => ({ ...s, code: e.target.value }))}
            style={{
              background: 'rgba(5, 15, 30, 0.8)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00f0ff',
              fontFamily: 'Space Mono, monospace'
            }}
          />
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <strong style={{ color: '#00f0ff', fontFamily: 'Space Mono, monospace', fontSize: '1.1rem', letterSpacing: 1 }}>{item.code}</strong>
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
    </div>
  );
}
