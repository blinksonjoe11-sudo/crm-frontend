import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GitBranch, Settings, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Modal, Input, Card, Badge, Spinner, Toast, Empty, PageHeader } from '../components/ui';

function DealCard({ deal, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8,
      padding:12, cursor:'pointer', transition:'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ fontSize:13, fontWeight:500, marginBottom:6, lineHeight:1.3 }}>{deal.title}</div>
      {deal.value ? (
        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent)', fontWeight:600 }}>
          ${deal.value.toLocaleString()} {deal.currency}
        </div>
      ) : null}
      {deal.probability != null && (
        <div style={{ marginTop:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, fontSize:10, color:'var(--text-3)' }}>
            <span>Win probability</span><span>{deal.probability}%</span>
          </div>
          <div style={{ height:2, background:'var(--bg-4)', borderRadius:1, overflow:'hidden' }}>
            <div style={{ width:`${deal.probability}%`, height:'100%', background: deal.probability >= 70 ? 'var(--green)' : deal.probability >= 40 ? 'var(--amber)' : 'var(--red)' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePipelineForm({ onSave, onCancel, loading }) {
  const [name, setName] = useState('Sales Pipeline');
  const [stages, setStages] = useState([
    { id:'stage_1', name:'Lead', order:1, probability:10, color:'#6B7280' },
    { id:'stage_2', name:'Qualified', order:2, probability:30, color:'#3B82F6' },
    { id:'stage_3', name:'Proposal', order:3, probability:60, color:'#F59E0B' },
    { id:'stage_4', name:'Negotiation', order:4, probability:80, color:'#8B5CF6' },
    { id:'stage_5', name:'Closed Won', order:5, probability:100, color:'#10B981' },
  ]);

  const submit = e => { e.preventDefault(); onSave({ name, is_default:true, stages }); };
  const updateStage = (idx, key, val) => setStages(s => s.map((st, i) => i === idx ? { ...st, [key]: val } : st));

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <Input label="Pipeline name *" value={name} onChange={e => setName(e.target.value)} required />
      <div>
        <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:500, marginBottom:8 }}>Stages</div>
        {stages.map((s, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:8, marginBottom:6 }}>
            <Input value={s.name} onChange={e => updateStage(i, 'name', e.target.value)} placeholder="Stage name" />
            <Input type="number" value={s.probability} onChange={e => updateStage(i, 'probability', parseInt(e.target.value))} min={0} max={100} placeholder="%" />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Create pipeline</Button>
      </div>
    </form>
  );
}

export default function Pipeline() {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState([]);
  const [activePipeline, setActivePipeline] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type='success') => { setToast({ message:msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const pRes = await api.getPipelines();
      const pList = pRes?.data || [];
      setPipelines(pList);
      const active = pList[0];
      setActivePipeline(active);
      if (active) {
        const d = await api.getDeals({ pipeline_id: active.id, status:'open', per_page:100 });
        setDeals(d?.data || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const loadDeals = async (pid) => {
    try {
      const d = await api.getDeals({ pipeline_id: pid, status:'open', per_page:100 });
      setDeals(d?.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await api.createPipeline(data);
      setModal(null);
      showToast('Pipeline created');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeletePipeline = async (id) => {
    if (!window.confirm('Delete this pipeline?')) return;
    try { await api.deletePipeline(id); showToast('Pipeline deleted'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const selectPipeline = async (p) => {
    setActivePipeline(p);
    const d = await api.getDeals({ pipeline_id: p.id, status:'open', per_page:100 });
    setDeals(d?.data || []);
  };

  const stageDeals = (stageId) => deals.filter(d => d.stage_id === stageId);
  const stageValue = (stageId) => stageDeals(stageId).reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div style={{ padding:'28px 32px', height:'100%', display:'flex', flexDirection:'column', animation:'fadeIn 0.2s ease' }}>
      <PageHeader
        title="Pipeline"
        description="Kanban view of your active deals"
        action={<Button onClick={() => setModal('create')}><Plus size={14} />New pipeline</Button>}
      />

      {/* Pipeline selector */}
      {pipelines.length > 1 && (
        <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
          {pipelines.map(p => (
            <button key={p.id} onClick={() => selectPipeline(p)} style={{
              padding:'5px 14px', borderRadius:6, border:'1px solid var(--border)',
              background: activePipeline?.id === p.id ? 'var(--accent-dim)' : 'var(--bg-2)',
              color: activePipeline?.id === p.id ? 'var(--accent)' : 'var(--text-2)',
              cursor:'pointer', fontSize:13, fontWeight: activePipeline?.id === p.id ? 500 : 400,
            }}>{p.name}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={24} /></div>
      ) : !activePipeline ? (
        <Empty icon={GitBranch} title="No pipelines yet" description="Create your first pipeline to start tracking deals" action={<Button onClick={() => setModal('create')}><Plus size={13} />Create pipeline</Button>} />
      ) : (
        <div style={{ flex:1, overflowX:'auto', paddingBottom:8 }}>
          <div style={{ display:'flex', gap:12, minWidth:'max-content', height:'100%', alignItems:'flex-start' }}>
            {(activePipeline.stages || []).map(stage => {
              const stageDealList = stageDeals(stage.id);
              const val = stageValue(stage.id);
              return (
                <div key={stage.id} style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:0 }}>
                  {/* Column header */}
                  <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0', padding:'12px 14px', borderBottom:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background: stage.color || 'var(--accent)', flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{stage.name}</span>
                      </div>
                      <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)', background:'var(--bg-3)', padding:'1px 6px', borderRadius:4 }}>
                        {stageDealList.length}
                      </span>
                    </div>
                    {val > 0 && <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>${val.toLocaleString()}</div>}
                  </div>
                  {/* Cards */}
                  <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'0 0 var(--radius-lg) var(--radius-lg)', padding:10, display:'flex', flexDirection:'column', gap:8, minHeight:120, flex:1 }}>
                    {stageDealList.map(deal => (
                      <DealCard key={deal.id} deal={deal} onClick={() => navigate(`/deals/${deal.id}`)} />
                    ))}
                    {stageDealList.length === 0 && (
                      <div style={{ fontSize:12, color:'var(--text-3)', textAlign:'center', padding:'16px 0' }}>No deals</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Pipeline" width={520}>
        <CreatePipelineForm onSave={handleCreate} onCancel={() => setModal(null)} loading={saving} />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
