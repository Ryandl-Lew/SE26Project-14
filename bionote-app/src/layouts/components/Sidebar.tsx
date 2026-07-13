import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS, PAGE_NAV_MAP } from '@/utils/constants';
import { useAuthStore } from '@/stores/useAuthStore';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  // Determine active nav key
  const pathToKey = (path: string): string => {
    if (path === '/') return 'dashboard';
    const seg = path.split('/')[1];
    // Check for sub-page mappings
    if (path.startsWith('/projects/') && path !== '/projects') {
      return PAGE_NAV_MAP['current-project'] || 'projects';
    }
    if (path.startsWith('/records/')) {
      if (path.endsWith('/edit')) return PAGE_NAV_MAP['editor'] || 'records';
      if (path !== '/records') return PAGE_NAV_MAP['detail'] || 'records';
    }
    return seg || 'dashboard';
  };

  const activeKey = pathToKey(location.pathname);

  // Group nav items by section
  const sections = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    const section = item.section || 'default';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <aside
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#d8e8e4',
        background: 'linear-gradient(180deg, #0f2a25 0%, #143830 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        zIndex: 30,
        width: 248,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '0 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 4,
            background: '#1a8b6f',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
            boxShadow: '0 0 12px rgba(26,139,111,0.35)',
          }}
        >
          B
        </div>
        <div style={{ display: 'grid', gap: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>BioNote</div>
          <div style={{ fontSize: 11, color: 'rgba(216,232,228,0.55)', letterSpacing: 0.4 }}>生物实验记录助手</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px 14px', overflowY: 'auto', flex: 1 }}>
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            <div
              style={{
                margin: '14px 8px 6px',
                color: 'rgba(216,232,228,0.42)',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              {section}
            </div>
            {items.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.route)}
                  style={{
                    width: '100%',
                    minHeight: 38,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    margin: '2px 0',
                    padding: '8px 10px',
                    border: isActive ? '1px solid rgba(26,139,111,0.35)' : '1px solid transparent',
                    borderRadius: 6,
                    color: isActive ? '#fff' : 'rgba(216,232,228,0.78)',
                    background: isActive ? 'rgba(26,139,111,0.22)' : 'transparent',
                    boxShadow: isActive ? 'inset 2px 0 0 #3cc99e' : 'none',
                    textAlign: 'left',
                    fontSize: 13.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'rgba(216,232,228,0.78)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          margin: '8px 12px 14px',
          padding: '12px 14px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(216,232,228,0.6)',
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(216,232,228,0.35)', marginBottom: 3 }}>
          LAB
        </div>
        当前实验室<br />
        {user?.lab || '分子生物学教学实验室'}
      </div>
    </aside>
  );
};

export default Sidebar;
