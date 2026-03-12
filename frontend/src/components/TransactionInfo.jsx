export function TransactionInfo({ receipt }) {
  if (!receipt) return null;

  const txHash = receipt.transactionHash || receipt.hash;
  const blockNumber = receipt.blockNumber;
  const gasUsed = receipt.gasUsed?.toString();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="avi-card" style={{ 
      marginTop: 16, 
      background: 'linear-gradient(135deg, rgba(10, 15, 28, 0.9) 0%, rgba(26, 35, 50, 0.9) 100%)',
      border: '1px solid var(--color-radar-cyan)',
      boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)'
    }}>
      <div className="avi-cardBody">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-radar-cyan)'
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
              <circle cx="12" cy="12" r="3" opacity="0.3"/>
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
              <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <h4 style={{ 
            margin: 0, 
            color: 'var(--color-radar-cyan)',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>FLIGHT DATA RECORD</h4>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.9rem' }}>
          {txHash && (
            <div>
              <div style={{ 
                color: 'rgba(255,255,255,0.6)', 
                marginBottom: 6,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Transaction ID:</div>
              <div style={{ 
                fontFamily: 'monospace', 
                color: 'var(--color-radar-cyan)', 
                wordBreak: 'break-all',
                background: 'rgba(10, 15, 28, 0.8)',
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid rgba(0, 240, 255, 0.2)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => copyToClipboard(txHash)}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--color-radar-cyan)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(0, 240, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}>
                {txHash}
                <div style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem'
                }}>📋</div>
              </div>
            </div>
          )}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
            gap: 14 
          }}>
            {blockNumber && (
              <div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  marginBottom: 6,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Block Altitude:</div>
                <div style={{ 
                  fontWeight: 600, 
                  color: 'var(--color-cockpit-blue)',
                  background: 'rgba(10, 15, 28, 0.8)',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  textShadow: '0 0 10px rgba(74, 144, 226, 0.3)'
                }}>
                  #{blockNumber.toString()}
                </div>
              </div>
            )}
            
            {gasUsed && (
              <div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  marginBottom: 6,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Fuel Consumed:</div>
                <div style={{ 
                  fontWeight: 600, 
                  color: 'var(--color-aviation-orange)',
                  background: 'rgba(10, 15, 28, 0.8)',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  textShadow: '0 0 10px rgba(255, 165, 0, 0.3)'
                }}>
                  {Number(gasUsed).toLocaleString()} units
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: 16, 
          padding: '12px 16px', 
          background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)',
          borderRadius: 6,
          border: '1px solid rgba(0, 240, 255, 0.2)',
          color: 'var(--color-radar-cyan)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
        }}>
          <div style={{ 
            width: 16, 
            height: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <span>Dữ liệu đã được mã hóa và lưu trữ vĩnh viễn trên blockchain</span>
        </div>
      </div>
    </div>
  );
}
