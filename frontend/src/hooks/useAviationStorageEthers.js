import { BrowserProvider, Contract } from "ethers";
import abi from "../contracts/AviationStorage.abi.json";
import deployedAddresses from "../contracts/deployedAddresses.json";
import { formatError } from "../utils/error.js";

function getContractAddress(chainId) {
  if (!chainId) return undefined;
  const chainKey = String(chainId);
  return deployedAddresses?.[chainKey]?.AviationStorage;
}

export function useAviationStorageEthers({ chainId }) {
  const address = getContractAddress(chainId);

  async function ensureDeployed(provider) {
    const code = await provider.getCode(address);
    if (!code || code === "0x") {
      throw new Error(
        "Không thấy contract tại address hiện tại. Có thể Ganache vừa restart. Hãy chạy lại npm run dev (deploy + seed) rồi refresh trang."
      );
    }
  }

  async function getSignerContract() {
    if (!window.ethereum) throw new Error("Chưa có MetaMask.");
    if (!address) throw new Error("Chưa có address contract cho chainId này.");

    const provider = new BrowserProvider(window.ethereum);
    await ensureDeployed(provider);
    const signer = await provider.getSigner();
    return new Contract(address, abi, signer);
  }

  async function getReadContract() {
    if (!window.ethereum) throw new Error("Chưa có MetaMask.");
    if (!address) throw new Error("Chưa có address contract cho chainId này.");

    const provider = new BrowserProvider(window.ethereum);
    await ensureDeployed(provider);
    return new Contract(address, abi, provider);
  }

  async function registerItem({ code, partNumber, serialNumber, name, location, metadataHash }) {
    const trimmedCode = String(code ?? "").trim();
    const trimmedPN = String(partNumber ?? "").trim();
    const trimmedSN = String(serialNumber ?? "").trim();
    const trimmedName = String(name ?? "").trim();
    const trimmedLocation = String(location ?? "").trim();
    if (!trimmedCode) throw new Error("Thiếu code.");
    if (!trimmedPN) throw new Error("Thiếu Part Number.");
    if (!trimmedSN) throw new Error("Thiếu Serial Number.");
    if (!trimmedName) throw new Error("Thiếu tên.");
    if (!trimmedLocation) throw new Error("Thiếu vị trí.");

    try {
      const contract = await getSignerContract();
      const tx = await contract.registerItem(trimmedCode, trimmedPN, trimmedSN, trimmedName, trimmedLocation, metadataHash ?? "");
      return tx.wait();
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function transferItem({ code, destination }) {
    const trimmedCode = String(code ?? "").trim();
    const trimmedDestination = String(destination ?? "").trim();
    if (!trimmedCode) throw new Error("Thiếu code.");
    if (!trimmedDestination) throw new Error("Thiếu điểm đến.");

    try {
      const contract = await getSignerContract();
      const tx = await contract.transferItem(trimmedCode, trimmedDestination);
      return tx.wait();
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function updateLocation({ code, newLocation }) {
    const trimmedCode = String(code ?? "").trim();
    const trimmedLocation = String(newLocation ?? "").trim();
    if (!trimmedCode) throw new Error("Thiếu code.");
    if (!trimmedLocation) throw new Error("Thiếu vị trí mới.");

    try {
      const contract = await getSignerContract();
      const tx = await contract.updateLocation(trimmedCode, trimmedLocation);
      return tx.wait();
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function inspectItem({ code, status, notesHash }) {
    const trimmedCode = String(code ?? "").trim();
    const nStatus = Number(status);
    if (!trimmedCode) throw new Error("Thiếu code.");
    if (nStatus !== 1 && nStatus !== 2) throw new Error("Status không hợp lệ (1=Serviceable, 2=Unserviceable).");

    try {
      const contract = await getSignerContract();
      const tx = await contract.inspectItem(trimmedCode, nStatus, notesHash ?? "");
      return tx.wait();
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function getItem({ code }) {
    const trimmedCode = String(code ?? "").trim();
    if (!trimmedCode) throw new Error("Thiếu code.");

    try {
      const contract = await getReadContract();
      return contract.getItem(trimmedCode);
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function listItems({ limit = 50 } = {}) {
    try {
      const contract = await getReadContract();
      const count = await contract.itemCount();
      const total = Number(count);
      const items = [];

      for (let i = 0; i < Math.min(total, limit); i += 1) {
        const itemId = await contract.itemIdAt(i);
        const itemRaw = await contract.getItemById(itemId);
        items.push({ itemId, item: itemRaw });
      }

      return { total, items };
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  return {
    address,
    isDeployedOnThisChain: Boolean(address),
    registerItem,
    transferItem,
    updateLocation,
    inspectItem,
    getItem,
    listItems,
  };
}
