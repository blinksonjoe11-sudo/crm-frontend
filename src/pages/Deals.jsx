import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Input, Modal, Badge, Empty, Spinner, PageHeader, Toast, Select, Card } from '../components/ui';
import { format } from 'date-fns';

const statusColor = { open:'blue', won:'green', lost:'red' };

function DealForm({ pipelines = [], onSave, onCancel, loading }) {
  const pipeline = pipelines[0];
  const [form, setForm] = useState({
    title:'', pipeline_id: pipeline?.id || '', stage_id: pipeline?.stages?.[0]?.id || '',
    value:'', currency:'USD', probability:'', expected_close:'',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const currentPipeline = pipelines.find(p => p.id === form.pipeline_id);

  const submit = e => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.value) payload.value = parseFloat(payload.value);
    if (payload.probability) payload.probability = parseInt(payload.probability);
    if (payload.expected_close) payload.expected_close = new Date(payload.expected_close).toISOString();
    onSave(payload);
  };

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <Input label="Deal title *" value={form.title} onChange={set('title')} required placeholder="e.g. Acme Enterprise License" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Select label="Pipeline" value={form.pipeline_id} onChange={e => { setForm(f => ({ ...f, pipeline_id: e.target.value, stage_id: pipelines.find(p=>p.id===e.target.value)?.stages?.[0]?.id || '' })); }}>
          {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select label="Stage" value={form.stage_id} onChange={set('stage_id')}>
          {(currentPipeline?.stages || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Value" type="number" value={form.value} onChange={set('value')} min={0} placeholder="0.00" />
        <Select label="Currency" value={form.currency} onChange={set('currency')}>
          {['USD','EUR','GBP','NGN','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Probability (%)" type="number" min={0} max={100} value={form.probability} onChange={set('probability')} />
        <Input label="Expected close" type="date" value={form.expected_close} onChange={set('expected_close')} />
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Create deal</Button>
      </div>
    </form>
  );
}

export default function Deals() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [meta, setMeta] = useState({});
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type='success') => { setToast({ message:msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsRes, pipelinesRes] = await Promise.all([
        api.getDeals({ page, per_page:20, ...(status ? { status } : {}) }),
        api.getPipelines(),
      ]);
      setDeals(dealsRes.data || []);
      setMeta(dealsRes.meta || {});
      setPipelines(pipelinesRes.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await api.createDeal(data);
      setModal(false);
      showToast('Deal created');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this deal?')) return;
    try { await api.deleteDeal(id); showToast('Deal deleted'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const handleMarkWon = async (id, e) => {
    e.stopPropagation();
    try { await api.markDealWon(id); showToast('Deal marked as won! 🎉', 'success'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const totalOpen = deals.filter(d => d.status === 'open').reduce((s,d) => s + (d.value||0), 0);

  return (
    <div style={{ padding:'28px 32px', animation:'fadeIn 0.2s ease' }}>
      <PageHeader
        title="Deals"
        description={`${meta.total || 0} deals${totalOpen > 0 ? ` · $${totalOpen.toLocaleString()} open pipeline` : ''}`}
        action={<Button onClick={() => setModal(true)}><Plus size={14} />New deal</Button>}
      />

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:4, width:'fit-content' }}>
        {[['', 'All'], ['open', 'Open'], ['won', 'Won'], ['lost', 'Lost']].map(([val, label]) => (
          <button key={val} onClick={() => { setStatus(val); setPage(1); }} style={{
            padding:'5px 14px', borderRadius:5, border:'none', cursor:'pointer',
            background: status === val ? 'var(--bg-4)' : 'transparent',
            color: status === val ? 'var(--text)' : 'var(--text-2)',
            fontSize:13, fontWeight: status === val ? 500 : 400, transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Deals table */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-3)' }}>
              {['Deal','Stage','Value','Probability','Expected Close','Status',''].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-2)', letterSpacing:'0.05em', textTransform:'uppercase', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:40, textAlign:'center' }}><Spinner /></td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={7}><Empty icon={Briefcase} title="No deals found" description="Start tracking your deals" action={<Button onClick={() => setModal(true)}><Plus size={13} />New deal</Button>} /></td></tr>
            ) : (
              deals.map(deal => (
                <tr key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{deal.title}</div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-2)' }}>
                    {deal.stage_id?.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color:'var(--accent)' }}>
                      {deal.value ? `${deal.currency || 'USD'} ${deal.value.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    {deal.probability != null ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:48, height:4, background:'var(--bg-3)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:`${deal.probability}%`, height:'100%', background: deal.probability >= 70 ? 'var(--green)' : deal.probability >= 40 ? 'var(--amber)' : 'var(--red)', borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:12, color:'var(--text-2)', fontFamily:'var(--font-mono)' }}>{deal.probability}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-2)' }}>
                    {deal.expected_close ? format(new Date(deal.expected_close), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <Badge color={statusColor[deal.status] || 'default'}>{deal.status}</Badge>
                  </td>
                  <td style={{ padding:'12px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      {deal.status === 'open' && (
                        <button onClick={(e) => handleMarkWon(deal.id, e)} title="Mark won" style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:4, fontSize:14 }}>✓</button>
                      )}
                      <button onClick={(e) => handleDelete(deal.id, e)} title="Delete" style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:4, display:'flex', alignItems:'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta.total > 20 && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, color:'var(--text-2)' }}>
            <span>Showing {(page-1)*20+1}–{Math.min(page*20, meta.total)} of {meta.total}</span>
            <div style={{ display:'flex', gap:4 }}>
              <Button variant="secondary" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page*20>=meta.total} onClick={() => setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Deal" width={520}>
        {pipelines.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <AlertCircle size={32} style={{ color:'var(--amber)', margin:'0 auto 12px' }} />
            <p style={{ color:'var(--text-2)', fontSize:13 }}>You need to create a pipeline first before adding deals.</p>
            <Button onClick={() => navigate('/pipeline')} style={{ marginTop:16 }}>Go to Pipeline</Button>
          </div>
        ) : (
          <DealForm pipelines={pipelines} onSave={handleCreate} onCancel={() => setModal(false)} loading={saving} />
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
