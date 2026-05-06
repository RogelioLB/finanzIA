// Recurring payments screen — subscriptions + income
// Subscriptions auto-deduct on their due day; this screen shows status + upcoming.

function RecurringScreen({ theme, accent, density, onClose }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { RECURRING, ACCOUNTS, MXN } = window.FZ;

  // Today is May 5 2026 per system; compute next-due for each
  const today = new Date(2026, 4, 5);

  const enriched = RECURRING.filter(r => r.active).map(r => {
    const month = today.getMonth();
    const year = today.getFullYear();
    let due = new Date(year, month, r.dayOfMonth);
    if (due < today) due = new Date(year, month + 1, r.dayOfMonth);
    const daysUntil = Math.round((due - today) / (1000 * 60 * 60 * 24));
    const account = ACCOUNTS.find(a => a.id === r.account);
    return { ...r, due, daysUntil, account };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const incomes = enriched.filter(r => r.type === 'income');
  const subs = enriched.filter(r => r.type === 'subscription');

  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);
  const totalSubs = subs.reduce((s, r) => s + r.amount, 0); // negative
  const net = totalIncome + totalSubs;

  // Upcoming this week + this month splits
  const within7 = enriched.filter(r => r.daysUntil <= 7);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
      {/* Header */}
      <div style={{ padding: `60px ${pad}px 16px`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }}>
          <window.Icon.Back s={18} c={theme.text} w={1.7}/>
        </button>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>Recurrentes</div>
        <button style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: accent, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <window.Icon.Plus s={18} c={window.getFabContrast(accent)} w={2}/>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `8px ${pad}px 40px` }}>
        {/* Net flow card */}
        <div style={{
          background: theme.surface, borderRadius: 22, padding: compact ? 16 : 20,
          border: `1px solid ${theme.border}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
            Flujo mensual neto
          </div>
          <div style={{
            fontSize: 36, fontWeight: 600, letterSpacing: -1.4, fontVariantNumeric: 'tabular-nums',
            marginBottom: 14, color: net >= 0 ? theme.text : theme.bad,
          }}>{net >= 0 ? '+' : '−'}{MXN(Math.abs(net))}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: theme.textTer, marginBottom: 3 }}>Ingresos</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: theme.good }}>
                +{MXN(totalIncome)}
              </div>
            </div>
            <div style={{ width: 1, background: theme.divider }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: theme.textTer, marginBottom: 3 }}>Suscripciones</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: theme.bad }}>
                {MXN(totalSubs)}
              </div>
            </div>
            <div style={{ width: 1, background: theme.divider }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: theme.textTer, marginBottom: 3 }}>Activas</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {subs.length}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming this week */}
        {within7.length > 0 && (
          <React.Fragment>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, padding: '8px 4px 10px' }}>
              Próximos 7 días
            </div>
            <div style={{
              background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`,
              overflow: 'hidden', marginBottom: 18,
            }}>
              {within7.map((r, i) => (
                <UpcomingRow key={r.id} r={r} theme={theme} accent={accent}
                  isLast={i === within7.length - 1}/>
              ))}
            </div>
          </React.Fragment>
        )}

        {/* Income */}
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, padding: '8px 4px 10px' }}>
          Ingresos · {incomes.length}
        </div>
        <div style={{
          background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`,
          overflow: 'hidden', marginBottom: 18,
        }}>
          {incomes.map((r, i) => (
            <RecurringRow key={r.id} r={r} theme={theme} accent={accent}
              isLast={i === incomes.length - 1}/>
          ))}
        </div>

        {/* Subscriptions */}
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, padding: '8px 4px 10px' }}>
          Suscripciones · {subs.length}
        </div>
        <div style={{
          background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`,
          overflow: 'hidden',
        }}>
          {subs.map((r, i) => (
            <RecurringRow key={r.id} r={r} theme={theme} accent={accent}
              isLast={i === subs.length - 1}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function dayLabel(daysUntil) {
  if (daysUntil === 0) return 'Hoy';
  if (daysUntil === 1) return 'Mañana';
  if (daysUntil < 7) return `En ${daysUntil}d`;
  return `En ${daysUntil}d`;
}

function UpcomingRow({ r, theme, accent, isLast }) {
  const I = window.Icon[r.icon] || window.Icon.Bolt;
  const isIncome = r.type === 'income';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: isLast ? 'none' : `0.5px solid ${theme.divider}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: `${r.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <I s={16} c={r.color} w={1.7}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: theme.textTer, marginTop: 1 }}>
          {dayLabel(r.daysUntil)} · {r.account?.name || 'Sin cuenta'}
        </div>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        color: isIncome ? theme.good : theme.text,
      }}>
        {isIncome ? '+' : ''}{window.FZ.MXN(r.amount)}
      </div>
    </div>
  );
}

function RecurringRow({ r, theme, accent, isLast }) {
  const I = window.Icon[r.icon] || window.Icon.Bolt;
  const isIncome = r.type === 'income';
  const dueLabel = r.due.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: isLast ? 'none' : `0.5px solid ${theme.divider}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: `${r.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <I s={18} c={r.color} w={1.6}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.name}
        </div>
        <div style={{ fontSize: 11, color: theme.textTer, marginTop: 2 }}>
          Día {r.dayOfMonth} · próximo {dueLabel} · {r.account?.name || ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          color: isIncome ? theme.good : theme.text,
        }}>
          {isIncome ? '+' : ''}{window.FZ.MXN(r.amount)}
        </div>
        <div style={{ fontSize: 10, color: theme.textTer, marginTop: 2 }}>
          /mes
        </div>
      </div>
    </div>
  );
}

window.RecurringScreen = RecurringScreen;
