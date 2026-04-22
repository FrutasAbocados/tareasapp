import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home, CheckCircle2, Plus, Mic, TrendingUp, AlertTriangle,
  Calendar, Users, Package, DollarSign, Target, Lightbulb, Bell, Search,
  ChevronRight, ChevronLeft, X, Sun, Moon, Coffee, Flame, Zap, Clock,
  Briefcase, PieChart, Sparkles, Trash2, Edit3, Phone, Building2, Receipt,
  TrendingDown, BookOpen, Send, Check, MoreHorizontal, User, UserPlus,
  Filter, ArrowUp, ArrowDown, Repeat, MapPin, MessageSquare, Handshake,
  Star, Archive, Copy, ChevronDown, Settings, LogOut, Layers, FolderKanban, Mail, Lock
} from 'lucide-react';
import {
  auth, db, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  collection, doc, setDoc, deleteDoc, onSnapshot
} from './firebase';

// ============================================================
// STORAGE - Firebase Firestore (sincronización en tiempo real)
// ============================================================
const WORKSPACE_ID = 'main'; // Único workspace compartido tú + Álvaro

function subscribeCollection(name, setter) {
  const ref = collection(db, 'workspaces', WORKSPACE_ID, name);
  return onSnapshot(ref, (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    setter(items);
  }, (err) => console.error('Firestore error', name, err));
}

async function saveDoc(name, item) {
  const { id, ...data } = item;
  const ref = doc(db, 'workspaces', WORKSPACE_ID, name, id);
  await setDoc(ref, data, { merge: true });
}

async function deleteDocById(name, id) {
  const ref = doc(db, 'workspaces', WORKSPACE_ID, name, id);
  await deleteDoc(ref);
}

// ============================================================
// SEED DATA
// ============================================================
const DEFAULT_USERS = [
  { id: 'me',     name: 'Tú',       color: '#0A84FF', initial: 'T' },
  { id: 'alvaro', name: 'Álvaro',   color: '#FF9F0A', initial: 'A' },
  { id: 'both',   name: 'Ambos',    color: '#BF5AF2', initial: '👥' },
];

const DEFAULT_COMPANIES = [
  { id: 'c1', name: 'Distribuidora', color: '#0A84FF', icon: '🍎' },
  { id: 'c2', name: 'Consultoría',   color: '#30D158', icon: '💼' },
  { id: 'c3', name: 'Inmobiliaria',  color: '#FF9F0A', icon: '🏢' },
];

const DEFAULT_PROJECTS = [
  { id: 'p1', name: 'Expansión Sur',    companyId: 'c1', color: '#0A84FF' },
  { id: 'p2', name: 'Línea ecológica',  companyId: 'c1', color: '#30D158' },
  { id: 'p3', name: 'Captación Clientes', companyId: 'c2', color: '#5E5CE6' },
  { id: 'p4', name: 'Reforma oficinas', companyId: 'c3', color: '#FF9F0A' },
];

const AREAS = {
  'Operativa':   { color: '#0A84FF', icon: Package },
  'Proveedores': { color: '#5E5CE6', icon: Building2 },
  'Ventas':      { color: '#30D158', icon: TrendingUp },
  'Finanzas':    { color: '#FF9F0A', icon: DollarSign },
  'Clientes':    { color: '#FF375F', icon: Users },
  'RRHH':        { color: '#64D2FF', icon: Users },
  'Marketing':   { color: '#BF5AF2', icon: Sparkles },
  'Personal':    { color: '#8E8E93', icon: Star },
};

const priorityDot = { high: '#FF453A', medium: '#FF9F0A', low: '#30D158' };
const priorityLabel = { high: 'Alta', medium: 'Media', low: 'Baja' };

const today = () => new Date().toISOString().split('T')[0];
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const diffDays = (a, b) => {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.round((d2 - d1) / 86400000);
};

const SEED_TASKS = [
  { id: 't1', title: 'Control de pedidos urgentes', desc: 'Identificar pedidos anómalos', area: 'Operativa', priority: 'high', assignee: 'me', companyId: 'c1', projectId: 'p1', date: today(), repeat: 'daily', done: false },
  { id: 't2', title: 'Detección de subidas de precio', desc: 'Comparar factura actual con anterior', area: 'Proveedores', priority: 'medium', assignee: 'me', companyId: 'c1', projectId: null, date: today(), repeat: 'daily', done: false },
  { id: 't3', title: 'Reunión equipo comercial', desc: '10:00 - sala A', area: 'Ventas', priority: 'high', assignee: 'both', companyId: 'c2', projectId: 'p3', date: today(), repeat: 'weekly', done: false },
  { id: 't4', title: 'Llamar a Frutería La Esperanza', desc: 'Seguimiento pedido semanal', area: 'Clientes', priority: 'medium', assignee: 'alvaro', companyId: 'c1', projectId: null, date: today(), repeat: 'none', done: false },
  { id: 't5', title: 'Revisar cobros pendientes', desc: 'Ordenar por antigüedad', area: 'Finanzas', priority: 'high', assignee: 'me', companyId: 'c1', projectId: null, date: today(), repeat: 'weekly', done: false },
  { id: 't6', title: 'Caída de ventas semana', desc: 'Monitorizar tendencia', area: 'Ventas', priority: 'high', assignee: 'both', companyId: 'c1', projectId: null, date: addDays(today(), 1), repeat: 'weekly', done: false },
  { id: 't7', title: 'Visita cliente nuevo Málaga', desc: 'Restaurante El Puerto', area: 'Ventas', priority: 'medium', assignee: 'alvaro', companyId: 'c1', projectId: 'p1', date: addDays(today(), 2), repeat: 'none', done: false },
  { id: 't8', title: 'Análisis de margen', desc: 'Calcular margen medio semanal', area: 'Finanzas', priority: 'high', assignee: 'me', companyId: 'c2', projectId: null, date: addDays(today(), 3), repeat: 'weekly', done: false },
  { id: 't9', title: 'Pagos a proveedores', desc: 'Calendario de vencimientos', area: 'Finanzas', priority: 'medium', assignee: 'alvaro', companyId: 'c1', projectId: null, date: addDays(today(), 4), repeat: 'weekly', done: false },
  { id: 't10', title: 'Inventario físico', desc: 'Conteo físico vs sistema', area: 'Operativa', priority: 'medium', assignee: 'both', companyId: 'c1', projectId: null, date: addDays(today(), 10), repeat: 'monthly', done: false },
  { id: 't11', title: 'Revisar presupuesto reforma', desc: 'Oficina planta 2', area: 'Operativa', priority: 'medium', assignee: 'me', companyId: 'c3', projectId: 'p4', date: addDays(today(), 5), repeat: 'none', done: false },
];

const SEED_CLIENTS = [
  { id: 'cl1', name: 'Frutería La Esperanza', type: 'cliente', phone: '600 123 456', city: 'Sevilla', lastContact: today(), nextAction: 'Llamar esta semana', status: 'activo', value: 'alto', companyId: 'c1', notes: 'Cliente fiel desde 2020. Pedido semanal martes.' },
  { id: 'cl2', name: 'Restaurante El Olivo', type: 'cliente', phone: '622 333 444', city: 'Córdoba', lastContact: addDays(today(), -20), nextAction: 'Visitar - bajada pedidos', status: 'en_riesgo', value: 'medio', companyId: 'c1', notes: 'Lleva 3 semanas sin pedido. Revisar motivo.' },
  { id: 'cl3', name: 'Mercado Central - Puesto 42', type: 'cliente', phone: '611 987 654', city: 'Málaga', lastContact: addDays(today(), -3), nextAction: 'Cerrar contrato ampliación', status: 'oportunidad', value: 'alto', companyId: 'c1', notes: 'Interesado en ampliar gama ecológica.' },
  { id: 'cl4', name: 'Bar Sevilla Centro', type: 'prospecto', phone: '655 111 222', city: 'Sevilla', lastContact: null, nextAction: 'Primera visita pendiente', status: 'prospecto', value: 'medio', companyId: 'c1', notes: 'Contacto inicial por recomendación.' },
  { id: 'cl5', name: 'Grupo Inversión Delta', type: 'cliente', phone: '900 456 789', city: 'Madrid', lastContact: addDays(today(), -5), nextAction: 'Enviar propuesta Q2', status: 'activo', value: 'alto', companyId: 'c2', notes: 'Reunión quincenal los viernes.' },
];

const SEED_MEETINGS = [
  { id: 'm1', title: 'Reunión equipo comercial', clientId: null, date: today(), time: '10:00', duration: 60, location: 'Oficina - Sala A', attendees: ['me','alvaro'], notes: '', companyId: 'c2', type: 'interna' },
  { id: 'm2', title: 'Visita Frutería La Esperanza', clientId: 'cl1', date: addDays(today(), 1), time: '12:30', duration: 45, location: 'Sevilla', attendees: ['alvaro'], notes: 'Llevar nueva tarifa', companyId: 'c1', type: 'visita' },
  { id: 'm3', title: 'Llamada Grupo Delta', clientId: 'cl5', date: addDays(today(), 2), time: '16:00', duration: 30, location: 'Zoom', attendees: ['me'], notes: 'Presentar propuesta', companyId: 'c2', type: 'llamada' },
];

