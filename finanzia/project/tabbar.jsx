// Bottom tab bar with centered FAB notch — FinanzIA
// 4 tabs: Inicio, Gastos, Deudas, Sobres

function TabBar({ theme, active, onChange, onFab, accent, fabStyle = 'notch', density = 'comfortable' }) {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: 'Home' },
    { id: 'expenses', label: 'Gastos', icon: 'List' },
    { id: 'debts', label: 'Deudas', icon: 'Debt' },
    { id: 'more', label: 'Más', icon: 'Dots' },
  ];

  const Tab = ({ t, isActive }) => {
    const I = window.Icon[t.icon];
    return (
      <button onClick={() => onChange(t.id)} style={{
        flex: 1, height: 56, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: isActive ? accent : theme.textTer,
        padding: 0, fontFamily: 'inherit',
        transition: 'color 0.15s',
      }}>
        <I s={22} c={isActive ? accent : theme.textTer} w={isActive ? 1.9 : 1.5}/>
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.1 }}>{t.label}</span>
      </button>
    );
  };

  if (fabStyle === 'floating') {
    // Floating FAB above a flat tab bar
    return (
      <React.Fragment>
        <button onClick={onFab} style={{
          position: 'absolute', bottom: 96, right: 20, zIndex: 40,
          width: 60, height: 60, borderRadius: 30,
          background: accent, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: theme.fabShadow,
          color: getFabContrast(accent),
        }}>
          <window.Icon.Plus s={26} c={getFabContrast(accent)} w={2.2}/>
        </button>
        <nav style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 84,
          background: theme.navBg,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: `0.5px solid ${theme.border}`,
          display: 'flex', paddingBottom: 28, zIndex: 20,
        }}>
          {tabs.map(t => <Tab key={t.id} t={t} isActive={active === t.id} />)}
        </nav>
      </React.Fragment>
    );
  }

  // Centered notched FAB (default)
  return (
    <nav style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 84,
      background: theme.navBg,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `0.5px solid ${theme.border}`,
      zIndex: 20,
    }}>
      <div style={{
        display: 'flex', height: 56, paddingBottom: 0, position: 'relative',
      }}>
        <Tab t={tabs[0]} isActive={active === tabs[0].id} />
        <Tab t={tabs[1]} isActive={active === tabs[1].id} />
        <div style={{ width: 72, flexShrink: 0 }} />
        <Tab t={tabs[2]} isActive={active === tabs[2].id} />
        <Tab t={tabs[3]} isActive={active === tabs[3].id} />
      </div>
      {/* FAB */}
      <button onClick={onFab} style={{
        position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
        width: 64, height: 64, borderRadius: 32,
        background: accent, border: `4px solid ${theme.bg}`, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: theme.fabShadow, zIndex: 25,
        color: getFabContrast(accent),
      }}>
        <window.Icon.Plus s={28} c={getFabContrast(accent)} w={2.2}/>
      </button>
    </nav>
  );
}

// Pick black or white for FAB icon based on accent luminance
function getFabContrast(hex) {
  if (!hex) return '#fff';
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.65 ? '#0A0A0A' : '#FFFFFF';
}

window.TabBar = TabBar;
window.getFabContrast = getFabContrast;
