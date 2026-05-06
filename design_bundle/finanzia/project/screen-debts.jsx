// Debts screen + payment plan detail

function DebtsScreen({ theme, accent, density, onSelectDebt }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { DEBTS, MXN } = window.FZ;

  const totalOriginal = DEBTS.reduce((s, d) => s + d.original, 0);
  const totalPaid = DEBTS.reduce((s, d) => s + d.paid, 0);
  const totalRemaining = totalOriginal - totalPaid;

  return (
    <div style={{ padding: `60px ${pad}px 120px`, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1.2, marginBottom: 4 }}>Deudas</div>
        <div style={{ fontSize: 13, color: theme.textSec }}>
          {DEBTS.length} activas · {Math.round(totalPaid / totalOriginal * 100)}% pagado
        </div>
      </div>

      {/* total card */}
      <div style={{
        background: theme.surface, borderRadius: 22, padding: compact ? 16 : 20,
        marginBottom: 20, border: `1px solid ${theme.border}`,
      }}>
        <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
          Total restante
        </div>
        <div style={{
          fontSize: 36, fontWeight: 600, letterSpacing: -1.4, fontVariantNumeric: 'tabular-nums',
          marginBottom: 12,
        }}>{MXN(totalRemaining)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textTer, marginBottom: 6 }}>
          <span>Pagado {MXN(totalPaid)}</span>
          <span>Total {MXN(totalOriginal)}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: theme.surfaceAlt, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${totalPaid / totalOriginal * 100}%`,
            background: accent,
          }}/>
        </div>
      </div>

      {/* debts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEBTS.map(d => (
          <DebtCard key={d.id} debt={d} theme={theme} accent={accent} onClick={() => onSelectDebt(d)} compact={compact}/>
        ))}
      </div>
    </div>
  );
}

function DebtCard({ debt, theme, accent, onClick, compact }) {
  const pct = debt.paid / debt.original;
  const remaining = debt.original - debt.paid;
  return (
    <button onClick={onClick} style={{
      background: theme.surface, borderRadius: 20, padding: compact ? 14 : 16,
      border: `1px solid ${theme.border}`, textAlign: 'left', width: '100%',
      cursor: 'pointer', fontFamily: 'inherit', color: theme.text,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{debt.name}</div>
          <div style={{ fontSize: 11, color: theme.textTer, marginTop: 2 }}>
            APR {debt.apr} · liquida en {debt.due}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>
            {window.FZ.MXN(remaining)}
          </div>
          <div style={{ fontSize: 11, color: theme.textTer, marginTop: 2 }}>restante</div>
        </div>
      </div>
      <div>
        <div style={{
          height: 5, borderRadius: 3, background: theme.surfaceAlt, overflow: 'hidden', marginBottom: 6,
        }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`, background: accent,
            transition: 'width 0.3s',
          }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textSec, fontVariantNumeric: 'tabular-nums' }}>
          <span>{Math.round(pct * 100)}% pagado</span>
          <span>{window.FZ.MXN(debt.monthly)}/mes</span>
        </div>
      </div>
    </button>
  );
}

// Detail modal — payment plan
function DebtDetail({ debt, theme, accent, onClose }) {
  const pct = debt.paid / debt.original;
  const remaining = debt.original - debt.paid;
  const monthsLeft = Math.ceil(remaining / debt.monthly);

  // Simulated payment plan rows
  const plan = [];
  let bal = remaining;
  const today = new Date(2026, 4, 2); // May 2026
  for (let i = 0; i < Math.min(monthsLeft, 6); i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 5);
    const monthName = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    const pay = Math.min(debt.monthly, bal);
    bal -= pay;
    plan.push({ date: monthName, payment: pay, balance: Math.max(0, bal) });
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
      <div style={{
        padding: '60px 20px 20px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `0.5px solid ${theme.divider}`,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }}>
          <window.Icon.Back s={18} c={theme.text} w={1.7}/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: theme.textTer, textTransform: 'uppercase', letterSpacing: 0.5 }}>Plan de pagos</div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{debt.name}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 40px' }}>
        {/* big remaining */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: theme.textSec, marginBottom: 4 }}>Restante</div>
          <div style={{
            fontSize: 44, fontWeight: 600, letterSpacing: -2, fontVariantNumeric: 'tabular-nums',
            lineHeight: 1, marginBottom: 12,
          }}>{window.FZ.MXN(remaining)}</div>
          <div style={{
            height: 6, borderRadius: 3, background: theme.surfaceAlt, overflow: 'hidden', marginBottom: 8,
          }}>
            <div style={{ height: '100%', width: `${pct * 100}%`, background: accent }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.textSec }}>
            <span>{Math.round(pct * 100)}% pagado</span>
            <span>{monthsLeft} meses restantes</span>
          </div>
        </div>

        {/* stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <Stat theme={theme} label="Original" value={window.FZ.MXN(debt.original)}/>
          <Stat theme={theme} label="Pagado" value={window.FZ.MXN(debt.paid)}/>
          <Stat theme={theme} label="Pago mensual" value={window.FZ.MXN(debt.monthly)}/>
          <Stat theme={theme} label="Liquidación" value={debt.due}/>
        </div>

        {/* plan */}
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, letterSpacing: -0.1 }}>Próximos pagos</div>
        <div style={{
          background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden',
        }}>
          {plan.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px',
              borderBottom: i === plan.length - 1 ? 'none' : `0.5px solid ${theme.divider}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: theme.surfaceAlt,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 500, color: theme.textSec, marginRight: 12,
                textTransform: 'capitalize',
              }}>{p.date.split(' ')[0]}</div>
              <div style={{ flex: 1, fontSize: 13, color: theme.textSec, fontVariantNumeric: 'tabular-nums' }}>
                Pago de {window.FZ.MXN(p.payment)}
              </div>
              <div style={{ fontSize: 13, color: theme.textTer, fontVariantNumeric: 'tabular-nums' }}>
                {window.FZ.MXN(p.balance)}
              </div>
            </div>
          ))}
        </div>

        <button style={{
          width: '100%', height: 52, borderRadius: 16, border: 'none',
          background: accent, color: window.getFabContrast(accent),
          fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 24,
          fontFamily: 'inherit', letterSpacing: -0.2,
        }}>Adelantar un pago</button>
      </div>
    </div>
  );
}

function Stat({ theme, label, value }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: 16, padding: 12,
      border: `1px solid ${theme.border}`,
    }}>
      <div style={{ fontSize: 11, color: theme.textTer, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>{value}</div>
    </div>
  );
}

window.DebtsScreen = DebtsScreen;
window.DebtDetail = DebtDetail;
