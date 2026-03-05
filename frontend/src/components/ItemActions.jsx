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
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h3>Nhập kho (register)</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input
            placeholder="Mã (code)"
            value={registerForm.code}
            onChange={(e) => setRegisterForm((s) => ({ ...s, code: e.target.value }))}
          />
          <input
            placeholder="Tên"
            value={registerForm.name}
            onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            placeholder="Vị trí"
            value={registerForm.location}
            onChange={(e) => setRegisterForm((s) => ({ ...s, location: e.target.value }))}
          />
          <input
            placeholder="Số lượng"
            type="number"
            min={1}
            value={registerForm.quantity}
            onChange={(e) => setRegisterForm((s) => ({ ...s, quantity: toNumber(e.target.value, 1) }))}
          />
          <input
            placeholder="metadataHash (ipfs://...)"
            value={registerForm.metadataHash}
            onChange={(e) => setRegisterForm((s) => ({ ...s, metadataHash: e.target.value }))}
            style={{ gridColumn: "1 / -1" }}
          />
        </div>
        <button
          disabled={!canUseApi || busy}
          onClick={() =>
            run(() =>
              api.registerItem({
                ...registerForm,
                quantity: registerForm.quantity,
              })
            )
          }
          style={{ marginTop: 8 }}
        >
          Gửi giao dịch
        </button>
      </div>

      <div>
        <h3>Cộng kho (addStock)</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input
            placeholder="Mã (code)"
            value={addStockForm.code}
            onChange={(e) => setAddStockForm((s) => ({ ...s, code: e.target.value }))}
          />
          <input
            placeholder="Số lượng"
            type="number"
            min={1}
            value={addStockForm.amount}
            onChange={(e) => setAddStockForm((s) => ({ ...s, amount: toNumber(e.target.value, 1) }))}
          />
          <input
            placeholder="Vị trí (có thể để trống)"
            value={addStockForm.location}
            onChange={(e) => setAddStockForm((s) => ({ ...s, location: e.target.value }))}
            style={{ gridColumn: "1 / -1" }}
          />
        </div>
        <button disabled={!canUseApi || busy} onClick={() => run(() => api.addStock(addStockForm))} style={{ marginTop: 8 }}>
          Gửi giao dịch
        </button>
      </div>

      <div>
        <h3>Xuất kho (removeStock)</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input
            placeholder="Mã (code)"
            value={removeStockForm.code}
            onChange={(e) => setRemoveStockForm((s) => ({ ...s, code: e.target.value }))}
          />
          <input
            placeholder="Số lượng"
            type="number"
            min={1}
            value={removeStockForm.amount}
            onChange={(e) => setRemoveStockForm((s) => ({ ...s, amount: toNumber(e.target.value, 1) }))}
          />
          <input
            placeholder="Điểm đến"
            value={removeStockForm.destination}
            onChange={(e) => setRemoveStockForm((s) => ({ ...s, destination: e.target.value }))}
            style={{ gridColumn: "1 / -1" }}
          />
        </div>
        <button
          disabled={!canUseApi || busy}
          onClick={() => run(() => api.removeStock(removeStockForm))}
          style={{ marginTop: 8 }}
        >
          Gửi giao dịch
        </button>
      </div>

      <div>
        <h3>Kiểm định (inspect)</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input
            placeholder="Mã (code)"
            value={inspectForm.code}
            onChange={(e) => setInspectForm((s) => ({ ...s, code: e.target.value }))}
          />
          <select value={inspectForm.status} onChange={(e) => setInspectForm((s) => ({ ...s, status: toNumber(e.target.value, 1) }))}>
            <option value={1}>Passed</option>
            <option value={2}>Failed</option>
          </select>
          <input
            placeholder="notesHash (ipfs://...)"
            value={inspectForm.notesHash}
            onChange={(e) => setInspectForm((s) => ({ ...s, notesHash: e.target.value }))}
            style={{ gridColumn: "1 / -1" }}
          />
        </div>
        <button
          disabled={!canUseApi || busy}
          onClick={() => run(() => api.inspectItem(inspectForm))}
          style={{ marginTop: 8 }}
        >
          Gửi giao dịch
        </button>
      </div>

      {message ? <div style={{ color: message === "OK" ? "green" : "crimson" }}>{message}</div> : null}
    </div>
  );
}

