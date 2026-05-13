export default function StatCard({ label, value, delta, deltaUp, icon, color = '#818cf8' }) {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid rgba(148,163,184,0.12)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
        letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 11, marginTop: 4, color: deltaUp ? '#34d399' : '#fb7185',
          display: 'flex', alignItems: 'center', gap: 3 }}>
          {deltaUp ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  );
}
