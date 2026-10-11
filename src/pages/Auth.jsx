import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { Zap } from 'lucide-react';

function AuthLayout({ children, title, sub }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', padding:16,
    }}>
      <div className="fade-in" style={{ width:'100%', maxWidth:400 }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40, justifyContent:'center' }}>
          <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={18} color="#0f0f0f" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Forge CRM</span>
        </div>

        <div style={{
          background:'var(--bg-2)', border:'1px solid var(--border)',
          borderRadius:16, padding:32,
        }}>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4, fontFamily:'var(--font-display)' }}>{title}</h2>
          <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:24 }}>{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" sub="Sign in to your workspace">
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Input label="Email address" type="email" value={form.email} onChange={set('email')} required placeholder="you@company.com" />
        <Input label="Password" type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" />
        {error && <div style={{ fontSize:12, color:'var(--red)', background:'var(--red-dim)', border:'1px solid var(--red-dim)', borderRadius:6, padding:'8px 12px' }}>{error}</div>}
        <Button type="submit" loading={loading} style={{ width:'100%', justifyContent:'center', marginTop:4 }}>Sign in</Button>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-3)' }}>
          No account? <Link to="/register" style={{ color:'var(--accent)' }}>Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ workspace_name:'', first_name:'', last_name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your workspace" sub="Get started with Forge CRM">
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Workspace name" value={form.workspace_name} onChange={set('workspace_name')} required placeholder="Acme Corp" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Input label="First name" value={form.first_name} onChange={set('first_name')} required placeholder="John" />
          <Input label="Last name" value={form.last_name} onChange={set('last_name')} required placeholder="Doe" />
        </div>
        <Input label="Email address" type="email" value={form.email} onChange={set('email')} required placeholder="you@company.com" />
        <Input label="Password" type="password" value={form.password} onChange={set('password')} required placeholder="Min 8 chars with upper, lower, digit" />
        {error && <div style={{ fontSize:12, color:'var(--red)', background:'var(--red-dim)', border:'1px solid var(--red-dim)', borderRadius:6, padding:'8px 12px' }}>{error}</div>}
        <Button type="submit" loading={loading} style={{ width:'100%', justifyContent:'center', marginTop:4 }}>Create workspace</Button>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-3)' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--accent)' }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
