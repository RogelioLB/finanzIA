// "Más" menu — full-screen list of secondary screens

function MoreScreen({ theme, accent, onOpen }) {
  const items = [
    { id: 'recurring',   label: 'Pagos recurrentes', sub: 'Suscripciones e ingresos', icon: 'Bolt' },
    { id: 'envelopes',   label: 'Sobres',       sub: 'Presupuestos por categoría', icon: 'Envelope' },
    { id: 'accounts',    label: 'Cuentas',      sub: 'Bancos, tarjetas, efectivo', icon: 'Bank' },
    { id: 'investments', label: 'Inversiones',  sub: 'Portafolio y rendimiento',   icon: 'Stocks' },
    { id: 'settings',    label: 'Apariencia',   sub: 'Tema y color de acento',     icon: 'Settings' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', boxSizing: 'border-box', padding: '60px 20px 120px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1.2, marginBottom: 4 }}>Más</div>
        <div style={{ fontSize: 13, color: theme.textSec }}>Herramientas y ajustes</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(it => {
          const I = window.Icon[it.icon];
          return (
            <button key={it.id} onClick={() => onOpen(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 14,
              borderRadius: 18, border: `1px solid ${theme.border}`, background: theme.surface,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              color: theme.text, width: '100%',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11, background: theme.surfaceAlt,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <I s={20} c={theme.text} w={1.6}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{it.label}</div>
                <div style={{ fontSize: 12, color: theme.textTer, marginTop: 2 }}>{it.sub}</div>
              </div>
              <window.Icon.Chevron s={15} c={theme.textTer} w={1.7}/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.MoreScreen = MoreScreen;
