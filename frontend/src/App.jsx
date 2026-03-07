import { Component, Suspense, lazy, useMemo, useState } from "react";
import "./styles/App.css";
import { AviationShell } from "./components/AviationShell.jsx";
import { useAviationStorageEthers } from "./hooks/useAviationStorageEthers.js";
import { useAviationStorageWeb3 } from "./hooks/useAviationStorageWeb3.js";
import { useAviationRoles } from "./hooks/useAviationRoles.js";
import { useMetaMask } from "./hooks/useMetaMask.js";
import { useHashPath } from "./router/hashPath.js";

const HomePage = lazy(() => import("./pages/HomePage.jsx").then((m) => ({ default: m.HomePage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx").then((m) => ({ default: m.DashboardPage })));
const TestQRPage = lazy(() => import("./pages/TestQRPage.jsx").then((m) => ({ default: m.TestQRPage })));
const WarehousePage = lazy(() => import("./pages/WarehousePage.jsx").then((m) => ({ default: m.WarehousePage })));
const EngineerPage = lazy(() => import("./pages/EngineerPage.jsx").then((m) => ({ default: m.EngineerPage })));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx").then((m) => ({ default: m.AdminPage })));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message =
      this.state.error?.message ||
      this.state.error?.shortMessage ||
      String(this.state.error);

    return (
      <div style={{ padding: 20 }}>
        <div className="avi-alert avi-alert--error">UI bị lỗi runtime và đã dừng render.</div>
        <div className="avi-muted" style={{ marginTop: 10 }}>
          {message}
        </div>
        <div className="avi-inline" style={{ marginTop: 12 }}>
          <button className="avi-btn avi-btn--primary" onClick={() => window.location.reload()}>
            Reload trang
          </button>
        </div>
      </div>
    );
  }
}

function App() {
  const wallet = useMetaMask();
  const [library, setLibrary] = useState("ethers");
  const path = useHashPath();

  const ethersApi = useAviationStorageEthers({ chainId: wallet.chainId });
  const web3Api = useAviationStorageWeb3({ chainId: wallet.chainId });
  const api = library === "web3" ? web3Api : ethersApi;

  const roles = useAviationRoles({ chainId: wallet.chainId, account: wallet.account });
  const contractAddress = api.address;

  const page = useMemo(() => {
    const hash = window.location.hash;
    if (hash.includes('lookup=')) return "testqr";
    if (path === "/") return "home";
    if (path === "/dashboard") return "dashboard";
    if (path === "/admin") return "admin";
    if (path === "/warehouse") return "warehouse";
    if (path === "/engineer") return "engineer";
    return "home";
  }, [path]);

  return (
    <ErrorBoundary>
      <AviationShell wallet={wallet} roles={roles} library={library} onLibraryChange={setLibrary}>
        <Suspense fallback={<div className="avi-alert avi-alert--warn">Đang tải trang…</div>}>
          {page === "home" ? <HomePage wallet={wallet} roles={roles} /> : null}
          {page === "testqr" ? <TestQRPage wallet={wallet} /> : null}
          {page === "dashboard" ? <DashboardPage api={api} /> : null}
          {page === "warehouse" ? <WarehousePage wallet={wallet} roles={roles} api={api} /> : null}
          {page === "engineer" ? <EngineerPage wallet={wallet} roles={roles} api={api} /> : null}
          {page === "admin" ? (
            <AdminPage wallet={wallet} roles={roles} contractAddress={contractAddress} onRoleChanged={() => roles.refresh()} />
          ) : null}
        </Suspense>
      </AviationShell>
    </ErrorBoundary>
  );
}

export default App;