// ============================================================
// HOOK: Estado global con Firebase
// ============================================================
function useAppState() {
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [currentUser, setCurrentUser] = useState('me');
  const [tasks, setTasksRaw] = useState([]);
  const [clients, setClientsRaw] = useState([]);
  const [meetings, setMeetingsRaw] = useState([]);
  const [companies, setCompaniesRaw] = useState([]);
  const [projects, setProjectsRaw] = useState([]);
  const [notes, setNotesRaw] = useState([]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) {
        const saved = localStorage.getItem('currentUser_' + u.uid);
        if (saved) setCurrentUser(saved);
      }
    });
    return unsub;
  }, []);

  // Sincroniza currentUser a localStorage
  useEffect(() => {
    if (user) localStorage.setItem('currentUser_' + user.uid, currentUser);
  }, [currentUser, user]);

  // Subscripciones Firestore (solo si hay user)
  useEffect(() => {
    if (!user) { setLoaded(false); return; }
    const unsubs = [
      subscribeCollection('tasks', setTasksRaw),
      subscribeCollection('clients', setClientsRaw),
      subscribeCollection('meetings', setMeetingsRaw),
      subscribeCollection('companies', setCompaniesRaw),
      subscribeCollection('projects', setProjectsRaw),
      subscribeCollection('notes', setNotesRaw),
    ];
    // Seed inicial si está vacío (solo primera vez)
    seedIfEmpty();
    setLoaded(true);
    return () => unsubs.forEach(u => u && u());
  }, [user]);

  // Wrappers que guardan en Firebase
  const setTasks = async (newList) => {
    // newList puede ser array completo o función
    const list = typeof newList === 'function' ? newList(tasks) : newList;
    // Detectar cambios: guardar los nuevos/modificados y borrar los que ya no están
    const prevIds = new Set(tasks.map(t => t.id));
    const newIds = new Set(list.map(t => t.id));
    for (const id of prevIds) if (!newIds.has(id)) await deleteDocById('tasks', id);
    for (const t of list) await saveDoc('tasks', t);
  };
  const setClients = async (newList) => {
    const list = typeof newList === 'function' ? newList(clients) : newList;
    const prevIds = new Set(clients.map(c => c.id));
    const newIds = new Set(list.map(c => c.id));
    for (const id of prevIds) if (!newIds.has(id)) await deleteDocById('clients', id);
    for (const c of list) await saveDoc('clients', c);
  };
  const setMeetings = async (newList) => {
    const list = typeof newList === 'function' ? newList(meetings) : newList;
    const prevIds = new Set(meetings.map(m => m.id));
    const newIds = new Set(list.map(m => m.id));
    for (const id of prevIds) if (!newIds.has(id)) await deleteDocById('meetings', id);
    for (const m of list) await saveDoc('meetings', m);
  };
  const setCompanies = async (newList) => {
    const list = typeof newList === 'function' ? newList(companies) : newList;
    for (const c of list) await saveDoc('companies', c);
  };
  const setProjects = async (newList) => {
    const list = typeof newList === 'function' ? newList(projects) : newList;
    for (const p of list) await saveDoc('projects', p);
  };
  const setNotes = async (newList) => {
    const list = typeof newList === 'function' ? newList(notes) : newList;
    for (const n of list) await saveDoc('notes', n);
  };

  return {
    loaded: loaded && authChecked,
    user, authChecked,
    currentUser, setCurrentUser,
    tasks, setTasks,
    clients, setClients,
    meetings, setMeetings,
    companies: companies.length ? companies : DEFAULT_COMPANIES,
    setCompanies,
    projects: projects.length ? projects : DEFAULT_PROJECTS,
    setProjects,
    notes, setNotes
  };
}

