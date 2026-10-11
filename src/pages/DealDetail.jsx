import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Badge, Button, Modal, Spinner, Toast, Select, Input, Textarea } from '../components/ui';
import { format } from 'date-fns';

const typeIcon = { call:'📞', note:'📝', email:'✉️', meeting:'🤝' };

function toLocalDatetimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
}

function toAPIString(localDatetimeValue) {
  if (!localDatetimeValue) return new Date().toISOString();
  return new Date(localDatetimeValue + ':00').toISOString();
}

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [toast, setToast] = useState(null);
  const [actForm, setActForm] = useState({
    type: 'note', subject: '', body: '', duration: '',
    occurred_at: toLocalDatetimeValue(),
  });

  const showToast = (msg, type='success') => { setToast({ message:msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    try {
      const dRes = await api.getDeal(id);
      setDeal(dRes.data);
      const [acts, pip] = await Promise.all([
        api.getActivities({ deal_id: id }),
        dRes.data.pipeline_id ? api.getPipeline(dRes.data.pipeline_id) : Promise.resolve(null),
      ]);
      setActivities(acts?.data || []);
      setPipeline(pip?.data || null);
    } catch { navigate('/deals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const moveStage = async (stage_id) => {
    try { await api.moveDealStage(id, stage_id); showToast('Stage updated'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const markWon = async () => {
    setSaving(true);
    try { await api.markDealWon(id); setModal(null); showToast('Deal won! 🎉'); load(); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const markLost = async () => {
    setSaving(true);
    try { await api.markDealLost(id, lostReason); setModal(null); showToast('Deal marked as lost'); load(); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const logActivity = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createActivity({
        type: actForm.type,
        subject: actForm.subject,
        body: actForm.body,
        deal_id: id,
        ...(actForm.duration ? { duration: parseInt(actForm.duration, 10) } : {}),
        occurred_at: toAPIString(actForm.occurred_at),
      });
      setModal(null);
      setActForm({ type:'note', subject:'', body:'', duration:'', occurred_at: toLocalDatetimeValue() });
      showToast('Activity logged');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={24} /></div>;
  if (!deal) return null;

  const stages = pipeline?.stages || [];
  const currentStageIdx = stages.findIndex(s => s.id === deal.stage_id);

  return (
    <div style={{ padding:'28px 32px', animation:'fadeIn 0.2s ease' }}>
      <button onClick={() => navigate('/deals')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:13, marginBottom:20, padding:0 }}>
        <ArrowLeft size={14} /> Back to deals
      </button>

      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, justifyContent:'space-between', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, fontFamily:'var(--font-display)', letterSpacing:'-0.02em' }}>{deal.title}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <Badge color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : 'blue'}>{deal.status}</Badge>
              {deal.value && <span style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:600, color:'var(--accent)' }}>${deal.value.toLocaleString()} {deal.currency}</span>}
              {deal.probability != null && <span style={{ fontSize:13, color:'var(--text-2)' }}>{deal.probability}% probability</span>}
            </div>
          </div>
          {deal.status === 'open' && (
            <div style={{ display:'flex', gap:8 }}>
              <Button variant="success" size="sm" onClick={() => setModal('won')}><CheckCircle size={13} />Mark Won</Button>
              <Button variant="danger" size="sm" onClick={() => setModal('lost')}><XCircle size={13} />Mark Lost</Button>
            </div>
          )}
        </div>
      </div>

      {stages.length > 0 && deal.status === 'open' && (
        <Card style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:12, fontWeight:500 }}>Pipeline Stage</div>
          <div style={{ display:'flex', gap:0, alignItems:'center' }}>
            {stages.map((stage, i) => {
              const isActive = stage.id === deal.stage_id;
              const isPast = i < currentStageIdx;
              return (
                <div key={stage.id} style={{ display:'flex', alignItems:'center', flex:1 }}>
                  <button onClick={() => moveStage(stage.id)} style={{
                    flex:1, padding:'6px 10px', border:'none', cursor:'pointer', fontSize:11, fontWeight:500,
                    background: isActive ? 'var(--accent)' : isPast ? 'var(--accent-dim)' : 'var(--bg-3)',
                    color: isActive ? '#0f0f0f' : isPast ? 'var(--accent)' : 'var(--text-2)',
                    borderRadius: i === 0 ? '6px 0 0 6px' : i === stages.length-1 ? '0 6px 6px 0' : 0,
                    transition:'all 0.15s',
                  }}>
                    {stage.name}
                  </button>
                  {i < stages.length-1 && (
                    <div style={{ width:0, height:0, borderTop:'14px solid transparent', borderBottom:'14px solid transparent', borderLeft:`8px solid ${isActive ? 'var(--accent)' : isPast ? 'var(--accent-dim)' : 'var(--bg-3)'}`, zIndex:1, flexShrink:0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Deal details</div>
            {[
              ['Pipeline', deal.pipeline?.name || '—'],
              ['Stage', deal.stage_id?.replace(/_/g,' ')],
              ['Expected Close', deal.expected_close ? format(new Date(deal.expected_close), 'MMM d, yyyy') : '—'],
              ['Created', format(new Date(deal.created_at), 'MMM d, yyyy')],
            ].map(([label, value]) => (
              <div key={label} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:13 }}>{value}</div>
              </div>
            ))}
            {deal.lost_reason && (
              <div style={{ padding:'10px 16px', background:'var(--red-dim)' }}>
                <div style={{ fontSize:10, color:'var(--red)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Lost reason</div>
                <div style={{ fontSize:13, color:'var(--red)' }}>{deal.lost_reason}</div>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:14, fontWeight:600 }}>Activities ({activities.length})</h3>
            <Button size="sm" onClick={() => setModal('activity')}><Plus size={12} />Log</Button>
          </div>
          {activities.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center' }}>
              <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:12 }}>No activities yet</div>
              <Button size="sm" onClick={() => setModal('activity')}><Plus size={12} />Log first activity</Button>
            </div>
          ) : (
            <div style={{ padding:'8px 0' }}>
              {activities.map((act, i) => (
                <div key={act.id} style={{ padding:'12px 20px', borderBottom: i < activities.length-1 ? '1px solid var(--border)' : 'none', display:'flex', gap:10 }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{typeIcon[act.type] || '•'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{act.subject}</div>
                    {act.body && <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:4 }}>{act.body}</div>}
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>
                      {act.occurred_at ? format(new Date(act.occurred_at), 'MMM d, yyyy · h:mm a') : ''}
                      {act.duration ? ` · ${act.duration} min` : ''}
                    </div>
                  </div>
                  <Badge>{act.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={modal === 'won'} onClose={() => setModal(null)} title="Mark deal as won?">
        <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:20 }}>This will mark "{deal.title}" as won and set probability to 100%.</p>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="success" onClick={markWon} loading={saving}><CheckCircle size={13} />Confirm Won</Button>
        </div>
      </Modal>

      <Modal open={modal === 'lost'} onClose={() => setModal(null)} title="Mark deal as lost">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', fontWeight:500, display:'block', marginBottom:4 }}>Reason (optional)</label>
            <textarea value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="e.g. Budget cut, went with competitor..." style={{ width:'100%', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', padding:'8px 12px', fontSize:14, resize:'vertical', minHeight:80, fontFamily:'var(--font)', outline:'none' }} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={markLost} loading={saving}><XCircle size={13} />Mark Lost</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'activity'} onClose={() => setModal(null)} title="Log Activity">
        <form onSubmit={logActivity} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Select label="Type" value={actForm.type} onChange={e => setActForm(f => ({ ...f, type: e.target.value }))}>
            {['call','note','email','meeting'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </Select>
          <Input label="Subject *" value={actForm.subject} onChange={e => setActForm(f => ({ ...f, subject: e.target.value }))} required />
          <Textarea label="Notes" value={actForm.body} onChange={e => setActForm(f => ({ ...f, body: e.target.value }))} />
          {(actForm.type === 'call' || actForm.type === 'meeting') && (
            <Input label="Duration (min)" type="number" value={actForm.duration} onChange={e => setActForm(f => ({ ...f, duration: e.target.value }))} min={1} />
          )}
          <Input label="Date & Time" type="datetime-local" value={actForm.occurred_at} onChange={e => setActForm(f => ({ ...f, occurred_at: e.target.value }))} />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Log activity</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}