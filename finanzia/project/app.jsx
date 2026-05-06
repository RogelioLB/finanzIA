// Main App for FinanzIA

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF6B35",
  "mode": "dark",
  "density": "comfortable",
  "numpadStyle": "calculator",
  "fabStyle": "notch"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);
  const { accent, mode, density, numpadStyle, fabStyle } = tweaks;

  const [tab, setTab] = useState('home');
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [investmentsOpen, setInvestmentsOpen] = useState(false);
  const [envelopesOpen, setEnvelopesOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [customAccent, setCustomAccent] = useState(accent);

  const theme = window.FZ.getTheme(mode);

  // expose nav helper for Home → Settings deep link
  useEffect(() => {
    window.FZ_navigate = (target) => {
      if (target === 'settings') setSettingsOpen(true);
      else setTab(target);
    };
  }, []);

  const setAccent = (c) => setTweak({ accent: c });
  const setMode = (m) => setTweak({ mode: m });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a',
      padding: 24, boxSizing: 'border-box',
      fontFamily: 'Geist, -apple-system, system-ui, sans-serif',
    }}>
      <window.FZDevice theme={theme}>
        {/* Active screen */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {tab === 'home' && <window.HomeScreen theme={theme} accent={accent} density={density}/>}
          {tab === 'expenses' && <window.ExpensesScreen theme={theme} accent={accent} density={density}/>}
          {tab === 'debts' && <window.DebtsScreen theme={theme} accent={accent} density={density} onSelectDebt={setSelectedDebt}/>}
          {tab === 'more' && <window.MoreScreen theme={theme} accent={accent} onOpen={(id) => {
            if (id === 'envelopes') setEnvelopesOpen(true);
            else if (id === 'accounts') setAccountsOpen(true);
            else if (id === 'investments') setInvestmentsOpen(true);
            else if (id === 'recurring') setRecurringOpen(true);
            else if (id === 'settings') setSettingsOpen(true);
          }}/>}
        </div>

        {/* Tab bar */}
        <window.TabBar
          theme={theme} accent={accent}
          active={tab} onChange={setTab}
          onFab={() => setQuickOpen(true)}
          fabStyle={fabStyle}
          density={density}
        />

        {/* Quick expense */}
        {quickOpen && (
          <window.QuickExpense
            theme={theme} accent={accent}
            onClose={() => setQuickOpen(false)}
            numpadStyle={numpadStyle}
          />
        )}

        {/* Debt detail */}
        {selectedDebt && (
          <window.DebtDetail
            debt={selectedDebt} theme={theme} accent={accent}
            onClose={() => setSelectedDebt(null)}
          />
        )}

        {/* Settings */}
        {settingsOpen && (
          <window.SettingsScreen
            theme={theme} accent={accent} setAccent={setAccent}
            mode={mode} setMode={setMode}
            customAccent={customAccent} setCustomAccent={setCustomAccent}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {/* Envelopes (modal from Más) */}
        {envelopesOpen && (
          <div style={{
            position: 'absolute', inset: 0, background: theme.bg, zIndex: 100,
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}>
            <div style={{ padding: '60px 20px 0', display: 'flex', alignItems: 'center', gap: 12, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
              <button onClick={() => setEnvelopesOpen(false)} style={{
                width: 36, height: 36, borderRadius: 18, border: 'none',
                background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: theme.text,
              }}>
                <window.Icon.Back s={18} c={theme.text} w={1.7}/>
              </button>
            </div>
            <div style={{ flex: 1, paddingTop: 44 }}>
              <window.EnvelopesScreen theme={theme} accent={accent} density={density}/>
            </div>
          </div>
        )}

        {/* Accounts */}
        {accountsOpen && (
          <window.AccountsScreen
            theme={theme} accent={accent} density={density}
            onClose={() => setAccountsOpen(false)}
            onAdd={() => setAddAccountOpen(true)}
          />
        )}

        {/* Add Account sheet */}
        {addAccountOpen && (
          <window.AddAccountSheet
            theme={theme} accent={accent}
            onClose={() => setAddAccountOpen(false)}
          />
        )}

        {/* Investments */}
        {investmentsOpen && (
          <window.InvestmentsScreen
            theme={theme} accent={accent} density={density}
            onClose={() => setInvestmentsOpen(false)}
          />
        )}

        {/* Recurring */}
        {recurringOpen && (
          <window.RecurringScreen
            theme={theme} accent={accent} density={density}
            onClose={() => setRecurringOpen(false)}
          />
        )}
      </window.FZDevice>

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Apariencia">
            <window.TweakRadio
              label="Tema"
              value={mode}
              onChange={(v) => setTweak({ mode: v })}
              options={[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Oscuro' },
              ]}
            />
            <window.TweakColor
              label="Acento"
              value={accent}
              onChange={(v) => setTweak({ accent: v })}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {window.FZ.ACCENT_PALETTE.slice(0, 8).map(c => (
                <button key={c} onClick={() => setTweak({ accent: c })} style={{
                  width: 22, height: 22, borderRadius: 11, background: c,
                  border: c.toLowerCase() === accent.toLowerCase() ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer', padding: 0,
                }}/>
              ))}
            </div>
          </window.TweakSection>

          <window.TweakSection title="Layout">
            <window.TweakRadio
              label="Densidad"
              value={density}
              onChange={(v) => setTweak({ density: v })}
              options={[
                { value: 'comfortable', label: 'Cómoda' },
                { value: 'compact', label: 'Compacta' },
              ]}
            />
            <window.TweakRadio
              label="FAB"
              value={fabStyle}
              onChange={(v) => setTweak({ fabStyle: v })}
              options={[
                { value: 'notch', label: 'Centrado' },
                { value: 'floating', label: 'Flotante' },
              ]}
            />
            <window.TweakRadio
              label="Numpad"
              value={numpadStyle}
              onChange={(v) => setTweak({ numpadStyle: v })}
              options={[
                { value: 'calculator', label: 'Calculadora' },
                { value: 'phone', label: 'Teléfono' },
              ]}
            />
          </window.TweakSection>

          <window.TweakSection title="Acciones">
            <window.TweakButton onClick={() => setQuickOpen(true)}>Abrir registro rápido</window.TweakButton>
            <window.TweakButton onClick={() => setSettingsOpen(true)}>Abrir ajustes en app</window.TweakButton>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
