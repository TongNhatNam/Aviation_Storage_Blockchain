import { useMemo, useState } from "react";
import { SectionCard } from "./SectionCard.jsx";
import { formatError } from "../utils/error.js";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  return fallback;
}

export function EngineerActions({ api, disabled, onActionDone }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);

  const [inspectForm, setInspectForm] = useState({
    code: "",
    status: 1,
    notesHash: "",
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

  return (
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
        <button className="avi-btn avi-btn--primary" disabled={!canUseApi || busy} onClick={() => run(() => api.inspectItem(inspectForm))}>
          Gửi giao dịch
        </button>
        {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
      </div>
    </SectionCard>
  );
}
