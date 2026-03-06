export function TransactionInfo({ receipt }) {
  if (!receipt) return null;

  const txHash = receipt.transactionHash || receipt.hash;
  const blockNumber = receipt.blockNumber;
  const gasUsed = receipt.gasUsed?.toString();

  return (
    <div className="avi-card" style={{ 
      marginTop: 16, 
      background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 150, 255, 0.1) 100%)',
      border: '1px solid rgba(0, 240, 255, 0.3)'
    }}>
      <div className="avi-cardBody">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>⛓️</span>
          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Blockchain Transaction</h4>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
          {txHash && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Transaction Hash:</div>
              <div style={{ 
                fontFamily: 'monospace', 
                color: 'var(--color-primary)', 
                wordBreak: 'break-all',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: 4
              }}>
                {txHash}
              </div>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {blockNumber && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Block Number:</div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#fff',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  borderRadius: 4
                }}>
                  #{blockNumber.toString()}
                </div>
              </div>
            )}
            
            {gasUsed && (
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Gas Used:</div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#38ef7d',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  borderRadius: 4
                }}>
                  {Number(gasUsed).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: 12, 
          padding: '8px 12px', 
          background: 'rgba(56, 239, 125, 0.1)',
          borderRadius: 4,
          color: '#38ef7d',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>✅</span>
          <span>Transaction đã được ghi nhận trên blockchain - Không thể thay đổi!</span>
        </div>
      </div>
    </div>
  );
}
