// New transaction bottom sheet — supports income & expense, account picker, numpad

function QuickExpense({ theme, accent, onClose, numpadStyle = 'calculator' }) {
  const { CATEGORIES, ACCOUNTS } = window.FZ;
  const [kind, setKind] = React.useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = React.useState('0');
  const [category, setCategory] = React.useState('food');
  const [accountId, setAccountId] = React.useState(ACCOUNTS[0].id);
  const [showAccountPicker, setShowAccountPicker] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [listening, setListening] = React.useState(false);

  const account = ACCOUNTS.find(a => a.id === accountId);

  const press = (k) => {
    setAmount(prev => {
      if (k === '⌫') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      if (k === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0' && k !== '.') return k;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      return prev + k;
    });
  };

  const layout = numpadStyle === 'phone'
    ? ['1','2','3','4','5','6','7','8','9','.','0','⌫']
    : ['7','8','9','4','5','6','1','2','3','.','0','⌫'];

  const formatted = (() => {
    const [int, dec] = amount.split('.');
    const intFmt = parseInt(int || '0').toLocaleString('es-MX');
    return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
  })();

  const toggleVoice = () => {
    setListening(true);
    setTimeout(() => {
      setAmount('245');
      setCategory('food');
      setNote('Comida con Andrea');
      setNoteOpen(true);
      setListening(false);
    }, 1800);
  };

  const valid = parseFloat(amount) > 0;
  const isIncome = kind === 'income';
  const sign = isIncome ? '+' : '−';
  const signColor = isIncome ? theme.good : theme.text;

  // Account icon helper
  const accIcon = (a) => {
    if (a.type === 'cash') return window.Icon.Cash;
    if (a.type === 'wallet') return window.Icon.Wallet;
    if (a.type === 'credit') return window.Icon.Card;
    return window.Icon.Bank;
  };
  const AccIco = accIcon(account);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
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
        paddingBottom: 18, maxHeight: '94%', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.borderStrong, margin: '8px auto 6px' }}/>

        {/* Header — kind toggle + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: theme.textSec }}>Nueva transacción</div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 15, border: 'none',
            background: theme.surfaceAlt, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.text,
          }}>
            <window.Icon.Close s={16} c={theme.text} w={1.7}/>
          </button>
        </div>

        {/* Expense / Income segmented */}
        <div style={{
          display: 'flex', gap: 4, margin: '10px 18px 6px',
          background: theme.surface, borderRadius: 12, padding: 4, border: `1px solid ${theme.border}`,
        }}>
          {[
            { id: 'expense', label: 'Gasto' },
            { id: 'income',  label: 'Ingreso' },
          ].map(k => {
            const active = kind === k.id;
            return (
              <button key={k.id} onClick={() => setKind(k.id)} style={{
                flex: 1, height: 34, borderRadius: 9, border: 'none',
                background: active ? (k.id === 'income' ? theme.good : accent) : 'transparent',
                color: active ? (k.id === 'income' ? '#0A0A0A' : window.getFabContrast(accent)) : theme.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>{k.label}</button>
            );
          })}
        </div>

        {/* Amount */}
        <div style={{ padding: '10px 24px 8px', textAlign: 'center' }}>
          <div style={{
            fontSize: 50, fontWeight: 600, letterSpacing: -2.2, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: amount === '0' ? theme.textTer : signColor,
          }}>
            <span style={{ color: theme.textTer, fontSize: 24, marginRight: 2, verticalAlign: '8px' }}>{sign}$</span>
            {formatted}
          </div>
        </div>

        {/* Account selector */}
        <div style={{ padding: '4px 18px 10px' }}>
          <button onClick={() => setShowAccountPicker(s => !s)} style={{
            width: '100%', height: 48, borderRadius: 14, border: `1px solid ${theme.border}`,
            background: theme.surface, color: theme.text,
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: `${account.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AccIco s={15} c={account.color} w={1.7}/>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: theme.textTer, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {isIncome ? 'A cuenta' : 'Pagar con'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {account.name} {account.last4 ? `· ${account.last4}` : ''}
              </div>
            </div>
            <window.Icon.Chevron s={14} c={theme.textTer} w={1.7}
              style={{ transform: showAccountPicker ? 'rotate(90deg)' : 'rotate(0)' }}/>
          </button>
          {showAccountPicker && (
            <div style={{
              marginTop: 8, background: theme.surface, borderRadius: 14,
              border: `1px solid ${theme.border}`, overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
            }}>
              {ACCOUNTS.map((a, i) => {
                const I = accIcon(a);
                const sel = a.id === accountId;
                return (
                  <button key={a.id} onClick={() => { setAccountId(a.id); setShowAccountPicker(false); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: sel ? theme.surfaceAlt : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    color: theme.text, textAlign: 'left',
                    borderBottom: i === ACCOUNTS.length - 1 ? 'none' : `0.5px solid ${theme.divider}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, background: `${a.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <I s={14} c={a.color} w={1.7}/>
                    </div>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      {a.name}
                      {a.last4 ? <span style={{ color: theme.textTer }}> · {a.last4}</span> : ''}
                    </div>
                    <span style={{ fontSize: 11, color: theme.textTer, fontVariantNumeric: 'tabular-nums' }}>
                      {window.FZ.MXN(a.balance)}
                    </span>
                    {sel && <window.Icon.Check s={14} c={accent} w={2.5}/>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories — only for expenses */}
        {!isIncome && (
          <div style={{ padding: '0 0 10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
              {CATEGORIES.map(c => {
                const I = window.Icon[c.icon];
                const active = category === c.id;
                return (
                  <button key={c.id} onClick={() => setCategory(c.id)} style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4, padding: '8px 6px', minWidth: 60,
                    borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? `${accent}1A` : 'transparent',
                    border: `1px solid ${active ? accent : theme.border}`,
                    color: active ? accent : theme.textSec,
                  }}>
                    <I s={18} c={active ? accent : theme.text} w={1.6}/>
                    <span style={{ fontSize: 9.5, fontWeight: 500, color: active ? accent : theme.textSec }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <div style={{ padding: '0 18px 10px' }}>
          {noteOpen ? (
            <input autoFocus value={note} onChange={e => setNote(e.target.value)}
              placeholder={isIncome ? 'Concepto…' : 'Nota…'}
              style={{
                width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box',
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 12, color: theme.text, fontSize: 13, fontFamily: 'inherit',
                outline: 'none',
              }}/>
          ) : (
            <button onClick={() => setNoteOpen(true)} style={{
              width: '100%', height: 34, borderRadius: 12, border: `1px dashed ${theme.borderStrong}`,
              background: 'transparent', color: theme.textSec, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>+ {isIncome ? 'Concepto' : 'Nota'}</button>
          )}
        </div>

        {/* Numpad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          padding: '0 18px',
        }}>
          {layout.map(k => (
            <button key={k} onClick={() => press(k)} style={{
              height: 44, borderRadius: 14, border: 'none',
              background: theme.surface, color: theme.text,
              fontSize: 21, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {k === '⌫' ? <window.Icon.Backspace s={20} c={theme.text} w={1.7}/> : k}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 18px 0', display: 'flex', gap: 10 }}>
          <button onClick={toggleVoice} style={{
            width: 52, height: 50, borderRadius: 16, border: `1px solid ${theme.border}`,
            background: listening ? accent : theme.surface,
            color: listening ? window.getFabContrast(accent) : theme.text,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <window.Icon.Mic s={20} c={listening ? window.getFabContrast(accent) : theme.text} w={1.7}/>
            {listening && (
              <div style={{
                position: 'absolute', inset: -2, borderRadius: 18,
                border: `2px solid ${accent}`, opacity: 0.6,
                animation: 'pulse 1.2s infinite',
              }}/>
            )}
          </button>
          <button disabled={!valid} style={{
            flex: 1, height: 50, borderRadius: 16, border: 'none',
            background: valid ? (isIncome ? theme.good : accent) : theme.surfaceAlt,
            color: valid ? (isIncome ? '#0A0A0A' : window.getFabContrast(accent)) : theme.textTer,
            fontSize: 15, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', letterSpacing: -0.2,
          }}>
            {isIncome ? 'Registrar ingreso' : 'Guardar gasto'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.QuickExpense = QuickExpense;
