// Settings / theme screen

function SettingsScreen({ theme, accent, setAccent, mode, setMode, customAccent, setCustomAccent, onClose }) {
  const { ACCENT_PALETTE } = window.FZ;
  const [showCustom, setShowCustom] = React.useState(false);
  const [hexInput, setHexInput] = React.useState(accent);

  const applyHex = () => {
    const v = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setAccent(v);
      setCustomAccent(v);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg, zIndex: 110,
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
      <div style={{
        padding: '60px 20px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }}>
          <window.Icon.Back s={18} c={theme.text} w={1.7}/>
        </button>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>Apariencia</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 40px' }}>
        {/* Live preview card */}
        <div style={{
          background: theme.surface, borderRadius: 22, padding: 18,
          border: `1px solid ${theme.border}`, marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: theme.textTer, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Preview</div>
          <div style={{
            fontSize: 32, fontWeight: 600, letterSpacing: -1.2, fontVariantNumeric: 'tabular-nums', marginBottom: 12,
          }}>$48,732.50</div>
          <div style={{
            height: 6, borderRadius: 3, background: theme.surfaceAlt, overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{ width: '67%', height: '100%', background: accent }}/>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, height: 40, borderRadius: 12, border: 'none',
              background: accent, color: window.getFabContrast(accent),
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>Botón primario</button>
            <button style={{
              width: 40, height: 40, borderRadius: 12, border: `1px solid ${accent}`,
              background: 'transparent', color: accent, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <window.Icon.Plus s={18} c={accent} w={2}/>
            </button>
          </div>
        </div>

        {/* Theme toggle */}
        <SectionLabel theme={theme}>Tema</SectionLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          background: theme.surface, borderRadius: 14, padding: 4, border: `1px solid ${theme.border}`,
          marginBottom: 24,
        }}>
          {['light', 'dark'].map(m => {
            const active = mode === m;
            const I = m === 'light' ? window.Icon.Sun : window.Icon.Moon;
            return (
              <button key={m} onClick={() => setMode(m)} style={{
                height: 40, borderRadius: 10, border: 'none',
                background: active ? accent : 'transparent',
                color: active ? window.getFabContrast(accent) : theme.text,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}>
                <I s={15} c={active ? window.getFabContrast(accent) : theme.text} w={1.7}/>
                {m === 'light' ? 'Claro' : 'Oscuro'}
              </button>
            );
          })}
        </div>

        {/* Accent palette */}
        <SectionLabel theme={theme}>Color de acento</SectionLabel>
        <div style={{
          background: theme.surface, borderRadius: 18, padding: 16, border: `1px solid ${theme.border}`,
          marginBottom: 12,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {ACCENT_PALETTE.map(c => {
              const active = c.toLowerCase() === accent.toLowerCase();
              return (
                <button key={c} onClick={() => setAccent(c)} style={{
                  width: 38, height: 38, borderRadius: 19,
                  background: c, border: c === '#FAFAFA' ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer', position: 'relative',
                  boxShadow: active ? `0 0 0 2px ${theme.bg}, 0 0 0 4px ${c}` : 'none',
                  transition: 'box-shadow 0.15s',
                }}>
                  {active && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <window.Icon.Check s={16} c={window.getFabContrast(c)} w={2.5}/>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom hex */}
        <button onClick={() => setShowCustom(s => !s)} style={{
          width: '100%', height: 48, borderRadius: 14, border: `1px solid ${theme.border}`,
          background: theme.surface, color: theme.text,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <span>Color personalizado</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 11, background: customAccent || accent,
              border: '1px solid rgba(0,0,0,0.1)',
            }}/>
            <window.Icon.Chevron s={14} c={theme.textTer} w={1.7}/>
          </div>
        </button>

        {showCustom && (
          <div style={{
            background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`,
            padding: 14, marginTop: 8, display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, color: theme.textSec, fontFamily: 'Geist Mono, monospace' }}>#</span>
            <input
              value={hexInput.replace('#', '')}
              onChange={e => setHexInput('#' + e.target.value.replace('#', '').slice(0, 6))}
              placeholder="FF6B35"
              style={{
                flex: 1, height: 38, padding: '0 12px', boxSizing: 'border-box',
                background: theme.surfaceAlt, border: 'none', borderRadius: 10,
                color: theme.text, fontSize: 14, fontFamily: 'Geist Mono, monospace',
                letterSpacing: 1, textTransform: 'uppercase', outline: 'none',
              }}
            />
            <input
              type="color"
              value={hexInput.length === 7 ? hexInput : accent}
              onChange={e => { setHexInput(e.target.value); setAccent(e.target.value); setCustomAccent(e.target.value); }}
              style={{ width: 38, height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'transparent' }}
            />
            <button onClick={applyHex} style={{
              height: 38, padding: '0 14px', borderRadius: 10, border: 'none',
              background: accent, color: window.getFabContrast(accent),
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ theme, children }) {
  return (
    <div style={{
      fontSize: 11, color: theme.textTer, textTransform: 'uppercase',
      letterSpacing: 0.6, padding: '0 4px 8px', fontWeight: 500,
    }}>{children}</div>
  );
}

window.SettingsScreen = SettingsScreen;
