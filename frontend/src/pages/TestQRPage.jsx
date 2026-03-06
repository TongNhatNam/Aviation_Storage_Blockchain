import { useEffect, useState } from "react";
import { useAviationStorageEthers } from "../hooks/useAviationStorageEthers.js";

export function TestQRPage({ wallet }) {
  const api = useAviationStorageEthers({ chainId: wallet.chainId });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const code = params.get('lookup');

    const fetchItemData = async (code) => {
      try {
        setLoading(true);
        let currentApi = api;

        // Nếu không có MetaMask (chainId rỗng) hoặc sai chain, dùng fallback provider
        if (!api?.isDeployedOnThisChain) {
          const ethers = await import('ethers');
          const abi = (await import('../contracts/AviationStorage.abi.json')).default;
          const addresses = (await import('../contracts/deployedAddresses.json')).default;

          const chainId = "1337";
          const contractAddress = addresses[chainId]?.AviationStorage;

          if (!contractAddress) {
            throw new Error("Không tìm thấy địa chỉ contract");
          }

          // Lấy RPC port từ env (nếu có)
          const envRpcUrl = import.meta.env.VITE_GANACHE_RPC_URL || "http://127.0.0.1:8788";
          const portMatch = envRpcUrl.match(/:(\d+)\/?$/);
          const port = portMatch ? portMatch[1] : "8788";

          // Tạo một provider trực tiếp từ RPC của Ganache chạy cùng IP của frontend
          const rpcUrl = `http://${window.location.hostname}:${port}`;
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const contract = new ethers.Contract(contractAddress, abi, provider);

          // Gọi getItem
          const item = await contract.getItem(code);
          setResult(item);
        } else {
          const item = await api.getItem({ code });
          setResult(item);
        }
      } catch (err) {
        console.error(err);
        setResult({ error: err.message });
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchItemData(code);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api?.isDeployedOnThisChain, wallet?.chainId]);

  if (loading) {
    return <div style={{ padding: 40, color: '#fff', fontSize: 20 }}>⏳ Đang tải từ blockchain...</div>;
  }

  if (result?.error) {
    return <div style={{ padding: 40, color: 'red', fontSize: 20 }}>❌ Lỗi: {result.error}</div>;
  }

  if (!result) {
    return <div style={{ padding: 40, color: '#fff', fontSize: 20 }}>❌ Không tìm thấy code trong URL</div>;
  }

  return (
    <div style={{ padding: 40, color: '#fff' }}>
      <h1 style={{ color: 'var(--color-primary)' }}>✅ Kết quả QR Code</h1>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <p><strong>Code:</strong> {result.code}</p>
        <p><strong>Tên:</strong> {result.name}</p>
        <p><strong>Part Number:</strong> {result.partNumber}</p>
        <p><strong>Serial Number:</strong> {result.serialNumber}</p>
        <p><strong>Vị trí:</strong> {result.location}</p>
        <p><strong>Trạng thái:</strong> {Number(result.lastInspectionStatus) === 1 ? '✅ Serviceable' : Number(result.lastInspectionStatus) === 2 ? '❌ Unserviceable' : '⏳ Chưa kiểm định'}</p>
      </div>
    </div>
  );
}
