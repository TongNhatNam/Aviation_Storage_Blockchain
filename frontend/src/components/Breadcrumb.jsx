import { HashLink } from "../router/hashRouter.jsx";

export function Breadcrumb({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 0',
      marginBottom: '16px',
      fontSize: '0.9rem',
      color: 'rgba(255,255,255,0.7)',
      borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
      flexWrap: 'wrap'
    }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {item.link ? (
            <HashLink to={item.link} style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {item.label}
            </HashLink>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{item.label}</span>
          )}
          {idx < items.length - 1 && (
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
          )}
        </div>
      ))}
    </div>
  );
}
