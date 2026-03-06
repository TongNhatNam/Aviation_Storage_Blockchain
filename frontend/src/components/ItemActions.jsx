import { useMemo, useState } from "react";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  return fallback;
}

export function ItemActions({ api, onActionDone }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(undefined);

  const [registerForm, setRegisterForm] = useState({
    code: "",
    name: "",
    location: "",
    quantity: 1,
    metadataHash: "",
  });

  const [addStockForm, setAddStockForm] = useState({
    code: "",
    amount: 1,
    location: "",
  });

  const [removeStockForm, setRemoveStockForm] = useState({
    code: "",
    amount: 1,
    destination: "",
  });

  const [inspectForm, setInspectForm] = useState({
    code: "",
    status: 1,
    notesHash: "",
  });

  const canUseApi = useMemo(() => Boolean(api?.isDeployedOnThisChain), [api]);

  async function run(action) {
    setMessage(undefined);
    setBusy(true);
    try {
      await action();
      setMessage("OK");
      onActionDone?.();
    } catch (e) {
      setMessage(e?.shortMessage || e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionCard title="Nhập kho (Register)" subtitle="Đăng ký tài sản mới lên Blockchain">
        <div className="avi-formGrid">
          <input
            placeholder="Mã (code)"
            value={registerForm.code}
            onChange={(e) => setRegisterForm((s) => ({ ...s, code: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#00f0ff', fontFamily: 'Space Mono, monospace' }}
          />
          <input
            placeholder="Tên"
            value={registerForm.name}
            onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#fff' }}
          />
          <input
            placeholder="Vị trí (Kho)"
            value={registerForm.location}
            onChange={(e) => setRegisterForm((s) => ({ ...s, location: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#fff' }}
          />
          <input
            placeholder="Số lượng"
            type="number"
            min={1}
            value={registerForm.quantity}
            onChange={(e) => setRegisterForm((s) => ({ ...s, quantity: toNumber(e.target.value, 1) }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#fff', fontFamily: 'Space Mono, monospace' }}
          />
          <input
            className="avi-span2"
            placeholder="metadataHash (ipfs://...)"
            value={registerForm.metadataHash}
            onChange={(e) => setRegisterForm((s) => ({ ...s, metadataHash: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Space Mono, monospace' }}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 20 }}>
          <button
            className="avi-btn avi-btn--primary"
            disabled={!canUseApi || busy}
            style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}
            onClick={() =>
              run(() =>
                api.registerItem({
                  ...registerForm,
                  quantity: registerForm.quantity,
                })
              )
            }
          >
            Nhập kho Blockchain
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Cộng kho (Add Stock)" subtitle="Tăng số lượng tài sản hiện có">
        <div className="avi-formGrid">
          <input
            placeholder="Mã (code)"
            value={addStockForm.code}
            onChange={(e) => setAddStockForm((s) => ({ ...s, code: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#00f0ff', fontFamily: 'Space Mono, monospace' }}
          />
          <input
            placeholder="Số lượng"
            type="number"
            min={1}
            value={addStockForm.amount}
            onChange={(e) => setAddStockForm((s) => ({ ...s, amount: toNumber(e.target.value, 1) }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#fff', fontFamily: 'Space Mono, monospace' }}
          />
          <input
            className="avi-span2"
            placeholder="Vị trí mới (có thể để trống)"
            value={addStockForm.location}
            onChange={(e) => setAddStockForm((s) => ({ ...s, location: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#fff' }}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 20 }}>
          <button
            className="avi-btn avi-btn--success"
            disabled={!canUseApi || busy}
            onClick={() => run(() => api.addStock(addStockForm))}
            style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)' }}
          >
            Cộng số lượng
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Xuất kho (Remove Stock)" subtitle="Giảm số lượng, điều phối hoặc gửi đi (Lock)">
        <div className="avi-formGrid">
          <input
            placeholder="Mã (code)"
            value={removeStockForm.code}
            onChange={(e) => setRemoveStockForm((s) => ({ ...s, code: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(255, 170, 0, 0.4)', color: '#ffaa00', fontFamily: 'Space Mono, monospace' }}
          />
          <input
            placeholder="Số lượng"
            type="number"
            min={1}
            value={removeStockForm.amount}
            onChange={(e) => setRemoveStockForm((s) => ({ ...s, amount: toNumber(e.target.value, 1) }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(255, 170, 0, 0.4)', color: '#fff', fontFamily: 'Space Mono, monospace' }}
          />
          <input
            className="avi-span2"
            placeholder="Điểm đến (Nhập 'Aircraft ...' để KHÓA tài sản)"
            value={removeStockForm.destination}
            onChange={(e) => setRemoveStockForm((s) => ({ ...s, destination: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px dashed rgba(255, 170, 0, 0.8)', color: '#fff' }}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 20 }}>
          <button
            className="avi-btn"
            disabled={!canUseApi || busy}
            onClick={() => run(() => api.removeStock(removeStockForm))}
            style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.5)', color: '#ffaa00', boxShadow: '0 0 15px rgba(255, 170, 0, 0.2)' }}
          >
            Ghi nhận Xuất kho
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Kiểm định Trực tiếp (Force Inspect)" subtitle="Cho phép Admin can thiệp cưỡng chế trạng thái kỹ thuật">
        <div className="avi-formGrid">
          <input
            placeholder="Mã (code)"
            value={inspectForm.code}
            onChange={(e) => setInspectForm((s) => ({ ...s, code: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(255, 51, 102, 0.4)', color: '#ff3366', fontFamily: 'Space Mono, monospace' }}
          />
          <select
            value={inspectForm.status}
            onChange={(e) => setInspectForm((s) => ({ ...s, status: toNumber(e.target.value, 1) }))}
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
            <option value={1} style={{ background: '#050f1e', color: '#00ff88' }}>🟢 SERVICEABLE</option>
            <option value={2} style={{ background: '#050f1e', color: '#ff3366', fontWeight: 'bold' }}>🔴 UNSERVICEABLE (AOG/Red-Tag)</option>
          </select>
          <input
            className="avi-span2"
            placeholder="notesHash (ipfs://...)"
            value={inspectForm.notesHash}
            onChange={(e) => setInspectForm((s) => ({ ...s, notesHash: e.target.value }))}
            style={{ background: 'rgba(5, 15, 30, 0.8)', border: '1px solid rgba(255, 51, 102, 0.4)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Space Mono, monospace' }}
          />
        </div>
        <div className="avi-inline" style={{ marginTop: 20 }}>
          <button
            className="avi-btn"
            disabled={!canUseApi || busy}
            onClick={() => run(() => api.inspectItem(inspectForm))}
            style={{ padding: '10px 24px', letterSpacing: 1, textTransform: 'uppercase', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.5)', color: '#ff3366', boxShadow: '0 0 15px rgba(255, 51, 102, 0.2)' }}
          >
            Cưỡng chế Ghi nhận
          </button>
        </div>
      </SectionCard>

      {message ? <div className={`avi-msg ${message === "OK" ? "avi-msg--ok" : "avi-msg--err"}`}>{message}</div> : null}
    </>
  );
}
