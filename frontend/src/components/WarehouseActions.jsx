import { useMemo, useState } from "react";
import { SectionCard } from "./SectionCard.jsx";
import { formatError } from "../utils/error.js";

// Common pre-defined aircraft/hangars for dropdown demo
const PREDEFINED_DESTINATIONS = [
  "Aircraft VN-A899 (A350)",
  "Aircraft VN-A321 (A321neo)",
  "Aircraft VN-A789 (B787)",
  "Hangar 1 - HAN",
  "Hangar 2 - SGN",
  "Line Maintenance - DAD"
];

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

  async function run(action) {
    setMessage(undefined);
    setBusy(true);
    try {
      await action();
      setMessage("OK");
      onActionDone?.();
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

  return (
    <div className="avi-grid">
      <SectionCard title="Nhập kho (Digital Twin)" subtitle="Đăng ký phụ tùng độc nhất vào chuỗi cung ứng">
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
          <input
            placeholder="Vị trí Kho ban đầu"
            value={registerForm.location}
            onChange={(e) => setRegisterForm((s) => ({ ...s, location: e.target.value }))}
          />
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

      <SectionCard title="Điều chuyển / Lắp đặt (Transfer)" subtitle="Xuất kho cho máy bay hoặc chuyển xưởng">
        <div className="avi-formGrid">
          <input
            placeholder="Code phụ tùng (PN-SN)"
            value={transferForm.code}
            onChange={(e) => setTransferForm((s) => ({ ...s, code: e.target.value }))}
          />
          <select
            value={transferForm.destination}
            onChange={(e) => setTransferForm((s) => ({ ...s, destination: e.target.value }))}
            className="avi-span2"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '10px 14px',
              fontFamily: 'Space Mono, monospace',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>--- Chọn điểm đến ---</option>
            {PREDEFINED_DESTINATIONS.map(dest => (
              <option key={dest} value={dest} style={{ color: '#000' }}>{dest}</option>
            ))}
          </select>
        </div>
        <div className="avi-inline" style={{ marginTop: 10 }}>
          <button className="avi-btn avi-btn--primary" disabled={!canUseApi || busy} onClick={() => run(() => api.transferItem(transferForm))}>
            Ghi nhận Điểm đến
          </button>
          {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
        </div>
      </SectionCard>

      <SectionCard title="Cập nhật vị trí Lưu trữ" subtitle="Thay đổi ô kệ/dock bên trong kho Warehouse">
        <div className="avi-formGrid">
          <input placeholder="Code phụ tùng (PN-SN)" value={updateLocationForm.code} onChange={(e) => setUpdateLocationForm((s) => ({ ...s, code: e.target.value }))} />
          <input
            placeholder="Vị trí kệ mới (VD: Shelf A-12)"
            value={updateLocationForm.newLocation}
            onChange={(e) => setUpdateLocationForm((s) => ({ ...s, newLocation: e.target.value }))}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 10 }}>
          <button className="avi-btn" disabled={!canUseApi || busy} onClick={() => run(() => api.updateLocation(updateLocationForm))}>
            Lưu Vị trí
          </button>
          {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
        </div>
      </SectionCard>
    </div>
  );
}

