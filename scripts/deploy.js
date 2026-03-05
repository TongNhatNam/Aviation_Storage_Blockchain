import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";
import { createPublicClient, encodeDeployData, http, numberToHex } from "viem";

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

async function upsertDeployments({ chainId, contractName, address }) {
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  let deployments = {};

  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }

  const chainKey = String(chainId);
  deployments[chainKey] = deployments[chainKey] ?? {};
  deployments[chainKey][contractName] = address;

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  return deployments;
}

function trySyncFrontend({ abi, deployments }) {
  const frontendDir = path.join(__dirname, "..", "frontend");
  if (!fs.existsSync(frontendDir)) return;

  const frontendContractsDir = path.join(frontendDir, "src", "contracts");
  fs.mkdirSync(frontendContractsDir, { recursive: true });

  const abiPath = path.join(frontendContractsDir, "AviationStorage.abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

  const addressesPath = path.join(frontendContractsDir, "deployedAddresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(deployments, null, 2));
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
  const deployer = accounts?.[0];
  if (!deployer) throw new Error("RPC must provide an unlocked account (eth_accounts)");

  const data = encodeDeployData({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [],
  });

  const receipt = await sendTransaction({ publicClient, from: deployer, data });
  const aviationStorageAddress = receipt?.contractAddress;
  if (!aviationStorageAddress) throw new Error("Deploy failed: missing contractAddress");
  const deployments = await upsertDeployments({
    chainId,
    contractName: "AviationStorage",
    address: aviationStorageAddress,
  });

  trySyncFrontend({ abi: artifact.abi, deployments });

  console.log("Deployer:", deployer);
  console.log("Network chainId:", chainId);
  console.log("AviationStorage:", aviationStorageAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
