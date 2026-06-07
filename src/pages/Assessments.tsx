import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { TestResult, TEST_NAMES, TEST_UNITS } from '@/lib/types';
import { BarChart3, TrendingUp, Plus, Edit3, Trash2, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';

const THRESHOLDS: Record<string, { excellent: number; good: number; pass: number; lowerBetter?: boolean }> = {
  '50米跑': { excellent: 7.0, good: 8.0, pass: 9.0, lowerBetter: true },
  '立定跳远': { excellent: 220, good: 190, pass: 160 },
  '引体向上': { excellent: 12, good: 8, pass: 4 },
  '耐力跑': { excellent: 180, good: 240, pass: 300, lowerBetter: true },
  '仰卧起坐': { excellent: 45, good: 35, pass: 25 },
  '坐位体前屈': { excellent: 18, good: 12, pass: 6 },
  '握力': { excellent: 45, good: 35, pass: 25 },
  '纵跳': { excellent: 55, good: 42, pass: 30 },
};

function calcLevel(testName: string, score: number): string {
  const t = THRESHOLDS[testName];
  if (!t) return '及格';
  if (t.lowerBetter) {
    if (score <= t.excellent) return '优秀';
    if (score <= t.good) return '良好';
    if (score <= t.pass) return '及格';
    return '不及格';
  }
  if (score >= t.excellent) return '优秀';
  if (score >= t.good) return '良好';
  if (score >= t.pass) return '及格';
  return '不及格';
}

const LEVEL_BADGE: Record<string, string> = {
  '优秀': 'badge-warning',
  '良好': 'badge-info',
  '及格': 'badge-success',
  '不及格': 'badge-danger',
};

const LINE_COLORS = ['#FF6B35', '#1A365D', '#38A169', '#E53E3E', '#ECC94B', '#805AD5', '#DD6B20', '#319795'];

export default function Assessments() {
  const { students, groups, testResults, addTestResult, updateTestResult, deleteTestResult } = useStore();
  const [activeTab, setActiveTab] = useState<'entry' | 'compare'>('entry');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [testDate, setTestDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState<TestResult | null>(null);
  const [form, setForm] = useState({ testName: TEST_NAMES[0], score: 0, testDate: dayjs().format('YYYY-MM-DD') });
  const [compareStudentId, setCompareStudentId] = useState<number | ''>('');
  const [compareTestName, setCompareTestName] = useState(TEST_NAMES[0]);
  const [compareGroupId, setCompareGroupId] = useState<number | ''>('');

  const studentResults = useMemo(() => {
    if (!selectedStudentId) return [];
    return testResults.filter(r => r.studentId === Number(selectedStudentId)).sort((a, b) => a.testDate.localeCompare(b.testDate));
  }, [selectedStudentId, testResults]);

  const openAdd = () => {
    setEditingResult(null);
    setForm({ testName: TEST_NAMES[0], score: 0, testDate });
    setShowModal(true);
  };

  const openEdit = (r: TestResult) => {
    setEditingResult(r);
    setForm({ testName: r.testName, score: r.score, testDate: r.testDate });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const level = calcLevel(form.testName, form.score);
    const unit = TEST_UNITS[form.testName];
    if (editingResult?.id) {
      await updateTestResult(editingResult.id, { ...form, unit, level });
    } else {
      await addTestResult({ studentId: Number(selectedStudentId), ...form, unit, level });
    }
    setShowModal(false);
  };

  const lineData = useMemo(() => {
    if (!compareStudentId) return [];
    const results = testResults.filter(r => r.studentId === Number(compareStudentId)).sort((a, b) => a.testDate.localeCompare(b.testDate));
    const grouped: Record<string, { date: string; [key: string]: string | number }> = {};
    results.forEach(r => {
      if (!grouped[r.testDate]) grouped[r.testDate] = { date: r.testDate };
      grouped[r.testDate][r.testName] = r.score;
    });
    return Object.values(grouped);
  }, [compareStudentId, testResults]);

  const barData = useMemo(() => {
    if (!compareGroupId) return [];
    const groupStudentIds = students.filter(s => s.groupId === Number(compareGroupId)).map(s => s.id!);
    const results = testResults.filter(r => r.testName === compareTestName && groupStudentIds.includes(r.studentId));
    const latestPerStudent: Record<number, TestResult> = {};
    results.forEach(r => {
      if (!latestPerStudent[r.studentId] || r.testDate > latestPerStudent[r.studentId].testDate) {
        latestPerStudent[r.studentId] = r;
      }
    });
    return Object.values(latestPerStudent).map(r => {
      const student = students.find(s => s.id === r.studentId);
      return { name: student?.name ?? '', score: r.score };
    });
  }, [compareGroupId, compareTestName, students, testResults]);

  const levelSummary = useMemo(() => {
    if (!compareGroupId) return { excellent: 0, good: 0, pass: 0, fail: 0 };
    const groupStudentIds = students.filter(s => s.groupId === Number(compareGroupId)).map(s => s.id!);
    const results = testResults.filter(r => groupStudentIds.includes(r.studentId));
    const latestPerStudentTest: Record<string, TestResult> = {};
    results.forEach(r => {
      const key = `${r.studentId}-${r.testName}`;
      if (!latestPerStudentTest[key] || r.testDate > latestPerStudentTest[key].testDate) {
        latestPerStudentTest[key] = r;
      }
    });
    const counts = { excellent: 0, good: 0, pass: 0, fail: 0 };
    Object.values(latestPerStudentTest).forEach(r => {
      if (r.level === '优秀') counts.excellent++;
      else if (r.level === '良好') counts.good++;
      else if (r.level === '及格') counts.pass++;
      else counts.fail++;
    });
    return counts;
  }, [compareGroupId, students, testResults]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Award className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        <h1 className="section-title">测试评估</h1>
      </div>

      <div className="flex gap-2">
        <button className={activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('entry')}>
          <BarChart3 className="w-4 h-4" /> 成绩录入
        </button>
        <button className={activeTab === 'compare' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('compare')}>
          <TrendingUp className="w-4 h-4" /> 成绩对比
        </button>
      </div>

      {activeTab === 'entry' && (
        <div className="space-y-4">
          <div className="card p-4 flex gap-4 items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>选择学员</label>
              <select className="select-field" value={selectedStudentId} onChange={e => setSelectedStudentId(Number(e.target.value) || '')}>
                <option value="">-- 请选择 --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>测试日期</label>
              <input type="date" className="input-field" value={testDate} onChange={e => setTestDate(e.target.value)} />
            </div>
            {selectedStudentId && (
              <button className="btn-primary flex items-center gap-1" onClick={openAdd}>
                <Plus className="w-4 h-4" /> 添加成绩
              </button>
            )}
          </div>

          {selectedStudentId && studentResults.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--navy)' }} className="text-white">
                    <th className="p-3 text-left">测试项目</th>
                    <th className="p-3 text-left">成绩</th>
                    <th className="p-3 text-left">单位</th>
                    <th className="p-3 text-left">等级</th>
                    <th className="p-3 text-left">日期</th>
                    <th className="p-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map(r => (
                    <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-3">{r.testName}</td>
                      <td className="p-3">{r.score}</td>
                      <td className="p-3">{r.unit}</td>
                      <td className="p-3"><span className={LEVEL_BADGE[r.level] ?? 'badge-success'}>{r.level}</span></td>
                      <td className="p-3">{r.testDate}</td>
                      <td className="p-3 flex gap-2">
                        <button className="btn-secondary p-1" onClick={() => openEdit(r)}><Edit3 className="w-3 h-3" /></button>
                        <button className="btn-danger p-1" onClick={() => deleteTestResult(r.id!)}><Trash2 className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="card p-4 flex gap-4 items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>选择学员</label>
              <select className="select-field" value={compareStudentId} onChange={e => setCompareStudentId(Number(e.target.value) || '')}>
                <option value="">-- 请选择 --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>选择小组</label>
              <select className="select-field" value={compareGroupId} onChange={e => setCompareGroupId(Number(e.target.value) || '')}>
                <option value="">-- 请选择 --</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>测试项目</label>
              <select className="select-field" value={compareTestName} onChange={e => setCompareTestName(e.target.value)}>
                {TEST_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {compareStudentId && lineData.length > 0 && (
            <div className="card p-4">
              <h3 className="section-title mb-4">个人成绩趋势</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {TEST_NAMES.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {compareGroupId && barData.length > 0 && (
            <div className="card p-4">
              <h3 className="section-title mb-4">小组{compareTestName}对比</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {compareGroupId && (
            <div className="grid grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: '#ECC94B' }}>{levelSummary.excellent}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>优秀</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: '#4299E1' }}>{levelSummary.good}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>良好</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: '#38A169' }}>{levelSummary.pass}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>及格</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: '#E53E3E' }}>{levelSummary.fail}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>不及格</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="section-title">{editingResult ? '编辑成绩' : '添加成绩'}</h3>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>测试项目</label>
              <select className="select-field" value={form.testName} onChange={e => setForm({ ...form, testName: e.target.value })} disabled={!!editingResult}>
                {TEST_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>成绩</label>
              <input type="number" className="input-field" value={form.score} onChange={e => setForm({ ...form, score: Number(e.target.value) })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>单位</label>
              <input className="input-field" value={TEST_UNITS[form.testName]} disabled />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm" style={{ color: 'var(--text)' }}>测试日期</label>
              <input type="date" className="input-field" value={form.testDate} onChange={e => setForm({ ...form, testDate: e.target.value })} />
            </div>
            {form.score > 0 && (
              <div className="text-sm" style={{ color: 'var(--text)' }}>
                预估等级: <span className={LEVEL_BADGE[calcLevel(form.testName, form.score)]}>{calcLevel(form.testName, form.score)}</span>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSubmit}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