// Seed inicial solo la primera vez (detecta si no hay datos)
let seeded = false;
async function seedIfEmpty() {
  if (seeded) return;
  seeded = true;
  // Comprobamos si ya hay algo - si no, sembramos
  const ref = collection(db, 'workspaces', WORKSPACE_ID, 'tasks');
  const unsub = onSnapshot(ref, async (snap) => {
    if (snap.empty) {
      for (const t of SEED_TASKS) await saveDoc('tasks', t);
      for (const c of SEED_CLIENTS) await saveDoc('clients', c);
      for (const m of SEED_MEETINGS) await saveDoc('meetings', m);
      for (const co of DEFAULT_COMPANIES) await saveDoc('companies', co);
      for (const p of DEFAULT_PROJECTS) await saveDoc('projects', p);
    }
    unsub();
  });
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const S = useAppState();
  const [tab, setTab] = useState('today');
  const [editingTask, setEditingTask] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showUserSwitch, setShowUserSwitch] = useState(false);
  const [filterUser, setFilterUser] = useState('all'); // all | me | alvaro | both

  if (!S.authChecked) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div className="animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (!S.user) {
    return <LoginScreen/>;
  }

  if (!S.loaded) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div className="animate-pulse">Sincronizando…</div>
      </div>
    );
  }

  // Tasks handlers
  const saveTask = (task) => {
    if (task.id && S.tasks.find(t => t.id === task.id)) {
      S.setTasks(S.tasks.map(t => t.id === task.id ? task : t));
    } else {
      S.setTasks([...S.tasks, { ...task, id: 'u' + Date.now() }]);
    }
    setEditingTask(null);
  };
  const deleteTask = (id) => S.setTasks(S.tasks.filter(t => t.id !== id));
  const toggleTask = (id) => S.setTasks(S.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const moveTaskToDate = (taskId, newDate) => {
    S.setTasks(S.tasks.map(t => t.id === taskId ? { ...t, date: newDate } : t));
  };

  // Clients handlers
  const saveClient = (client) => {
    if (client.id && S.clients.find(c => c.id === client.id)) {
      S.setClients(S.clients.map(c => c.id === client.id ? client : c));
    } else {
      S.setClients([...S.clients, { ...client, id: 'cl' + Date.now() }]);
    }
    setEditingClient(null);
  };
  const deleteClient = (id) => S.setClients(S.clients.filter(c => c.id !== id));

  // Meetings handlers
  const saveMeeting = (m) => {
    if (m.id && S.meetings.find(x => x.id === m.id)) {
      S.setMeetings(S.meetings.map(x => x.id === m.id ? m : x));
    } else {
      S.setMeetings([...S.meetings, { ...m, id: 'm' + Date.now() }]);
    }
    setEditingMeeting(null);
  };
  const deleteMeeting = (id) => S.setMeetings(S.meetings.filter(m => m.id !== id));

  // Filtro por usuario
  const visibleTasks = useMemo(() => {
    if (filterUser === 'all') return S.tasks;
    if (filterUser === 'me') return S.tasks.filter(t => t.assignee === 'me' || t.assignee === 'both');
    if (filterUser === 'alvaro') return S.tasks.filter(t => t.assignee === 'alvaro' || t.assignee === 'both');
    return S.tasks.filter(t => t.assignee === filterUser);
  }, [S.tasks, filterUser]);

  return (
    <div className="min-h-screen w-full" style={{
      background: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      color: '#F5F5F7',
    }}>
      <div className="mx-auto max-w-md min-h-screen pb-24 relative">

        {tab === 'today' && (
          <TodayView
            tasks={visibleTasks}
            meetings={S.meetings}
            clients={S.clients}
            companies={S.companies}
            projects={S.projects}
            currentUser={S.currentUser}
            filterUser={filterUser}
            setFilterUser={setFilterUser}
            onToggleTask={toggleTask}
            onEditTask={setEditingTask}
            onEditMeeting={setEditingMeeting}
            onShowUserSwitch={() => setShowUserSwitch(true)}
            onNewTask={() => setEditingTask({ new: true, date: today(), assignee: S.currentUser, priority: 'medium', area: 'Operativa', companyId: S.companies[0]?.id, repeat: 'none', done: false })}
          />
        )}

        {tab === 'calendar' && (
          <CalendarView
            tasks={visibleTasks}
            meetings={S.meetings}
            companies={S.companies}
            projects={S.projects}
            onMoveTask={moveTaskToDate}
            onToggleTask={toggleTask}
            onEditTask={setEditingTask}
            onEditMeeting={setEditingMeeting}
            onNewTask={(date) => setEditingTask({ new: true, date, assignee: S.currentUser, priority: 'medium', area: 'Operativa', companyId: S.companies[0]?.id, repeat: 'none', done: false })}
          />
        )}

        {tab === 'crm' && (
          <CRMView
            clients={S.clients}
            meetings={S.meetings}
            companies={S.companies}
            onEditClient={setEditingClient}
            onEditMeeting={setEditingMeeting}
            onNewClient={() => setEditingClient({ new: true, type: 'prospecto', status: 'prospecto', value: 'medio', companyId: S.companies[0]?.id })}
            onNewMeeting={() => setEditingMeeting({ new: true, date: today(), time: '10:00', duration: 60, attendees: [S.currentUser], type: 'visita', companyId: S.companies[0]?.id })}
          />
        )}

        {tab === 'insights' && (
          <InsightsView tasks={S.tasks} clients={S.clients} meetings={S.meetings} companies={S.companies} />
        )}

        <BottomNav tab={tab} setTab={setTab} />

        {editingTask && (
          <TaskEditor task={editingTask} companies={S.companies} projects={S.projects}
            onSave={saveTask} onDelete={deleteTask} onClose={() => setEditingTask(null)} />
        )}
        {editingClient && (
          <ClientEditor client={editingClient} companies={S.companies}
            onSave={saveClient} onDelete={deleteClient} onClose={() => setEditingClient(null)} />
        )}
        {editingMeeting && (
          <MeetingEditor meeting={editingMeeting} clients={S.clients} companies={S.companies}
            onSave={saveMeeting} onDelete={deleteMeeting} onClose={() => setEditingMeeting(null)} />
        )}
        {showUserSwitch && (
          <UserSwitchModal currentUser={S.currentUser} onChange={(u) => { S.setCurrentUser(u); setShowUserSwitch(false); }} onClose={() => setShowUserSwitch(false)} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// TODAY VIEW
// ============================================================
function TodayView({ tasks, meetings, clients, companies, projects, currentUser, filterUser, setFilterUser, onToggleTask, onEditTask, onEditMeeting, onShowUserSwitch, onNewTask }) {
  const [groupBy, setGroupBy] = useState('priority');
  const [showCompanyFilter, setShowCompanyFilter] = useState(null);

  const todayStr = today();
  const todayTasks = tasks.filter(t => t.date === todayStr && (!showCompanyFilter || t.companyId === showCompanyFilter));
  const todayMeetings = meetings.filter(m => m.date === todayStr);
  const overdue = tasks.filter(t => t.date < todayStr && !t.done);

  const done = todayTasks.filter(t => t.done).length;
  const total = todayTasks.length;
  const pct = total ? Math.round((done/total)*100) : 0;

  const G = greet();
  const GIcon = G.icon;

  // Agrupación
  const grouped = useMemo(() => {
    if (groupBy === 'priority') {
      return [
        { key: 'high', label: 'Prioridad alta', items: todayTasks.filter(t => t.priority === 'high') },
        { key: 'medium', label: 'Prioridad media', items: todayTasks.filter(t => t.priority === 'medium') },
        { key: 'low', label: 'Prioridad baja', items: todayTasks.filter(t => t.priority === 'low') },
      ].filter(g => g.items.length > 0);
    }
    if (groupBy === 'company') {
      return companies.map(c => ({
        key: c.id, label: c.name, icon: c.icon, color: c.color,
        items: todayTasks.filter(t => t.companyId === c.id)
      })).filter(g => g.items.length > 0);
    }
    if (groupBy === 'area') {
      return Object.keys(AREAS).map(a => ({
        key: a, label: a, color: AREAS[a].color,
        items: todayTasks.filter(t => t.area === a)
      })).filter(g => g.items.length > 0);
    }
    return [{ key: 'all', label: 'Todas', items: todayTasks }];
  }, [groupBy, todayTasks, companies]);

  const assignee = DEFAULT_USERS.find(u => u.id === currentUser);

  return (
    <div className="pt-4 animate-fadeIn">
      {/* Header */}
      <div className="px-5 pt-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[13px]" style={{ color: '#98989D' }}>
            <GIcon size={13} />
            <span>{G.text}, {assignee?.name}</span>
          </div>
          <h1 className="text-[30px] font-semibold tracking-tight leading-none mt-1" style={{ color: '#fff' }}>
            {formatDay(new Date())}
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: '#98989D' }}>{formatLongDate(new Date())}</p>
        </div>
        <button onClick={onShowUserSwitch}
          className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-[14px] transition-transform active:scale-95"
          style={{ background: assignee?.color, color: '#fff' }}>
          {assignee?.initial}
        </button>
      </div>

      {/* Progreso hero */}
      <div className="mx-5 mt-5 rounded-[22px] p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
          border: '0.5px solid rgba(255,255,255,0.08)',
        }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20" style={{
          background: `radial-gradient(circle, ${pct === 100 ? '#30D158' : '#0A84FF'} 0%, transparent 70%)`
        }}/>
        <div className="relative flex items-center gap-5">
          {/* Ring */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#2C2C2E" strokeWidth="6" fill="none"/>
              <circle cx="40" cy="40" r="34"
                stroke={pct === 100 ? '#30D158' : '#0A84FF'}
                strokeWidth="6" fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct/100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[16px] font-semibold" style={{ color: '#fff' }}>
              {pct}%
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#98989D' }}>Tu día</p>
                <h2 className="text-[22px] font-semibold leading-tight" style={{ color: '#fff' }}>
                  {done}<span style={{ color: '#636366' }}>/{total}</span> tareas
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[12px]">
              {todayMeetings.length > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#64D2FF' }}>
                  <Calendar size={11}/> {todayMeetings.length} reun.
                </span>
              )}
              {overdue.length > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#FF453A' }}>
                  <AlertTriangle size={11}/> {overdue.length} atrasadas
                </span>
              )}
              {todayMeetings.length === 0 && overdue.length === 0 && (
                <span style={{ color: '#98989D' }}>
                  {pct === 100 ? '¡Día completo!' : pct > 0 ? 'Vas bien' : 'A por ello'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtro por usuario */}
      <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { k: 'all', label: 'Todos', color: '#636366' },
          { k: 'me', label: 'Míos', color: '#0A84FF' },
          { k: 'alvaro', label: 'Álvaro', color: '#FF9F0A' },
          { k: 'both', label: 'Compartidos', color: '#BF5AF2' },
        ].map(f => (
          <button key={f.k} onClick={() => setFilterUser(f.k)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
            style={{
              background: filterUser === f.k ? f.color : '#1C1C1E',
              color: filterUser === f.k ? '#fff' : '#98989D',
              border: '0.5px solid rgba(255,255,255,0.08)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Reuniones de hoy */}
      {todayMeetings.length > 0 && (
        <div className="mt-5 px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#98989D' }}>
            Agenda de hoy
          </p>
          <div className="space-y-2">
            {todayMeetings.sort((a,b) => a.time.localeCompare(b.time)).map(m => (
              <MeetingRow key={m.id} meeting={m} clients={clients} onClick={() => onEditMeeting(m)}/>
            ))}
          </div>
        </div>
      )}

      {/* Barra de agrupación */}
      <div className="mt-5 px-5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#98989D' }}>
          Tareas · {total} · agrupar por
        </p>
        <div className="flex gap-1">
          {[
            { k: 'priority', l: 'Prior' },
            { k: 'company', l: 'Empresa' },
            { k: 'area', l: 'Área' },
          ].map(g => (
            <button key={g.k} onClick={() => setGroupBy(g.k)}
              className="px-2.5 py-1 rounded-[8px] text-[11px] font-medium"
              style={{
                background: groupBy === g.k ? '#0A84FF' : '#1C1C1E',
                color: groupBy === g.k ? '#fff' : '#98989D',
              }}>
              {g.l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada */}
      <div className="mt-3 px-5">
        {grouped.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #30D158 0%, #64D2FF 100%)' }}>
              <CheckCircle2 size={30} color="#fff"/>
            </div>
            <p className="font-semibold text-[16px]">Sin tareas hoy</p>
            <p className="text-[13px] mt-1" style={{ color: '#98989D' }}>Disfruta el día o añade una nueva</p>
          </div>
        )}
        {grouped.map(g => (
          <div key={g.key} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              {g.color && <div className="w-1 h-4 rounded-full" style={{ background: g.color }}/>}
              {g.icon && <span className="text-[14px]">{g.icon}</span>}
              <span className="text-[13px] font-semibold" style={{ color: '#fff' }}>{g.label}</span>
              <span className="text-[12px]" style={{ color: '#636366' }}>{g.items.filter(i=>i.done).length}/{g.items.length}</span>
            </div>
            <div className="space-y-2">
              {g.items.map(t => (
                <TaskRow key={t.id} task={t} companies={companies} projects={projects}
                  onToggle={onToggleTask} onClick={() => onEditTask(t)}/>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="mt-5 px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#FF453A' }}>
            ⚠ Atrasadas
          </p>
          <div className="space-y-2">
            {overdue.slice(0, 3).map(t => (
              <TaskRow key={t.id} task={t} companies={companies} projects={projects}
                onToggle={onToggleTask} onClick={() => onEditTask(t)} overdue/>
            ))}
          </div>
        </div>
      )}

      <FAB onClick={onNewTask} icon={Plus}/>
    </div>
  );
}

function MeetingRow({ meeting, clients, onClick }) {
  const client = meeting.clientId ? clients.find(c => c.id === meeting.clientId) : null;
  const typeStyle = {
    visita: { color: '#30D158', bg: 'rgba(48,209,88,0.15)', label: 'Visita' },
    llamada: { color: '#0A84FF', bg: 'rgba(10,132,255,0.15)', label: 'Llamada' },
    interna: { color: '#BF5AF2', bg: 'rgba(191,90,242,0.15)', label: 'Interna' },
    reunion: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.15)', label: 'Reunión' },
  }[meeting.type] || { color: '#8E8E93', bg: 'rgba(142,142,147,0.15)', label: 'Evento' };

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-[14px] text-left active:scale-[0.98] transition-transform"
      style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
        <span className="text-[15px] font-semibold" style={{ color: '#fff' }}>{meeting.time}</span>
        <span className="text-[10px]" style={{ color: '#636366' }}>{meeting.duration}min</span>
      </div>
      <div className="w-[2px] h-10 rounded-full" style={{ background: typeStyle.color }}/>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: '#fff' }}>{meeting.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: typeStyle.bg, color: typeStyle.color }}>
            {typeStyle.label}
          </span>
          {meeting.location && (
            <span className="text-[11px] flex items-center gap-0.5" style={{ color: '#98989D' }}>
              <MapPin size={9}/> {meeting.location}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function TaskRow({ task, companies, projects, onToggle, onClick, overdue }) {
  const area = AREAS[task.area] || AREAS['Operativa'];
  const company = companies.find(c => c.id === task.companyId);
  const project = projects.find(p => p.id === task.projectId);
  const assignee = DEFAULT_USERS.find(u => u.id === task.assignee);

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-[14px] transition-all active:scale-[0.99]"
      style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className="flex-shrink-0 mt-0.5 active:scale-90 transition-transform">
        {task.done ? (
          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: area.color }}>
            <Check size={13} color="#fff" strokeWidth={3}/>
          </div>
        ) : (
          <div className="w-[22px] h-[22px] rounded-full border-[1.5px]" style={{ borderColor: '#48484A' }}/>
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: priorityDot[task.priority] }}/>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: area.color }}>{task.area}</span>
          {company && <span className="text-[10px]" style={{ color: '#636366' }}>· {company.icon} {company.name}</span>}
          {task.repeat !== 'none' && <Repeat size={10} style={{ color: '#636366' }}/>}
          {overdue && <span className="text-[10px] font-semibold" style={{ color: '#FF453A' }}>· ATRASADA</span>}
        </div>
        <p className={`text-[14px] font-medium mt-0.5 leading-snug ${task.done ? 'line-through' : ''}`}
          style={{ color: task.done ? '#636366' : '#fff' }}>
          {task.title}
        </p>
        {task.desc && !task.done && (
          <p className="text-[12px] mt-0.5 leading-snug line-clamp-1" style={{ color: '#98989D' }}>{task.desc}</p>
        )}
        {project && (
          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#98989D' }}>
            <FolderKanban size={9}/> {project.name}
          </span>
        )}
      </div>

      <div className="flex-shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
          style={{ background: assignee?.color, color: '#fff' }}>
          {assignee?.initial}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function greet() {
  const h = new Date().getHours();
  if (h < 6) return { text: 'Buenas noches', icon: Moon };
  if (h < 13) return { text: 'Buenos días', icon: Coffee };
  if (h < 20) return { text: 'Buenas tardes', icon: Sun };
  return { text: 'Buenas noches', icon: Moon };
}
function formatDay(d) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
}
function formatLongDate(d) {
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

// Archivo combinado

// ============================================================
// CALENDAR VIEW - con drag and drop entre días
// ============================================================
function CalendarView({ tasks, meetings, companies, projects, onMoveTask, onToggleTask, onEditTask, onEditMeeting, onNewTask }) {
  const [view, setView] = useState('week'); // 'day' | 'week' | 'month'
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today());
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [companyFilter, setCompanyFilter] = useState(null);

  const filteredTasks = companyFilter ? tasks.filter(t => t.companyId === companyFilter) : tasks;
  const filteredMeetings = companyFilter ? meetings.filter(m => m.companyId === companyFilter) : meetings;

  const goToday = () => { setAnchor(new Date()); setSelectedDate(today()); };
  const goPrev = () => {
    const d = new Date(anchor);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  };
  const goNext = () => {
    const d = new Date(anchor);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  };

  return (
    <div className="pt-4 animate-fadeIn">
      {/* Header */}
      <div className="px-5 pt-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#98989D' }}>Calendario</p>
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: '#fff' }}>
            {anchor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goPrev} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)' }}>
            <ChevronLeft size={16} color="#fff"/>
          </button>
          <button onClick={goToday} className="px-3 py-2 rounded-full text-[12px] font-semibold"
            style={{ background: '#0A84FF', color: '#fff' }}>
            Hoy
          </button>
          <button onClick={goNext} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)' }}>
            <ChevronRight size={16} color="#fff"/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-5 mt-4 p-1 rounded-[12px] flex" style={{ background: '#1C1C1E' }}>
        {[
          { k: 'day', l: 'Día' },
          { k: 'week', l: 'Semana' },
          { k: 'month', l: 'Mes' },
        ].map(v => (
          <button key={v.k} onClick={() => setView(v.k)}
            className="flex-1 py-2 text-[13px] font-medium rounded-[9px] transition-all"
            style={{
              background: view === v.k ? '#2C2C2E' : 'transparent',
              color: view === v.k ? '#fff' : '#98989D',
            }}>
            {v.l}
          </button>
        ))}
      </div>

      {/* Filtro empresas */}
      <div className="mt-3 px-5 flex gap-2 overflow-x-auto scrollbar-none">
        <button onClick={() => setCompanyFilter(null)}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap"
          style={{
            background: !companyFilter ? '#fff' : '#1C1C1E',
            color: !companyFilter ? '#000' : '#98989D',
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}>
          Todas
        </button>
        {companies.map(c => (
          <button key={c.id} onClick={() => setCompanyFilter(c.id)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex items-center gap-1"
            style={{
              background: companyFilter === c.id ? c.color : '#1C1C1E',
              color: companyFilter === c.id ? '#fff' : '#98989D',
              border: '0.5px solid rgba(255,255,255,0.08)',
            }}>
            <span>{c.icon}</span> {c.name}
          </button>
        ))}
      </div>

      {view === 'day' && (
        <DayView date={selectedDate} tasks={filteredTasks} meetings={filteredMeetings}
          companies={companies} projects={projects}
          onToggleTask={onToggleTask} onEditTask={onEditTask} onEditMeeting={onEditMeeting}
          onNewTask={() => onNewTask(selectedDate)}/>
      )}
      {view === 'week' && (
        <WeekView anchor={anchor} tasks={filteredTasks} meetings={filteredMeetings}
          companies={companies} projects={projects}
          onMoveTask={onMoveTask} onToggleTask={onToggleTask} onEditTask={onEditTask} onEditMeeting={onEditMeeting}
          draggedTask={draggedTask} setDraggedTask={setDraggedTask}
          dragOverDate={dragOverDate} setDragOverDate={setDragOverDate}
          onNewTask={onNewTask}/>
      )}
      {view === 'month' && (
        <MonthView anchor={anchor} tasks={filteredTasks} meetings={filteredMeetings}
          companies={companies}
          onMoveTask={onMoveTask} onSelectDate={(d) => { setSelectedDate(d); setView('day'); setAnchor(new Date(d)); }}
          draggedTask={draggedTask} setDraggedTask={setDraggedTask}
          dragOverDate={dragOverDate} setDragOverDate={setDragOverDate}/>
      )}
    </div>
  );
}

function DayView({ date, tasks, meetings, companies, projects, onToggleTask, onEditTask, onEditMeeting, onNewTask }) {
  const dayTasks = tasks.filter(t => t.date === date);
  const dayMeetings = meetings.filter(m => m.date === date).sort((a,b) => a.time.localeCompare(b.time));
  const d = new Date(date);

  return (
    <div className="mt-4 px-5 animate-fadeIn pb-24">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[22px] font-semibold" style={{ color: '#fff' }}>
          {d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
        </h2>
        <span className="text-[12px]" style={{ color: '#98989D' }}>
          {dayTasks.length} tareas · {dayMeetings.length} reuniones
        </span>
      </div>

      {/* Timeline de horas para reuniones */}
      {dayMeetings.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#98989D' }}>Agenda</p>
          <div className="space-y-2">
            {dayMeetings.map(m => (
              <MeetingRow key={m.id} meeting={m} clients={[]} onClick={() => onEditMeeting(m)}/>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#98989D' }}>Tareas</p>
      {dayTasks.length === 0 && (
        <div className="text-center py-8 rounded-[14px]" style={{ background: '#1C1C1E' }}>
          <p className="text-[13px]" style={{ color: '#98989D' }}>Sin tareas este día</p>
          <button onClick={onNewTask} className="mt-3 px-4 py-2 rounded-full text-[13px] font-semibold"
            style={{ background: '#0A84FF', color: '#fff' }}>
            + Añadir tarea
          </button>
        </div>
      )}
      <div className="space-y-2">
        {dayTasks.map(t => (
          <TaskRow key={t.id} task={t} companies={companies} projects={projects}
            onToggle={onToggleTask} onClick={() => onEditTask(t)}/>
        ))}
      </div>

      <FAB onClick={onNewTask} icon={Plus}/>
    </div>
  );
}

function WeekView({ anchor, tasks, meetings, companies, projects, onMoveTask, onToggleTask, onEditTask, onEditMeeting, draggedTask, setDraggedTask, dragOverDate, setDragOverDate, onNewTask }) {
  // Semana que contiene el anchor (lunes a domingo)
  const start = new Date(anchor);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="mt-4 pb-24 animate-fadeIn">
      {/* Header días */}
      <div className="px-5 grid grid-cols-7 gap-1 mb-2">
        {days.map(d => {
          const dt = new Date(d);
          const isToday = d === today();
          return (
            <div key={d} className="text-center">
              <div className="text-[10px] uppercase" style={{ color: '#636366' }}>
                {dt.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0,2)}
              </div>
              <div className={`text-[15px] font-semibold mt-0.5 w-7 h-7 mx-auto rounded-full flex items-center justify-center`}
                style={{
                  background: isToday ? '#0A84FF' : 'transparent',
                  color: isToday ? '#fff' : '#fff'
                }}>
                {dt.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <p className="px-5 text-[11px] mb-3" style={{ color: '#636366' }}>
        💡 Mantén pulsada una tarea y arrástrala entre días
      </p>

      {/* Columnas (stack vertical en móvil) */}
      <div className="px-5 space-y-3">
        {days.map(d => {
          const dTasks = tasks.filter(t => t.date === d);
          const dMeetings = meetings.filter(m => m.date === d);
          const dt = new Date(d);
          const isToday = d === today();
          const dayName = dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
            .replace(/^\w/, c => c.toUpperCase());
          const isDragOver = dragOverDate === d;

          return (
            <div key={d}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(d); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTask) {
                  onMoveTask(draggedTask, d);
                  setDraggedTask(null);
                  setDragOverDate(null);
                }
              }}
              className="rounded-[16px] p-3 transition-all"
              style={{
                background: isDragOver ? 'rgba(10,132,255,0.15)' : '#1C1C1E',
                border: isDragOver ? '1.5px dashed #0A84FF' : isToday ? '0.5px solid rgba(10,132,255,0.3)' : '0.5px solid rgba(255,255,255,0.06)',
              }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-semibold" style={{ color: isToday ? '#0A84FF' : '#fff' }}>
                  {dayName} {isToday && '· Hoy'}
                </h3>
                <button onClick={() => onNewTask(d)} className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Plus size={12} color="#fff"/>
                </button>
              </div>

              {dMeetings.length === 0 && dTasks.length === 0 && (
                <p className="text-[12px] py-2" style={{ color: '#636366' }}>Sin planes</p>
              )}

              {dMeetings.sort((a,b) => a.time.localeCompare(b.time)).map(m => (
                <div key={m.id} onClick={() => onEditMeeting(m)}
                  className="flex items-center gap-2 p-2 mb-1.5 rounded-[10px] cursor-pointer"
                  style={{ background: 'rgba(100,210,255,0.1)', border: '0.5px solid rgba(100,210,255,0.2)' }}>
                  <Calendar size={12} color="#64D2FF"/>
                  <span className="text-[11px] font-semibold" style={{ color: '#64D2FF' }}>{m.time}</span>
                  <span className="text-[12px] truncate flex-1" style={{ color: '#fff' }}>{m.title}</span>
                </div>
              ))}

              <div className="space-y-1.5">
                {dTasks.map(t => (
                  <DraggableTaskChip key={t.id} task={t} companies={companies}
                    onDragStart={() => setDraggedTask(t.id)}
                    onDragEnd={() => setDraggedTask(null)}
                    onToggle={onToggleTask} onClick={() => onEditTask(t)}/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraggableTaskChip({ task, companies, onDragStart, onDragEnd, onToggle, onClick }) {
  const area = AREAS[task.area] || AREAS['Operativa'];
  const company = companies.find(c => c.id === task.companyId);
  const assignee = DEFAULT_USERS.find(u => u.id === task.assignee);

  return (
    <div draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      className="flex items-center gap-2 p-2 rounded-[10px] cursor-move active:opacity-60"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${company?.color || area.color}`
      }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} className="flex-shrink-0">
        {task.done ? (
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: area.color }}>
            <Check size={9} color="#fff" strokeWidth={3}/>
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border-[1.5px]" style={{ borderColor: '#48484A' }}/>
        )}
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <p className={`text-[12px] leading-tight truncate ${task.done ? 'line-through' : ''}`}
          style={{ color: task.done ? '#636366' : '#fff' }}>
          {task.title}
        </p>
      </div>
      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
        style={{ background: assignee?.color, color: '#fff' }}>
        {assignee?.initial}
      </div>
    </div>
  );
}

function MonthView({ anchor, tasks, meetings, companies, onMoveTask, onSelectDate, draggedTask, setDraggedTask, dragOverDate, setDragOverDate }) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // lunes=0

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i).toISOString().split('T')[0];
    days.push(d);
  }
  while (days.length % 7 !== 0) days.push(null);

  return (
    <div className="mt-4 px-5 pb-24 animate-fadeIn">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L','M','X','J','V','S','D'].map(d => (
          <div key={d} className="text-center text-[10px] uppercase py-1" style={{ color: '#636366' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square"/>;
          const dTasks = tasks.filter(t => t.date === d);
          const dMeetings = meetings.filter(m => m.date === d);
          const isToday = d === today();
          const dt = new Date(d);
          const dayNum = dt.getDate();
          const isDragOver = dragOverDate === d;
          const companyColors = [...new Set(dTasks.map(t => companies.find(c => c.id === t.companyId)?.color).filter(Boolean))];

          return (
            <div key={d}
              onClick={() => onSelectDate(d)}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(d); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTask) { onMoveTask(draggedTask, d); setDraggedTask(null); setDragOverDate(null); }
              }}
              className="aspect-square rounded-[10px] p-1.5 cursor-pointer flex flex-col transition-all"
              style={{
                background: isDragOver ? 'rgba(10,132,255,0.2)' : isToday ? 'rgba(10,132,255,0.12)' : '#1C1C1E',
                border: isDragOver ? '1.5px dashed #0A84FF' : isToday ? '0.5px solid #0A84FF' : '0.5px solid rgba(255,255,255,0.05)',
              }}>
              <span className="text-[12px] font-semibold" style={{ color: isToday ? '#0A84FF' : '#fff' }}>
                {dayNum}
              </span>
              {(dTasks.length > 0 || dMeetings.length > 0) && (
                <div className="flex-1 flex flex-col justify-end gap-0.5">
                  <div className="flex gap-0.5 flex-wrap">
                    {companyColors.slice(0,3).map((color, i) => (
                      <div key={i} className="w-1 h-1 rounded-full" style={{ background: color }}/>
                    ))}
                  </div>
                  {dMeetings.length > 0 && (
                    <div className="text-[8px] font-semibold px-1 rounded" style={{ background: 'rgba(100,210,255,0.2)', color: '#64D2FF' }}>
                      {dMeetings.length} 📅
                    </div>
                  )}
                  {dTasks.length > 0 && (
                    <div className="text-[8px] font-semibold" style={{ color: '#98989D' }}>
                      {dTasks.filter(t=>!t.done).length}/{dTasks.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 text-[11px] flex-wrap">
        <span style={{ color: '#636366' }}>Leyenda:</span>
        {companies.map(c => (
          <div key={c.id} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: c.color }}/>
            <span style={{ color: '#98989D' }}>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CRM VIEW - Visitas, clientes, prospección
// ============================================================
function CRMView({ clients, meetings, companies, onEditClient, onEditMeeting, onNewClient, onNewMeeting }) {
  const [sub, setSub] = useState('clients');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [clients, search, statusFilter]);

  const upcomingMeetings = meetings
    .filter(m => m.date >= today())
    .sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));

  // Clientes en riesgo (sin contacto > 15 días)
  const atRisk = clients.filter(c => {
    if (!c.lastContact) return c.type === 'cliente';
    return diffDays(c.lastContact, today()) > 15 && c.type === 'cliente';
  });

  return (
    <div className="pt-4 animate-fadeIn pb-24">
      <div className="px-5 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#98989D' }}>Comercial</p>
        <h1 className="text-[30px] font-semibold tracking-tight" style={{ color: '#fff' }}>Clientes & Visitas</h1>
      </div>

      {/* Stats rápidas */}
      <div className="mt-4 px-5 grid grid-cols-3 gap-2">
        <StatMini label="Clientes" value={clients.filter(c => c.type === 'cliente').length} color="#30D158"/>
        <StatMini label="Prospectos" value={clients.filter(c => c.type === 'prospecto').length} color="#0A84FF"/>
        <StatMini label="En riesgo" value={atRisk.length} color="#FF9F0A"/>
      </div>

      {/* Sub-tabs */}
      <div className="mx-5 mt-4 p-1 rounded-[12px] flex" style={{ background: '#1C1C1E' }}>
        {[
          { k: 'clients', l: 'Clientes' },
          { k: 'meetings', l: 'Próximas visitas' },
        ].map(s => (
          <button key={s.k} onClick={() => setSub(s.k)}
            className="flex-1 py-2 text-[13px] font-medium rounded-[9px]"
            style={{
              background: sub === s.k ? '#2C2C2E' : 'transparent',
              color: sub === s.k ? '#fff' : '#98989D',
            }}>
            {s.l}
          </button>
        ))}
      </div>

      {sub === 'clients' && (
        <>
          <div className="px-5 mt-4">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[12px]" style={{ background: '#1C1C1E' }}>
              <Search size={14} color="#98989D"/>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: '#fff' }}/>
            </div>
          </div>

          <div className="px-5 mt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {[
              { k: 'all', l: 'Todos' },
              { k: 'activo', l: 'Activos', c: '#30D158' },
              { k: 'oportunidad', l: 'Oportunidades', c: '#0A84FF' },
              { k: 'en_riesgo', l: 'En riesgo', c: '#FF9F0A' },
              { k: 'prospecto', l: 'Prospectos', c: '#BF5AF2' },
            ].map(f => (
              <button key={f.k} onClick={() => setStatusFilter(f.k)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap"
                style={{
                  background: statusFilter === f.k ? (f.c || '#fff') : '#1C1C1E',
                  color: statusFilter === f.k ? '#fff' : '#98989D',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                }}>
                {f.l}
              </button>
            ))}
          </div>

          <div className="px-5 mt-4 space-y-2">
            {filteredClients.map(c => (
              <ClientCard key={c.id} client={c} companies={companies} onClick={() => onEditClient(c)}/>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-center py-10">
                <p style={{ color: '#98989D' }}>Sin resultados</p>
              </div>
            )}
          </div>

          <FAB onClick={onNewClient} icon={UserPlus}/>
        </>
      )}

      {sub === 'meetings' && (
        <>
          <div className="px-5 mt-4 space-y-2">
            {upcomingMeetings.length === 0 && (
              <div className="text-center py-10 rounded-[14px]" style={{ background: '#1C1C1E' }}>
                <p className="text-[14px]" style={{ color: '#98989D' }}>Sin visitas programadas</p>
              </div>
            )}
            {upcomingMeetings.map(m => {
              const client = clients.find(c => c.id === m.clientId);
              const isToday = m.date === today();
              return (
                <button key={m.id} onClick={() => onEditMeeting(m)}
                  className="w-full p-4 rounded-[14px] text-left active:scale-[0.99] transition-transform"
                  style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-14 flex-shrink-0 text-center">
                      <div className="text-[10px] uppercase" style={{ color: isToday ? '#0A84FF' : '#636366' }}>
                        {isToday ? 'Hoy' : new Date(m.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                      </div>
                      <div className="text-[22px] font-semibold" style={{ color: '#fff' }}>
                        {new Date(m.date).getDate()}
                      </div>
                      <div className="text-[10px]" style={{ color: '#98989D' }}>
                        {new Date(m.date).toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold" style={{ color: '#fff' }}>{m.title}</p>
                      {client && (
                        <p className="text-[12px] mt-0.5" style={{ color: '#98989D' }}>{client.name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: '#98989D' }}>
                        <span className="flex items-center gap-0.5"><Clock size={10}/> {m.time}</span>
                        {m.location && <span className="flex items-center gap-0.5"><MapPin size={10}/> {m.location}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <FAB onClick={onNewMeeting} icon={Plus}/>
        </>
      )}
    </div>
  );
}

function StatMini({ label, value, color }) {
  return (
    <div className="p-3 rounded-[14px]" style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[22px] font-semibold leading-none" style={{ color }}>{value}</p>
      <p className="text-[11px] mt-1" style={{ color: '#98989D' }}>{label}</p>
    </div>
  );
}

function ClientCard({ client, companies, onClick }) {
  const company = companies.find(c => c.id === client.companyId);
  const statusStyle = {
    activo:       { color: '#30D158', label: 'Activo' },
    oportunidad:  { color: '#0A84FF', label: 'Oportunidad' },
    en_riesgo:    { color: '#FF9F0A', label: 'En riesgo' },
    prospecto:    { color: '#BF5AF2', label: 'Prospecto' },
    perdido:      { color: '#636366', label: 'Perdido' },
  }[client.status] || { color: '#636366', label: client.status };

  const daysSince = client.lastContact ? diffDays(client.lastContact, today()) : null;

  return (
    <button onClick={onClick} className="w-full p-4 rounded-[14px] text-left active:scale-[0.99] transition-transform"
      style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
              style={{ background: `${statusStyle.color}22`, color: statusStyle.color }}>
              {statusStyle.label}
            </span>
            {client.value === 'alto' && (
              <Star size={11} fill="#FFD60A" color="#FFD60A"/>
            )}
            {company && <span className="text-[10px]" style={{ color: '#636366' }}>{company.icon} {company.name}</span>}
          </div>
          <p className="text-[15px] font-semibold mt-1" style={{ color: '#fff' }}>{client.name}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: '#98989D' }}>
            {client.city && <span className="flex items-center gap-0.5"><MapPin size={10}/> {client.city}</span>}
            {client.phone && <span className="flex items-center gap-0.5"><Phone size={10}/> {client.phone}</span>}
          </div>
          {client.nextAction && (
            <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: '#0A84FF' }}>
              <ChevronRight size={11}/> {client.nextAction}
            </p>
          )}
          {daysSince !== null && (
            <p className="text-[10px] mt-0.5" style={{ color: daysSince > 15 ? '#FF9F0A' : '#636366' }}>
              Último contacto: hace {daysSince}d
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================
// INSIGHTS
// ============================================================
function InsightsView({ tasks, clients, meetings, companies }) {
  const [period, setPeriod] = useState('week'); // week | month

  const periodTasks = useMemo(() => {
    const days = period === 'week' ? 7 : 30;
    const from = addDays(today(), -days);
    return tasks.filter(t => t.date >= from && t.date <= today());
  }, [tasks, period]);

  const byUser = DEFAULT_USERS.map(u => ({
    user: u,
    total: periodTasks.filter(t => t.assignee === u.id).length,
    done: periodTasks.filter(t => t.assignee === u.id && t.done).length,
  }));

  const byCompany = companies.map(c => ({
    company: c,
    total: periodTasks.filter(t => t.companyId === c.id).length,
    done: periodTasks.filter(t => t.companyId === c.id && t.done).length,
  })).filter(c => c.total > 0);

  const byArea = Object.keys(AREAS).map(a => ({
    area: a,
    color: AREAS[a].color,
    total: periodTasks.filter(t => t.area === a).length,
    done: periodTasks.filter(t => t.area === a && t.done).length,
  })).filter(a => a.total > 0);

  const totalDone = periodTasks.filter(t => t.done).length;
  const totalPct = periodTasks.length ? Math.round((totalDone / periodTasks.length) * 100) : 0;

  const atRiskClients = clients.filter(c => {
    if (!c.lastContact) return c.type === 'cliente';
    return diffDays(c.lastContact, today()) > 15 && c.type === 'cliente';
  });
  const opportunityClients = clients.filter(c => c.status === 'oportunidad');

  return (
    <div className="pt-4 animate-fadeIn pb-24">
      <div className="px-5 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#98989D' }}>Rendimiento</p>
        <h1 className="text-[30px] font-semibold tracking-tight" style={{ color: '#fff' }}>Insights</h1>
      </div>

      <div className="mx-5 mt-4 p-1 rounded-[12px] flex" style={{ background: '#1C1C1E' }}>
        {[{ k: 'week', l: 'Esta semana' }, { k: 'month', l: 'Este mes' }].map(p => (
          <button key={p.k} onClick={() => setPeriod(p.k)}
            className="flex-1 py-2 text-[13px] font-medium rounded-[9px]"
            style={{
              background: period === p.k ? '#2C2C2E' : 'transparent',
              color: period === p.k ? '#fff' : '#98989D',
            }}>
            {p.l}
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="mx-5 mt-4 p-5 rounded-[20px] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#2C2C2E" strokeWidth="7" fill="none"/>
              <circle cx="48" cy="48" r="40"
                stroke="url(#gradient)" strokeWidth="7" fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalPct/100)}`}
                strokeLinecap="round"/>
              <defs>
                <linearGradient id="gradient">
                  <stop offset="0%" stopColor="#0A84FF"/>
                  <stop offset="100%" stopColor="#BF5AF2"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold" style={{ color: '#fff' }}>
              {totalPct}%
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: '#98989D' }}>Productividad</p>
            <p className="text-[26px] font-semibold leading-none mt-1" style={{ color: '#fff' }}>
              {totalDone}<span style={{ color: '#636366' }}>/{periodTasks.length}</span>
            </p>
            <p className="text-[12px] mt-1" style={{ color: '#98989D' }}>tareas completadas</p>
          </div>
        </div>
      </div>

      {/* Por persona */}
      <div className="mx-5 mt-4 p-5 rounded-[20px]" style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-[15px] font-semibold mb-3" style={{ color: '#fff' }}>Por persona</h3>
        <div className="space-y-3">
          {byUser.filter(u => u.total > 0).map(({ user, total, done }) => {
            const pct = total ? Math.round((done/total)*100) : 0;
            return (
              <div key={user.id}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: user.color, color: '#fff' }}>{user.initial}</div>
                  <span className="text-[13px] font-medium" style={{ color: '#fff' }}>{user.name}</span>
                  <span className="text-[11px] ml-auto" style={{ color: '#98989D' }}>{done}/{total} · {pct}%</span>
                </div>
                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#2C2C2E' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: user.color }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por empresa */}
      {byCompany.length > 0 && (
        <div className="mx-5 mt-3 p-5 rounded-[20px]" style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-[15px] font-semibold mb-3" style={{ color: '#fff' }}>Por empresa</h3>
          <div className="space-y-3">
            {byCompany.map(({ company, total, done }) => {
              const pct = total ? Math.round((done/total)*100) : 0;
              return (
                <div key={company.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px]">{company.icon}</span>
                    <span className="text-[13px] font-medium" style={{ color: '#fff' }}>{company.name}</span>
                    <span className="text-[11px] ml-auto" style={{ color: '#98989D' }}>{pct}%</span>
                  </div>
                  <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#2C2C2E' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: company.color }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Por área */}
      <div className="mx-5 mt-3 p-5 rounded-[20px]" style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-[15px] font-semibold mb-3" style={{ color: '#fff' }}>Por área</h3>
        <div className="space-y-2.5">
          {byArea.map(({ area, color, total, done }) => {
            const pct = total ? Math.round((done/total)*100) : 0;
            return (
              <div key={area}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px]" style={{ color: '#fff' }}>{area}</span>
                  <span className="text-[11px]" style={{ color: '#98989D' }}>{done}/{total}</span>
                </div>
                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: '#2C2C2E' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas de negocio */}
      <div className="mx-5 mt-3 p-5 rounded-[20px] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.1) 0%, rgba(255,69,58,0.1) 100%)', border: '0.5px solid rgba(255,159,10,0.2)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} color="#FF9F0A"/>
          <h3 className="text-[15px] font-semibold" style={{ color: '#fff' }}>Alertas</h3>
        </div>
        <div className="space-y-2 text-[13px]">
          {atRiskClients.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} color="#FF9F0A" className="mt-0.5 flex-shrink-0"/>
              <span style={{ color: '#fff' }}>
                <strong>{atRiskClients.length}</strong> cliente{atRiskClients.length > 1 ? 's' : ''} sin contacto {'>'}15 días
              </span>
            </div>
          )}
          {opportunityClients.length > 0 && (
            <div className="flex items-start gap-2">
              <Lightbulb size={12} color="#30D158" className="mt-0.5 flex-shrink-0"/>
              <span style={{ color: '#fff' }}>
                <strong>{opportunityClients.length}</strong> oportunidad{opportunityClients.length > 1 ? 'es' : ''} abierta
              </span>
            </div>
          )}
          {tasks.filter(t => t.date < today() && !t.done).length > 0 && (
            <div className="flex items-start gap-2">
              <Clock size={12} color="#FF453A" className="mt-0.5 flex-shrink-0"/>
              <span style={{ color: '#fff' }}>
                <strong>{tasks.filter(t => t.date < today() && !t.done).length}</strong> tareas atrasadas
              </span>
            </div>
          )}
          {atRiskClients.length === 0 && opportunityClients.length === 0 && (
            <p style={{ color: '#98989D' }}>Todo bajo control 👌</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen() {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        await createUserWithEmailAndPassword(auth, email, pw);
      }
    } catch (e) {
      setErr(e.message.replace('Firebase:', '').replace(/\(auth.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #000 0%, #0A0A14 100%)' }}>
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[22px] mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
                     boxShadow: '0 20px 40px rgba(10,132,255,0.4)' }}>
            <Briefcase size={36} color="#fff"/>
          </div>
          <h1 className="text-[32px] font-semibold tracking-tight" style={{ color: '#fff' }}>NegocioDía</h1>
          <p className="text-[14px] mt-1" style={{ color: '#98989D' }}>Tu día bajo control</p>
        </div>

        <div className="p-5 rounded-[20px]" style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="p-1 rounded-[10px] flex mb-4" style={{ background: '#2C2C2E' }}>
            {[{ k: 'login', l: 'Entrar' }, { k: 'register', l: 'Crear cuenta' }].map(m => (
              <button key={m.k} onClick={() => { setMode(m.k); setErr(''); }}
                className="flex-1 py-2 text-[13px] font-medium rounded-[8px]"
                style={{
                  background: mode === m.k ? '#0A84FF' : 'transparent',
                  color: mode === m.k ? '#fff' : '#98989D',
                }}>
                {m.l}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-3 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Mail size={15} color="#98989D"/>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com" autoComplete="email"
                className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: '#fff' }}/>
            </div>
            <div className="flex items-center gap-2 px-3 py-3 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Lock size={15} color="#98989D"/>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="Contraseña" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: '#fff' }}/>
            </div>

            {err && (
              <p className="text-[12px] px-2" style={{ color: '#FF453A' }}>{err}</p>
            )}

            <button onClick={submit} disabled={!email || !pw || loading}
              className="w-full py-3.5 rounded-[12px] font-semibold text-[15px] transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
                color: '#fff',
                opacity: (!email || !pw || loading) ? 0.4 : 1,
                boxShadow: '0 6px 20px rgba(10,132,255,0.3)',
              }}>
              {loading ? '…' : (mode === 'login' ? 'Entrar' : 'Crear cuenta')}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center mt-5" style={{ color: '#636366' }}>
          Tú y Álvaro usáis la misma cuenta para compartir datos.<br/>
          Cambiáis de perfil desde el avatar arriba.
        </p>
      </div>
    </div>
  );
}

// ============================================================
function BottomNav({ tab, setTab }) {
  const items = [
    { k: 'today', icon: Home, label: 'Hoy' },
    { k: 'calendar', icon: Calendar, label: 'Calendario' },
    { k: 'crm', icon: Handshake, label: 'CRM' },
    { k: 'insights', icon: PieChart, label: 'Insights' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex justify-around px-2 pt-2 pb-2">
        {items.map(i => {
          const active = tab === i.k;
          const Icon = i.icon;
          return (
            <button key={i.k} onClick={() => setTab(i.k)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-[12px] transition-all active:scale-95">
              <Icon size={21} color={active ? '#0A84FF' : '#636366'} strokeWidth={active ? 2.4 : 2}/>
              <span className="text-[10px] font-medium" style={{ color: active ? '#0A84FF' : '#636366' }}>{i.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FAB({ onClick, icon: Icon }) {
  return (
    <button onClick={onClick}
      className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
      style={{
        background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
        boxShadow: '0 8px 28px rgba(10,132,255,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
      }}>
      <Icon size={26} color="#fff" strokeWidth={2.5}/>
    </button>
  );
}

// ============================================================
// TASK EDITOR
// ============================================================
function TaskEditor({ task, companies, projects, onSave, onDelete, onClose }) {
  const [t, setT] = useState(task);
  const isNew = task.new;
  const availableProjects = projects.filter(p => p.companyId === t.companyId);

  const save = () => {
    if (!t.title?.trim()) return;
    const { new: _, ...clean } = t;
    onSave(clean);
  };

  return (
    <Modal onClose={onClose} title={isNew ? 'Nueva tarea' : 'Editar tarea'}>
      <div className="space-y-3">
        <Field label="Título">
          <input value={t.title || ''} onChange={(e) => setT({ ...t, title: e.target.value })}
            placeholder="¿Qué hay que hacer?" autoFocus
            className="w-full text-[17px] outline-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>

        <Field label="Descripción">
          <textarea value={t.desc || ''} onChange={(e) => setT({ ...t, desc: e.target.value })}
            placeholder="Detalles (opcional)" rows={2}
            className="w-full text-[14px] outline-none resize-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <input type="date" value={t.date || today()} onChange={(e) => setT({ ...t, date: e.target.value })}
              className="w-full text-[14px] outline-none bg-transparent" style={{ color: '#fff', colorScheme: 'dark' }}/>
          </Field>
          <Field label="Asignado a">
            <div className="flex gap-1.5">
              {DEFAULT_USERS.map(u => (
                <button key={u.id} onClick={() => setT({ ...t, assignee: u.id })}
                  className="flex-1 py-1.5 rounded-[8px] text-[11px] font-semibold flex items-center justify-center gap-1"
                  style={{
                    background: t.assignee === u.id ? u.color : 'rgba(255,255,255,0.05)',
                    color: t.assignee === u.id ? '#fff' : '#98989D',
                  }}>
                  {u.initial} {u.name}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Empresa">
          <div className="flex flex-wrap gap-1.5">
            {companies.map(c => (
              <button key={c.id} onClick={() => setT({ ...t, companyId: c.id, projectId: null })}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center gap-1"
                style={{
                  background: t.companyId === c.id ? c.color : 'rgba(255,255,255,0.05)',
                  color: t.companyId === c.id ? '#fff' : '#98989D',
                }}>
                <span>{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </Field>

        {availableProjects.length > 0 && (
          <Field label="Proyecto (opcional)">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setT({ ...t, projectId: null })}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium"
                style={{
                  background: !t.projectId ? '#3A3A3C' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                }}>
                Sin proyecto
              </button>
              {availableProjects.map(p => (
                <button key={p.id} onClick={() => setT({ ...t, projectId: p.id })}
                  className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium"
                  style={{
                    background: t.projectId === p.id ? p.color : 'rgba(255,255,255,0.05)',
                    color: t.projectId === p.id ? '#fff' : '#98989D',
                  }}>
                  {p.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Área">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(AREAS).map(a => (
              <button key={a} onClick={() => setT({ ...t, area: a })}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium"
                style={{
                  background: t.area === a ? AREAS[a].color : 'rgba(255,255,255,0.05)',
                  color: t.area === a ? '#fff' : '#98989D',
                }}>
                {a}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prioridad">
            <div className="flex gap-1">
              {['high','medium','low'].map(p => (
                <button key={p} onClick={() => setT({ ...t, priority: p })}
                  className="flex-1 py-1.5 rounded-[8px] text-[11px] font-semibold"
                  style={{
                    background: t.priority === p ? priorityDot[p] : 'rgba(255,255,255,0.05)',
                    color: t.priority === p ? '#fff' : '#98989D',
                  }}>
                  {priorityLabel[p]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Repetir">
            <select value={t.repeat || 'none'} onChange={(e) => setT({ ...t, repeat: e.target.value })}
              className="w-full text-[13px] outline-none bg-transparent py-1"
              style={{ color: '#fff', colorScheme: 'dark' }}>
              <option value="none" style={{ background: '#1C1C1E' }}>No repetir</option>
              <option value="daily" style={{ background: '#1C1C1E' }}>Cada día</option>
              <option value="weekly" style={{ background: '#1C1C1E' }}>Cada semana</option>
              <option value="monthly" style={{ background: '#1C1C1E' }}>Cada mes</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {!isNew && (
          <button onClick={() => { if (confirm('¿Eliminar esta tarea?')) { onDelete(t.id); onClose(); } }}
            className="px-4 py-3 rounded-[12px] font-semibold text-[14px]"
            style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}>
            <Trash2 size={16}/>
          </button>
        )}
        <button onClick={save} disabled={!t.title?.trim()}
          className="flex-1 py-3 rounded-[12px] font-semibold text-[15px] transition-opacity"
          style={{
            background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
            color: '#fff',
            opacity: t.title?.trim() ? 1 : 0.4,
            boxShadow: t.title?.trim() ? '0 6px 20px rgba(10,132,255,0.3)' : 'none',
          }}>
          {isNew ? 'Crear tarea' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// CLIENT EDITOR
// ============================================================
function ClientEditor({ client, companies, onSave, onDelete, onClose }) {
  const [c, setC] = useState(client);
  const isNew = client.new;

  const save = () => {
    if (!c.name?.trim()) return;
    const { new: _, ...clean } = c;
    onSave(clean);
  };

  return (
    <Modal onClose={onClose} title={isNew ? 'Nuevo contacto' : 'Editar contacto'}>
      <div className="space-y-3">
        <Field label="Nombre / Empresa">
          <input value={c.name || ''} onChange={(e) => setC({ ...c, name: e.target.value })}
            placeholder="Nombre del cliente" autoFocus
            className="w-full text-[17px] outline-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <input value={c.phone || ''} onChange={(e) => setC({ ...c, phone: e.target.value })}
              placeholder="600 000 000"
              className="w-full text-[14px] outline-none bg-transparent" style={{ color: '#fff' }}/>
          </Field>
          <Field label="Ciudad">
            <input value={c.city || ''} onChange={(e) => setC({ ...c, city: e.target.value })}
              placeholder="Madrid"
              className="w-full text-[14px] outline-none bg-transparent" style={{ color: '#fff' }}/>
          </Field>
        </div>

        <Field label="Empresa">
          <div className="flex flex-wrap gap-1.5">
            {companies.map(co => (
              <button key={co.id} onClick={() => setC({ ...c, companyId: co.id })}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center gap-1"
                style={{
                  background: c.companyId === co.id ? co.color : 'rgba(255,255,255,0.05)',
                  color: c.companyId === co.id ? '#fff' : '#98989D',
                }}>
                <span>{co.icon}</span> {co.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tipo">
          <div className="flex gap-1.5">
            {[
              { k: 'cliente', l: 'Cliente', c: '#30D158' },
              { k: 'prospecto', l: 'Prospecto', c: '#BF5AF2' },
              { k: 'proveedor', l: 'Proveedor', c: '#5E5CE6' },
            ].map(t => (
              <button key={t.k} onClick={() => setC({ ...c, type: t.k })}
                className="flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold"
                style={{
                  background: c.type === t.k ? t.c : 'rgba(255,255,255,0.05)',
                  color: c.type === t.k ? '#fff' : '#98989D',
                }}>
                {t.l}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Estado">
          <div className="flex flex-wrap gap-1.5">
            {[
              { k: 'activo', l: 'Activo', c: '#30D158' },
              { k: 'oportunidad', l: 'Oportunidad', c: '#0A84FF' },
              { k: 'en_riesgo', l: 'En riesgo', c: '#FF9F0A' },
              { k: 'prospecto', l: 'Prospecto', c: '#BF5AF2' },
              { k: 'perdido', l: 'Perdido', c: '#636366' },
            ].map(s => (
              <button key={s.k} onClick={() => setC({ ...c, status: s.k })}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-semibold"
                style={{
                  background: c.status === s.k ? s.c : 'rgba(255,255,255,0.05)',
                  color: c.status === s.k ? '#fff' : '#98989D',
                }}>
                {s.l}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Valor">
          <div className="flex gap-1.5">
            {['bajo','medio','alto'].map(v => (
              <button key={v} onClick={() => setC({ ...c, value: v })}
                className="flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold capitalize"
                style={{
                  background: c.value === v ? '#FFD60A' : 'rgba(255,255,255,0.05)',
                  color: c.value === v ? '#000' : '#98989D',
                }}>
                {v === 'alto' && '⭐ '}{v}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Próxima acción">
          <input value={c.nextAction || ''} onChange={(e) => setC({ ...c, nextAction: e.target.value })}
            placeholder="Ej: Llamar esta semana"
            className="w-full text-[14px] outline-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>

        <Field label="Último contacto">
          <input type="date" value={c.lastContact || ''} onChange={(e) => setC({ ...c, lastContact: e.target.value })}
            className="w-full text-[14px] outline-none bg-transparent" style={{ color: '#fff', colorScheme: 'dark' }}/>
        </Field>

        <Field label="Notas">
          <textarea value={c.notes || ''} onChange={(e) => setC({ ...c, notes: e.target.value })}
            placeholder="Notas internas, preferencias, histórico…" rows={3}
            className="w-full text-[13px] outline-none resize-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>
      </div>

      <div className="mt-5 flex gap-2">
        {!isNew && (
          <button onClick={() => { if (confirm('¿Eliminar contacto?')) { onDelete(c.id); onClose(); } }}
            className="px-4 py-3 rounded-[12px]"
            style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}>
            <Trash2 size={16}/>
          </button>
        )}
        {!isNew && c.phone && (
          <a href={`tel:${c.phone}`} className="px-4 py-3 rounded-[12px] flex items-center justify-center"
            style={{ background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>
            <Phone size={16}/>
          </a>
        )}
        <button onClick={save} disabled={!c.name?.trim()}
          className="flex-1 py-3 rounded-[12px] font-semibold text-[15px]"
          style={{
            background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
            color: '#fff',
            opacity: c.name?.trim() ? 1 : 0.4,
          }}>
          {isNew ? 'Guardar contacto' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// MEETING EDITOR
// ============================================================
function MeetingEditor({ meeting, clients, companies, onSave, onDelete, onClose }) {
  const [m, setM] = useState(meeting);
  const isNew = meeting.new;

  const toggleAttendee = (u) => {
    const list = m.attendees || [];
    setM({ ...m, attendees: list.includes(u) ? list.filter(x => x !== u) : [...list, u] });
  };

  const save = () => {
    if (!m.title?.trim()) return;
    const { new: _, ...clean } = m;
    onSave(clean);
  };

  return (
    <Modal onClose={onClose} title={isNew ? 'Nueva reunión' : 'Editar reunión'}>
      <div className="space-y-3">
        <Field label="Título">
          <input value={m.title || ''} onChange={(e) => setM({ ...m, title: e.target.value })}
            placeholder="Reunión con…" autoFocus
            className="w-full text-[17px] outline-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>

        <Field label="Tipo">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { k: 'visita', l: 'Visita', c: '#30D158' },
              { k: 'llamada', l: 'Llamada', c: '#0A84FF' },
              { k: 'reunion', l: 'Reunión', c: '#FF9F0A' },
              { k: 'interna', l: 'Interna', c: '#BF5AF2' },
            ].map(t => (
              <button key={t.k} onClick={() => setM({ ...m, type: t.k })}
                className="py-1.5 rounded-[8px] text-[11px] font-semibold"
                style={{
                  background: m.type === t.k ? t.c : 'rgba(255,255,255,0.05)',
                  color: m.type === t.k ? '#fff' : '#98989D',
                }}>
                {t.l}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Fecha">
            <input type="date" value={m.date || ''} onChange={(e) => setM({ ...m, date: e.target.value })}
              className="w-full text-[13px] outline-none bg-transparent" style={{ color: '#fff', colorScheme: 'dark' }}/>
          </Field>
          <Field label="Hora">
            <input type="time" value={m.time || ''} onChange={(e) => setM({ ...m, time: e.target.value })}
              className="w-full text-[13px] outline-none bg-transparent" style={{ color: '#fff', colorScheme: 'dark' }}/>
          </Field>
          <Field label="Duración">
            <select value={m.duration || 60} onChange={(e) => setM({ ...m, duration: Number(e.target.value) })}
              className="w-full text-[13px] outline-none bg-transparent" style={{ color: '#fff' }}>
              {[15,30,45,60,90,120].map(d => (
                <option key={d} value={d} style={{ background: '#1C1C1E' }}>{d}m</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Cliente / Contacto">
          <select value={m.clientId || ''} onChange={(e) => setM({ ...m, clientId: e.target.value || null })}
            className="w-full text-[13px] outline-none bg-transparent" style={{ color: '#fff' }}>
            <option value="" style={{ background: '#1C1C1E' }}>— Ninguno —</option>
            {clients.map(cl => (
              <option key={cl.id} value={cl.id} style={{ background: '#1C1C1E' }}>{cl.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Ubicación">
          <input value={m.location || ''} onChange={(e) => setM({ ...m, location: e.target.value })}
            placeholder="Dirección, Zoom, oficina…"
            className="w-full text-[13px] outline-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>

        <Field label="Asistentes">
          <div className="flex gap-1.5">
            {DEFAULT_USERS.filter(u => u.id !== 'both').map(u => (
              <button key={u.id} onClick={() => toggleAttendee(u.id)}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-semibold flex items-center justify-center gap-1"
                style={{
                  background: (m.attendees || []).includes(u.id) ? u.color : 'rgba(255,255,255,0.05)',
                  color: (m.attendees || []).includes(u.id) ? '#fff' : '#98989D',
                }}>
                {u.initial} {u.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Empresa">
          <div className="flex flex-wrap gap-1.5">
            {companies.map(co => (
              <button key={co.id} onClick={() => setM({ ...m, companyId: co.id })}
                className="px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium flex items-center gap-1"
                style={{
                  background: m.companyId === co.id ? co.color : 'rgba(255,255,255,0.05)',
                  color: m.companyId === co.id ? '#fff' : '#98989D',
                }}>
                <span>{co.icon}</span> {co.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notas">
          <textarea value={m.notes || ''} onChange={(e) => setM({ ...m, notes: e.target.value })}
            placeholder="Agenda, preparación, objetivos…" rows={3}
            className="w-full text-[13px] outline-none resize-none bg-transparent" style={{ color: '#fff' }}/>
        </Field>
      </div>

      <div className="mt-5 flex gap-2">
        {!isNew && (
          <button onClick={() => { if (confirm('¿Eliminar reunión?')) { onDelete(m.id); onClose(); } }}
            className="px-4 py-3 rounded-[12px]"
            style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}>
            <Trash2 size={16}/>
          </button>
        )}
        <button onClick={save} disabled={!m.title?.trim()}
          className="flex-1 py-3 rounded-[12px] font-semibold text-[15px]"
          style={{
            background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
            color: '#fff',
            opacity: m.title?.trim() ? 1 : 0.4,
          }}>
          {isNew ? 'Crear reunión' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// USER SWITCH
// ============================================================
function UserSwitchModal({ currentUser, onChange, onClose }) {
  const logout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      await signOut(auth);
      onClose();
    }
  };
  return (
    <Modal onClose={onClose} title="Cambiar de perfil">
      <p className="text-[13px] mb-3" style={{ color: '#98989D' }}>
        Selecciona quién está usando la app. Las nuevas tareas se asignarán por defecto a esta persona.
      </p>
      <div className="space-y-2">
        {DEFAULT_USERS.filter(u => u.id !== 'both').map(u => (
          <button key={u.id} onClick={() => onChange(u.id)}
            className="w-full flex items-center gap-3 p-3 rounded-[12px] text-left transition-all"
            style={{
              background: currentUser === u.id ? `${u.color}22` : 'rgba(255,255,255,0.05)',
              border: currentUser === u.id ? `1px solid ${u.color}` : '1px solid transparent',
            }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
              style={{ background: u.color, color: '#fff' }}>{u.initial}</div>
            <span className="text-[15px] font-medium flex-1" style={{ color: '#fff' }}>{u.name}</span>
            {currentUser === u.id && <Check size={18} color={u.color}/>}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
        <p className="text-[11px] mb-2" style={{ color: '#636366' }}>
          Conectado como {auth.currentUser?.email}
        </p>
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-medium text-[13px]"
          style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>
          <LogOut size={14}/> Cerrar sesión
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// MODAL + FIELD
// ============================================================
function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 max-w-md mx-auto flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full rounded-t-[28px] p-5 animate-slideUp"
        style={{ background: '#1C1C1E', maxHeight: '92vh', overflowY: 'auto',
                 paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#48484A' }}/>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: '#fff' }}>{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} color="#fff"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#636366' }}>{label}</p>
      {children}
    </div>
  );
}

// Los estilos están en src/index.css
