import { useMemo, useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { SectionCard } from "./SectionCard.jsx";
import { TransactionInfo } from "./TransactionInfo.jsx";
import { formatError } from "../utils/error.js";
import { isItemLocked } from "../utils/itemState.js";

const FALLBACK_DESTINATIONS = [
  "Aircraft VN-A899 (A350)",
  "Aircraft VN-A321 (A321neo)",
  "Aircraft VN-A789 (B787)",
  "Hangar 1 - HAN",
  "Hangar 2 - SGN",
  "Line Maintenance - DAD"
];

const CERTIFICATE_TYPES = [
  { value: "CO", label: "C/O (Giấy chứng nhận xuất xứ)" },
  { value: "CQ", label: "C/Q (Giấy chứng nhận chất lượng)" },
  { value: "EASA_FORM1", label: "EASA Form 1" },
  { value: "FAA_8130_3", label: "FAA Form 8130-3" },
  { value: "JAA_FORM1", label: "JAA Form 1" },
  { value: "OTHER", label: "Khác" }
];

const FALLBACK_WAREHOUSE_LOCATIONS = [
  "HAN-WH-A1",
  "HAN-WH-A2",
  "HAN-WH-B1",
  "SGN-WH-B3",
  "SGN-WH-C2",
  "DAD-WH-LM1",
];

function formatInspectionStatus(value) {
  const n = Number(value);
  if (n === 1) return "Serviceable";
  if (n === 2) return "Unserviceable (AOG)";
  return "Unknown";
}

export function WarehouseActions({ api, disabled, onActionDone }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);
  const [txReceipt, setTxReceipt] = useState(undefined);

  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [transferDestinations, setTransferDestinations] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    code: "",
    partNumber: "",
    serialNumber: "",
    name: "",
    location: "",
    certificateType: "CO",
    metadataHash: "",
    quantity: 1,
  });

  const [generatedCodes, setGeneratedCodes] = useState([]);

  const [transferForm, setTransferForm] = useState({
    code: "",
    destination: "",
  });

  const [updateLocationForm, setUpdateLocationForm] = useState({
    code: "",
    newLocation: "",
  });

  const canUseApi = useMemo(() => Boolean(api?.isDeployedOnThisChain) && !disabled, [api, disabled]);
  const hasContract = useMemo(() => Boolean(api?.isDeployedOnThisChain), [api]);

  const [activeTab, setActiveTab] = useState("REGISTER"); // REGISTER, TRANSFER, UPDATE
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  async function fetchItems() {
    if (!canUseApi) return;
    setLoadingItems(true);
    try {
      const data = await api.listItems({ limit: 100 });
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  }

  // Fetch items when switching to tabs that need them
  useEffect(() => {
    if (activeTab === "TRANSFER" || activeTab === "UPDATE") {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, canUseApi]);

  useEffect(() => {
    if (!hasContract) return;
    let cancelled = false;
    setLoadingCatalog(true);
    Promise.all([api?.listWarehouseLocations?.(), api?.listTransferDestinations?.()])
      .then(([locRes, destRes]) => {
        if (cancelled) return;
        const locations = locRes?.locations?.length ? locRes.locations : FALLBACK_WAREHOUSE_LOCATIONS;
        const destinations = destRes?.destinations?.length ? destRes.destinations : FALLBACK_DESTINATIONS;
        setWarehouseLocations(locations);
        setTransferDestinations(destinations);
        setRegisterForm((s) => (s.location || !locations?.[0] ? s : { ...s, location: locations[0] }));
        setTransferForm((s) => (s.destination || !destinations?.[0] ? s : { ...s, destination: destinations[0] }));
      })
      .catch(() => { })
      .finally(() => {
        if (cancelled) return;
        setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, hasContract]);

  async function run(action) {
    setMessage(undefined);
    setTxReceipt(undefined);
    setBusy(true);
    try {
      const receipt = await action();
      setMessage("OK");
      setTxReceipt(receipt);
      onActionDone?.();
      if (activeTab !== "REGISTER") {
        await fetchItems();
      }
    } catch (e) {
      setMessage(formatError(e));
      setGeneratedCodes([]);
    } finally {
      setBusy(false);
    }
  }

  // Helper to pre-fill the Unique Code when PN or SN changes
  const handlePnSnChange = (field, value) => {
    setRegisterForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (updated.partNumber && updated.serialNumber) {
        updated.code = updated.quantity > 1 
          ? `${updated.partNumber}-${updated.serialNumber}-...`
          : `${updated.partNumber}-${updated.serialNumber}`;
        // Auto-generate IPFS hash
        const certType = updated.certificateType || 'CO';
        const timestamp = Date.now().toString(36);
        updated.metadataHash = `ipfs://Qm${certType}-${updated.partNumber}-${updated.serialNumber}-${timestamp}`;
      }
      return updated;
    });
  };

  const serviceableItems = items.filter((i) => Number(i.item.lastInspectionStatus) === 1 && !isItemLocked(i.item));

  return (
    <div className="avi-grid">
      <div className="avi-tabs">
        <button
          onClick={() => setActiveTab("REGISTER")}
          className={`avi-tab ${activeTab === "REGISTER" ? "active" : ""}`}>
          <span className="avi-tabIcon avi-tabIcon--register" aria-hidden="true" />
          <span>Nhập Kho Mới</span>
        </button>
        <button
          onClick={() => setActiveTab("TRANSFER")}
          className={`avi-tab ${activeTab === "TRANSFER" ? "active" : ""}`}>
          <span className="avi-tabIcon avi-tabIcon--transfer" aria-hidden="true" />
          <span>Điều Chuyển Máy Bay</span>
        </button>
        <button
          onClick={() => setActiveTab("UPDATE")}
          className={`avi-tab ${activeTab === "UPDATE" ? "active" : ""}`}>
          <span className="avi-tabIcon avi-tabIcon--update" aria-hidden="true" />
          <span>Đổi Kệ (Nội bộ)</span>
        </button>
      </div>

      {activeTab === "REGISTER" && (
        <SectionCard title="Nhập kho (Digital Twin)" subtitle="Đăng ký phụ tùng mới, chờ kỹ sư thẩm định.">
          <div className="avi-formGrid">
            <input
              placeholder="Mã PN (VD: TIRE-A320)"
              value={registerForm.partNumber}
              onChange={(e) => handlePnSnChange("partNumber", e.target.value)}
            />
            <input
              placeholder="Mã SN (VD: SN001)"
              value={registerForm.serialNumber}
              onChange={(e) => handlePnSnChange("serialNumber", e.target.value)}
            />
            <input
              type="number"
              min="1"
              max="50"
              placeholder="Số lượng (Mặc định 1)"
              value={registerForm.quantity}
              onChange={(e) => {
                const qty = parseInt(e.target.value) || 1;
                setRegisterForm((prev) => {
                  const updated = { ...prev, quantity: qty };
                  if (updated.partNumber && updated.serialNumber) {
                    updated.code = qty > 1 
                      ? `${updated.partNumber}-${updated.serialNumber}-...`
                      : `${updated.partNumber}-${updated.serialNumber}`;
                  }
                  return updated;
                });
              }}
              style={{
                background: 'rgba(5, 15, 30, 0.8)',
                color: '#fff',
                border: '1px solid rgba(0, 240, 255, 0.4)'
              }}
            />
            <input
              className="avi-span2"
              placeholder="Mã Code (Tự tạo từ PN và SN)"
              value={registerForm.code}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
            <input
              placeholder="Tên Phụ tùng"
              value={registerForm.name}
              onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))}
            />
            {warehouseLocations?.length ? (
              <select
                value={registerForm.location}
                onChange={(e) => setRegisterForm((s) => ({ ...s, location: e.target.value }))}
                style={{ cursor: "pointer" }}
                disabled={loadingCatalog}
              >
                <option value="" disabled>
                  --- Chọn vị trí Kho ban đầu ---
                </option>
                {warehouseLocations.map((loc) => (
                  <option key={loc} value={loc} style={{ color: "#000" }}>
                    {loc}
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Vị trí Kho ban đầu"
                value={registerForm.location}
                onChange={(e) => setRegisterForm((s) => ({ ...s, location: e.target.value }))}
              />
            )}
            <select
              value={registerForm.certificateType}
              onChange={(e) => {
                const certType = e.target.value;
                setRegisterForm((s) => {
                  const updated = { ...s, certificateType: certType };
                  // Re-generate IPFS hash when cert type changes
                  if (updated.partNumber && updated.serialNumber) {
                    const timestamp = Date.now().toString(36);
                    updated.metadataHash = `ipfs://Qm${certType}-${updated.partNumber}-${updated.serialNumber}-${timestamp}`;
                  }
                  return updated;
                });
              }}
              style={{ cursor: "pointer" }}
            >
              {CERTIFICATE_TYPES.map((cert) => (
                <option key={cert.value} value={cert.value} style={{ color: "#000" }}>
                  {cert.label}
                </option>
              ))}
            </select>
            <input
              placeholder="IPFS Hash (Tự tạo)"
              value={registerForm.metadataHash}
              onChange={(e) => setRegisterForm((s) => ({ ...s, metadataHash: e.target.value }))}
              style={{ opacity: 0.8 }}
            />
          </div>
          <div className="avi-inline" style={{ marginTop: 10 }}>
            <button className="avi-btn avi-btn--primary" disabled={!canUseApi || busy} onClick={() => run(async () => {
              const qty = Math.max(1, registerForm.quantity || 1);
              const codes = [];
              let lastReceipt = null;

              if (qty === 1) {
                lastReceipt = await api.registerItem({ ...registerForm });
                codes.push(registerForm.code);
              } else {
                for (let i = 1; i <= qty; i++) {
                  const newSn = `${registerForm.serialNumber}-${i}`;
                  const newCode = `${registerForm.partNumber}-${newSn}`;
                  const timestamp = Date.now().toString(36);
                  const newHash = `ipfs://Qm${registerForm.certificateType}-${registerForm.partNumber}-${newSn}-${timestamp}`;
                  
                  lastReceipt = await api.registerItem({
                    ...registerForm,
                    serialNumber: newSn,
                    code: newCode,
                    metadataHash: newHash
                  });
                  codes.push(newCode);
                }
              }
              setGeneratedCodes(codes);
              return lastReceipt;
            })}>
              Đăng ký Tài sản số {registerForm.quantity > 1 ? `(x${registerForm.quantity})` : ''}
            </button>
            {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
          </div>
          <TransactionInfo receipt={txReceipt} />
          {message === "OK" && generatedCodes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ color: 'var(--color-success)', marginBottom: 12, fontWeight: 'bold' }}>
                ✅ Đăng ký thành công {generatedCodes.length} QR Code!
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                {generatedCodes.map(code => {
                  const baseUrl = `${window.location.origin}${window.location.pathname}`;
                  const url = `${baseUrl}#/?lookup=${encodeURIComponent(code)}`;
                  return (
                    <div key={code} className="avi-card" style={{ background: '#fff', padding: 16, textAlign: 'center', minWidth: 200, flexShrink: 0 }}>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                        <QRCodeSVG value={url} size={150} level="H" includeMargin={true} />
                      </div>
                      <div style={{ color: '#000', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: 8, wordBreak: 'break-all' }}>{code}</div>
                      <button
                        className="avi-btn avi-btn--primary"
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          alert('✅ Đã copy link tra cứu!\n\n' + url);
                        }}
                        style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}
                      >
                        📋 Copy Link
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "TRANSFER" && (
        <SectionCard title="Điều chuyển / Lắp đặt (Transfer)" subtitle="Chỉ hiển thị các vật tư/phụ tùng đã được Kỹ sư xác nhận (Serviceable) trong kho.">
          <div className="avi-formGrid">
            {loadingItems ? (
              <div className="avi-span2" style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>Đang tải danh sách kho...</div>
            ) : serviceableItems.length === 0 ? (
              <div className="avi-span2" style={{ color: "var(--color-danger)", fontStyle: "italic", padding: "12px", background: "rgba(255, 51, 102, 0.05)", borderRadius: "8px" }}>Không có thiết bị Serviceable nào trong kho. Hãy chờ Kỹ sư thẩm định!</div>
            ) : (
              <select
                value={transferForm.code}
                onChange={(e) => setTransferForm((s) => ({ ...s, code: e.target.value }))}
                className="avi-span2"
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled>--- Chọn thiết bị (Serviceable) ---</option>
                {serviceableItems.map((i) => (
                  <option key={i.itemId} value={i.item.code} style={{ color: '#000' }}>
                    [{i.item.code}] - {i.item.name} (Kho: {i.item.location})
                  </option>
                ))}
              </select>
            )}

            <select
              value={transferForm.destination}
              onChange={(e) => setTransferForm((s) => ({ ...s, destination: e.target.value }))}
              className="avi-span2"
              style={{ cursor: 'pointer' }}
              disabled={loadingCatalog}
            >
              <option value="" disabled>--- Chọn điểm đến (Máy bay/Xưởng) ---</option>
              {transferDestinations.map(dest => (
                <option key={dest} value={dest} style={{ color: '#000' }}>{dest}</option>
              ))}
            </select>
          </div>
          <div className="avi-inline" style={{ marginTop: 10 }}>
            <button className="avi-btn avi-btn--primary" disabled={!canUseApi || busy || !transferForm.code || !transferForm.destination} onClick={() => run(() => api.transferItem(transferForm))}>
              Ghi nhận Điểm đến
            </button>
            <button className="avi-btn" onClick={fetchItems} disabled={loadingItems}>
              Làm mới kho
            </button>
            {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
          </div>
          <TransactionInfo receipt={txReceipt} />
        </SectionCard>
      )}

      {activeTab === "UPDATE" && (
        <SectionCard title="Cập nhật vị trí Lưu trữ" subtitle="Thay đổi ô kệ/dock cho mọi tài sản đang nằm trong Warehouse">
          <div className="avi-formGrid">
            {loadingItems ? (
              <div className="avi-span2" style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>Đang tải danh sách kho...</div>
            ) : items.length === 0 ? (
              <div className="avi-span2" style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>Kho đang trống.</div>
            ) : (
              <select
                value={updateLocationForm.code}
                onChange={(e) => setUpdateLocationForm((s) => ({ ...s, code: e.target.value }))}
                className="avi-span2"
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled>--- Chọn thiết bị ---</option>
                {items.map((i) => {
                  const locked = isItemLocked(i.item);
                  return (
                    <option key={i.itemId} value={i.item.code} disabled={locked} style={{ color: '#000' }}>
                      [{i.item.code}] - {i.item.name} ({formatInspectionStatus(i.item.lastInspectionStatus)}){locked ? " - LOCKED" : ""}
                    </option>
                  );
                })}
              </select>
            )}

            {warehouseLocations?.length ? (
              <select
                className="avi-span2"
                value={updateLocationForm.newLocation}
                onChange={(e) => setUpdateLocationForm((s) => ({ ...s, newLocation: e.target.value }))}
                style={{ cursor: "pointer" }}
                disabled={loadingCatalog}
              >
                <option value="" disabled>--- Vị trí kệ mới (VD: Shelf A-12) ---</option>
                {warehouseLocations.map((loc) => (
                  <option key={loc} value={loc} style={{ color: "#000" }}>
                    {loc}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="avi-span2"
                placeholder="Vị trí kệ mới (VD: Shelf A-12)"
                value={updateLocationForm.newLocation}
                onChange={(e) => setUpdateLocationForm((s) => ({ ...s, newLocation: e.target.value }))}
              />
            )}
          </div>
          <div className="avi-inline" style={{ marginTop: 10 }}>
            <button className="avi-btn" disabled={!canUseApi || busy || !updateLocationForm.code || !updateLocationForm.newLocation} onClick={() => run(() => api.updateLocation(updateLocationForm))}>
              Lưu Vị trí
            </button>
            <button className="avi-btn" onClick={fetchItems} disabled={loadingItems}>
              Làm mới kho
            </button>
            {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
          </div>
          <TransactionInfo receipt={txReceipt} />
        </SectionCard>
      )}
    </div>
  );
}
