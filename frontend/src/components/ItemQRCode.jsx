import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

export function ItemQRCode({ item }) {
  const [showQR, setShowQR] = useState(false);

  if (!item) return null;

  // Tự động lấy URL hiện tại của trình duyệt. 
  // NẾU MUỐN ĐIỆN THOẠI QUÉT ĐƯỢC: Bạn phải mở web này trên máy tính bằng địa chỉ IP (VD: http://192.168.x.x:5173) 
  // thay vì http://localhost:5173. Khi đó QR code sẽ sinh ra chứa IP mạng LAN nội bộ.
  const baseUrl = `${window.location.origin}${window.location.pathname}`;

  const lookupUrl = `${baseUrl}#/?lookup=${encodeURIComponent(item.code)}`;

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
          maxWidth: 300,
          borderRadius: 12
        }}>
          <div style={{ marginBottom: 16, background: '#fff', padding: 12, borderRadius: 8, display: 'inline-block' }}>
            <QRCodeSVG
              value={lookupUrl}
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
          <div style={{
            marginTop: 16,
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Scan để tra cứu thông tin blockchain
          </div>
          <button
            className="avi-btn avi-btn--primary"
            onClick={() => {
              navigator.clipboard.writeText(lookupUrl);
              alert('✅ Đã copy link tra cứu!\n\n' + lookupUrl + '\n\nPaste vào browser để xem kết quả.');
            }}
            style={{ width: '100%', marginTop: 12 }}
          >
            📋 Copy Link Tra Cứu
          </button>
        </div>
      )}
    </div>
  );
}
