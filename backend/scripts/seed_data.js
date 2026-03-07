import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";
import { createPublicClient, encodeDeployData, encodeFunctionData, http, numberToHex } from "viem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_GANACHE_RPC_URL = `http://127.0.0.1:${process.env.GANACHE_PORT || 8787}`;

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hexToBigInt(hex) {
  if (typeof hex !== "string") return 0n;
  return BigInt(hex);
}

async function waitForReceipt(publicClient, hash) {
  for (; ;) {
    const receipt = await publicClient.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });
    if (receipt) return receipt;
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function sendTransaction({ publicClient, from, to, data, value }) {
  const tx = { from, to, data };
  if (value != null) tx.value = value;

  try {
    tx.gas = await publicClient.request({
      method: "eth_estimateGas",
      params: [tx],
    });
    const estimated = hexToBigInt(tx.gas);
    const padded = (estimated * 12n) / 10n + 50_000n;
    const minGas = 500_000n;
    const maxGas = 6_000_000n;
    const safeGas = padded < minGas ? minGas : padded > maxGas ? maxGas : padded;
    tx.gas = numberToHex(safeGas);
  } catch {
    tx.gas = numberToHex(6_000_000);
  }

  try {
    const maxPriorityFeePerGas = await publicClient.request({
      method: "eth_maxPriorityFeePerGas",
      params: [],
    });
    const block = await publicClient.request({
      method: "eth_getBlockByNumber",
      params: ["latest", false],
    });
    const baseFeePerGas = block?.baseFeePerGas ?? "0x0";
    const maxFeePerGas =
      hexToBigInt(baseFeePerGas) * 2n + hexToBigInt(maxPriorityFeePerGas);

    tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
    tx.maxFeePerGas = numberToHex(maxFeePerGas);
    tx.type = "0x2";
  } catch {
    try {
      tx.gasPrice = await publicClient.request({
        method: "eth_gasPrice",
        params: [],
      });
    } catch { }
  }

  const hash = await publicClient.request({
    method: "eth_sendTransaction",
    params: [tx],
  });

  return waitForReceipt(publicClient, hash);
}

function readDeployments() {
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
}

function upsertDeployments({ deployments, chainId, contractName, address }) {
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  const chainKey = String(chainId);
  const next = deployments ?? {};
  next[chainKey] = next[chainKey] ?? {};
  next[chainKey][contractName] = address;
  fs.writeFileSync(deploymentsPath, JSON.stringify(next, null, 2));
  return next;
}

