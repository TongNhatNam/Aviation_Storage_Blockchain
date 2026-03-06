import { SectionCard } from "../components/SectionCard.jsx";
import { WarehouseActions } from "../components/WarehouseActions.jsx";
import { ItemViewer } from "../components/ItemViewer.jsx";

export function WarehousePage({ wallet, roles, api }) {
  const ready = Boolean(wallet?.account) && wallet?.chainId === 1337;
  const allowed = Boolean(roles?.isWarehouse) || Boolean(roles?.isAdmin);

  return (
    <div className="avi-grid">
      <SectionCard
        title={
          <span className="avi-pageTitle">
            <span className="avi-pageIcon avi-pageIcon--warehouse" aria-hidden="true" />
            <span>Kho hàng không</span>
          </span>
        }
        subtitle="Nghiệp vụ nhập/xuất/cộng kho vật tư & phụ tùng"
        right={<img className="avi-pageBadge" src="/role_warehouse.png" alt="Warehouse" style={{ width: 120, height: 120 }} />}
      >
        {!ready ? (
          <div className="avi-alert avi-alert--warn">Hãy connect MetaMask và chuyển sang Ganache 1337.</div>
        ) : null}
        {ready && !allowed ? (
          <div>
            <div className="avi-alert avi-alert--error" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 8 }}>⚠️ Không có quyền truy cập</div>
              <div>Account hiện tại không có quyền <strong>Warehouse</strong>.</div>
            </div>
            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', padding: 20 }}>
              <h3 style={{ color: 'var(--color-primary)', marginTop: 0 }}>🔑 Cách lấy quyền:</h3>
              <ol style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
                <li>Mở MetaMask và chuyển sang <strong>Account #1</strong> (0x7099…) - Warehouse Manager</li>
                <li>Hoặc chuyển sang <strong>Account #0</strong> (0xf39f…) - Admin (có tất cả quyền)</li>
                <li>Hoặc liên hệ Admin để cấp quyền cho account hiện tại</li>
              </ol>
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(0, 240, 255, 0.1)', borderRadius: 4, borderLeft: '3px solid var(--color-primary)' }}>
                <strong>💡 Ghi chú:</strong> Chỉ có account được Admin cấp quyền <strong>Warehouse</strong> mới có thể nhập/xuất kho.
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>

      {ready && allowed && (
        <div className="avi-columns">
          <div className="avi-col">
            <WarehouseActions api={api} disabled={false} onActionDone={() => wallet?.refresh?.()} />
          </div>
          <div className="avi-col">
            <SectionCard title="Tra cứu & danh sách" subtitle="Xem lịch sử cập nhật và trạng thái kiểm định">
              <ItemViewer api={api} />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
