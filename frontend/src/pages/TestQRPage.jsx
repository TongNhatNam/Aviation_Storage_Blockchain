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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ color: 'var(--color-primary)', fontSize: '1.1rem', letterSpacing: 1, textTransform: 'uppercase' }}>Đang kết nối vệ tinh...</div>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 600, margin: '0 auto', color: '#fff' }}>
        <div className="avi-card" style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', boxShadow: '0 0 20px rgba(255, 51, 102, 0.1)' }}>
          <div className="avi-cardBody" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', color: '#ff3366', textTransform: 'uppercase', letterSpacing: 1 }}>Lỗi Truy Xuất Blockchain</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 600, margin: '0 auto', color: '#fff' }}>
        <div className="avi-card" style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', boxShadow: '0 0 20px rgba(255, 170, 0, 0.1)' }}>
          <div className="avi-cardBody" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <h3 style={{ margin: '0 0 10px', color: '#ffaa00', textTransform: 'uppercase', letterSpacing: 1 }}>Không tìm thấy dữ liệu</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Vui lòng quét lại mã QR hoặc kiểm tra URL.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: 600, margin: '0 auto', color: '#fff' }}>
      <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' }}>
        <div className="avi-cardBody">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: 8, border: '1px solid rgba(0, 240, 255, 0.2)' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>System Code (PN-SN)</div>
              <div style={{ color: 'var(--color-primary)', fontFamily: 'Space Mono, monospace', fontSize: '1.4rem', textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>{result.code}</div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 20px', color: '#fff', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
            Thông tin Chi tiết
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="avi-span2">
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Tên Mô tả</small> <br />
              <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{result.name}</strong>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Part Number</small> <br />
              <strong style={{ color: '#fff' }}>{result.partNumber}</strong>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Serial Number</small> <br />
              <strong style={{ color: 'var(--color-primary)' }}>{result.serialNumber}</strong>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Vị trí Lưu trữ</small> <br />
              <span style={{ color: '#00f0ff', background: 'rgba(0, 240, 255, 0.05)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4, border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                📍 {result.location}
              </span>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Chứng nhận</small> <br />
              <strong style={{
                color: Number(result.lastInspectionStatus) === 2 ? '#ff3366' : Number(result.lastInspectionStatus) === 1 ? '#00ff88' : '#ffaa00',
                display: 'inline-block', marginTop: 4, padding: '4px 8px',
                background: Number(result.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.1)' : Number(result.lastInspectionStatus) === 1 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                borderRadius: 4,
                border: `1px solid ${Number(result.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.3)' : Number(result.lastInspectionStatus) === 1 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 170, 0, 0.3)'}`
              }}>
                {Number(result.lastInspectionStatus) === 1 ? '✅ Serviceable' : Number(result.lastInspectionStatus) === 2 ? '❌ Unserviceable' : '⏳ Chưa kiểm định'}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '1.5rem' }}>🛡️</div>
            <div>
              <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 4 }}>Dữ liệu Blockchain hợp lệ</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Bản ghi này được bảo vệ bởi mạng blockchain, không thể làm giả hoặc sửa đổi trái phép.</div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
