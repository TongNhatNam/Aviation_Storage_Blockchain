function getPort() {
  const raw = process.env.GANACHE_PORT;
  const port = raw ? Number(raw) : 8787;
  return Number.isFinite(port) ? port : 8787;
}

async function isGanacheRpc(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "web3_clientVersion", params: [] }),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    const v = String(data?.result ?? "");
    if (v.toLowerCase().includes("ganache")) return { ok: true };
    return { ok: false, wrongService: true, clientVersion: v };
  } catch {
    return { ok: false };
  }
}

async function main() {
  const port = getPort();
  const timeoutMs = Number(process.env.GANACHE_WAIT_MS || 30_000);
  const startedAt = Date.now();

  for (;;) {
    const status = await isGanacheRpc(port);
    if (status.ok) return;
    if (status.wrongService) {
      throw new Error(`Port ${port} đang chạy service khác (clientVersion=${status.clientVersion}).`);
    }
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Không kết nối được Ganache trên port ${port} sau ${timeoutMs}ms.`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

