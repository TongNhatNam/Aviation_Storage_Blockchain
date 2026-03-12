export function LoadingSpinner({ size = 40, message = "Đang tải..." }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px',
      minHeight: '200px'
    }}>
      <div 
        style={{
          width: size,
          height: size,
          border: '3px solid rgba(0, 240, 255, 0.2)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
        }}
      />
      <div style={{
        color: 'var(--color-primary)',
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        animation: 'pulse-glow 2s ease-in-out infinite'
      }}>
        {message}
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = "Đang xử lý..." }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 15, 28, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fade-in 0.3s ease-out'
    }}>
      <div style={{
        background: 'var(--gradient-card)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--border-radius)',
        padding: '40px',
        boxShadow: 'var(--shadow-elevated)',
        animation: 'slide-up 0.4s ease-out'
      }}>
        <LoadingSpinner size={60} message={message} />
      </div>
    </div>
  );
}