async function main() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "AviationStorage.sol",
    "AviationStorage.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const networkName = process.env.HARDHAT_NETWORK ?? getArgValue("--network") ?? hre.network.name;
  const rpcUrl =
    process.env.RPC_URL ??
    (networkName === "ganache" || networkName === "localhost" ? DEFAULT_GANACHE_RPC_URL : undefined);
  if (!rpcUrl) throw new Error(`Missing RPC_URL for network=${networkName}`);

  const chain = {
    id: 1337,
    name: "Ganache Local",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  };

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const chainId = await publicClient.getChainId();

  const accounts = await publicClient.request({ method: "eth_accounts", params: [] });
  const adminAccount = accounts?.[0];
  const warehouseAccount = accounts?.[1];
  const engineerAccount = accounts?.[2];
  if (!adminAccount || !warehouseAccount || !engineerAccount) {
    throw new Error("RPC must provide at least 3 unlocked accounts (eth_accounts)");
  }

  const deployments = readDeployments();
  const chainDeployments = deployments[String(chainId)] ?? {};
  let aviationStorageAddress = chainDeployments.AviationStorage;
  if (aviationStorageAddress) {
    const bytecode = await publicClient.getBytecode({ address: aviationStorageAddress });
    if (!bytecode) aviationStorageAddress = undefined;
  }
  if (!aviationStorageAddress) {
    const deployData = encodeDeployData({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: [],
    });
    const receipt = await sendTransaction({ publicClient, from: adminAccount, data: deployData });
    aviationStorageAddress = receipt?.contractAddress;
    if (!aviationStorageAddress) throw new Error("Deploy failed: missing contractAddress");
    upsertDeployments({
      deployments,
      chainId,
      contractName: "AviationStorage",
      address: aviationStorageAddress,
    });
  }

  await sendTransaction({
    publicClient,
    from: adminAccount,
    to: aviationStorageAddress,
    data: encodeFunctionData({
      abi: artifact.abi,
      functionName: "setWarehouseStaff",
      args: [warehouseAccount, true],
    }),
  });

  await sendTransaction({
    publicClient,
    from: adminAccount,
    to: aviationStorageAddress,
    data: encodeFunctionData({
      abi: artifact.abi,
      functionName: "setEngineer",
      args: [engineerAccount, true],
    }),
  });

  const warehouseLocations = ["HAN-WH-A1", "HAN-WH-A2", "HAN-WH-B1", "SGN-WH-B3", "SGN-WH-C2", "DAD-WH-LM1"];
  for (const loc of warehouseLocations) {
    await sendTransaction({
      publicClient,
      from: adminAccount,
      to: aviationStorageAddress,
      data: encodeFunctionData({
        abi: artifact.abi,
        functionName: "setWarehouseLocation",
        args: [loc, true],
      }),
    });
  }

  const destinations = [
    { value: "Aircraft VN-A899 (A350)", kind: 1 },
    { value: "Aircraft VN-A321 (A321neo)", kind: 1 },
    { value: "Aircraft VN-A789 (B787)", kind: 1 },
    { value: "Hangar 1 - HAN", kind: 0 },
    { value: "Hangar 2 - SGN", kind: 0 },
    { value: "Line Maintenance - DAD", kind: 0 },
  ];
  for (const d of destinations) {
    await sendTransaction({
      publicClient,
      from: adminAccount,
      to: aviationStorageAddress,
      data: encodeFunctionData({
        abi: artifact.abi,
        functionName: "setDestination",
        args: [d.value, d.kind, true],
      }),
    });
  }

  await sendTransaction({
    publicClient,
    from: adminAccount,
    to: aviationStorageAddress,
    data: encodeFunctionData({
      abi: artifact.abi,
      functionName: "setPolicies",
      args: [true, true, true, true, true],
    }),
  });

  async function ensureItem({ code, partNumber, serialNumber, name, location, metadataHash }) {
    const exists = await publicClient.readContract({
      address: aviationStorageAddress,
      abi: artifact.abi,
      functionName: "exists",
      args: [code],
    });
    if (exists) return;

    await sendTransaction({
      publicClient,
      from: warehouseAccount,
      to: aviationStorageAddress,
      data: encodeFunctionData({
        abi: artifact.abi,
        functionName: "registerItem",
        args: [code, partNumber, serialNumber, name, location, metadataHash],
      }),
    });
  }

  // 1. Nhập lốp máy bay A320
  await ensureItem({
    code: "TIRE-A320-SN001",
    partNumber: "TIRE-A320",
    serialNumber: "SN001",
    name: "Main Landing Gear Tire",
    location: "HAN-WH-A1",
    metadataHash: "ipfs://example-metadata-tire-sn001",
  });

  // 2. Nhập khối điều khiển điện tử
  await ensureItem({
    code: "AVIONICS-A350-SN102",
    partNumber: "PN-A350-AVIONICS",
    serialNumber: "SN102",
    name: "Avionics Control Unit",
    location: "SGN-WH-B3",
    metadataHash: "ipfs://example-metadata-avionics-102",
  });

  // 3. Kỹ sư kiểm định trạng thái lốp báo hỏng (Unserviceable = 2)
  await sendTransaction({
    publicClient,
    from: engineerAccount,
    to: aviationStorageAddress,
    data: encodeFunctionData({
      abi: artifact.abi,
      functionName: "inspectItem",
      args: ["TIRE-A320-SN001", 2, "ipfs://inspection-failed-tire-001"],
    }),
  });

  // 4. Kỹ sư kiểm tra cụm điều khiển báo tốt (Serviceable = 1)
  await sendTransaction({
    publicClient,
    from: engineerAccount,
    to: aviationStorageAddress,
    data: encodeFunctionData({
      abi: artifact.abi,
      functionName: "inspectItem",
      args: ["AVIONICS-A350-SN102", 1, "ipfs://inspection-passed-avionics-102"],
    }),
  });



  // 5. Kho điều chuyển khối điện tử lên máy bay VN-A899
  await sendTransaction({
    publicClient,
    from: warehouseAccount,
    to: aviationStorageAddress,
    data: encodeFunctionData({
      abi: artifact.abi,
      functionName: "transferItem",
      args: ["AVIONICS-A350-SN102", "Aircraft VN-A899 (A350)"],
    }),
  });

  console.log("Seed completed for chainId:", chainId);
  console.log("Admin:", adminAccount);
  console.log("Warehouse:", warehouseAccount);
  console.log("Engineer:", engineerAccount);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
