import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

export function ItemQRCode({ item }) {
  const [showQR, setShowQR] = useState(false);
  const [qrMode, setQrMode] = useState('text'); // 'text' hoặc 'link'

  if (!item) return null;

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const lookupUrl = `${baseUrl}#/?lookup=${encodeURIComponent(item.code)}`;
  
  const statusText = Number(item.lastInspectionStatus) === 1 ? 'Serviceable' : Number(item.lastInspectionStatus) === 2 ? 'Unserviceable' : 'Pending';
  
  // Text đơn giản
  const textData = `Code: ${item.code}\nPN: ${item.partNumber}\nSN: ${item.serialNumber}\nName: ${item.name}\nLocation: ${item.location}\nStatus: ${statusText}`;
  
  const qrValue = qrMode === 'text' ? textData : lookupUrl;

  return (
    <div style={{ marginTop: 16 }}>
      <button
        className="avi-btn"
        onClick={() => setShowQR(!showQR)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: showQR ? 'rgba(0, 240, 255, 0.1)' : 'transparent', border: `1px solid ${showQR ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255,255,255,0.2)'}`, color: showQR ? '#00f0ff' : 'var(--color-primary)' }}
      >
        <span style={{ fontSize: '1.2rem' }}>📱</span>
        <span>{showQR ? 'Ẩn QR Code ❌' : 'Hiển thị QR Code'}</span>
      </button>

      {showQR && (
        <div className="avi-card" style={{
          marginTop: 16,
          background: 'rgba(5, 15, 30, 0.98)',
          border: '1px solid rgba(0, 240, 255, 0.5)',
          padding: 24,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(0, 240, 255, 0.2)',
          maxWidth: 350,
          borderRadius: 12
        }}>
          {/* Toggle QR Mode */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="avi-btn"
              onClick={() => setQrMode('text')}
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.85rem',
                background: qrMode === 'text' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(0, 240, 255, 0.05)',
                border: `1px solid ${qrMode === 'text' ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 240, 255, 0.3)'}`,
                color: qrMode === 'text' ? '#00f0ff' : 'rgba(255,255,255,0.6)'
              }}
            >
              📝 Text
            </button>
            <button
              className="avi-btn"
              onClick={() => setQrMode('link')}
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.85rem',
                background: qrMode === 'link' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(0, 240, 255, 0.05)',
                border: `1px solid ${qrMode === 'link' ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 240, 255, 0.3)'}`,
                color: qrMode === 'link' ? '#00f0ff' : 'rgba(255,255,255,0.6)'
              }}
            >
              🔗 Link
            </button>
          </div>

          <div style={{ marginBottom: 16, background: '#fff', padding: 12, borderRadius: 8, display: 'inline-block' }}>
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>
          
          <div style={{
            color: '#00f0ff',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Space Mono, monospace',
            marginBottom: 12,
            letterSpacing: 1
          }}>
            {item.code}
          </div>
          
          {qrMode === 'text' && (
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.85rem',
              textAlign: 'left',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              fontFamily: 'monospace',
              whiteSpace: 'pre-line'
            }}>
              {textData}
            </div>
          )}
          
          {qrMode === 'link' && (
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem',
              wordBreak: 'break-all',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6
            }}>
              {lookupUrl}
            </div>
          )}
          
          <div style={{
            marginTop: 12,
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.75rem',
            lineHeight: 1.4
          }}>
            {qrMode === 'text' && '📝 Quét để xem thông tin text'}
            {qrMode === 'link' && '🔗 Quét để mở web (cần MetaMask)'}
          </div>
          
          <button
            className="avi-btn avi-btn--primary"
            onClick={() => {
              const textToCopy = qrMode === 'text' ? textData : lookupUrl;
              navigator.clipboard.writeText(textToCopy);
              alert('✅ Đã copy!\n\n' + textToCopy);
            }}
            style={{ width: '100%', marginTop: 12 }}
          >
            📋 Copy {qrMode === 'text' ? 'Text' : 'Link'}
          </button>
        </div>
      )}
    </div>
  );
}