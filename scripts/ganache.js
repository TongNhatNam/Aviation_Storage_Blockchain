import ganache from "ganache";

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
    if (!res.ok) return false;
    const data = await res.json();
    const v = String(data?.result ?? "");
    return v.toLowerCase().includes("ganache");
  } catch {
    return false;
  }
}

async function main() {
  const port = getPort();
  const mnemonic = "test test test test test test test test test test test junk";

  const server = ganache.server({
    wallet: { mnemonic, totalAccounts: 10 },
    chain: { chainId: 1337 },
    logging: { quiet: false },
  });

  try {
    await server.listen(port);
  } catch (e) {
    const message = String(e?.message ?? e);
    const inUse =
      e?.code === "EADDRINUSE" ||
      e?.code === "ERR_SOCKET_BAD_PORT" ||
      message.toLowerCase().includes("eaddrinuse");

    if (!inUse) throw e;

    const isGanache = await isGanacheRpc(port);
    if (isGanache) {
      console.log(`Ganache đã chạy sẵn trên http://127.0.0.1:${port} (không khởi động lại).`);
      process.exitCode = 0;
      return;
    }

    throw new Error(`Port ${port} đang bị chiếm bởi process khác. Hãy tắt process đó hoặc đổi GANACHE_PORT.`);
  }

  console.log(`Ganache RPC: http://127.0.0.1:${port} (chainId=1337)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

