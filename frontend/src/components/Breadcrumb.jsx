import { HashLink } from "../router/hashRouter.jsx";

export function Breadcrumb({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 0',
      marginBottom: '20px',
      fontSize: '13px',
      color: 'rgba(255,255,255,0.7)',
      borderBottom: '1px solid var(--glass-border)',
      flexWrap: 'wrap',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      borderRadius: 'var(--border-radius-sm)',
      paddingLeft: '16px',
      paddingRight: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {item.link ? (
            <HashLink to={item.link} style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0, 240, 255, 0.1)';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'var(--color-primary)';
            }}
            >
              {item.label}
            </HashLink>
          ) : (
            <span style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontWeight: '600',
              padding: '4px 8px',
              background: 'rgba(0, 240, 255, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 240, 255, 0.2)'
            }}>{item.label}</span>
          )}
          {idx < items.length - 1 && (
            <span style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>›</span>
          )}
        </div>
      ))}
    </div>
  );
}
