import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Clock, Check, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Modal, Badge, Empty, Spinner, PageHeader, Toast, Select, Input, Textarea } from '../components/ui';
import { format, isPast } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const priorityColor = { high:'red', medium:'amber', low:'blue' };

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('incomplete');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', priority:'medium', due_at:'' });

  const showToast = (msg, type='success') => { setToast({ message:msg, type }); setTimeout(() => setToast(null), 3000); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page:25 };
      if (filter === 'incomplete') params.completed = false;
      if (filter === 'completed') params.completed = true;
      if (filter === 'overdue') params.overdue = true;
      const res = await api.getTasks(params);
      setTasks(res?.data || []);
      setMeta(res?.meta || {});
    } catch {}
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, assignee_id: user?.id };
      if (payload.due_at) payload.due_at = new Date(payload.due_at).toISOString();
      await api.createTask(payload);
      setModal(false);
      setForm({ title:'', description:'', priority:'medium', due_at:'' });
      showToast('Task created');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleComplete = async (id) => {
    setCompleting(id);
    try { await api.completeTask(id); showToast('Task completed ✓'); load(); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setCompleting(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete task?')) return;
    try { await api.deleteTask(id); showToast('Task deleted'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const pendingCount = filter === 'incomplete' ? meta.total : null;

  return (
    <div style={{ padding:'28px 32px', animation:'fadeIn 0.2s ease' }}>
      <PageHeader
        title="Tasks"
        description={`Track and manage your to-do items`}
        action={<Button onClick={() => setModal(true)}><Plus size={14} />New task</Button>}
      />

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:4, width:'fit-content' }}>
        {[['incomplete','Pending'],['overdue','Overdue'],['completed','Completed']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(1); }} style={{
            padding:'5px 14px', borderRadius:5, border:'none', cursor:'pointer',
            background: filter === val ? 'var(--bg-4)' : 'transparent',
            color: filter === val ? (val === 'overdue' ? 'var(--red)' : 'var(--text)') : 'var(--text-2)',
            fontSize:13, fontWeight: filter === val ? 500 : 400, transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size={24} /></div>
      ) : tasks.length === 0 ? (
        <Empty icon={CheckSquare} title={filter === 'completed' ? 'No completed tasks' : 'No tasks'} description={filter === 'completed' ? 'Complete some tasks to see them here' : 'Create tasks to stay on top of your work'} action={filter !== 'completed' && <Button onClick={() => setModal(true)}><Plus size={13} />New task</Button>} />
      ) : (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          {tasks.map((task, i) => {
            const overdue = task.due_at && !task.completed_at && isPast(new Date(task.due_at));
            const done = !!task.completed_at;
            return (
              <div key={task.id} style={{ padding:'14px 20px', borderBottom: i < tasks.length-1 ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'center', gap:12, transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                {/* Complete button */}
                {!done ? (
                  <button onClick={() => handleComplete(task.id)} disabled={completing === task.id} style={{
                    width:20, height:20, borderRadius:4, border:'1.5px solid var(--border-2)', background:'none',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'none'; }}
                  >
                    {completing === task.id ? <Spinner size={10} /> : null}
                  </button>
                ) : (
                  <div style={{ width:20, height:20, borderRadius:4, background:'var(--green-dim)', border:'1.5px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check size={11} color="var(--green)" strokeWidth={2.5} />
                  </div>
                )}

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, opacity: done ? 0.5 : 1, textDecoration: done ? 'line-through' : 'none' }}>{task.title}</div>
                  {task.description && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.description}</div>}
                  {task.due_at && (
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:11, color: overdue ? 'var(--red)' : done ? 'var(--text-3)' : 'var(--text-3)' }}>
                      <Clock size={9} />
                      {done && task.completed_at ? `Completed ${format(new Date(task.completed_at), 'MMM d')}` : format(new Date(task.due_at), 'MMM d, yyyy · h:mm a')}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <Badge color={priorityColor[task.priority] || 'default'}>{task.priority}</Badge>
                  {overdue && <Badge color="red">overdue</Badge>}
                  <button onClick={() => handleDelete(task.id)} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:4, display:'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {meta.total > 25 && (
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, color:'var(--text-2)' }}>
              <span>{(page-1)*25+1}–{Math.min(page*25, meta.total)} of {meta.total}</span>
              <div style={{ display:'flex', gap:4 }}>
                <Button variant="secondary" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={page*25>=meta.total} onClick={() => setPage(p=>p+1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Task">
        <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="Task title *" value={form.title} onChange={set('title')} required placeholder="e.g. Send proposal to Jane" />
          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Any additional details..." />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="Priority" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
            <Input label="Due date" type="datetime-local" value={form.due_at} onChange={set('due_at')} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create task</Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
