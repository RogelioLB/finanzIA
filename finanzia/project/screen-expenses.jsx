// Monthly expenses screen — swipeable carousel of months (6 back / current / 6 forward)

function ExpensesScreen({ theme, accent, density }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { MONTH_DATA, CAT_LABELS, MXN, TRANSACTIONS } = window.FZ;

  const currentIdx = MONTH_DATA.findIndex(m => m.current);
  const [activeIdx, setActiveIdx] = React.useState(currentIdx);

  const scrollerRef = React.useRef(null);
  const ITEM_W = 110; // each month pill width incl gap

  // Center selected month in scroller
  React.useEffect(() => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current;
    // children[0] is leading spacer; pill is at children[activeIdx + 1]
    const pill = el.children[activeIdx + 1];
    if (!pill) return;
    const target = pill.offsetLeft + pill.offsetWidth / 2 - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeIdx]);

  const month = MONTH_DATA[activeIdx];
  const prevMonth = activeIdx > 0 ? MONTH_DATA[activeIdx - 1] : null;
  const delta = prevMonth ? month.total - prevMonth.total : 0;
  const deltaPct = prevMonth ? (delta / prevMonth.total * 100) : 0;

  const cats = Object.entries(month.byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(([_, v]) => v));

  const recent = month.current ? TRANSACTIONS : [];

  return (
    <div style={{ height: '100%', overflowY: 'auto', boxSizing: 'border-box', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: `60px ${pad}px 14px` }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1.2, marginBottom: 4 }}>Gastos</div>
        <div style={{ fontSize: 13, color: theme.textSec }}>
          Desliza para navegar entre meses
        </div>
      </div>

      {/* Month carousel */}
      <div
        ref={scrollerRef}
        style={{
          display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory',
          padding: `4px ${pad}px 16px`, scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* spacers to allow first/last to center */}
        <div style={{ flexShrink: 0, width: 'calc(50% - 51px)' }}/>
        {MONTH_DATA.map((m, i) => {
          const isActive = i === activeIdx;
          const isCurrent = m.current;
          return (
            <button
              key={m.key}
              onClick={() => setActiveIdx(i)}
              style={{
                flexShrink: 0, scrollSnapAlign: 'center',
                width: 102, height: 64, borderRadius: 16,
                background: isActive ? accent : theme.surface,
                border: isActive ? 'none' : `1px solid ${m.projected ? theme.borderStrong : theme.border}`,
                color: isActive ? window.getFabContrast(accent) : theme.text,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, padding: 0, position: 'relative',
                opacity: m.projected && !isActive ? 0.55 : 1,
                transition: 'all 0.18s',
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase',
                opacity: 0.7,
              }}>{m.label} {String(m.year).slice(2)}</span>
              <span style={{
                fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
              }}>{MXN(m.total)}</span>
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 6, height: 6, borderRadius: 3,
                  background: isActive ? window.getFabContrast(accent) : accent,
                }}/>
              )}
            </button>
          );
        })}
        <div style={{ flexShrink: 0, width: 'calc(50% - 51px)' }}/>
      </div>

      {/* Selected month detail */}
      <div style={{ padding: `0 ${pad}px` }}>
        {/* Hero — total + delta */}
        <div style={{
          background: theme.surface, borderRadius: 22, padding: compact ? 16 : 20,
          border: `1px solid ${theme.border}`, marginBottom: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          {month.projected && (
            <div style={{
              position: 'absolute', top: 14, right: 14,
              fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase',
              color: theme.textTer,
              padding: '3px 8px', borderRadius: 4,
              background: theme.surfaceAlt,
            }}>Proyectado</div>
          )}
          <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
            {month.label} {month.year} · Total
          </div>
          <div style={{
            fontSize: 40, fontWeight: 600, letterSpacing: -1.6, fontVariantNumeric: 'tabular-nums',
            lineHeight: 1, marginBottom: 10,
          }}>{MXN(month.total)}</div>

          {prevMonth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {delta > 0
                ? <window.Icon.TrendUp s={13} c={theme.bad} w={2}/>
                : <window.Icon.TrendDown s={13} c={theme.good} w={2}/>}
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: delta > 0 ? theme.bad : theme.good,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {delta > 0 ? '+' : ''}{MXN(delta)} ({deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
              </span>
              <span style={{ fontSize: 13, color: theme.textTer }}>vs {prevMonth.label}</span>
            </div>
          )}

          {/* income vs expense bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textTer, marginBottom: 6 }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>Ingreso {MXN(month.income)}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>Ahorro {MXN(month.income - month.total)}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: theme.surfaceAlt, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, month.total / month.income * 100)}%`,
                background: accent,
              }}/>
            </div>
          </div>
        </div>

        {/* Categories breakdown */}
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, padding: '8px 4px 10px' }}>
          Por categoría
        </div>
        <div style={{
          background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`,
          overflow: 'hidden', marginBottom: 18,
        }}>
          {cats.map(([catId, value], i) => {
            const Ico = window.Icon[catId] || window.Icon.Bag;
            const pct = (value / month.total * 100).toFixed(0);
            const barPct = (value / maxCat * 100);
            return (
              <div key={catId} style={{
                padding: '12px 14px',
                borderBottom: i === cats.length - 1 ? 'none' : `0.5px solid ${theme.divider}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, background: theme.surfaceAlt,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ico s={16} c={theme.text} w={1.6}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                    {CAT_LABELS[catId] || catId}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {MXN(value)}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textTer, fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>
                    {pct}%
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: theme.surfaceAlt, overflow: 'hidden', marginLeft: 44 }}>
                  <div style={{
                    height: '100%', width: `${barPct}%`, background: accent,
                    transition: 'width 0.3s',
                  }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transactions for current month */}
        {recent.length > 0 && (
          <React.Fragment>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, padding: '8px 4px 10px' }}>
              Movimientos del mes
            </div>
            <div style={{
              background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`,
              overflow: 'hidden',
            }}>
              {recent.map((t, i) => (
                <window.TxRow key={t.id} tx={t} theme={theme} accent={accent} isLast={i === recent.length - 1}/>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

window.ExpensesScreen = ExpensesScreen;
