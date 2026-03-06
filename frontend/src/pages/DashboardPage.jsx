import { useEffect, useState } from "react";
import { SectionCard } from "../components/SectionCard.jsx";

export function DashboardPage({ api }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!api?.isDeployedOnThisChain) return;

    async function loadStats() {
      setLoading(true);
      try {
        const data = await api.listItems({ limit: 100 });
        const items = data.items || [];

        const serviceable = items.filter(i => Number(i.item.lastInspectionStatus) === 1).length;
        const unserviceable = items.filter(i => Number(i.item.lastInspectionStatus) === 2).length;
        const unknown = items.filter(i => Number(i.item.lastInspectionStatus) === 0).length;

        const locationMap = {};
        items.forEach(i => {
          const loc = i.item.location || "Unknown";
          locationMap[loc] = (locationMap[loc] || 0) + 1;
        });

        setStats({
          total: items.length,
          serviceable,
          unserviceable,
          unknown,
          locations: locationMap,
          items
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [api]);

  if (!api?.isDeployedOnThisChain) {
    return (
      <div className="avi-alert avi-alert--warn">
        Vui lòng kết nối MetaMask và chuyển sang mạng Ganache (Chain ID: 1337)
      </div>
    );
  }

  return (
    <div className="avi-grid">
      <SectionCard
        title={
          <span className="avi-pageTitle">
            <span className="avi-pageIcon avi-pageIcon--dashboard" aria-hidden="true" />
            <span>Thống Kê Tổng Quan</span>
          </span>
        }
        subtitle="Tổng quan hệ thống quản lý vật tư hàng không trên Blockchain"
      >
        {loading && <div style={{ color: 'rgba(255,255,255,0.6)' }}>Đang tải dữ liệu từ blockchain...</div>}
      </SectionCard>

      {stats && (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)' }}>
              <div className="avi-cardBody" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-primary)', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>{stats.total}</div>
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tổng Phụ Tùng</div>
              </div>
            </div>

            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 255, 136, 0.3)', boxShadow: '0 0 15px rgba(0, 255, 136, 0.1)' }}>
              <div className="avi-cardBody" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-success)', textShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }}>{stats.serviceable}</div>
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Serviceable</div>
              </div>
            </div>

            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(255, 51, 102, 0.3)', boxShadow: '0 0 15px rgba(255, 51, 102, 0.1)' }}>
              <div className="avi-cardBody" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-danger)', textShadow: '0 0 10px rgba(255, 51, 102, 0.5)' }}>{stats.unserviceable}</div>
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Unserviceable</div>
              </div>
            </div>

            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div className="avi-cardBody" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>{stats.unknown}</div>
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Chờ Kiểm Định</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Status Chart */}
            <SectionCard title="📈 Phân Bố Trạng Thái" subtitle="Tình trạng kỹ thuật phụ tùng">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                    <span>Serviceable</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{stats.serviceable} ({stats.total > 0 ? Math.round(stats.serviceable / stats.total * 100) : 0}%)</span>
                  </div>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                    <div style={{
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.serviceable / stats.total * 100) : 0}%`,
                      backgroundColor: '#00ff88',
                      boxShadow: '0 0 10px #00ff88',
                      transition: 'width 0.5s ease-in-out'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                    <span>Unserviceable</span>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{stats.unserviceable} ({stats.total > 0 ? Math.round(stats.unserviceable / stats.total * 100) : 0}%)</span>
                  </div>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255, 51, 102, 0.2)' }}>
                    <div style={{
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.unserviceable / stats.total * 100) : 0}%`,
                      backgroundColor: '#ff3366',
                      boxShadow: '0 0 10px #ff3366',
                      transition: 'width 0.5s ease-in-out'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                    <span>Chờ Kiểm Định</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{stats.unknown} ({stats.total > 0 ? Math.round(stats.unknown / stats.total * 100) : 0}%)</span>
                  </div>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{
                      height: '100%',
                      width: `${stats.total > 0 ? (stats.unknown / stats.total * 100) : 0}%`,
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      transition: 'width 0.5s ease-in-out'
                    }}></div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Location Chart */}
            <SectionCard title="📍 Phân Bố Theo Kho" subtitle="Số lượng phụ tùng tại mỗi vị trí">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                {Object.entries(stats.locations).sort((a, b) => b[1] - a[1]).map(([loc, count]) => (
                  <div key={loc}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ fontFamily: 'monospace' }}>{loc}</span>
                      <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                      <div style={{
                        height: '100%',
                        width: `${(count / stats.total * 100)}%`,
                        backgroundColor: '#00f0ff',
                        boxShadow: '0 0 8px #00f0ff',
                        transition: 'width 0.5s ease-in-out'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Recent Items */}
          <SectionCard title="🕐 Phụ Tùng Mới Nhất" subtitle="5 phụ tùng được đăng ký gần đây">
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Code</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Tên</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Vị trí</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.items.slice(0, 5).map(({ itemId, item }) => {
                    const status = Number(item.lastInspectionStatus);
                    const statusText = status === 1 ? 'Serviceable' : status === 2 ? 'Unserviceable' : 'Chờ kiểm định';
                    const statusColor = status === 1 ? 'var(--color-success)' : status === 2 ? 'var(--color-danger)' : 'rgba(255,255,255,0.5)';

                    return (
                      <tr key={itemId} style={{ background: status === 2 ? 'rgba(255, 51, 102, 0.05)' : 'transparent', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'} onMouseOut={(e) => e.currentTarget.style.background = status === 2 ? 'rgba(255, 51, 102, 0.05)' : 'transparent'}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-primary)', fontFamily: 'Space Mono, monospace', fontSize: '0.9rem' }}>{item.code}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{item.name}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)' }}>{item.location}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: statusColor, fontWeight: status === 1 || status === 2 ? 'bold' : 'normal' }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: statusColor, marginRight: 8, boxShadow: `0 0 8px ${statusColor}` }}></span>
                          {statusText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
