import { forwardRef } from 'react';
import { clsx } from 'clsx';

export function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[--accent] text-[#0f0f0f] border-transparent hover:brightness-110 active:brightness-90',
    secondary: 'bg-[--bg-3] text-[--text] border-[--border] hover:bg-[--bg-4] active:bg-[--bg-3]',
    ghost: 'bg-transparent text-[--text-2] border-transparent hover:bg-[--bg-3] hover:text-[--text]',
    danger: 'bg-[--red-dim] text-[--red] border-[--red-dim] hover:bg-[rgba(248,113,113,0.2)]',
    success: 'bg-[--green-dim] text-[--green] border-[--green-dim] hover:bg-[rgba(74,222,128,0.2)]',
  };
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
    icon: 'p-2',
  };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <span style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block', flexShrink:0 }} />}
      {children}
    </button>
  );
}

export function Input({ label, error, className, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <label style={{ fontSize:12, color:'var(--text-2)', fontWeight:500, letterSpacing:'0.02em' }}>{label}</label>}
      <input
        style={{
          background: 'var(--bg-3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', color: 'var(--text)', padding: '8px 12px',
          fontSize: 14, outline: 'none', transition: 'border-color 0.15s', width:'100%',
        }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
        className={className}
        {...props}
      />
      {error && <span style={{ fontSize:11, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <label style={{ fontSize:12, color:'var(--text-2)', fontWeight:500 }}>{label}</label>}
      <select style={{
        background: 'var(--bg-3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', color: 'var(--text)', padding: '8px 12px',
        fontSize: 14, outline: 'none', width:'100%', cursor:'pointer',
      }} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <label style={{ fontSize:12, color:'var(--text-2)', fontWeight:500 }}>{label}</label>}
      <textarea style={{
        background: 'var(--bg-3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', color: 'var(--text)', padding: '8px 12px',
        fontSize: 14, outline: 'none', resize:'vertical', minHeight:80, width:'100%',
        fontFamily: 'var(--font)', transition: 'border-color 0.15s',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
      {...props} />
    </div>
  );
}

export function Card({ children, style, className, ...props }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', ...style }} className={className} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'default' }) {
  const colors = {
    default: { bg:'var(--bg-3)', color:'var(--text-2)', border:'var(--border)' },
    accent: { bg:'var(--accent-dim)', color:'var(--accent)', border:'transparent' },
    green: { bg:'var(--green-dim)', color:'var(--green)', border:'transparent' },
    red: { bg:'var(--red-dim)', color:'var(--red)', border:'transparent' },
    blue: { bg:'var(--blue-dim)', color:'var(--blue)', border:'transparent' },
    amber: { bg:'var(--amber-dim)', color:'var(--amber)', border:'transparent' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius:4, padding:'2px 7px', fontSize:11, fontWeight:500, letterSpacing:'0.03em',
      display:'inline-flex', alignItems:'center', whiteSpace:'nowrap',
    }}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000, padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        background:'var(--bg-2)', border:'1px solid var(--border-2)',
        borderRadius:'var(--radius-lg)', width:'100%', maxWidth:width,
        maxHeight:'90vh', overflow:'auto',
      }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:15, fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-2)', cursor:'pointer', padding:4, borderRadius:4, display:'flex' }}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:12, textAlign:'center' }}>
      {Icon && <div style={{ width:48, height:48, background:'var(--bg-3)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)' }}><Icon size={22} /></div>}
      <div>
        <div style={{ fontWeight:500, marginBottom:4 }}>{title}</div>
        {description && <div style={{ fontSize:13, color:'var(--text-2)' }}>{description}</div>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 16 }) {
  return <span style={{ width:size, height:size, border:'2px solid var(--border-2)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block' }} />;
}

export function Avatar({ name = '', size = 32 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#c8a96e','#4ade80','#60a5fa','#f87171','#a78bfa','#fb923c'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background: `${colors[idx]}22`, border:`1.5px solid ${colors[idx]}44`,
      color: colors[idx], display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.35, fontWeight:600, flexShrink:0,
    }}>
      {initials || '?'}
    </div>
  );
}

export function StatCard({ label, value, sub, color = 'default', icon: Icon }) {
  const colors = { default: 'var(--text)', green:'var(--green)', amber:'var(--amber)', red:'var(--red)', blue:'var(--blue)', accent:'var(--accent)' };
  return (
    <Card style={{ padding:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
        <div>
          <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:28, fontWeight:700, color: colors[color], fontFamily:'var(--font-display)', letterSpacing:'-0.03em' }}>{value}</div>
          {sub && <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>{sub}</div>}
        </div>
        {Icon && <div style={{ width:36, height:36, background:'var(--bg-3)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', flexShrink:0 }}><Icon size={18} /></div>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:24, flexWrap:'wrap' }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'var(--font-display)', letterSpacing:'-0.02em', lineHeight:1.2 }}>{title}</h1>
        {description && <p style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toast({ message, type = 'info', onClose }) {
  const colors = { info: 'var(--blue)', success: 'var(--green)', error: 'var(--red)' };
  return (
    <div className="fade-in" style={{
      position:'fixed', bottom:24, right:24, zIndex:2000,
      background:'var(--bg-2)', border:`1px solid ${colors[type]}44`,
      borderLeft:`3px solid ${colors[type]}`, borderRadius:'var(--radius)',
      padding:'12px 16px', display:'flex', alignItems:'center', gap:10,
      fontSize:13, maxWidth:320, boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <span style={{ color:colors[type], flex:1 }}>{message}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', lineHeight:1 }}>✕</button>
    </div>
  );
}
