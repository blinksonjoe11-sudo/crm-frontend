import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, CheckSquare, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { StatCard, Card, Badge, Spinner, Avatar, PageHeader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const priorityColor = { high:'red', medium:'amber', low:'blue' };
const activityTypeLabel = { call:'📞', note:'📝', email:'✉️', meeting:'🤝' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ contacts:null, deals:null, tasks:null, activities:null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getContacts({ per_page:5 }),
      api.getDeals({ per_page:5, status:'open' }),
      api.getTasks({ completed:false, per_page:5 }),
      api.getActivities({ per_page:5 }),
    ]).then(([contacts, deals, tasks, activities]) => {
      setData({ contacts, deals, tasks, activities });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner size={24} />
    </div>
  );

  const wonDeals = data.deals?.data?.filter(d => d.status === 'won') || [];
  const totalValue = data.deals?.data?.reduce((s, d) => s + (d.value || 0), 0) || 0;
  const overdueTasks = data.tasks?.data?.filter(t => !t.completed_at && new Date(t.due_at) < new Date()) || [];

  return (
    <div style={{ padding:'28px 32px', animation:'fadeIn 0.2s ease' }}>
      <PageHeader
        title={`${greeting}, ${user?.first_name} ✦`}
        description={`${format(new Date(), 'EEEE, MMMM d')} — here's your workspace overview`}
      />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        <StatCard label="Total Contacts" value={data.contacts?.meta?.total ?? '—'} icon={Users} />
        <StatCard label="Open Deals" value={data.deals?.meta?.total ?? '—'} icon={Briefcase} color="accent" />
        <StatCard label="Pipeline Value" value={totalValue ? `$${(totalValue/1000).toFixed(0)}k` : '—'} icon={TrendingUp} color="green" />
        <StatCard label="Pending Tasks" value={data.tasks?.meta?.total ?? '—'} sub={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined} icon={CheckSquare} color={overdueTasks.length > 0 ? 'red' : 'default'} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Recent Deals */}
        <Card>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:14, fontWeight:600 }}>Recent Deals</h3>
            <button onClick={() => navigate('/deals')} style={{ fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div>
            {(data.deals?.data || []).length === 0 ? (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>No open deals yet</div>
            ) : (
              (data.deals?.data || []).slice(0,5).map((deal, i) => (
                <div key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} style={{
                  padding:'12px 20px', display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{deal.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{deal.stage_id?.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
                    {deal.value ? `$${deal.value.toLocaleString()}` : '—'}
                  </div>
                  <Badge color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : 'default'}>
                    {deal.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:14, fontWeight:600 }}>Pending Tasks</h3>
            <button onClick={() => navigate('/tasks')} style={{ fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div>
            {(data.tasks?.data || []).length === 0 ? (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>All caught up!</div>
            ) : (
              (data.tasks?.data || []).slice(0,5).map((task, i) => {
                const overdue = task.due_at && new Date(task.due_at) < new Date();
                return (
                  <div key={task.id} style={{
                    padding:'12px 20px', display:'flex', alignItems:'center', gap:12,
                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background: overdue ? 'var(--red)' : 'var(--border-2)', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</div>
                      {task.due_at && (
                        <div style={{ fontSize:11, color: overdue ? 'var(--red)' : 'var(--text-3)', marginTop:1, display:'flex', alignItems:'center', gap:3 }}>
                          <Clock size={9} />
                          {format(new Date(task.due_at), 'MMM d, h:mm a')}
                        </div>
                      )}
                    </div>
                    <Badge color={priorityColor[task.priority] || 'default'}>{task.priority}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card style={{ gridColumn:'1 / -1' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontSize:14, fontWeight:600 }}>Recent Activity</h3>
            <button onClick={() => navigate('/activities')} style={{ fontSize:12, color:'var(--accent)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding:'4px 0' }}>
            {(data.activities?.data || []).length === 0 ? (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>No activities logged yet</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {(data.activities?.data || []).map((act, i) => (
                  <div key={act.id} style={{ padding:'12px 20px', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:14 }}>{activityTypeLabel[act.type] || '•'}</span>
                      <span style={{ fontSize:13, fontWeight:500 }}>{act.subject}</span>
                    </div>
                    {act.body && <div style={{ fontSize:12, color:'var(--text-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{act.body}</div>}
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>
                      {act.occurred_at ? format(new Date(act.occurred_at), 'MMM d, h:mm a') : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
