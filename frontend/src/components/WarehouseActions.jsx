import { useMemo, useState, useEffect } from "react";
import { SectionCard } from "./SectionCard.jsx";
import { formatError } from "../utils/error.js";
import { isItemLocked } from "../utils/itemState.js";

// Common pre-defined aircraft/hangars for dropdown demo
const PREDEFINED_DESTINATIONS = [
  "Aircraft VN-A899 (A350)",
  "Aircraft VN-A321 (A321neo)",
  "Aircraft VN-A789 (B787)",
  "Hangar 1 - HAN",
  "Hangar 2 - SGN",
  "Line Maintenance - DAD"
];

const PREDEFINED_WAREHOUSE_LOCATIONS = [
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

  const [registerForm, setRegisterForm] = useState({
    code: "",
    partNumber: "",
    serialNumber: "",
    name: "",
    location: "",
    metadataHash: "",
  });

  const [transferForm, setTransferForm] = useState({
    code: "",
    destination: "",
  });

  const [updateLocationForm, setUpdateLocationForm] = useState({
    code: "",
    newLocation: "",
  });

  const canUseApi = useMemo(() => Boolean(api?.isDeployedOnThisChain) && !disabled, [api, disabled]);

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
  }, [activeTab, canUseApi]);

  async function run(action) {
    setMessage(undefined);
    setBusy(true);
    try {
      await action();
      setMessage("OK");
      onActionDone?.();
      if (activeTab !== "REGISTER") {
        await fetchItems(); // refresh list after action
      }
    } catch (e) {
      setMessage(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  // Helper to pre-fill the Unique Code when PN or SN changes
  const handlePnSnChange = (field, value) => {
    setRegisterForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (updated.partNumber && updated.serialNumber) {
        updated.code = `${updated.partNumber}-${updated.serialNumber}`;
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
              placeholder="Part Number (PN) - VD: TIRE-A320"
              value={registerForm.partNumber}
              onChange={(e) => handlePnSnChange("partNumber", e.target.value)}
            />
            <input
              placeholder="Serial Number (SN) - VD: SN001"
              value={registerForm.serialNumber}
              onChange={(e) => handlePnSnChange("serialNumber", e.target.value)}
            />
            <input
              className="avi-span2"
              placeholder="Code (Hệ thống tự tạo từ PN và SN)"
              value={registerForm.code}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
            <input
              placeholder="Tên Phụ tùng"
              value={registerForm.name}
              onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))}
            />
            <select
              value={registerForm.location}
              onChange={(e) => setRegisterForm((s) => ({ ...s, location: e.target.value }))}
              style={{ cursor: "pointer" }}
            >
              <option value="" disabled>
                --- Chọn vị trí Kho ban đầu ---
              </option>
              {PREDEFINED_WAREHOUSE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} style={{ color: "#000" }}>
                  {loc}
                </option>
              ))}
            </select>
            <input
              className="avi-span2"
              placeholder="Giấy tờ C/O, C/Q hoặc EASA Form 1 (IPFS Hash)"
              value={registerForm.metadataHash}
              onChange={(e) => setRegisterForm((s) => ({ ...s, metadataHash: e.target.value }))}
            />
          </div>
          <div className="avi-inline" style={{ marginTop: 10 }}>
            <button className="avi-btn avi-btn--primary" disabled={!canUseApi || busy} onClick={() => run(() => api.registerItem({ ...registerForm }))}>
              Đăng ký Tài sản số
            </button>
            {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
          </div>
        </SectionCard>
      )}

      {activeTab === "TRANSFER" && (
        <SectionCard title="Điều chuyển / Lắp đặt (Transfer)" subtitle="Chỉ hiển thị các vật tư/phụ tùng đã được Kỹ sư xác nhận (Serviceable) trong kho.">
          <div className="avi-formGrid">
            {loadingItems ? (
              <div style={{ color: "rgba(255,255,255,0.5)" }}>Đang tải danh sách kho...</div>
            ) : serviceableItems.length === 0 ? (
              <div style={{ color: "var(--color-danger)" }}>Không có thiết bị Serviceable nào trong kho. Hãy chờ Kỹ sư thẩm định!</div>
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
            >
              <option value="" disabled>--- Chọn điểm đến (Máy bay/Xưởng) ---</option>
              {PREDEFINED_DESTINATIONS.map(dest => (
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
        </SectionCard>
      )}

      {activeTab === "UPDATE" && (
        <SectionCard title="Cập nhật vị trí Lưu trữ" subtitle="Thay đổi ô kệ/dock cho mọi tài sản đang nằm trong Warehouse">
          <div className="avi-formGrid">
            {loadingItems ? (
              <div style={{ color: "rgba(255,255,255,0.5)" }}>Đang tải danh sách kho...</div>
            ) : items.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.5)" }}>Kho đang trống.</div>
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

            <input
              className="avi-span2"
              placeholder="Vị trí kệ mới (VD: Shelf A-12)"
              value={updateLocationForm.newLocation}
              onChange={(e) => setUpdateLocationForm((s) => ({ ...s, newLocation: e.target.value }))}
            />
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
        </SectionCard>
      )}
    </div>
  );
}
