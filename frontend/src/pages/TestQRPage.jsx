import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { useAviationStorage } from "../hooks/useAviationStorage.js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export function TestQRPage({ wallet }) {
  const api = useAviationStorage({ chainId: wallet.chainId });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef(null);

  const generatePdf = async () => {
    if (!result || !pdfRef.current) return;
    setIsExporting(true);
    try {
      const element = pdfRef.current;
      element.id = "cert-pdf-content";
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            #cert-pdf-content, #cert-pdf-content * {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: "Times New Roman", Times, serif !important;
              border: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
              border-radius: 0 !important;
            }
            #cert-pdf-content {
              padding: 40px !important;
            }
            #cert-pdf-content h4 {
              border-bottom: 1px solid #000000 !important;
              padding-bottom: 10px !important;
              margin-bottom: 20px !important;
            }
            #cert-pdf-content .avi-timeline-item {
              border-left: none !important;
              padding-left: 0 !important;
            }
            #cert-pdf-content .avi-timeline-icon {
              display: none !important;
            }
            #cert-pdf-content .no-export {
              display: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let finalWidth = pdfWidth;
      
      // Ép khung PDF vừa vặn đúng 1 trang A4
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        finalWidth = (canvas.width * pageHeight) / canvas.height;
      }

      const xOffset = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, "JPEG", xOffset, 0, finalWidth, imgHeight);

      pdf.save(`Aviation_Cert_${result.code}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Lỗi khi xuất PDF:", err);
      alert("Đã có lỗi xảy ra khi tạo chứng nhận PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const code = params.get('lookup');

    const fetchItemData = async (code) => {
      try {
        setLoading(true);

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
      
      {/* Nút Xuất PDF */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          className="avi-btn avi-btn--primary"
          onClick={generatePdf}
          disabled={isExporting}
          style={{ padding: '10px 20px', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {isExporting ? "⏳ Đang tạo PDF..." : "📄 Tải Chứng nhận (PDF)"}
        </button>
      </div>

      <div ref={pdfRef} className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)', padding: '20px' }}>
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
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Mã Phụ tùng (PN)</small> <br />
              <strong style={{ color: '#fff' }}>{result.partNumber}</strong>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Số Serial (SN)</small> <br />
              <strong style={{ color: 'var(--color-primary)' }}>{result.serialNumber}</strong>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Vị trí Lưu trữ</small> <br />
              <span style={{ color: '#00f0ff', background: 'rgba(0, 240, 255, 0.05)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4, border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                <span className="no-export">📍 </span>{result.location}
              </span>
            </div>

            <div>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Chứng nhận</small> <br />
              <strong style={{
                color: Number(result.lastInspectionStatus) === 3 ? '#9e9e9e' : Number(result.lastInspectionStatus) === 2 ? '#ff3366' : Number(result.lastInspectionStatus) === 1 ? '#00ff88' : '#ffaa00',
                display: 'inline-block', marginTop: 4, padding: '4px 8px',
                background: Number(result.lastInspectionStatus) === 3 ? 'rgba(158, 158, 158, 0.1)' : Number(result.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.1)' : Number(result.lastInspectionStatus) === 1 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                borderRadius: 4,
                border: `1px solid ${Number(result.lastInspectionStatus) === 3 ? 'rgba(158, 158, 158, 0.3)' : Number(result.lastInspectionStatus) === 2 ? 'rgba(255, 51, 102, 0.3)' : Number(result.lastInspectionStatus) === 1 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 170, 0, 0.3)'}`
              }}>
                <span className="no-export">
                  {Number(result.lastInspectionStatus) === 3 ? '🗑️ ' : Number(result.lastInspectionStatus) === 1 ? '✅ ' : Number(result.lastInspectionStatus) === 2 ? '❌ ' : '⏳ '}
                </span>
                {Number(result.lastInspectionStatus) === 3 ? 'Đã hủy bỏ (Scrapped)' : Number(result.lastInspectionStatus) === 1 ? 'Bình thường' : Number(result.lastInspectionStatus) === 2 ? 'Cần bảo dưỡng' : 'Chưa kiểm định'}
              </strong>
            </div>
          </div>

          <div className="avi-span2" style={{ marginTop: 20 }}>
            <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Mã băm dữ liệu (Blockchain Hash)</small> <br />
            <div style={{
              color: 'var(--color-primary)',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.85rem',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: 6,
              padding: '10px 12px',
              marginTop: 6,
              wordBreak: 'break-all',
              textShadow: '0 0 5px rgba(0, 240, 255, 0.2)'
            }}>
              <span style={{ opacity: 0.5 }}>0x</span>
              <span>{ethers.keccak256(ethers.toUtf8Bytes(
                (result.code || "") +
                (result.name || "") +
                (result.partNumber || "") +
                (result.serialNumber || "")
              )).slice(2)}</span>
            </div>
          </div>

          {result.metadataHash && (
            <div className="avi-span2" style={{ marginTop: 12 }}>
              <small style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Liên kết Dữ liệu (IPFS)</small> <br />
              <div style={{
                color: '#fff',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.85rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                padding: '8px 12px',
                marginTop: 6,
                wordBreak: 'break-all'
              }}>
                {result.metadataHash.replace('ipfs://', '')}
              </div>
            </div>
          )}

          {/* Vòng đời thiết bị (Timeline View) */}
          {result.history && result.history.length > 0 && (
            <div className="avi-span2" style={{ marginTop: 32 }}>
              <h4 style={{ margin: '0 0 16px', color: '#00f0ff', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="no-export" style={{ fontSize: '1.2rem' }}>⏱️</span> Lịch sử Vòng đời Thiết bị
              </h4>
              <div className="avi-timeline-container" style={{ position: 'relative', marginTop: 10, paddingLeft: 10 }}>
                {/* Đường kẻ dọc */}
                <div className="no-export" style={{ position: 'absolute', top: 0, bottom: 0, left: 24, width: 2, background: 'rgba(0, 240, 255, 0.2)' }}></div>
                
                {result.history.map((record, index) => {
                  const stamp = Number(record.timestamp);
                  const date = isNaN(stamp) ? "Unknown" : new Date(stamp * 1000).toLocaleString('vi-VN');
                  let actionColor = "rgba(255,255,255,0.7)";
                  let icon = "📝";
                  let actionName = record.action;
                  let displayDetails = record.details;

                  if (record.action === 'REGISTER') { 
                    actionColor = '#00f0ff'; icon = '📝'; actionName = 'ĐĂNG KÝ THIẾT BỊ'; 
                    displayDetails = 'Đăng ký mới vào hệ thống Blockchain Hàng không';
                  }
                  else if (record.action === 'TRANSFER') { 
                    actionColor = '#ffaa00'; icon = '🔄'; actionName = 'ĐIỀU CHUYỂN'; 
                    displayDetails = displayDetails.replace('Transferred to:', 'Điều chuyển tới máy bay:');
                  }
                  else if (record.action === 'UPDATE_LOCATION') { 
                    actionColor = '#b000ff'; icon = '📦'; actionName = 'CẬP NHẬT VỊ TRÍ'; 
                    displayDetails = displayDetails.replace('Received in location:', 'Nhập kho tại:')
                                                   .replace('Moved to:', 'Di chuyển tới kho:');
                  }
                  else if (record.action === 'INSPECT') { 
                    icon = "🔍"; 
                    actionColor = record.details.includes("Unserviceable") ? "#ff3366" : "#00ff88"; 
                    actionName = 'KIỂM ĐỊNH';
                    displayDetails = displayDetails.replace('Status marked as: Serviceable', 'Cập nhật trạng thái: Bình thường (Serviceable)')
                                                   .replace('Status marked as: Unserviceable', 'Cập nhật trạng thái: Cần bảo dưỡng (Unserviceable)');
                  }
                  else if (record.action === 'SCRAP') { 
                    actionColor = '#ff3366'; icon = '🧨'; actionName = 'GHI HỦY THIẾT BỊ'; 
                    displayDetails = 'Hủy bỏ thiết bị vĩnh viễn khỏi hệ thống';
                  }
                  else if (record.action === 'DEMOUNT') { 
                    actionColor = '#ffaa00'; icon = '🔧'; actionName = 'THÁO DỠ'; 
                    displayDetails = displayDetails.replace('Demounted from aircraft to location:', 'Tháo dỡ khỏi máy bay về kho:')
                                                   .replace('Removed from aircraft to:', 'Tháo khỏi máy bay đưa về kho:');
                  }

                  return (
                    <div key={index} className="avi-timeline-item" style={{ position: 'relative', paddingLeft: 40, marginBottom: 20 }}>
                      <div className="avi-timeline-icon" style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: `rgba(${parseInt(actionColor.slice(1,3), 16)}, ${parseInt(actionColor.slice(3,5), 16)}, ${parseInt(actionColor.slice(5,7), 16)}, 0.1)`,
                        border: `1px solid ${actionColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        zIndex: 2,
                        boxShadow: `0 0 10px rgba(${parseInt(actionColor.slice(1,3), 16)}, ${parseInt(actionColor.slice(3,5), 16)}, ${parseInt(actionColor.slice(5,7), 16)}, 0.3)`
                      }}>
                        <span className="no-export">{icon}</span>
                       </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid rgba(255, 255, 255, 0.05)`,
                        borderLeft: `3px solid ${actionColor}`,
                        padding: '12px',
                        borderRadius: '0 8px 8px 0',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <strong style={{ color: actionColor, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>{actionName}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{date}</span>
                        </div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: 4 }}>
                          {displayDetails}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace' }}>
                          Actor: {record.actor.substring(0, 6)}...{record.actor.substring(record.actor.length - 4)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: 16, background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="no-export" style={{ fontSize: '1.5rem' }}>🛡️</div>
            <div>
              <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 4 }}>Dữ liệu Blockchain hợp lệ</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Bản ghi này được bảo vệ bởi mạng blockchain, không thể làm giả hoặc sửa đổi trái phép. Reload trang để xác nhận dữ liệu vẫn tồn tại trên blockchain.</div>
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
