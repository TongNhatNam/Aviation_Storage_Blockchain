import { useMemo, useState, useEffect } from "react";
import { SectionCard } from "./SectionCard.jsx";
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

  const [inspectForm, setInspectForm] = useState({
    code: "",
    status: 1,
    notesHash: "",
  });

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
    setBusy(true);
    try {
      await action();
      setMessage("OK");
      onActionDone?.();
      await fetchPendingItems(); // Refresh lưới đồ chờ kiểm duyệt
    } catch (e) {
      setMessage(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avi-grid">
      <SectionCard title="Kiểm định" subtitle="Cập nhật trạng thái kiểm định và biên bản (hash)">
        <div className="avi-formGrid">
          <input placeholder="Mã (code)" value={inspectForm.code} onChange={(e) => setInspectForm((s) => ({ ...s, code: e.target.value }))} />
          <select
            value={inspectForm.status}
            onChange={(e) => setInspectForm((s) => ({ ...s, status: toNumber(e.target.value, 1) }))}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '10px',
              fontFamily: 'Space Mono, monospace'
            }}
          >
            <option value={1} style={{ color: '#000' }}>Serviceable (Dùng tốt)</option>
            <option value={2} style={{ color: '#000', fontWeight: 'bold' }}>Unserviceable / AOG (Phải sửa chữa / Red-Tag)</option>
          </select>
          <input
            className="avi-span2"
            placeholder="notesHash (ipfs://...)"
            value={inspectForm.notesHash}
            onChange={(e) => setInspectForm((s) => ({ ...s, notesHash: e.target.value }))}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 10 }}>
          <button
            className="avi-btn avi-btn--primary"
            disabled={!canUseApi || busy}
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
          <button className="avi-btn" disabled={!canUseApi || loadingPending} onClick={fetchPendingItems}>
            Làm mới danh sách
          </button>
          {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
        </div>
      </SectionCard>

      <SectionCard title="Cần kiểm định (Pending)" subtitle="Danh sách thiết bị mới lưu kho hoặc đang hỏng">
        {loadingPending ? (
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tải danh sách...</div>
        ) : pendingItems.length === 0 ? (
          <div style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Tất cả thiết bị đều đã được kiểm duyệt Tốt (Serviceable)!</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {pendingItems.map(({ itemId, item }) => (
              <div
                key={itemId}
                className="avi-card"
                style={{
                  cursor: 'pointer',
                  borderLeft: Number(item.lastInspectionStatus) === 2 ? '4px solid var(--color-danger)' : '4px solid #ffaa00'
                }}
                onClick={() => setInspectForm(s => ({ ...s, code: item.code }))}
              >
                <div className="avi-cardBody" style={{ padding: "12px 16px" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{item.code}</strong>
                    <span style={{
                      fontSize: '0.85rem',
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: Number(item.lastInspectionStatus) === 2 ? 'rgba(255,50,50,0.2)' : 'rgba(255,170,0,0.2)',
                      color: Number(item.lastInspectionStatus) === 2 ? '#ffaaaa' : '#ffeebb'
                    }}>
                      {formatInspectionStatus(item.lastInspectionStatus)}
                    </span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: 8 }}>{item.name} ({item.partNumber})</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 4 }}>Kho: {item.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
