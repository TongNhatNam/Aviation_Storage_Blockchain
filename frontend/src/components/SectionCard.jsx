export function SectionCard({ title, subtitle, right, children }) {
  return (
    <section className="avi-card">
      <div className="avi-cardHeader">
        <div>
          <div className="avi-cardTitle">{title}</div>
          {subtitle ? <div className="avi-cardSubtitle">{subtitle}</div> : null}
        </div>
        {right ? <div className="avi-cardRight">{right}</div> : null}
      </div>
      <div className="avi-cardBody">{children}</div>
    </section>
  );
}

