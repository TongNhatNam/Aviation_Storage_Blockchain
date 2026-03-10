import { SectionCard } from "../components/SectionCard.jsx";
import { EngineerActions } from "../components/EngineerActions.jsx";
import { ItemViewer } from "../components/ItemViewer.jsx";

export function EngineerPage({ wallet, roles, api, addNotification }) {
  const ready = Boolean(wallet?.account) && wallet?.chainId === 1337;
  const allowed = Boolean(roles?.isEngineer) || Boolean(roles?.isAdmin);

  return (
    <div className="avi-grid">
      <SectionCard
        title={
          <span className="avi-pageTitle">
            <span className="avi-pageIcon avi-pageIcon--engineer" aria-hidden="true" />
            <span>Kỹ sư kiểm định</span>
          </span>
        }
        subtitle="Cập nhật kiểm định cho vật tư/phụ tùng theo chuẩn bảo trì"
        right={<img className="avi-pageBadge" src="/role_engineer.png" alt="Engineer" style={{ width: 120, height: 120 }} />}
      >
        {!ready ? (
          <div className="avi-alert avi-alert--warn">Hãy connect MetaMask và chuyển sang Ganache 1337.</div>
        ) : null}
        {ready && !allowed ? (
          <div>
            <div className="avi-alert avi-alert--error" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 8 }}>⚠️ Không có quyền truy cập</div>
              <div>Account hiện tại không có quyền <strong>Engineer</strong>.</div>
            </div>
            <div className="avi-card" style={{ background: 'rgba(5, 15, 30, 0.95)', padding: 20 }}>
              <h3 style={{ color: 'var(--color-primary)', marginTop: 0 }}>🔑 Cách lấy quyền:</h3>
              <ol style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
                <li>Mở MetaMask và chuyển sang <strong>Account #2</strong> (0x3c44…) - Maintenance Engineer</li>
                <li>Hoặc chuyển sang <strong>Account #0</strong> (0xf39f…) - Admin (có tất cả quyền)</li>
                <li>Hoặc liên hệ Admin để cấp quyền cho account hiện tại</li>
              </ol>
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(0, 240, 255, 0.1)', borderRadius: 4, borderLeft: '3px solid var(--color-primary)' }}>
                <strong>💡 Ghi chú:</strong> Chỉ có account được Admin cấp quyền <strong>Engineer</strong> mới có thể kiểm định phụ tùng.
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>

      {ready && allowed && (
        <div className="avi-columns">
          <div className="avi-col">
            <EngineerActions api={api} disabled={false} onActionDone={() => wallet?.refresh?.()} addNotification={addNotification} />
          </div>
          <div className="avi-col">
            <SectionCard title="Tra cứu & danh sách" subtitle="Kiểm tra status và hash biên bản">
              <ItemViewer api={api} />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
