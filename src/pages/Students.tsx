import { useState } from 'react';
import { useStore } from '@/store';
import type { Student, Group, Attendance } from '@/lib/types';
import { GROUP_COLORS } from '@/lib/types';
import { Search, Plus, Edit2, Trash2, X, Users, FolderOpen, ClipboardCheck, Phone, User } from 'lucide-react';
import dayjs from 'dayjs';

const TABS = [
  { key: 'profiles', label: '学员档案', icon: Users },
  { key: 'groups', label: '分组管理', icon: FolderOpen },
  { key: 'attendance', label: '出勤签到', icon: ClipboardCheck },
];

const EMPTY_STUDENT = { name: '', age: 0, gender: '男', groupId: null as number | null, avatar: '', phone: '', parentName: '', parentPhone: '' };
const EMPTY_GROUP = { name: '', color: GROUP_COLORS[0], description: '' };

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--navy)]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StudentFormModal({ open, onClose, initial, groups, onSave }: {
  open: boolean; onClose: () => void;
  initial: typeof EMPTY_STUDENT; groups: Group[];
  onSave: (data: typeof EMPTY_STUDENT) => void;
}) {
  const [form, setForm] = useState(initial);
  const update = (k: string, v: string | number | null) => setForm((p: typeof EMPTY_STUDENT) => ({ ...p, [k]: v }));
  const valid = form.name.trim() !== '';
  return (
    <Modal open={open} onClose={onClose} title={initial.name ? '编辑学员' : '添加学员'}>
      <div className="space-y-3">
        <div><label className="block text-sm font-medium mb-1">姓名 *</label><input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">年龄</label><input type="number" className="input-field" value={form.age || ''} onChange={e => update('age', Number(e.target.value))} /></div>
          <div><label className="block text-sm font-medium mb-1">性别</label><select className="select-field" value={form.gender} onChange={e => update('gender', e.target.value)}><option>男</option><option>女</option></select></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">分组</label><select className="select-field" value={form.groupId ?? ''} onChange={e => update('groupId', e.target.value ? Number(e.target.value) : null)}><option value="">未分组</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-1">电话</label><input className="input-field" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">家长姓名</label><input className="input-field" value={form.parentName} onChange={e => update('parentName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">家长电话</label><input className="input-field" value={form.parentPhone} onChange={e => update('parentPhone', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" disabled={!valid} onClick={() => { onSave(form); onClose(); }}>保存</button>
        </div>
      </div>
    </Modal>
  );
}

function GroupFormModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void;
  initial: typeof EMPTY_GROUP & { id?: number };
  onSave: (data: typeof EMPTY_GROUP) => void;
}) {
  const [form, setForm] = useState(initial);
  const update = (k: string, v: string) => setForm((p: typeof EMPTY_GROUP) => ({ ...p, [k]: v }));
  const valid = form.name.trim() !== '';
  return (
    <Modal open={open} onClose={onClose} title={initial.id ? '编辑分组' : '添加分组'}>
      <div className="space-y-3">
        <div><label className="block text-sm font-medium mb-1">名称 *</label><input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} /></div>
        <div><label className="block text-sm font-medium mb-1">颜色</label><div className="flex gap-2 flex-wrap">{GROUP_COLORS.map(c => <button key={c} onClick={() => update('color', c)} className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-[var(--text)] scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div></div>
        <div><label className="block text-sm font-medium mb-1">描述</label><input className="input-field" value={form.description} onChange={e => update('description', e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" disabled={!valid} onClick={() => { onSave(form); onClose(); }}>保存</button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteModal({ open, onClose, label, onConfirm }: { open: boolean; onClose: () => void; label: string; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="确认删除">
      <p className="text-sm text-[var(--text-light)] mb-4">确定要删除「{label}」吗？此操作不可撤销。</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>删除</button>
      </div>
    </Modal>
  );
}

function ProfilesTab({ students, groups, addStudent, updateStudent, deleteStudent }: {
  students: Student[]; groups: Group[];
  addStudent: (s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: number, d: Partial<Student>) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const getGroup = (gid: number | null) => groups.find(g => g.id === gid);
  const filtered = students.filter(s => s.name.includes(search) && (groupFilter === null || s.groupId === groupFilter));
  const handleSave = async (data: typeof EMPTY_STUDENT) => {
    if (editTarget?.id) { await updateStudent(editTarget.id, data); } else { await addStudent(data); }
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input className="input-field pl-9" placeholder="搜索学员..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="select-field w-36" value={groupFilter ?? ''} onChange={e => setGroupFilter(e.target.value ? Number(e.target.value) : null)}><option value="">全部分组</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <button className="btn-primary flex items-center gap-1" onClick={() => setShowAdd(true)}><Plus size={16} />添加学员</button>
      </div>
      <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(s => {
          const g = getGroup(s.groupId);
          return (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">{s.name.slice(-2)}</div>
                  <div><div className="font-medium">{s.name}</div><div className="text-xs text-[var(--text-light)]">{s.age}岁 · {s.gender}</div></div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-gray-100 text-[var(--text-light)]" onClick={() => setEditTarget(s)}><Edit2 size={14} /></button>
                  <button className="p-1 rounded hover:bg-red-50 text-[var(--danger)]" onClick={() => setDeleteTarget(s)}><Trash2 size={14} /></button>
                </div>
              </div>
              {g && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white mb-2" style={{ backgroundColor: g.color }}>{g.name}</span>}
              <div className="space-y-1 text-xs text-[var(--text-light)]">
                <div className="flex items-center gap-1"><User size={12} />{s.parentName}</div>
                <div className="flex items-center gap-1"><Phone size={12} />{s.phone}</div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">暂无学员数据</div>}
      <StudentFormModal open={showAdd} onClose={() => setShowAdd(false)} initial={EMPTY_STUDENT} groups={groups} onSave={handleSave} />
      <StudentFormModal open={!!editTarget} onClose={() => setEditTarget(null)} initial={editTarget ? { name: editTarget.name, age: editTarget.age, gender: editTarget.gender, groupId: editTarget.groupId, avatar: editTarget.avatar, phone: editTarget.phone, parentName: editTarget.parentName, parentPhone: editTarget.parentPhone } : EMPTY_STUDENT} groups={groups} onSave={handleSave} />
      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} label={deleteTarget?.name ?? ''} onConfirm={() => deleteTarget?.id && deleteStudent(deleteTarget.id)} />
    </div>
  );
}

function GroupsTab({ students, groups, addGroup, updateGroup, deleteGroup }: {
  students: Student[]; groups: Group[];
  addGroup: (g: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  updateGroup: (id: number, d: Partial<Group>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
}) {
  const [selected, setSelected] = useState<number | null>(groups[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const countMap = Object.fromEntries(groups.map(g => [g.id, students.filter(s => s.groupId === g.id).length]));
  const groupStudents = students.filter(s => s.groupId === selected);
  const handleSave = async (data: typeof EMPTY_GROUP) => {
    if (editTarget?.id) { await updateGroup(editTarget.id, data); } else { await addGroup(data); }
  };
  return (
    <div className="flex gap-4 h-full">
      <div className="w-72 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">分组列表</h2>
          <button className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1" onClick={() => setShowAdd(true)}><Plus size={14} />添加</button>
        </div>
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} onClick={() => setSelected(g.id ?? null)} className={`card cursor-pointer py-3 px-4 transition-all ${selected === g.id ? 'ring-2 ring-[var(--primary)]' : 'hover:shadow'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} /><span className="font-medium text-sm">{g.name}</span></div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--text-muted)]">{countMap[g.id] ?? 0}人</span>
                  <button className="p-1 rounded hover:bg-gray-100 text-[var(--text-light)]" onClick={e => { e.stopPropagation(); setEditTarget(g); }}><Edit2 size={13} /></button>
                  <button className="p-1 rounded hover:bg-red-50 text-[var(--danger)]" onClick={e => { e.stopPropagation(); setDeleteTarget(g); }}><Trash2 size={13} /></button>
                </div>
              </div>
              {g.description && <div className="text-xs text-[var(--text-light)] mt-1 ml-5">{g.description}</div>}
            </div>
          ))}
          {groups.length === 0 && <div className="text-center py-8 text-[var(--text-muted)] text-sm">暂无分组</div>}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="section-title">{groups.find(g => g.id === selected)?.name ?? '选择分组'} · 学员</h2>
        <div className="space-y-2">
          {groupStudents.map(s => (
            <div key={s.id} className="card py-3 px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">{s.name.slice(-2)}</div>
              <div className="flex-1 min-w-0"><div className="font-medium text-sm">{s.name}</div><div className="text-xs text-[var(--text-light)]">{s.age}岁 · {s.gender} · {s.phone}</div></div>
            </div>
          ))}
          {groupStudents.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该分组暂无学员</div>}
        </div>
      </div>
      <GroupFormModal open={showAdd} onClose={() => setShowAdd(false)} initial={EMPTY_GROUP} onSave={handleSave} />
      <GroupFormModal open={!!editTarget} onClose={() => setEditTarget(null)} initial={editTarget ? { name: editTarget.name, color: editTarget.color, description: editTarget.description, id: editTarget.id } : EMPTY_GROUP} onSave={handleSave} />
      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} label={deleteTarget?.name ?? ''} onConfirm={() => deleteTarget?.id && deleteGroup(deleteTarget.id)} />
    </div>
  );
}

function AttendanceTab({ students, groups, attendance, addAttendance, updateAttendance }: {
  students: Student[]; groups: Group[]; attendance: Attendance[];
  addAttendance: (r: Omit<Attendance, 'id'>) => Promise<void>;
  updateAttendance: (id: number, d: Partial<Attendance>) => Promise<void>;
}) {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const dayRecords = attendance.filter(a => a.date === date);
  const getRecord = (sid: number) => dayRecords.find(a => a.studentId === sid);
  const getGroup = (gid: number | null) => groups.find(g => g.id === gid);
  const toggleStatus = async (sid: number, current: Attendance['status'] | undefined) => {
    const existing = getRecord(sid);
    const next: Attendance['status'] = current === 'present' ? 'absent' : current === 'absent' ? 'leave' : 'present';
    if (existing?.id) { await updateAttendance(existing.id, { status: next }); }
    else { await addAttendance({ studentId: sid, date, status: next, note: '' }); }
  };
  const statusBtn = (status: Attendance['status'] | undefined) => {
    if (status === 'present') return 'badge-success';
    if (status === 'absent') return 'badge-danger';
    if (status === 'leave') return 'badge-warning';
    return 'bg-gray-100 text-gray-500';
  };
  const statusLabel = (s: Attendance['status'] | undefined) => s === 'present' ? '出勤' : s === 'absent' ? '缺勤' : s === 'leave' ? '请假' : '未记录';
  const counts = { total: students.length, present: 0, absent: 0, leave: 0 };
  students.forEach(s => { const st = getRecord(s.id!)?.status; if (st === 'present') counts.present++; else if (st === 'absent') counts.absent++; else if (st === 'leave') counts.leave++; });
  const rate = counts.total ? ((counts.present / counts.total) * 100).toFixed(1) : '0.0';
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input type="date" className="input-field w-48" value={date} onChange={e => setDate(e.target.value)} />
        <span className="text-sm text-[var(--text-light)]">{dayjs(date).format('YYYY年MM月DD日')}</span>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[var(--border)] bg-gray-50"><th className="text-left py-2.5 px-4 font-medium">学员</th><th className="text-left py-2.5 px-4 font-medium">分组</th><th className="text-center py-2.5 px-4 font-medium">状态</th><th className="text-left py-2.5 px-4 font-medium">备注</th></tr></thead>
          <tbody>
            {students.map(s => {
              const rec = getRecord(s.id!);
              const g = getGroup(s.groupId);
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-medium">{s.name}</td>
                  <td className="py-2.5 px-4">{g && <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: g.color }}>{g.name}</span>}</td>
                  <td className="py-2.5 px-4 text-center"><button onClick={() => toggleStatus(s.id!, rec?.status)} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${statusBtn(rec?.status)}`}>{statusLabel(rec?.status)}</button></td>
                  <td className="py-2.5 px-4 text-[var(--text-light)]">{rec?.note || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {students.length === 0 && <div className="text-center py-8 text-[var(--text-muted)]">暂无学员</div>}
      </div>
      <div className="flex items-center gap-6 mt-4 text-sm">
        <span>总人数: <strong>{counts.total}</strong></span>
        <span className="text-[var(--success)]">出勤: <strong>{counts.present}</strong></span>
        <span className="text-[var(--danger)]">缺勤: <strong>{counts.absent}</strong></span>
        <span className="text-[var(--warning)]">请假: <strong>{counts.leave}</strong></span>
        <span>出勤率: <strong className="text-[var(--primary)]">{rate}%</strong></span>
      </div>
    </div>
  );
}

export default function Students() {
  const [activeTab, setActiveTab] = useState('profiles');
  const students = useStore(s => s.students);
  const groups = useStore(s => s.groups);
  const attendance = useStore(s => s.attendance);
  const addStudent = useStore(s => s.addStudent);
  const updateStudent = useStore(s => s.updateStudent);
  const deleteStudent = useStore(s => s.deleteStudent);
  const addGroup = useStore(s => s.addGroup);
  const updateGroup = useStore(s => s.updateGroup);
  const deleteGroup = useStore(s => s.deleteGroup);
  const addAttendance = useStore(s => s.addAttendance);
  const updateAttendance = useStore(s => s.updateAttendance);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-0">
        <h1 className="text-xl font-bold text-[var(--navy)] mb-4">学员列表</h1>
        <div className="flex gap-1 border-b border-[var(--border)]">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-light)] hover:text-[var(--text)]'}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'profiles' && <ProfilesTab students={students} groups={groups} addStudent={addStudent} updateStudent={updateStudent} deleteStudent={deleteStudent} />}
        {activeTab === 'groups' && <GroupsTab students={students} groups={groups} addGroup={addGroup} updateGroup={updateGroup} deleteGroup={deleteGroup} />}
        {activeTab === 'attendance' && <AttendanceTab students={students} groups={groups} attendance={attendance} addAttendance={addAttendance} updateAttendance={updateAttendance} />}
      </div>
    </div>
  );
}
