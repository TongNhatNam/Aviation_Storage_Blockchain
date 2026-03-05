import Web3 from "web3";
import abi from "../contracts/AviationStorage.abi.json";
import deployedAddresses from "../contracts/deployedAddresses.json";
import { formatError } from "../utils/error.js";

function getContractAddress(chainId) {
  if (!chainId) return undefined;
  const chainKey = String(chainId);
  return deployedAddresses?.[chainKey]?.AviationStorage;
}

export function useAviationStorageWeb3({ chainId }) {
  const address = getContractAddress(chainId);

  function getWeb3() {
    if (!window.ethereum) throw new Error("Chưa có MetaMask.");
    return new Web3(window.ethereum);
  }

  async function getFromAccount(web3) {
    const accounts = await web3.eth.getAccounts();
    if (!accounts?.[0]) throw new Error("Chưa connect MetaMask.");
    return accounts[0];
  }
  function getContract(web3) {
    if (!address) throw new Error("Chưa có address contract cho chainId này.");
    return new web3.eth.Contract(abi, address);
  }

  async function getContractAndWeb3() {
    const web3 = getWeb3();
    const contract = getContract(web3);
    return { web3, contract };
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
      const { contract, web3 } = await getContractAndWeb3();
      const accounts = await web3.eth.getAccounts();
      const from = accounts[0];
      if (!from) throw new Error("Chưa connect MetaMask.");

      return await contract.methods
        .registerItem(trimmedCode, trimmedPN, trimmedSN, trimmedName, trimmedLocation, metadataHash ?? "")
        .send({ from });
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
      const { contract, web3 } = await getContractAndWeb3();
      const accounts = await web3.eth.getAccounts();
      const from = accounts[0];
      if (!from) throw new Error("Chưa connect MetaMask.");

      return await contract.methods
        .transferItem(trimmedCode, trimmedDestination)
        .send({ from });
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
      const { contract, web3 } = await getContractAndWeb3();
      const accounts = await web3.eth.getAccounts();
      const from = accounts[0];
      if (!from) throw new Error("Chưa connect MetaMask.");

      return await contract.methods
        .updateLocation(trimmedCode, trimmedLocation)
        .send({ from });
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
      const { contract, web3 } = await getContractAndWeb3();
      const accounts = await web3.eth.getAccounts();
      const from = accounts[0];
      if (!from) throw new Error("Chưa connect MetaMask.");

      return await contract.methods
        .inspectItem(trimmedCode, nStatus, notesHash ?? "")
        .send({ from });
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function getItem({ code }) {
    const trimmedCode = String(code ?? "").trim();
    if (!trimmedCode) throw new Error("Thiếu code.");

    try {
      const { contract } = await getContractAndWeb3();
      return await contract.methods.getItem(trimmedCode).call();
    } catch (e) {
      throw new Error(formatError(e));
    }
  }

  async function listItems({ limit = 50 } = {}) {
    try {
      const { contract } = await getContractAndWeb3();
      const countStr = await contract.methods.itemCount().call();
      const total = Number(countStr);
      const items = [];

      for (let i = 0; i < Math.min(total, limit); i += 1) {
        const itemId = await contract.methods.itemIdAt(i).call();
        const itemRaw = await contract.methods.getItemById(itemId).call();
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
