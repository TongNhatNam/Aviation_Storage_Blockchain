import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import './QRScannerModal.css';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleScan = (result) => {
    if (result && result.length > 0) {
      const code = result[0].rawValue;
      onScanSuccess(code);
      onClose(); // Close modal immediately after success
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    // Suppress common expected errors like stream unmounting
    if (err?.name === 'OverconstrainedError' || err?.message?.includes('stream')) return;
    setError('Cannot access camera. Please check your browser permissions.');
  };

  return (
    <div className="avi-qr-modal-overlay">
      <div className="avi-qr-modal-content">
        <div className="avi-qr-modal-header">
          <h3>SCAN ITEM QR CODE</h3>
          <button className="avi-qr-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="avi-qr-scanner-wrapper">
          {error ? (
            <div className="avi-qr-error">
              <p>🔴 {error}</p>
              <button onClick={() => setError(null)} className="avi-btn avi-btn-secondary">Retry</button>
            </div>
          ) : (
            <Scanner 
              onScan={handleScan}
              onError={handleError}
              formats={['qr_code', 'ean_13', 'code_128']}
              styles={{
                container: { borderRadius: '8px', overflow: 'hidden' },
                video: { objectFit: 'cover' }
              }}
              components={{
                audio: true, // Beeps on success
                onOff: true, // Flashlight toggle if available
                torch: true,
                zoom: true,
                finder: true, // Shows the scanning box
              }}
            />
          )}
        </div>
        
        <div className="avi-qr-modal-footer">
          <p>Align the QR code within the frame to scan.</p>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
