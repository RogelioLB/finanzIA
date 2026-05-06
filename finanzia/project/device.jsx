// Device frame for FinanzIA — 390x844 (iPhone 14 / Android standard)
// Includes status bar, home indicator, and content viewport.

function FZStatusBar({ theme }) {
  const c = theme.text;
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 47, padding: '0 28px', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 30, color: c, pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: 'Geist, sans-serif', fontWeight: 600, fontSize: 16,
        letterSpacing: -0.2, paddingTop: 4,
      }}>9:41</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0" y="7" width="3" height="4" rx="0.5" fill={c}/>
          <rect x="4.6" y="5" width="3" height="6" rx="0.5" fill={c}/>
          <rect x="9.2" y="2.5" width="3" height="8.5" rx="0.5" fill={c}/>
          <rect x="13.8" y="0" width="3" height="11" rx="0.5" fill={c}/>
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11">
          <path d="M7.5 2.5C9.6 2.5 11.5 3.3 13 4.6L14 3.5C12.2 1.9 9.9 1 7.5 1C5.1 1 2.8 1.9 1 3.5L2 4.6C3.5 3.3 5.4 2.5 7.5 2.5Z" fill={c}/>
          <path d="M7.5 5.7C8.7 5.7 9.8 6.2 10.6 7L11.7 5.9C10.5 4.8 9.1 4.2 7.5 4.2C5.9 4.2 4.5 4.8 3.3 5.9L4.4 7C5.2 6.2 6.3 5.7 7.5 5.7Z" fill={c}/>
          <circle cx="7.5" cy="9.5" r="1.3" fill={c}/>
        </svg>
        {/* battery */}
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke={c} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill={c}/>
          <path d="M23.5 4V8C24.2 7.7 24.5 7.1 24.5 6.5C24.5 5.9 24.2 5.3 23.5 4Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function FZDevice({ theme, children }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 50, overflow: 'hidden',
      position: 'relative', background: theme.bg,
      boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.15)',
      fontFamily: 'Geist, -apple-system, system-ui, sans-serif',
      color: theme.text, WebkitFontSmoothing: 'antialiased',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 122, height: 36, borderRadius: 22, background: '#000', zIndex: 50,
      }} />
      <FZStatusBar theme={theme} />
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {children}
      </div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 100,
        background: theme.isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.30)',
        zIndex: 60, pointerEvents: 'none',
      }} />
    </div>
  );
}

window.FZDevice = FZDevice;
