import { useMemo, useState } from "react";
import { formatError } from "../utils/error.js";
import { isItemLocked } from "../utils/itemState.js";

function formatTimestamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return new Date(n * 1000).toLocaleString();
}

function formatInspectionStatus(value) {
  const n = Number(value);
  if (n === 1) return "Serviceable";
  if (n === 2) return "Unserviceable (AOG)";
  return "Unknown";
}

export function ItemViewer({ api }) {
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState(undefined);
  const [lookupError, setLookupError] = useState(undefined);
  const [lookupBusy, setLookupBusy] = useState(false);

  const [listResult, setListResult] = useState(undefined);
  const [listError, setListError] = useState(undefined);
  const [listBusy, setListBusy] = useState(false);

  const canUseApi = useMemo(() => Boolean(api?.isDeployedOnThisChain), [api]);

  async function lookup() {
    setLookupError(undefined);
    setLookupResult(undefined);
    const trimmedCode = lookupCode.trim();
    if (!trimmedCode) {
      setLookupError("Vui lòng nhập code.");
      return;
    }
    setLookupBusy(true);
    try {
      const item = await api.getItem({ code: trimmedCode });
      setLookupResult(item);
    } catch (e) {
      setLookupError(formatError(e));
    } finally {
      setLookupBusy(false);
    }
  }

  async function refreshList() {
    setListError(undefined);
    setListResult(undefined);
    setListBusy(true);
    try {
      const data = await api.listItems({ limit: 50 });
      setListResult(data);
    } catch (e) {
      setListError(formatError(e));
    } finally {
      setListBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {!canUseApi ? (
        <div className="avi-alert avi-alert--warn">
          Chưa thấy contract trên network hiện tại. Giữ kết nối tới testnet hoặc Ganache.
        </div>
      ) : null}

      <div>
        <h3 style={{ textTransform: 'uppercase', letterSpacing: 2, color: 'var(--color-primary)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: 8 }}>Tra cứu Digital Twin</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
          <input
            placeholder="Nhập System Code (PN-SN)..."
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            style={{ minWidth: 280, padding: "10px 14px" }}
          />
          <button className="avi-btn avi-btn--primary" disabled={!canUseApi || lookupBusy} onClick={lookup}>
            {lookupBusy ? "Đang tra cứu..." : "Tìm kiếm Code"}
          </button>
        </div>

        {lookupError ? <div style={{ color: "var(--color-danger)", marginTop: 16 }}>{lookupError}</div> : null}

        {lookupResult ? (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="avi-card">
              <div className="avi-cardBody">
                <h4 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.2rem' }}>Thông tin Định danh Tài sản</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><small style={{ color: 'rgba(255,255,255,0.5)' }}>Code:</small> <br /><strong style={{ color: 'var(--color-primary)' }}>{lookupResult.code}</strong></div>
                  <div><small style={{ color: 'rgba(255,255,255,0.5)' }}>Tên Mô tả:</small> <br /><strong>{lookupResult.name}</strong></div>
                  <div><small style={{ color: 'rgba(255,255,255,0.5)' }}>Part Number (PN):</small> <br /><strong>{lookupResult.partNumber}</strong></div>
                  <div><small style={{ color: 'rgba(255,255,255,0.5)' }}>Serial Number (SN):</small> <br /><strong>{lookupResult.serialNumber}</strong></div>
                  <div><small style={{ color: 'rgba(255,255,255,0.5)' }}>Vị trí hiện tại:</small> <br /><span>{lookupResult.location}</span></div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)' }}>Trạng thái:</small> <br />
                    <strong style={{ color: isItemLocked(lookupResult) ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {isItemLocked(lookupResult) ? 'Locked (đã gửi lên máy bay)' : 'Active'}
                    </strong>
                    {isItemLocked(lookupResult) && typeof lookupResult.isFinalized !== "boolean" ? (
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 4 }}>
                        Đang xác định trạng thái Locked theo vị trí (location).
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)' }}>Tình trạng Kỹ thuật:</small> <br />
                    <strong style={{ color: Number(lookupResult.lastInspectionStatus) === 2 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {formatInspectionStatus(lookupResult.lastInspectionStatus)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.9)' }}>
              <div className="avi-cardBody">
                <h4 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.2rem' }}>Lý lịch / Vòng đời (Traceability Timeline)</h4>
                {lookupResult.history && lookupResult.history.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 12, borderLeft: '2px solid rgba(0, 240, 255, 0.3)' }}>
                    {lookupResult.history.map((record, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: -19,
                          top: 4,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          boxShadow: '0 0 8px var(--color-primary)'
                        }}></div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 4 }}>
                          {formatTimestamp(record.timestamp)}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>[{record.action}]</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>{record.details}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', opacity: 0.8, fontFamily: 'Space Mono' }}>
                          Actor: {record.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.5)' }}>Không có lịch sử lưu trữ.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ textTransform: 'uppercase', letterSpacing: 2, color: 'var(--color-primary)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: 8 }}>Danh mục Tài sản (Max 50)</h3>
        <button className="avi-btn" disabled={!canUseApi || listBusy} onClick={refreshList} style={{ marginTop: 16 }}>
          {listBusy ? "Đang tải dữ liệu..." : "Tải danh sách Blockchain"}
        </button>
        {listError ? <div style={{ color: "var(--color-danger)", marginTop: 16 }}>{listError}</div> : null}

        {listResult ? (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: '0.95rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>Phụ tùng (PN)</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>Serial (SN)</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>Code</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>Vị trí</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>State</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {listResult.items.map(({ itemId, item }) => {
                  const isAOG = Number(item.lastInspectionStatus) === 2;
                  return (
                    <tr key={itemId} style={{ background: isAOG ? 'rgba(255, 50, 50, 0.1)' : 'transparent' }}>
                      <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', fontWeight: 'bold' }}>{item.partNumber}</td>
                      <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', color: 'var(--color-primary)' }}>{item.serialNumber}</td>
                      <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', fontSize: '0.85em', opacity: 0.7 }}>{item.code}</td>
                      <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px' }}>{item.location}</td>
                      <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px' }}>
                        {isItemLocked(item) ? "Locked" : "Active"}
                      </td>
                      <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', color: isAOG ? 'var(--color-danger)' : 'inherit' }}>
                        {formatInspectionStatus(item.lastInspectionStatus)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
