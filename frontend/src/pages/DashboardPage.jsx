import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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

  const exportToCSV = () => {
    if (!stats || !stats.items.length) return;

    // BOM để hỗ trợ tiếng Việt trên Excel
    const BOM = "\uFEFF";
    
    // Header dòng đầu tiên
    const headers = ["Mã Thiết Bị (Code)", "Tên Phụ Tùng", "Số Part Number", "Số Serial Number", "Vị Trí Hiện Tại", "Trạng Thái Kiểm Định"];
    let csvContent = BOM + headers.join(",") + "\n";

    stats.items.forEach(({ item }) => {
      const statusText = 
          Number(item.lastInspectionStatus) === 1 ? "Serviceable" 
        : Number(item.lastInspectionStatus) === 2 ? "Unserviceable" 
        : Number(item.lastInspectionStatus) === 3 ? "Scrapped" 
        : "Pending";
      
      const row = [
        `"${item.code}"`,
        `"${item.name}"`,
        `"${item.partNumber}"`,
        `"${item.serialNumber}"`,
        `"${item.location}"`,
        `"${statusText}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Blockchain_Warehouse_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="avi-grid">
      <SectionCard
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span className="avi-pageTitle">
              <span className="avi-pageIcon avi-pageIcon--dashboard" aria-hidden="true" />
              <span>Thống Kê Tổng Quan</span>
            </span>
            {stats && (
              <button 
                className="avi-btn avi-btn--primary" 
                onClick={exportToCSV}
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: 1 }}
              >
                <span>📥</span> Tải Báo cáo Kho (CSV)
              </button>
            )}
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
            {/* Status Chart */}
            <SectionCard title="📈 Phân Bố Trạng Thái" subtitle="Tình trạng kỹ thuật phụ tùng">
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', height: 250 }}>
                {stats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Serviceable', value: stats.serviceable, color: '#00ff88' },
                          { name: 'Unserviceable', value: stats.unserviceable, color: '#ff3366' },
                          { name: 'Chờ Kiểm Định', value: stats.unknown, color: 'rgba(255,255,255,0.4)' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {
                          [
                            { name: 'Serviceable', value: stats.serviceable, color: '#00ff88' },
                            { name: 'Unserviceable', value: stats.unserviceable, color: '#ff3366' },
                            { name: 'Chờ Kiểm Định', value: stats.unknown, color: 'rgba(255,255,255,0.4)' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color})` }} />
                          ))
                        }
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: 8, color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chưa có dữ liệu</div>
                )}
              </div>
            </SectionCard>

            {/* Location Chart */}
            <SectionCard title="📍 Phân Bố Theo Kho" subtitle="Số lượng phụ tùng tại mỗi vị trí">
              <div style={{ marginTop: 20, height: 250 }}>
                {stats.total > 0 && Object.keys(stats.locations).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(stats.locations).map(([name, value]) => ({ name, value }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0, 240, 255, 0.05)' }}
                        contentStyle={{ background: 'rgba(5, 15, 30, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: 8, color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#00f0ff" radius={[0, 4, 4, 0]} maxBarSize={30}>
                        {
                          Object.entries(stats.locations).map((entry, index) => (
                            <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0 0 5px #00f0ff)' }} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Chưa có dữ liệu</div>
                )}
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
