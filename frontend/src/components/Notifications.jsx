import { useEffect, useState } from 'react';

export function useNotification() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, addNotification, removeNotification };
}

export function NotificationContainer({ notifications, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            border: '1px solid',
            background: notification.type === 'success' ? 'rgba(0, 255, 136, 0.1)' :
                       notification.type === 'error' ? 'rgba(255, 51, 102, 0.1)' :
                       notification.type === 'warning' ? 'rgba(255, 170, 0, 0.1)' :
                       'rgba(0, 240, 255, 0.1)',
            borderColor: notification.type === 'success' ? 'rgba(0, 255, 136, 0.3)' :
                        notification.type === 'error' ? 'rgba(255, 51, 102, 0.3)' :
                        notification.type === 'warning' ? 'rgba(255, 170, 0, 0.3)' :
                        'rgba(0, 240, 255, 0.3)',
            color: notification.type === 'success' ? '#00ff88' :
                   notification.type === 'error' ? '#ff3366' :
                   notification.type === 'warning' ? '#ffaa00' :
                   '#00f0ff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
            {notification.type === 'success' ? '✅' :
             notification.type === 'error' ? '❌' :
             notification.type === 'warning' ? '⚠️' :
             'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            onClick={() => onRemove(notification.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
