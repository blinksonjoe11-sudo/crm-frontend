import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, GitBranch,
  Activity, CheckSquare, LogOut, Settings, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './ui';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/deals', icon: Briefcase, label: 'Deals' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const w = collapsed ? 64 : 220;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: w, minWidth: w, height:'100vh', background:'var(--bg-2)',
        borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
        transition:'width 0.2s ease', overflow:'hidden', position:'relative', zIndex:10,
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 0' : '20px 16px', display:'flex', alignItems:'center', gap:10, justifyContent: collapsed ? 'center' : 'space-between', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, background:'var(--accent)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap size={14} color="#0f0f0f" strokeWidth={2.5} />
            </div>
            {!collapsed && <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)' }}>Forge</span>}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', display:'flex', padding:2 }}>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : ''}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding: collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius:'var(--radius)', textDecoration:'none',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                fontSize:13, fontWeight:500, transition:'all 0.15s',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = e.currentTarget.style.color.includes('accent') ? 'var(--accent)' : 'var(--text)'; }}
              onMouseLeave={e => { if (!window.location.pathname === to) { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; } }}
            >
              <Icon size={16} strokeWidth={1.75} style={{ flexShrink:0 }} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'12px 8px' }}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} title="Expand" style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'center', padding:'8px 0' }}>
              <Avatar name={`${user?.first_name} ${user?.last_name}`} size={28} />
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:'var(--radius)' }}>
                <Avatar name={`${user?.first_name} ${user?.last_name}`} size={28} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.first_name} {user?.last_name}</div>
                  <div style={{ fontSize:10, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.workspace?.name}</div>
                </div>
              </div>
              <button onClick={handleLogout} style={{
                display:'flex', alignItems:'center', gap:8, padding:'7px 8px',
                background:'none', border:'none', color:'var(--text-3)', cursor:'pointer',
                borderRadius:'var(--radius)', fontSize:12, width:'100%', textAlign:'left',
                transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        {children}
      </main>
    </div>
  );
}
