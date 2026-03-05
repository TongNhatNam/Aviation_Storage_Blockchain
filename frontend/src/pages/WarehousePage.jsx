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
        right={<img className="avi-pageBadge" src="/role_warehouse.png" alt="Warehouse" />}
      >
        {!ready ? (
          <div className="avi-alert avi-alert--warn">Hãy connect MetaMask và chuyển sang Ganache 1337.</div>
        ) : null}
        {ready && !allowed ? (
          <div className="avi-alert avi-alert--error">
            Account hiện tại không có quyền Warehouse. Hãy chuyển sang Account index 1 (0x7099…) hoặc Admin.
          </div>
        ) : null}
      </SectionCard>

      <div className="avi-columns">
        <div className="avi-col">
          <WarehouseActions api={api} disabled={!ready || !allowed} onActionDone={() => wallet?.refresh?.()} />
        </div>
        <div className="avi-col">
          <SectionCard title="Tra cứu & danh sách" subtitle="Xem lịch sử cập nhật và trạng thái kiểm định">
            <ItemViewer api={api} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
