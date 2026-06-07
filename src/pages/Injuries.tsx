import { useState } from 'react';
import { useStore } from '@/store';
import type { InjuryRecord, ParentFeedback } from '@/lib/types';
import { BODY_PARTS, FEEDBACK_CATEGORIES } from '@/lib/types';
import { HeartPulse, AlertTriangle, MessageCircle, Plus, Edit3, CheckCircle, X } from 'lucide-react';
import dayjs from 'dayjs';

const SEVERITY_MAP: Record<string, { label: string; cls: string; color: string }> = {
  mild: { label: '轻度', cls: 'badge-warning', color: 'bg-yellow-100 text-yellow-800' },
  moderate: { label: '中度', cls: 'badge-info', color: 'bg-orange-100 text-orange-800' },
  severe: { label: '重度', cls: 'badge-danger', color: 'bg-red-100 text-red-800' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: 'text-red-600' },
  recovering: { label: '恢复中', color: 'text-yellow-600' },
  recovered: { label: '已恢复', color: 'text-green-600' },
};

const CATEGORY_COLORS: Record<string, string> = {
  '睡眠': 'bg-indigo-100 text-indigo-800',
  '饮食': 'bg-green-100 text-green-800',
  '情绪': 'bg-pink-100 text-pink-800',
  '学业': 'bg-blue-100 text-blue-800',
  '其他': 'bg-gray-100 text-gray-800',
};

const BODY_LAYOUT = [
  { part: '头部', col: 2, row: 1 },
  { part: '颈部', col: 2, row: 2 },
  { part: '左肩', col: 1, row: 3 }, { part: '右肩', col: 3, row: 3 },
  { part: '左上臂', col: 1, row: 4 }, { part: '右上臂', col: 3, row: 4 },
  { part: '左肘', col: 1, row: 5 }, { part: '右肘', col: 3, row: 5 },
  { part: '左前臂', col: 1, row: 6 }, { part: '右前臂', col: 3, row: 6 },
  { part: '左腕', col: 1, row: 7 }, { part: '右腕', col: 3, row: 7 },
  { part: '胸部', col: 2, row: 4 }, { part: '上背', col: 2, row: 5 },
  { part: '腹部', col: 2, row: 6 }, { part: '下背', col: 2, row: 7 },
  { part: '左髋', col: 1, row: 8 }, { part: '右髋', col: 3, row: 8 },
  { part: '左大腿', col: 1, row: 9 }, { part: '右大腿', col: 3, row: 9 },
  { part: '左膝', col: 1, row: 10 }, { part: '右膝', col: 3, row: 10 },
  { part: '左小腿', col: 1, row: 11 }, { part: '右小腿', col: 3, row: 11 },
  { part: '左踝', col: 1, row: 12 }, { part: '右踝', col: 3, row: 12 },
  { part: '左脚', col: 1, row: 13 }, { part: '右脚', col: 3, row: 13 },
];

const emptyInjury = (): Omit<InjuryRecord, 'id'> => ({
  studentId: 0, bodyPart: BODY_PARTS[0], severity: 'mild',
  description: '', status: 'active', occurredAt: dayjs().format('YYYY-MM-DD'), recoveredAt: '',
});

const emptyFeedback = (): Omit<ParentFeedback, 'id'> => ({
  studentId: 0, category: FEEDBACK_CATEGORIES[0], content: '', feedbackDate: dayjs().format('YYYY-MM-DD'),
});

