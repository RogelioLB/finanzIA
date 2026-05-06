// Accounts screen — banks, credit, debit, cash, wallets

function AccountsScreen({ theme, accent, density, onClose, onAdd }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { ACCOUNTS, MXN } = window.FZ;
  const [hideBalances, setHideBalances] = React.useState(false);

  // Group by type
  const groups = {
    debit: { label: 'Débito', items: [] },
    credit: { label: 'Crédito', items: [] },
    cash: { label: 'Efectivo', items: [] },
    wallet: { label: 'Billeteras', items: [] },
  };
  ACCOUNTS.forEach(a => groups[a.type]?.items.push(a));

  // Total liquid (debit + cash + wallet)
  const liquid = ACCOUNTS.filter(a => a.type !== 'credit').reduce((s, a) => s + a.balance, 0);
  const creditUsed = ACCOUNTS.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(a.balance), 0);
  const creditLimit = ACCOUNTS.filter(a => a.type === 'credit').reduce((s, a) => s + (a.limit || 0), 0);

  const masked = (v) => hideBalances ? '••••••' : v;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
      {/* Header */}
      <div style={{
        padding: `60px ${pad}px 16px`, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }}>
          <window.Icon.Back s={18} c={theme.text} w={1.7}/>
        </button>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>Cuentas</div>
        <button onClick={() => setHideBalances(h => !h)} style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }}>
          {hideBalances ? <window.Icon.EyeOff s={16} c={theme.text}/> : <window.Icon.Eye s={16} c={theme.text}/>}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `8px ${pad}px 40px` }}>
        {/* Summary */}
        <div style={{
          background: theme.surface, borderRadius: 22, padding: compact ? 16 : 20,
          border: `1px solid ${theme.border}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
            Líquido disponible
          </div>
          <div style={{
            fontSize: 36, fontWeight: 600, letterSpacing: -1.4, fontVariantNumeric: 'tabular-nums', marginBottom: 14,
          }}>{masked(MXN(liquid))}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: theme.textTer, marginBottom: 3 }}>Crédito usado</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {masked(MXN(creditUsed))}
              </div>
            </div>
            <div style={{ width: 1, background: theme.divider }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: theme.textTer, marginBottom: 3 }}>Disponible</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: theme.textSec }}>
                {masked(MXN(creditLimit - creditUsed))}
              </div>
            </div>
          </div>
        </div>

        {/* Groups */}
        {Object.values(groups).map(g => g.items.length > 0 && (
          <div key={g.label} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: theme.textTer, textTransform: 'uppercase', letterSpacing: 0.6,
              padding: '6px 4px 8px', fontWeight: 500,
            }}>{g.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.items.map(a => <AccountCard key={a.id} acc={a} theme={theme} hide={hideBalances}/>)}
            </div>
          </div>
        ))}

        {/* Add new */}
        <button onClick={onAdd} style={{
          width: '100%', height: 52, borderRadius: 16, border: `1.5px dashed ${theme.borderStrong}`,
          background: 'transparent', color: theme.text,
          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 8,
        }}>
          <window.Icon.Plus s={18} c={theme.text} w={2}/>
          Agregar cuenta
        </button>
      </div>
    </div>
  );
}

function AccountCard({ acc, theme, hide }) {
  const isCredit = acc.type === 'credit';
  const isCash = acc.type === 'cash';
  const isWallet = acc.type === 'wallet';

  // Icon by type
  const Ico = isCredit ? window.Icon.Card : (isCash ? window.Icon.Cash : (isWallet ? window.Icon.Wallet : window.Icon.Bank));

  const display = hide ? '••••••' : window.FZ.MXN(Math.abs(acc.balance));
  const pct = isCredit && acc.limit ? Math.abs(acc.balance) / acc.limit : null;

  return (
    <div style={{
      background: theme.surface, borderRadius: 18, padding: 14,
      border: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${acc.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ico s={18} c={acc.color} w={1.7}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{acc.name}</div>
          <div style={{ fontSize: 11, color: theme.textTer, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
            {acc.last4 ? `•••• ${acc.last4}` : (acc.bank || (isCash ? 'Sin banco' : ''))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
            color: isCredit ? theme.bad : theme.text,
          }}>
            {isCredit && !hide ? '−' : ''}{display}
          </div>
          {isCredit && acc.limit && (
            <div style={{ fontSize: 10, color: theme.textTer, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              de {hide ? '•••••' : window.FZ.MXN(acc.limit)}
            </div>
          )}
        </div>
      </div>
      {isCredit && pct !== null && (
        <div style={{ height: 4, borderRadius: 2, background: theme.surfaceAlt, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, pct * 100)}%`,
            background: pct > 0.7 ? theme.bad : acc.color,
          }}/>
        </div>
      )}
    </div>
  );
}

// "Add account" sheet — type picker
function AddAccountSheet({ theme, accent, onClose }) {
  const types = [
    { id: 'debit',  label: 'Cuenta de débito', sub: 'Tarjeta o cuenta de banco', icon: 'Bank' },
    { id: 'credit', label: 'Tarjeta de crédito', sub: 'Línea revolvente', icon: 'Card' },
    { id: 'cash',   label: 'Efectivo', sub: 'Dinero físico', icon: 'Cash' },
    { id: 'wallet', label: 'Billetera digital', sub: 'Mercado Pago, PayPal, etc.', icon: 'Wallet' },
    { id: 'invest', label: 'Inversión', sub: 'CETES, ETF, cripto', icon: 'Stocks' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 120,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        animation: 'fadeIn 0.2s',
      }}/>
      <div style={{
        position: 'relative', background: theme.bg,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        paddingBottom: 28, paddingTop: 8,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.borderStrong, margin: '6px auto 12px' }}/>
        <div style={{ padding: '0 20px 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5, marginBottom: 4 }}>Nueva cuenta</div>
          <div style={{ fontSize: 12, color: theme.textSec, marginBottom: 16 }}>¿Qué tipo de cuenta vas a agregar?</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px' }}>
          {types.map(t => {
            const I = window.Icon[t.icon];
            return (
              <button key={t.id} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.surface,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                color: theme.text,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: theme.surfaceAlt,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <I s={18} c={theme.text} w={1.6}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: theme.textTer, marginTop: 2 }}>{t.sub}</div>
                </div>
                <window.Icon.Chevron s={14} c={theme.textTer} w={1.7}/>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.AccountsScreen = AccountsScreen;
window.AddAccountSheet = AddAccountSheet;
