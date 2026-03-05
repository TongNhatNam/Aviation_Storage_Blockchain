import { BrowserProvider, Contract } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import abi from "../contracts/AviationStorage.abi.json";
import deployedAddresses from "../contracts/deployedAddresses.json";
import { formatError } from "../utils/error.js";

function getContractAddress(chainId) {
  if (!chainId) return undefined;
  const chainKey = String(chainId);
  return deployedAddresses?.[chainKey]?.AviationStorage;
}

function lower(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function useAviationRoles({ chainId, account }) {
  const address = useMemo(() => getContractAddress(chainId), [chainId]);
  const [state, setState] = useState({
    loading: false,
    admin: undefined,
    isAdmin: false,
    isWarehouse: false,
    isEngineer: false,
    error: undefined,
  });

  const refresh = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({ ...s, loading: false, error: "Chưa có MetaMask." }));
      return;
    }
    if (!address) {
      setState((s) => ({ ...s, loading: false, error: "Chưa có address contract cho chainId này." }));
      return;
    }
    if (!account) {
      setState((s) => ({
        ...s,
        loading: false,
        admin: undefined,
        isAdmin: false,
        isWarehouse: false,
        isEngineer: false,
        error: undefined,
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const provider = new BrowserProvider(window.ethereum);
      const code = await provider.getCode(address);
      if (!code || code === "0x") {
        setState({
          loading: false,
          admin: undefined,
          isAdmin: false,
          isWarehouse: false,
          isEngineer: false,
          error: "Không thấy contract tại address hiện tại. Có thể Ganache vừa restart. Hãy chạy lại npm run dev (deploy + seed) rồi refresh trang.",
        });
        return;
      }
      const contract = new Contract(address, abi, provider);
      const [admin, isWarehouse, isEngineer] = await Promise.all([
        contract.admin(),
        contract.isWarehouseStaff(account),
        contract.isEngineer(account),
      ]);
      setState({
        loading: false,
        admin,
        isAdmin: lower(admin) === lower(account),
        isWarehouse: Boolean(isWarehouse),
        isEngineer: Boolean(isEngineer),
        error: undefined,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: formatError(e) }));
    }
  }, [account, address]);

  useEffect(() => {
    refresh().catch(() => { });
  }, [refresh]);

  return {
    address,
    ...state,
    refresh,
  };
}
