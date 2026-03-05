import { useCallback, useEffect, useMemo, useState } from "react";
import { formatError } from "../utils/error.js";

const GANACHE_CHAIN_ID_DEC = 1337;
const GANACHE_CHAIN_ID_HEX = "0x539";
const GANACHE_RPC_URL = import.meta.env.VITE_GANACHE_RPC_URL || "http://127.0.0.1:8787";

function getEthereum() {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

function parseChainId(chainId) {
  if (chainId == null) return undefined;
  if (typeof chainId === "number") return chainId;
  if (typeof chainId === "bigint") return Number(chainId);
  if (typeof chainId === "string") {
    if (chainId.startsWith("0x")) return Number.parseInt(chainId, 16);
    return Number.parseInt(chainId, 10);
  }
  return undefined;
}

export function useMetaMask() {
  const ethereum = useMemo(() => getEthereum(), []);
  const [account, setAccount] = useState(undefined);
  const [chainId, setChainId] = useState(undefined);
  const [error, setError] = useState(undefined);

  const isAvailable = Boolean(ethereum);
  const isConnected = Boolean(account);

  const refresh = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;

    const [nextAccount] = await eth.request({ method: "eth_accounts" });
    const nextChainId = await eth.request({ method: "eth_chainId" });
    setAccount(nextAccount);
    setChainId(parseChainId(nextChainId));
  }, []);

  const connect = useCallback(async () => {
    setError(undefined);
    const eth = getEthereum();
    if (!eth) {
      setError("Chưa có MetaMask (window.ethereum).");
      return;
    }

    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const nextChainId = await eth.request({ method: "eth_chainId" });
      setAccount(accounts?.[0]);
      setChainId(parseChainId(nextChainId));
    } catch (e) {
      setError(formatError(e));
    }
  }, []);

  const addOrSwitchGanache = useCallback(async () => {
    setError(undefined);
    const eth = getEthereum();
    if (!eth) {
      setError("Chưa có MetaMask (window.ethereum).");
      return;
    }

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: GANACHE_CHAIN_ID_HEX }],
      });
      await refresh();
      return;
    } catch (e) {
      const code = e?.code;
      if (code !== 4902) {
        setError(formatError(e));
        return;
      }
    }

    try {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: GANACHE_CHAIN_ID_HEX,
            chainName: "Ganache Local",
            rpcUrls: [GANACHE_RPC_URL],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          },
        ],
      });
      await refresh();
    } catch (e) {
      setError(formatError(e));
    }
  }, [refresh]);

  const connectAndSwitchGanache = useCallback(async () => {
    await connect();
    await addOrSwitchGanache();
  }, [addOrSwitchGanache, connect]);

  useEffect(() => {
    if (!ethereum) return;

    refresh().catch(() => { });

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0]);
    };

    const handleChainChanged = (nextChainId) => {
      setChainId(parseChainId(nextChainId));
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [ethereum, refresh]);

  return {
    ethereum,
    isAvailable,
    isConnected,
    account,
    chainId,
    ganache: {
      chainIdDec: GANACHE_CHAIN_ID_DEC,
      rpcUrl: GANACHE_RPC_URL,
    },
    connect,
    addOrSwitchGanache,
    connectAndSwitchGanache,
    error,
    refresh,
  };
}
