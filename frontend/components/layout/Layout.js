import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const NAV = [
  { href: '/dashboard',   icon: '⬜', label: 'Overview' },
  { href: '/books',       icon: '📚', label: 'Browse Books' },
  { href: '/my-borrows',  icon: '📋', label: 'My Borrows' },
  { href: '/my-requests', icon: '📨', label: 'My Requests' },
  { href: '/progress',    icon: '📖', label: 'Reading Tracker' },
  { href: '/profile',     icon: '👤', label: 'My Profile' },
  { href: '/saved',       icon: '⭐', label: 'Saved Books' },
  { href: '/my-fines',    icon: '💰', label: 'My Fines' },
];

const SPACES = [
  { href: '/study-rooms', icon: '🏫', label: 'Study Rooms' },
  { href: '/marketplace', icon: '🎁', label: 'Marketplace' },
];

// ── ADMIN: sees who borrowed books, manages fines, manages users
const ADMIN_NAV = [
  { href: '/admin',         icon: '📊', label: 'Analytics' },
  { href: '/admin/borrows', icon: '📋', label: 'Active Loans' },
  { href: '/admin/users',   icon: '👤', label: 'Manage Users' },
  { href: '/admin/fines',   icon: '💰', label: 'Fine Management' },
];

// ── LIBRARIAN: approves borrow/return requests, manages books
const LIBRARIAN_NAV = [
  { href: '/admin',           icon: '📊', label: 'Overview' },
  { href: '/admin/requests',  icon: '📨', label: 'Borrow Requests' },
  { href: '/admin/books',     icon: '📚', label: 'Manage Books' },
  { href: '/study-rooms',     icon: '🏫', label: 'Study Rooms' },
];

function SignOutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, padding: '28px 24px', width: 300, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Sign out?</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>Are you sure you want to sign out?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: 8, color: '#fb7185', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const router = useRouter();
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  const handleSignOut = () => { logout(); router.push('/'); };

  const isAdmin     = user?.role === 'admin';
  const isLibrarian = user?.role === 'librarian';
  const isStaff     = isAdmin || isLibrarian;
  const staffNav    = isAdmin ? ADMIN_NAV : LIBRARIAN_NAV;

  const ROLE_COLOR = { admin: '#fb7185', librarian: '#fbbf24', student: '#34d399' };
  const ROLE_BADGE = { admin: '👑 Admin', librarian: '📖 Librarian', student: '🎓 Student' };
  const initials   = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const NavItem = ({ href, icon, label }) => {
    const active = router.pathname === href || router.pathname.startsWith(href + '/');
    return (
      <Link href={href} onClick={() => setMobileOpen(false)}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8, fontSize: 13,
          fontWeight: 500, cursor: 'pointer',
          color: active ? 'var(--text)' : 'var(--muted)',
          background: active ? 'var(--surface2)' : 'transparent',
          border: active ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'all 0.15s', marginBottom: 2, textDecoration: 'none',
        }}
          onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = 'var(--text)'; } }}
          onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; } }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ flex: 1 }}>{label}</span>
          {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
        </div>
      </Link>
    );
  };

  const SectionLabel = ({ label, color }) => (
    <div style={{ fontSize: 10, fontWeight: 600, color: color || 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 4px' }}>
      {label}
    </div>
  );

  const RoleBanner = () => {
    if (isAdmin) return (
      <div style={{ margin: '8px 10px', padding: '8px 10px', background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fb7185', marginBottom: 3 }}>👑 ADMIN ACCESS</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
          • View all active loans<br />
          • Manage fines<br />
          • Manage users & analytics
        </div>
      </div>
    );
    if (isLibrarian) return (
      <div style={{ margin: '8px 10px', padding: '8px 10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginBottom: 3 }}>📖 LIBRARIAN ACCESS</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
          • Approve borrow requests<br />
          • Approve return requests<br />
          • Manage book catalog
        </div>
      </div>
    );
    return null;
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo + theme */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 12px' }}>
        <Link href={isStaff ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>LibraryOS</span>
          </div>
        </Link>
        <button onClick={toggleTheme} className="theme-toggle" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0 10px 8px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700,
          background: isAdmin ? 'rgba(251,113,133,0.1)' : isLibrarian ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
          color: ROLE_COLOR[user?.role] || 'var(--muted)',
          border: `1px solid ${ROLE_COLOR[user?.role] || 'var(--border)'}40`,
        }}>
          {ROLE_BADGE[user?.role] || user?.role}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── STUDENT ── */}
        {!isStaff && (
          <>
            {NAV.map(item => <NavItem key={item.href} {...item} />)}
            <SectionLabel label="Spaces" />
            {SPACES.map(item => <NavItem key={item.href} {...item} />)}
          </>
        )}

        {/* ── ADMIN ── */}
        {isAdmin && (
          <>
            <NavItem href="/books"   icon="📚" label="Browse Books" />
            <NavItem href="/profile" icon="👤" label="My Profile" />
            <SectionLabel label="👑 Admin Panel" color="#fb7185" />
            {ADMIN_NAV.map(item => <NavItem key={item.href} {...item} />)}
            <RoleBanner />
          </>
        )}

        {/* ── LIBRARIAN ── */}
        {isLibrarian && (
          <>
            <NavItem href="/books"   icon="📚" label="Browse Books" />
            <NavItem href="/profile" icon="👤" label="My Profile" />
            <SectionLabel label="📖 Librarian Panel" color="#fbbf24" />
            {LIBRARIAN_NAV.map(item => <NavItem key={item.href} {...item} />)}
            <RoleBanner />
          </>
        )}
      </div>

      {/* Profile + sign out */}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 12 }}>
        <Link href="/profile" onClick={() => setMobileOpen(false)}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
            background: router.pathname === '/profile' ? 'var(--surface2)' : 'rgba(99,102,241,0.06)',
            border: router.pathname === '/profile' ? '1px solid var(--border)' : '1px solid rgba(99,102,241,0.15)',
            marginBottom: 8, transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => { if (router.pathname !== '/profile') e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: ROLE_COLOR[user?.role], textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--subtle)' }}>›</span>
          </div>
        </Link>
        <button onClick={() => setShowSignOut(true)} style={{
          width: '100%', padding: '8px 12px', background: 'transparent',
          border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8,
          color: 'var(--muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,113,133,0.08)'; e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.2)'; }}>
          → Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showSignOut && <SignOutModal onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />}

      <div className="mobile-topbar" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📚</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>LibraryOS</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggleTheme} className="theme-toggle">{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 4 }}>{mobileOpen ? '✕' : '☰'}</button>
        </div>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="mobile-overlay" style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.6)' }} />}

      <div className="app-shell" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', background: 'var(--bg)' }}>
        <aside className="sidebar" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '16px 12px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', transition: 'background 0.3s' }}>
          <SidebarContent />
        </aside>
        <main className="main-content" style={{ padding: '28px 32px', overflowY: 'auto', minHeight: '100vh', background: 'var(--bg)', transition: 'background 0.3s' }}>
          <div className="page-enter">{children}</div>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .mobile-overlay { display: block !important; }
          .app-shell { grid-template-columns: 1fr !important; }
          .sidebar {
            position: fixed !important; top: 0; left: 0; bottom: 0;
            width: 240px !important; z-index: 160;
            transform: translateX(${mobileOpen ? '0' : '-100%'});
            transition: transform 0.25s ease, background 0.3s !important;
          }
          .main-content { padding: 76px 16px 24px !important; }
        }
      `}</style>
    </>
  );
}
