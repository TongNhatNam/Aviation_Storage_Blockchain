import { useMemo, useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { ItemQRCode } from "./ItemQRCode.jsx";
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
  const [qrVisible, setQrVisible] = useState({});

  const canUseApi = useMemo(() => Boolean(api?.isDeployedOnThisChain), [api]);

  // Auto-lookup from URL parameter
  useEffect(() => {
    if (!canUseApi) return;
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const lookupParam = params.get('lookup');
    if (lookupParam) {
      setLookupCode(lookupParam);
      // Tự động tra cứu
      setLookupError(undefined);
      setLookupResult(undefined);
      setLookupBusy(true);
      api.getItem({ code: lookupParam.trim() })
        .then(item => {
          setLookupResult(item);
          setLookupBusy(false);
        })
        .catch(e => {
          setLookupError(formatError(e));
          setLookupBusy(false);
        });
    }
  }, [canUseApi, api]);

  async function lookup(code) {
    const trimmedCode = (code || lookupCode).trim();
    setLookupError(undefined);
    setLookupResult(undefined);
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
          <button className="avi-btn avi-btn--primary" disabled={!canUseApi || lookupBusy} onClick={() => lookup()}>
            {lookupBusy ? "Đang tra cứu..." : "Tìm kiếm Code"}
          </button>
        </div>

        {lookupError ? <div style={{ color: "var(--color-danger)", marginTop: 16 }}>{lookupError}</div> : null}

        {lookupResult ? (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' }}>
              <div className="avi-cardBody">
                <h4 style={{ margin: '0 0 20px', color: 'var(--color-primary)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: 10 }}>
                  Thông tin Định danh Tài sản
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Code:</small> <br />
                    <strong style={{ color: 'var(--color-primary)', fontFamily: 'Space Mono, monospace', fontSize: '1.1rem', textShadow: '0 0 8px rgba(0, 240, 255, 0.4)' }}>{lookupResult.code}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Tên Mô tả:</small> <br />
                    <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{lookupResult.name}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Part Number (PN):</small> <br />
                    <strong style={{ color: '#fff' }}>{lookupResult.partNumber}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Serial Number (SN):</small> <br />
                    <strong style={{ color: 'var(--color-primary)' }}>{lookupResult.serialNumber}</strong>
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Vị trí hiện tại:</small> <br />
                    <span style={{ color: '#00f0ff', background: 'rgba(0, 240, 255, 0.05)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4, border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                      📍 {lookupResult.location}
                    </span>
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Trạng thái:</small> <br />
                    <strong style={{
                      color: isItemLocked(lookupResult) ? '#ff3366' : '#00ff88',
                      display: 'inline-block', marginTop: 4, textTransform: 'uppercase'
                    }}>
                      {isItemLocked(lookupResult) ? '🔒 Locked (đã gửi lên máy bay)' : '🟢 Active'}
                    </strong>
                    {isItemLocked(lookupResult) && typeof lookupResult.isFinalized !== "boolean" ? (
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 4, fontStyle: 'italic' }}>
                        Đang xác định trạng thái Locked theo vị trí (location).
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Tình trạng Kỹ thuật:</small> <br />
                    <strong style={{
                      color: Number(lookupResult.lastInspectionStatus) === 2 ? '#ff3366' : '#00ff88',
                      display: 'inline-block', marginTop: 4, padding: '4px 8px', background: Number(lookupResult.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.1)' : 'rgba(0, 255, 136, 0.1)', borderRadius: 4, border: `1px solid ${Number(lookupResult.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 255, 136, 0.3)'}`
                    }}>
                      {Number(lookupResult.lastInspectionStatus) === 1 ? '✅ ' : Number(lookupResult.lastInspectionStatus) === 2 ? '❌ ' : ''}
                      {formatInspectionStatus(lookupResult.lastInspectionStatus)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <ItemQRCode item={lookupResult} />

            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' }}>
              <div className="avi-cardBody">
                <h4 style={{ margin: '0 0 20px', color: 'var(--color-primary)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: 10 }}>
                  Lý lịch / Vòng đời (Traceability Timeline)
                </h4>
                {lookupResult.history && lookupResult.history.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingLeft: 16, borderLeft: '2px solid rgba(0, 240, 255, 0.3)', marginLeft: 8 }}>
                    {lookupResult.history.map((record, idx) => (
                      <div key={idx} style={{ position: 'relative', background: 'rgba(0, 240, 255, 0.03)', padding: '12px 16px', borderRadius: '0 8px 8px 0', border: '1px solid rgba(0, 240, 255, 0.1)', borderLeft: 'none' }}>
                        <div style={{
                          position: 'absolute',
                          left: -23,
                          top: 16,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          boxShadow: '0 0 10px var(--color-primary)'
                        }}></div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                          🕒 {formatTimestamp(record.timestamp)}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem', letterSpacing: 0.5 }}>[{record.action}]</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0', lineHeight: 1.4 }}>{record.details}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', opacity: 0.8, fontFamily: 'Space Mono, monospace', background: 'rgba(0, 240, 255, 0.1)', display: 'inline-block', padding: '2px 6px', borderRadius: 4 }}>
                          Actor: {record.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>Chưa có bản ghi lịch sử nào trên Blockchain.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ textTransform: 'uppercase', letterSpacing: 2, color: 'var(--color-primary)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: 8 }}>Danh mục Tài sản (Max 50)</h3>
        <button className="avi-btn avi-btn--primary" disabled={!canUseApi || listBusy} onClick={refreshList} style={{ marginTop: 16 }}>
          {listBusy ? "Đang tải dữ liệu..." : "Tải danh sách Blockchain"}
        </button>
        {listError ? <div style={{ color: "var(--color-danger)", marginTop: 16 }}>{listError}</div> : null}

        {listResult ? (
          <div className="avi-card" style={{ marginTop: 24, padding: 0, background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)', overflow: 'visible' }}>
            <div style={{ overflowX: "auto", overflowY: "visible" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 240, 255, 0.05)' }}>
                    <th style={{ textAlign: "left", borderBottom: "1px solid rgba(0, 240, 255, 0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>PN</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid rgba(0, 240, 255, 0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>SN</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid rgba(0, 240, 255, 0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>Vị trí</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid rgba(0, 240, 255, 0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>Trạng thái</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid rgba(0, 240, 255, 0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>Tình trạng</th>
                    <th style={{ textAlign: "center", borderBottom: "1px solid rgba(0, 240, 255, 0.2)", padding: '12px 8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>QR</th>
                  </tr>
                </thead>
                <tbody>
                  {listResult.items.map(({ itemId, item }) => {
                    const isAOG = Number(item.lastInspectionStatus) === 2;
                    const showQR = qrVisible[itemId];
                    const isLocked = isItemLocked(item);
                    return (
                      <tr key={itemId} style={{ background: isAOG ? 'rgba(255, 51, 102, 0.05)' : 'transparent', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'} onMouseOut={(e) => e.currentTarget.style.background = isAOG ? 'rgba(255, 51, 102, 0.05)' : 'transparent'}>
                        <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', fontWeight: 'bold' }}>{item.partNumber}</td>
                        <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', color: 'var(--color-primary)' }}>{item.serialNumber}</td>
                        <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px' }}>{item.location}</td>
                        <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', color: isLocked ? '#ff3366' : '#00ff88' }}>
                          {isLocked ? "🔒 Locked" : "🟢 Active"}
                        </td>
                        <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', color: isAOG ? '#ff3366' : Number(item.lastInspectionStatus) === 1 ? '#00ff88' : 'inherit', fontWeight: isAOG || Number(item.lastInspectionStatus) === 1 ? 'bold' : 'normal' }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: isAOG ? '#ff3366' : Number(item.lastInspectionStatus) === 1 ? '#00ff88' : 'transparent', marginRight: 4, boxShadow: isAOG ? `0 0 8px #ff3366` : Number(item.lastInspectionStatus) === 1 ? `0 0 8px #00ff88` : 'none' }}></span>
                          {formatInspectionStatus(item.lastInspectionStatus)}
                        </td>
                        <td style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            className="avi-btn"
                            onClick={() => {
                              const baseUrl = `${window.location.origin}${window.location.pathname}`;
                              const url = `${baseUrl}#/?lookup=${encodeURIComponent(item.code)}`;
                              navigator.clipboard.writeText(url);
                              alert('✅ Đã copy link tra cứu!\n\n' + url + '\n\nPaste vào browser để xem kết quả.');
                            }}
                            style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.5)', color: '#00f0ff', whiteSpace: 'nowrap' }}
                            title="Copy link tra cứu mã QR"
                          >
                            QR 📱
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
