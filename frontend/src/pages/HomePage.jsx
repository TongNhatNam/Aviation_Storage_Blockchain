import { HashLink } from "../router/hashRouter.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { ItemViewer } from "../components/ItemViewer.jsx";
import { useAviationStorageEthers } from "../hooks/useAviationStorageEthers.js";

// Role data with associated images and descriptions
const ROLES_INFO = [
  {
    id: "admin",
    title: "Quản trị Hệ thống (System Admin)",
    imgSrc: "/role_admin.png",
    description: "Quản lý Role-Based Access Control (RBAC). Cấp phát và thu hồi quyền hạn của các địa chỉ ví khác tham gia vào hệ thống lưu trữ.",
    link: "/admin"
  },
  {
    id: "warehouse",
    title: "Vận hành Kho (Warehouse)",
    imgSrc: "/role_warehouse.png",
    description: "Mint (Khai sinh) các Digital Twin cho thiết bị, quản lý điều chuyển (Transfer) vật tư ra/vào máy bay, và thay đổi vị trí lưu kho.",
    link: "/warehouse"
  },
  {
    id: "engineer",
    title: "Kỹ sư Bảo dưỡng (Maintenance)",
    imgSrc: "/role_engineer.png",
    description: "Thực hiện kiểm định kỹ thuật định kỳ. Đóng dấu Serviceable (Dùng tốt) hoặc cắm cờ Red-Tag (AOG/Hỏng hóc) để chặn xuất kho vĩnh viễn.",
    link: "/engineer"
  }
];

export function HomePage({ wallet, roles }) {
  const connected = Boolean(wallet?.account);
  const onGanache = wallet?.chainId === 1337 || wallet?.chainId === 5777;
  const api = useAviationStorageEthers({ chainId: wallet.chainId });

  // Check if URL has lookup parameter
  const hasLookup = window.location.hash.includes('lookup=');

  // Scroll to ItemViewer when has lookup
  if (hasLookup) {
    setTimeout(() => {
      const element = document.querySelector('.avi-grid');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <div className="avi-grid">
      {hasLookup ? (
        <SectionCard
          title={
            <span className="avi-pageTitle">
              <span className="avi-pageIcon avi-pageIcon--dashboard" aria-hidden="true" />
              <span>Tra cứu từ QR Code</span>
            </span>
          }
          subtitle="Thông tin phụ tùng từ Blockchain"
        >
          <ItemViewer api={api} />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title={
              <span className="avi-pageTitle">
                <span className="avi-pageIcon avi-pageIcon--home" aria-hidden="true" />
                <span>ATC Terminal - Command Center</span>
              </span>
            }
            subtitle="Hệ thống kiểm soát và truy xuất nguồn gốc vật tư hàng không (Aviation Blockchain)"
          >
            <div className="avi-kpi">
              <div className={`avi-kpiItem ${connected ? "avi-kpiItem--ok" : "avi-kpiItem--warn"}`}>
                <div className="avi-kpiKey">MetaMask Uplink</div>
                <div className="avi-kpiVal">{connected ? "SECURE" : "OFFLINE"}</div>
              </div>
              <div className={`avi-kpiItem ${onGanache ? "avi-kpiItem--ok" : "avi-kpiItem--warn"}`}>
                <div className="avi-kpiKey">Network Frequency</div>
                <div className="avi-kpiVal">{onGanache ? `SYS-${wallet?.chainId}` : "UNSYNCED"}</div>
              </div>
              <div className={`avi-kpiItem ${roles?.address ? "avi-kpiItem--ok" : "avi-kpiItem--warn"}`}>
                <div className="avi-kpiKey">Smart Contract Registry</div>
                <div className="avi-kpiVal">{roles?.address ? "DEPLOYED" : "PENDING"}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Phân hệ Điều hành (Operations)"
            subtitle="Lựa chọn phân hệ chức năng tương ứng với quyền hạn của bạn"
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginTop: '16px'
            }}>
              {ROLES_INFO.map(role => (
                <div key={role.id} style={{
                  background: 'rgba(5, 15, 30, 0.95)',
                  border: '1px solid rgba(0, 240, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transform: 'translateZ(0)' // Force GPU acceleration
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--color-primary)',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
                    marginBottom: '16px',
                    transform: 'translateZ(0)' // Force GPU acceleration
                  }}>
                    <img
                      src={role.imgSrc}
                      alt={role.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback to a gradient if image generation failed or is missing
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = 'linear-gradient(135deg, var(--color-primary), #000)';
                      }}
                    />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '12px', margin: 0 }}>
                    {role.title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px', flex: 1 }}>
                    {role.description}
                  </p>
                  <HashLink to={role.link} className="avi-btn avi-btn--primary" style={{ width: '100%' }}>
                    Mở Bảng Điều Khiển
                  </HashLink>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
