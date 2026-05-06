// Envelopes / Budget screen

function EnvelopesScreen({ theme, accent, density }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { ENVELOPES, MXN } = window.FZ;

  const totalBudget = ENVELOPES.reduce((s, e) => s + e.budget, 0);
  const totalSpent = ENVELOPES.reduce((s, e) => s + e.spent, 0);

  return (
    <div style={{ padding: `60px ${pad}px 120px`, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1.2, marginBottom: 4 }}>Sobres</div>
        <div style={{ fontSize: 13, color: theme.textSec, fontVariantNumeric: 'tabular-nums' }}>
          {MXN(totalSpent)} de {MXN(totalBudget)} · {ENVELOPES.length} sobres
        </div>
      </div>

      {/* overall progress */}
      <div style={{
        background: theme.surface, borderRadius: 20, padding: compact ? 14 : 18,
        border: `1px solid ${theme.border}`, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: theme.textSec }}>Disponible</span>
          <span style={{ fontSize: 11, color: theme.textTer }}>Mayo</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, fontVariantNumeric: 'tabular-nums', marginBottom: 10 }}>
          {MXN(totalBudget - totalSpent)}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: theme.surfaceAlt, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalSpent / totalBudget * 100}%`, background: accent }}/>
        </div>
      </div>

      {/* grid of envelopes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ENVELOPES.map(e => <EnvelopeCard key={e.id} env={e} theme={theme} accent={accent}/>)}
      </div>

      <button style={{
        width: '100%', height: 48, borderRadius: 16, border: `1.5px dashed ${theme.borderStrong}`,
        background: 'transparent', color: theme.textSec, marginTop: 12,
        fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
      }}>+ Nuevo sobre</button>
    </div>
  );
}

function EnvelopeCard({ env, theme, accent }) {
  const I = window.Icon[env.icon] || window.Icon.Bag;
  const pct = env.spent / env.budget;
  const over = env.spent > env.budget;
  const near = pct >= 0.8 && !over;

  // Tint envelope with derived accent — alpha for available, near uses warm warning, over uses bad
  const fillColor = over ? theme.bad : (near ? '#F59E0B' : accent);
  const remaining = env.budget - env.spent;

  return (
    <div style={{
      background: theme.surface, borderRadius: 18, padding: 14,
      border: `1px solid ${over ? theme.bad : theme.border}`,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: 10, minHeight: 130,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${fillColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I s={16} c={fillColor} w={1.7}/>
        </div>
        {over && <span style={{ fontSize: 9, fontWeight: 600, color: theme.bad, letterSpacing: 0.5, textTransform: 'uppercase' }}>Excedido</span>}
        {near && <span style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', letterSpacing: 0.5, textTransform: 'uppercase' }}>Casi</span>}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{env.name}</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>
          {over ? `−${window.FZ.MXN(Math.abs(remaining)).slice(1)}` : window.FZ.MXN(remaining)}
        </div>
        <div style={{ fontSize: 10, color: theme.textTer, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
          de {window.FZ.MXN(env.budget)}
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: theme.surfaceAlt, overflow: 'hidden', marginTop: 'auto' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, pct * 100)}%`, background: fillColor,
          transition: 'width 0.3s',
        }}/>
      </div>
    </div>
  );
}

window.EnvelopesScreen = EnvelopesScreen;
