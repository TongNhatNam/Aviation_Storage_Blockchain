import { SectionCard } from "../components/SectionCard.jsx";
import { EngineerActions } from "../components/EngineerActions.jsx";
import { ItemViewer } from "../components/ItemViewer.jsx";

export function EngineerPage({ wallet, roles, api }) {
  const ready = Boolean(wallet?.account) && wallet?.chainId === 1337;
  const allowed = Boolean(roles?.isEngineer) || Boolean(roles?.isAdmin);

  return (
    <div className="avi-grid">
      <SectionCard title="Kỹ sư kiểm định" subtitle="Cập nhật kiểm định cho vật tư/phụ tùng theo chuẩn bảo trì">
        {!ready ? (
          <div className="avi-alert avi-alert--warn">Hãy connect MetaMask và chuyển sang Ganache 1337.</div>
        ) : null}
        {ready && !allowed ? (
          <div className="avi-alert avi-alert--error">
            Account hiện tại không có quyền Engineer. Hãy chuyển sang Account index 2 (0x3c44…) hoặc Admin.
          </div>
        ) : null}
      </SectionCard>

      <div className="avi-columns">
        <div className="avi-col">
          <EngineerActions api={api} disabled={!ready || !allowed} onActionDone={() => wallet?.refresh?.()} />
        </div>
        <div className="avi-col">
          <SectionCard title="Tra cứu & danh sách" subtitle="Kiểm tra status và hash biên bản">
            <ItemViewer api={api} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