export default function Injuries() {
  const { students, injuryRecords, sessionRecords, parentFeedback, addInjuryRecord, updateInjuryRecord, addParentFeedback } = useStore();
  const [tab, setTab] = useState(0);
  const [injuryStudentId, setInjuryStudentId] = useState<number>(0);
  const [feedbackStudentId, setFeedbackStudentId] = useState<number>(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [injuryForm, setInjuryForm] = useState(emptyInjury());
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedback());

  const studentMap = Object.fromEntries(students.map(s => [s.id!, s.name]));
  const studentInjuries = injuryRecords.filter(r => !injuryStudentId || r.studentId === injuryStudentId);
  const filteredInjuries = selectedPart ? studentInjuries.filter(r => r.bodyPart === selectedPart) : studentInjuries;
  const activeInjuries = new Map<string, string>();
  injuryRecords.filter(r => (!injuryStudentId || r.studentId === injuryStudentId) && r.status !== 'recovered')
    .forEach(r => activeInjuries.set(r.bodyPart, r.severity));

  const recentSessions = sessionRecords
    .filter(r => !injuryStudentId || r.studentId === injuryStudentId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const feedbackList = parentFeedback.filter(r => !feedbackStudentId || r.studentId === feedbackStudentId);

  const handleAddInjury = async () => {
    if (!injuryForm.studentId || !injuryForm.description) return;
    await addInjuryRecord(injuryForm);
    setShowInjuryModal(false);
    setInjuryForm(emptyInjury());
  };

  const handleAddFeedback = async () => {
    if (!feedbackForm.studentId || !feedbackForm.content) return;
    await addParentFeedback(feedbackForm);
    setShowFeedbackModal(false);
    setFeedbackForm(emptyFeedback());
  };

  const handleToggleRecover = async (rec: InjuryRecord) => {
    const recovered = rec.status !== 'recovered';
    await updateInjuryRecord(rec.id!, {
      status: recovered ? 'recovered' : 'active',
      recoveredAt: recovered ? dayjs().format('YYYY-MM-DD') : '',
    });
  };

  const partBtnClass = (part: string) => {
    const sev = activeInjuries.get(part);
    const isActive = selectedPart === part;
    if (sev === 'severe') return 'bg-red-500 text-white border-red-600';
    if (sev === 'moderate') return 'bg-orange-400 text-white border-orange-500';
    if (sev === 'mild') return 'bg-yellow-300 text-yellow-900 border-yellow-400';
    if (isActive) return 'bg-[var(--primary)] text-white border-[var(--primary-dark)]';
    return 'bg-gray-100 text-[var(--text-light)] border-gray-200 hover:bg-gray-200';
  };

  return (
    <div className="h-full flex flex-col p-6 gap-5 overflow-auto">
      <div className="flex items-center gap-3">
        <HeartPulse className="w-6 h-6 text-[var(--primary)]" />
        <h1 className="text-xl font-bold text-[var(--navy)]">伤病观察</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['伤痛记录', '家长反馈'].map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === i ? 'bg-white shadow text-[var(--primary)]' : 'text-[var(--text-light)] hover:text-[var(--text)]'}`}>
            {i === 0 ? <AlertTriangle className="w-4 h-4 inline mr-1.5" /> : <MessageCircle className="w-4 h-4 inline mr-1.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <div className="flex items-center gap-3">
            <select className="select-field w-48" value={injuryStudentId} onChange={e => { setInjuryStudentId(+e.target.value); setSelectedPart(null); }}>
              <option value={0}>全部学员</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => { setInjuryForm(f => ({ ...f, studentId: injuryStudentId })); setShowInjuryModal(true); }}>
              <Plus className="w-4 h-4" /> 添加记录
            </button>
            {selectedPart && (
              <button className="btn-secondary text-sm" onClick={() => setSelectedPart(null)}>
                清除筛选: {selectedPart}
              </button>
            )}
          </div>

          <div className="flex gap-5 flex-1 min-h-0">
            <div className="w-56 flex-shrink-0">
              <div className="card">
                <h3 className="section-title text-sm">身体部位图</h3>
                <div className="grid grid-cols-3 gap-1"
                  style={{ gridTemplateRows: `repeat(13, auto)` }}>
                  {BODY_LAYOUT.map(({ part, col, row }) => (
                    <button key={part}
                      className={`text-xs px-1.5 py-1 rounded border cursor-pointer transition-all ${partBtnClass(part)}`}
                      style={{ gridColumn: col, gridRow: row }}
                      onClick={() => setSelectedPart(selectedPart === part ? null : part)}>
                      {part}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-auto">
              <div className="flex-1 space-y-3">
                {filteredInjuries.length === 0 && <p className="text-[var(--text-light)] text-sm text-center py-8">暂无伤病记录</p>}
                {filteredInjuries.map(rec => (
                  <div key={rec.id} className="card flex items-start gap-3 py-3">
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_MAP[rec.severity].color}`}>
                      {SEVERITY_MAP[rec.severity].label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{rec.bodyPart}</span>
                        <span className={`text-xs font-medium ${STATUS_MAP[rec.status].color}`}>
                          {STATUS_MAP[rec.status].label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{dayjs(rec.occurredAt).format('MM/DD')}</span>
                      </div>
                      <p className="text-sm text-[var(--text-light)] truncate">{rec.description}</p>
                      {rec.status === 'recovered' && rec.recoveredAt && (
                        <p className="text-xs text-green-600 mt-1">恢复日期: {dayjs(rec.recoveredAt).format('YYYY-MM-DD')}</p>
                      )}
                    </div>
                    <button onClick={() => handleToggleRecover(rec)}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${rec.status === 'recovered' ? 'text-green-600 hover:bg-green-50' : 'text-[var(--text-muted)] hover:bg-gray-100'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="section-title text-sm">疲劳追踪 (RPE)</h3>
                {recentSessions.length === 0 ? (
                  <p className="text-[var(--text-light)] text-xs text-center py-4">暂无训练记录</p>
                ) : (
                  <div className="flex items-end gap-1.5 h-24">
                    {recentSessions.map(s => (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t"
                          style={{ height: `${s.fatigueScore}%`, backgroundColor: s.fatigueScore > 7 ? 'var(--danger)' : s.fatigueScore > 4 ? 'var(--warning)' : 'var(--success)' }}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">{dayjs(s.date).format('MM/DD')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 1 && (
        <>
          <div className="flex items-center gap-3">
            <select className="select-field w-48" value={feedbackStudentId} onChange={e => setFeedbackStudentId(+e.target.value)}>
              <option value={0}>全部学员</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => { setFeedbackForm(f => ({ ...f, studentId: feedbackStudentId })); setShowFeedbackModal(true); }}>
              <Plus className="w-4 h-4" /> 添加反馈
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {feedbackList.length === 0 && <p className="text-[var(--text-light)] text-sm text-center py-8">暂无家长反馈</p>}
            {feedbackList.map(fb => (
              <div key={fb.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{studentMap[fb.studentId] || '未知'}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[fb.category] || CATEGORY_COLORS['其他']}`}>
                    {fb.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">{dayjs(fb.feedbackDate).format('YYYY-MM-DD')}</span>
                </div>
                <p className="text-sm text-[var(--text-light)]">{fb.content}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {showInjuryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowInjuryModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--navy)]">添加伤病记录</h3>
              <button onClick={() => setShowInjuryModal(false)}><X className="w-5 h-5 text-[var(--text-muted)]" /></button>
            </div>
            <select className="select-field" value={injuryForm.studentId} onChange={e => setInjuryForm(f => ({ ...f, studentId: +e.target.value }))}>
              <option value={0}>选择学员</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="select-field" value={injuryForm.bodyPart} onChange={e => setInjuryForm(f => ({ ...f, bodyPart: e.target.value }))}>
              {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="select-field" value={injuryForm.severity} onChange={e => setInjuryForm(f => ({ ...f, severity: e.target.value as InjuryRecord['severity'] }))}>
              <option value="mild">轻度</option><option value="moderate">中度</option><option value="severe">重度</option>
            </select>
            <textarea className="input-field min-h-[60px]" placeholder="伤病描述" value={injuryForm.description}
              onChange={e => setInjuryForm(f => ({ ...f, description: e.target.value }))} />
            <input type="date" className="input-field" value={injuryForm.occurredAt}
              onChange={e => setInjuryForm(f => ({ ...f, occurredAt: e.target.value }))} />
            <select className="select-field" value={injuryForm.status} onChange={e => setInjuryForm(f => ({ ...f, status: e.target.value as InjuryRecord['status'] }))}>
              <option value="active">进行中</option><option value="recovering">恢复中</option><option value="recovered">已恢复</option>
            </select>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary text-sm" onClick={() => setShowInjuryModal(false)}>取消</button>
              <button className="btn-primary text-sm" onClick={handleAddInjury}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--navy)]">添加家长反馈</h3>
              <button onClick={() => setShowFeedbackModal(false)}><X className="w-5 h-5 text-[var(--text-muted)]" /></button>
            </div>
            <select className="select-field" value={feedbackForm.studentId} onChange={e => setFeedbackForm(f => ({ ...f, studentId: +e.target.value }))}>
              <option value={0}>选择学员</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="select-field" value={feedbackForm.category} onChange={e => setFeedbackForm(f => ({ ...f, category: e.target.value }))}>
              {FEEDBACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea className="input-field min-h-[80px]" placeholder="反馈内容" value={feedbackForm.content}
              onChange={e => setFeedbackForm(f => ({ ...f, content: e.target.value }))} />
            <input type="date" className="input-field" value={feedbackForm.feedbackDate}
              onChange={e => setFeedbackForm(f => ({ ...f, feedbackDate: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary text-sm" onClick={() => setShowFeedbackModal(false)}>取消</button>
              <button className="btn-primary text-sm" onClick={handleAddFeedback}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
