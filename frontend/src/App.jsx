import React, { Component, Suspense, lazy, useMemo, useState } from "react";
import "./styles/App.css";
import { AviationShell } from "./components/AviationShell.jsx";
import { useAviationStorage } from "./hooks/useAviationStorage.js";
import { useAviationRoles } from "./hooks/useAviationRoles.js";
import { useMetaMask } from "./hooks/useMetaMask.js";
import { useHashPath } from "./router/hashPath.js";
import { useNotification, NotificationContainer } from "./components/Notifications.jsx";

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
  // Check if we have lookup parameter to skip intro
  const hasLookupParam = useMemo(() => {
    return window.location.hash.includes('lookup=');
  }, []);
  
  const [showIntro, setShowIntro] = useState(!hasLookupParam);
  const [introPhase, setIntroPhase] = useState(1);
  const [progress, setProgress] = useState(0);
  const wallet = useMetaMask();
  const path = useHashPath();
  const { notifications, addNotification, removeNotification } = useNotification();

  const api = useAviationStorage({ chainId: wallet.chainId, isMockMode: wallet.isMockMode });
  const roles = useAviationRoles({ chainId: wallet.chainId, account: wallet.account, isMockMode: wallet.isMockMode });
  const contractAddress = api.address;
  const isMockMode = wallet.isMockMode;

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

  // Intro animation logic
  React.useEffect(() => {
    if (!showIntro) return;

    // Phase 1: Progress bar (3s)
    if (introPhase === 1) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIntroPhase(2), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 60);
      return () => clearInterval(interval);
    }

    // Phase 2: Project info (8s)
    if (introPhase === 2) {
      const timer = setTimeout(() => setIntroPhase(3), 8000);
      return () => clearTimeout(timer);
    }

    // Phase 3: Ready (2s + manual)
    if (introPhase === 3) {
      const timer = setTimeout(() => setShowIntro(false), 18000); // Auto-skip after 18s total
      return () => clearTimeout(timer);
    }
  }, [showIntro, introPhase]);

  return (
    <ErrorBoundary>
      {/* Aviation Intro - 3 Phases */}
      {showIntro && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0A0F1C 0%, #1A2332 50%, #242B3D 100%)',
          color: '#E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          fontFamily: '"Orbitron", "Exo 2", "Segoe UI", monospace'
        }}>

          {/* HUD Scanning Lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 240, 255, 0.02) 2px, rgba(0, 240, 255, 0.02) 4px)',
            animation: 'hudScan 4s linear infinite',
            pointerEvents: 'none'
          }}></div>

          {/* Phase 1: System Boot */}
          {introPhase === 1 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-in' }}>
              <div style={{
                fontSize: '2.2rem',
                fontWeight: '800',
                color: '#00F0FF',
                marginBottom: '2rem',
                textShadow: '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2)',
                letterSpacing: '3px',
                textTransform: 'uppercase'
              }}>
                AVIONICS SYSTEM INITIALIZATION
              </div>

              <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{
                  width: '450px',
                  height: '10px',
                  background: 'rgba(0, 240, 255, 0.12)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '2px solid #00F0FF',
                  boxShadow: '0 0 15px rgba(0, 240, 255, 0.15)'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #00F0FF, #0066FF)',
                    width: `${progress}%`,
                    transition: 'width 0.15s ease',
                    boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
                  }}></div>
                </div>
                <div style={{ fontSize: '1.4rem', color: '#FFAA00', fontWeight: '700', minWidth: '60px', textShadow: '0 0 10px rgba(255, 170, 0, 0.3)' }}>
                  {progress}%
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontSize: '1.1rem', color: '#00FF88', fontWeight: '800', margin: '0.5rem 0', opacity: progress > 30 ? 1 : 0, transition: 'opacity 0.5s', textShadow: '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)' }}>
                  ✈ FLIGHT MANAGEMENT SYSTEM: READY
                </div>
                <div style={{ fontSize: '1.1rem', color: '#00FF88', fontWeight: '800', margin: '0.5rem 0', opacity: progress > 60 ? 1 : 0, transition: 'opacity 0.5s', textShadow: '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)' }}>
                  ✈ NAVIGATION DATABASE: LOADED
                </div>
                <div style={{ fontSize: '1.1rem', color: '#00FF88', fontWeight: '800', margin: '0.5rem 0', opacity: progress > 90 ? 1 : 0, transition: 'opacity 0.5s', textShadow: '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)' }}>
                  ✈ STORAGE MANAGEMENT: ONLINE
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Project Info - Compact Layout */}
          {introPhase === 2 && (
            <div style={{ 
              animation: 'fadeIn 0.8s ease-in', 
              width: '90vw', 
              height: '85vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                background: 'rgba(10, 15, 28, 0.98)',
                border: '2px solid #00F0FF',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                gap: '1.5rem'
              }}>
                {/* Main Title */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2.2rem',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #00F0FF, #00FF88)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontFamily: '"Orbitron", monospace',
                    marginBottom: '0.3rem'
                  }}>
                    AVIATION CONSOLE
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    color: '#00FF88',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    fontWeight: '700'
                  }}>
                    BLOCKCHAIN STORAGE MANAGEMENT
                  </div>
                  <div style={{
                    width: '30%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00F0FF, #00FF88, #00F0FF, transparent)',
                    margin: '0.8rem auto',
                    borderRadius: '1px'
                  }}></div>
                </div>

                {/* Main Content - Horizontal Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 1fr',
                  gap: '1.5rem',
                  height: '100%',
                  alignItems: 'start'
                }}>
                  {/* Left Column - Features */}
                  <div>
                    <div style={{
                      fontSize: '1.1rem',
                      color: '#FFAA00',
                      fontWeight: '700',
                      marginBottom: '0.8rem',
                      textAlign: 'center',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      ⚡ FEATURES
                    </div>
                    <div style={{
                      display: 'grid',
                      gap: '0.8rem'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(0, 240, 255, 0.02))',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '6px',
                        padding: '0.8rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🛩️</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#00F0FF',
                          fontWeight: '700',
                          marginBottom: '0.2rem'
                        }}>
                          PARTS MANAGEMENT
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Quản lý vật tư
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.08), rgba(0, 255, 136, 0.02))',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        borderRadius: '6px',
                        padding: '0.8rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🔧</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#00FF88',
                          fontWeight: '700',
                          marginBottom: '0.2rem'
                        }}>
                          QUALITY CONTROL
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Kiểm định
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.08), rgba(255, 170, 0, 0.02))',
                        border: '1px solid rgba(255, 170, 0, 0.3)',
                        borderRadius: '6px',
                        padding: '0.8rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>📋</div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#FFAA00',
                          fontWeight: '700',
                          marginBottom: '0.2rem'
                        }}>
                          BLOCKCHAIN TRACE
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Truy xuất
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Column - Team */}
                  <div>
                    <div style={{
                      fontSize: '1.2rem',
                      color: '#FFAA00',
                      fontWeight: '700',
                      marginBottom: '0.8rem',
                      textAlign: 'center',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      ✈ FLIGHT CREW ✈
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem',
                        background: 'rgba(0, 240, 255, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 240, 255, 0.2)'
                      }}>
                        <div style={{ fontSize: '1.4rem', color: '#00F0FF' }}>👨✈️</div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#00F0FF', fontWeight: '600' }}>Captain</div>
                          <div style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Cao Văn Quang</div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem',
                        background: 'rgba(0, 255, 136, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 255, 136, 0.2)'
                      }}>
                        <div style={{ fontSize: '1.4rem', color: '#00FF88' }}>👨✈️</div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#00FF88', fontWeight: '600' }}>Co-pilot</div>
                          <div style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Tống Nhật Nam</div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem',
                        background: 'rgba(255, 170, 0, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 170, 0, 0.2)'
                      }}>
                        <div style={{ fontSize: '1.4rem', color: '#FFAA00' }}>🔧</div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#FFAA00', fontWeight: '600' }}>Engineer</div>
                          <div style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Nguyễn Hoàng Thiên Bảo</div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem',
                        background: 'rgba(0, 102, 255, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 102, 255, 0.2)'
                      }}>
                        <div style={{ fontSize: '1.4rem', color: '#0066FF' }}>🧭</div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#0066FF', fontWeight: '600' }}>Navigator</div>
                          <div style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Nguyễn Hồ Tuấn Hào</div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem',
                        background: 'rgba(255, 51, 102, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 51, 102, 0.2)',
                        gridColumn: '1 / -1'
                      }}>
                        <div style={{ fontSize: '1.4rem', color: '#FF3366' }}>📡</div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#FF3366', fontWeight: '600' }}>Comm Officer</div>
                          <div style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>Nguyễn Thành Chính</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Academy Info */}
                  <div>
                    <div style={{
                      fontSize: '1.1rem',
                      color: '#00F0FF',
                      fontWeight: '700',
                      marginBottom: '0.8rem',
                      textAlign: 'center',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>
                      🏛️ ACADEMY
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gap: '0.8rem'
                    }}>
                      <div style={{
                        padding: '0.8rem',
                        background: 'rgba(0, 240, 255, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🎓</div>
                        <div style={{ color: '#FFAA00', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.9rem' }}>ACADEMY</div>
                        <div style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>Vietnam Aviation Academy</div>
                      </div>
                      
                      <div style={{
                        padding: '0.8rem',
                        background: 'rgba(0, 255, 136, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>💻</div>
                        <div style={{ color: '#FFAA00', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.9rem' }}>DEPARTMENT</div>
                        <div style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>Information Technology</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phase 3: Ready for Takeoff */}
          {introPhase === 3 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease-in' }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: '900',
                color: '#00FF88',
                marginBottom: '3rem',
                textShadow: '0 0 25px rgba(0, 255, 136, 0.4), 0 0 50px rgba(0, 255, 136, 0.2)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}>
                ✈ CLEARED FOR TAKEOFF ✈
              </div>

              <button
                onClick={() => setShowIntro(false)}
                style={{
                  background: 'linear-gradient(135deg, #0A0F1C, #1A2332)',
                  border: '2px solid #00F0FF',
                  borderRadius: '8px',
                  padding: '1.5rem 3rem',
                  color: '#E2E8F0',
                  fontFamily: '"Orbitron", "Exo 2", monospace',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.05)',
                  animation: 'buttonPulse 2s ease-in-out infinite',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1A2332, #242B3D)';
                  e.target.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.4), inset 0 0 30px rgba(0, 240, 255, 0.1)';
                  e.target.style.transform = 'translateY(-2px) scale(1.02)';
                  e.target.style.borderColor = '#00FF88';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #0A0F1C, #1A2332)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.05)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.borderColor = '#00F0FF';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.1), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}></div>
                <div style={{ fontSize: '1.2rem', letterSpacing: '2px', position: 'relative', zIndex: 1 }}>ENTER CONSOLE</div>
                <div style={{ fontSize: '0.9rem', color: '#00FF88', marginTop: '0.5rem', letterSpacing: '1px', position: 'relative', zIndex: 1 }}>▶ ENGAGE SYSTEM ◀</div>
              </button>
            </div>
          )}

          {/* CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes hudScan {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100vh); }
            }
            @keyframes glow {
              from { text-shadow: 0 0 25px rgba(0, 255, 136, 0.4), 0 0 50px rgba(0, 255, 136, 0.2); }
              to { text-shadow: 0 0 35px rgba(0, 255, 136, 0.6), 0 0 70px rgba(0, 255, 136, 0.3); }
            }
            @keyframes buttonPulse {
              0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.05); }
              50% { box-shadow: 0 0 30px rgba(0, 240, 255, 0.4), inset 0 0 30px rgba(0, 240, 255, 0.1); }
            }
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* App chính - luôn render nhưng bị che bởi intro */}
      <div className="avi-floating-particles"></div>
      <AviationShell wallet={wallet} roles={roles}>
        {isMockMode && wallet.account && (
          <div className="avi-alert avi-alert--info" style={{ margin: "10px 0" }}>
            ⚠️ Chế độ Demo: Dữ liệu không được lưu trên blockchain. Để sử dụng blockchain thực, hãy chạy <code>npm run dev</code> và kết nối MetaMask.
          </div>
        )}
        <Suspense fallback={<div className="avi-alert avi-alert--warn">Đang tải trang…</div>}>
          {page === "home" ? <HomePage wallet={wallet} roles={roles} /> : null}
          {page === "testqr" ? <TestQRPage wallet={wallet} /> : null}
          {page === "dashboard" ? <DashboardPage api={api} /> : null}
          {page === "warehouse" ? <WarehousePage wallet={wallet} roles={roles} api={api} addNotification={addNotification} /> : null}
          {page === "engineer" ? <EngineerPage wallet={wallet} roles={roles} api={api} addNotification={addNotification} /> : null}
          {page === "admin" ? <AdminPage wallet={wallet} roles={roles} contractAddress={contractAddress} onRoleChanged={() => roles.refresh()} api={api} addNotification={addNotification} /> : null}
        </Suspense>
      </AviationShell>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </ErrorBoundary>
  );
}

export default App;