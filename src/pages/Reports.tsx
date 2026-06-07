import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { exportAllData, importAllData, db } from '@/lib/db';
import { FileText, TrendingUp, Database, Download, Upload, Plus, Calendar, AlertTriangle, Trash2, CheckCircle, Eye, Video } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';

const tabs = [
  { key: 'generate', label: '周报生成', icon: FileText },
  { key: 'trends', label: '历史趋势', icon: TrendingUp },
  { key: 'backup', label: '数据备份', icon: Database },
];

function buildExportText(r: any, students: any[], groups: any[]) {
  const groupName = r.groupId ? groups.find((g: any) => g.id === r.groupId)?.name : '全部';
  let text = `智慧体育训练周报\n${'='.repeat(40)}\n`;
  text += `时间范围: ${r.weekStart} ~ ${r.weekEnd}\n训练组: ${groupName}\n生成时间: ${r.generatedAt}\n\n`;
  text += `【出勤统计】\n  出勤: ${r.attendance.present}  缺勤: ${r.attendance.absent}  请假: ${r.attendance.leave}  出勤率: ${r.attendance.rate}%\n\n`;
  text += `【训练记录】\n  训练次数: ${r.training.sessionCount}  人均: ${r.training.avgSessionsPerStudent}  平均RPE: ${r.training.avgFatigue}\n\n`;
  if (r.tests?.length > 0) {
    text += `【测试成绩】\n`;
    r.tests.forEach((t: any) => { text += `  ${students.find((s: any) => s.id === t.studentId)?.name || '未知'} - ${t.testName}: ${t.score}${t.unit} (${t.level})\n`; });
  } else {
    text += `【测试成绩】\n  暂无记录\n`;
  }
  text += '\n';
  if (r.injuries?.length > 0) {
    text += `【伤病观察】\n`;
    r.injuries.forEach((i: any) => { text += `  ${students.find((s: any) => s.id === i.studentId)?.name || '未知'} - ${i.bodyPart}: ${i.description} (${i.severity})\n`; });
  } else {
    text += `【伤病观察】\n  暂无记录\n`;
  }
  text += '\n';
  if (r.feedback?.length > 0) {
    text += `【家长反馈】\n`;
    r.feedback.forEach((f: any) => { text += `  ${students.find((s: any) => s.id === f.studentId)?.name || '未知'} [${f.category}]: ${f.content}\n`; });
  } else {
    text += `【家长反馈】\n  暂无记录\n`;
  }
  text += '\n';
  if (r.videoComments?.length > 0) {
    text += `【视频点评摘要】\n`;
    r.videoComments.forEach((c: any) => {
      const studentName = students.find((s: any) => s.id === c.studentId)?.name || '未知';
      text += `  ${studentName} - ${c.videoFilename || '未知视频'} [${c.timestamp != null ? formatVideoTimestamp(c.timestamp) : ''}]: ${c.content}\n`;
    });
  } else {
    text += `【视频点评摘要】\n  暂无记录\n`;
  }
  text += '\n';
  return { text, groupName };
}

function formatVideoTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('generate');
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week').format('YYYY-MM-DD'));
  const [weekEnd, setWeekEnd] = useState(dayjs().endOf('week').format('YYYY-MM-DD'));
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [trendStudent, setTrendStudent] = useState<number | ''>('');
  const [trendPeriod, setTrendPeriod] = useState(8);
  const [backupMsg, setBackupMsg] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('lastBackup') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [historyReport, setHistoryReport] = useState<any>(null);

  const students = useStore(s => s.students);
  const groups = useStore(s => s.groups);
  const attendance = useStore(s => s.attendance);
  const sessionRecords = useStore(s => s.sessionRecords);
  const testResults = useStore(s => s.testResults);
  const injuryRecords = useStore(s => s.injuryRecords);
  const parentFeedback = useStore(s => s.parentFeedback);
  const weeklyReports = useStore(s => s.weeklyReports);
  const addWeeklyReport = useStore(s => s.addWeeklyReport);
  const videoAnnotations = useStore(s => s.videoAnnotations);
  const coachComments = useStore(s => s.coachComments);
  const reloadAll = useStore(s => s.reloadAll);

  const generateReport = () => {
    const start = dayjs(weekStart);
    const end = dayjs(weekEnd);
    const groupStudents = selectedGroup ? students.filter(s => s.groupId === selectedGroup) : students;
    const periodAttendance = attendance.filter(a => dayjs(a.date).isAfter(start.subtract(1, 'day')) && dayjs(a.date).isBefore(end.add(1, 'day')) && groupStudents.some(s => s.id === a.studentId));
    const present = periodAttendance.filter(a => a.status === 'present').length;
    const absent = periodAttendance.filter(a => a.status === 'absent').length;
    const leave = periodAttendance.filter(a => a.status === 'leave').length;
    const total = periodAttendance.length || 1;
    const periodSessions = sessionRecords.filter(s => dayjs(s.date).isAfter(start.subtract(1, 'day')) && dayjs(s.date).isBefore(end.add(1, 'day')) && groupStudents.some(gs => gs.id === s.studentId));
    const avgFatigue = periodSessions.length ? (periodSessions.reduce((sum, s) => sum + s.fatigueScore, 0) / periodSessions.length).toFixed(1) : '0';
    const periodTests = testResults.filter(t => dayjs(t.testDate).isAfter(start.subtract(1, 'day')) && dayjs(t.testDate).isBefore(end.add(1, 'day')) && groupStudents.some(s => s.id === t.studentId));
    const activeInjuries = injuryRecords.filter(i => i.status !== 'recovered' && groupStudents.some(s => s.id === i.studentId));
    const periodFeedback = parentFeedback.filter(f => dayjs(f.feedbackDate).isAfter(start.subtract(1, 'day')) && dayjs(f.feedbackDate).isBefore(end.add(1, 'day')) && groupStudents.some(s => s.id === f.studentId));
    const groupStudentIds = new Set(groupStudents.map(s => s.id));
    const groupVideoAnnotations = videoAnnotations.filter(va => groupStudentIds.has(va.studentId) && dayjs(va.recordDate).isAfter(start.subtract(1, 'day')) && dayjs(va.recordDate).isBefore(end.add(1, 'day')));
    const groupVideoIds = new Set(groupVideoAnnotations.map(va => va.id!));
    const periodVideoComments = coachComments.filter(cc => groupVideoIds.has(cc.videoId)).map(cc => {
      const va = groupVideoAnnotations.find(v => v.id === cc.videoId);
      return {
        ...cc,
        studentId: va?.studentId,
        videoFilename: va?.videoPath?.split('/').pop() || va?.videoPath || '未知视频',
      };
    });
    const report = {
      weekStart, weekEnd, groupId: selectedGroup || null,
      attendance: { total, present, absent, leave, rate: ((present / total) * 100).toFixed(1) },
      training: { sessionCount: periodSessions.length, avgSessionsPerStudent: groupStudents.length ? (periodSessions.length / groupStudents.length).toFixed(1) : '0', avgFatigue, details: periodSessions.slice(0, 10) },
      tests: periodTests, injuries: activeInjuries, feedback: periodFeedback,
      videoComments: periodVideoComments,
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    };
    setPreviewReport(report);
  };

  const saveReport = async () => {
    if (!previewReport) return;
    const content = JSON.stringify(previewReport);
    await addWeeklyReport({ groupId: previewReport.groupId, weekStart: previewReport.weekStart, weekEnd: previewReport.weekEnd, content, generatedAt: previewReport.generatedAt });
    setBackupMsg('周报已保存！');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const exportReportFile = () => {
    if (!previewReport) return;
    const { text, groupName } = buildExportText(previewReport, students, groups);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `周报_${previewReport.weekStart}_${groupName}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportHistoryReportFile = (reportData: any) => {
    const { text, groupName } = buildExportText(reportData, students, groups);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `周报_${reportData.weekStart}_${groupName}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const viewHistoryReport = (report: typeof weeklyReports[0]) => {
    try { setHistoryReport(JSON.parse(report.content)); } catch { setHistoryReport(null); }
  };

  const getTrendData = () => {
    const student = students.find(s => s.id === trendStudent);
    if (!student) return { attendance: [], fatigue: [], tests: [], testNames: [] };
    const endDate = dayjs();
    const startDate = endDate.subtract(trendPeriod, 'week');
    const weeks: string[] = [];
    for (let i = 0; i < trendPeriod; i++) weeks.push(startDate.add(i, 'week').format('MM/DD'));
    const studentAttendance = attendance.filter(a => a.studentId === trendStudent && dayjs(a.date).isAfter(startDate.subtract(1, 'day')));
    const attendanceData = weeks.map((w, i) => { const wStart = startDate.add(i, 'week'); const wEnd = wStart.add(6, 'day'); const wa = studentAttendance.filter(a => dayjs(a.date).isAfter(wStart.subtract(1, 'day')) && dayjs(a.date).isBefore(wEnd.add(1, 'day'))); return { week: w, 出勤: wa.filter(a => a.status === 'present').length, 缺勤: wa.filter(a => a.status === 'absent').length }; });
    const studentSessions = sessionRecords.filter(s => s.studentId === trendStudent && dayjs(s.date).isAfter(startDate.subtract(1, 'day')));
    const fatigueData = studentSessions.map(s => ({ date: dayjs(s.date).format('MM/DD'), RPE: s.fatigueScore }));
    const studentTests = testResults.filter(t => t.studentId === trendStudent && dayjs(t.testDate).isAfter(startDate.subtract(1, 'day')));
    const testNames = [...new Set(studentTests.map(t => t.testName))];
    const testData = studentTests.map(t => ({ date: dayjs(t.testDate).format('MM/DD'), [t.testName]: t.score }));
    return { attendance: attendanceData, fatigue: fatigueData, tests: testData, testNames };
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `smart-training-backup-${dayjs().format('YYYYMMDD')}.json`; a.click();
    URL.revokeObjectURL(url);
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    localStorage.setItem('lastBackup', now);
    setLastBackup(now);
    setBackupMsg('导出成功！');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        await importAllData(data);
        await reloadAll();
        setBackupMsg('导入成功！数据已刷新。');
      } catch { setBackupMsg('导入失败，文件格式错误。'); }
      setTimeout(() => setBackupMsg(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = async () => {
    const tables = ['groups', 'students', 'attendance', 'planTemplates', 'trainingPlans', 'exerciseItems', 'sessionRecords', 'setRecords', 'testResults', 'videoAnnotations', 'keyFrames', 'coachComments', 'injuryRecords', 'parentFeedback', 'weeklyReports', 'weeklySchedules'];
    for (const t of tables) {
      await (db as any)[t]?.clear?.();
    }
    await reloadAll();
    setShowClearConfirm(false);
    setBackupMsg('数据已清空！列表已刷新。');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const trendData = getTrendData();

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>周报导出</h1>
        <div className="flex gap-2 mt-4 border-b border-[var(--border)] pb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-light)] hover:text-[var(--text)]'}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'generate' && (
          <div className="space-y-4 max-w-5xl">
            <div className="card p-4 flex flex-wrap gap-4 items-end">
              <div><label className="text-xs text-[var(--text-light)]">开始日期</label><input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="input-field mt-1" /></div>
              <div><label className="text-xs text-[var(--text-light)]">结束日期</label><input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} className="input-field mt-1" /></div>
              <div><label className="text-xs text-[var(--text-light)]">训练组</label><select value={selectedGroup} onChange={e => setSelectedGroup(Number(e.target.value) || '')} className="select-field mt-1"><option value="">全部</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <button onClick={generateReport} className="btn-primary flex items-center gap-2"><Plus size={16} />生成周报</button>
            </div>

            {previewReport && (
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="section-title flex items-center gap-2 mb-0"><Calendar size={18} />周报预览 ({previewReport.weekStart} ~ {previewReport.weekEnd})</h3>
                  <div className="flex gap-2">
                    <button onClick={saveReport} className="btn-primary text-sm flex items-center gap-1"><CheckCircle size={14} />保存周报</button>
                    <button onClick={exportReportFile} className="btn-secondary text-sm flex items-center gap-1"><Download size={14} />导出文件</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[var(--bg)] rounded-lg p-3 text-center"><div className="text-2xl font-bold text-[var(--primary)]">{previewReport.attendance.present}</div><div className="text-xs text-[var(--text-light)]">出勤</div></div>
                  <div className="bg-[var(--bg)] rounded-lg p-3 text-center"><div className="text-2xl font-bold text-[var(--danger)]">{previewReport.attendance.absent}</div><div className="text-xs text-[var(--text-light)]">缺勤</div></div>
                  <div className="bg-[var(--bg)] rounded-lg p-3 text-center"><div className="text-2xl font-bold text-[var(--warning)]">{previewReport.attendance.leave}</div><div className="text-xs text-[var(--text-light)]">请假</div></div>
                  <div className="bg-[var(--bg)] rounded-lg p-3 text-center"><div className="text-2xl font-bold text-[var(--success)]">{previewReport.attendance.rate}%</div><div className="text-xs text-[var(--text-light)]">出勤率</div></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)]">训练完成度</div><div className="text-xs text-[var(--text-light)] mt-1">训练次数: {previewReport.training.sessionCount} | 人均: {previewReport.training.avgSessionsPerStudent} | 平均RPE: {previewReport.training.avgFatigue}</div></div>
                  <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)]">伤病情况</div><div className="text-xs text-[var(--text-light)] mt-1">活跃伤病: {previewReport.injuries.length} 条</div></div>
                </div>
                {previewReport.tests.length > 0 && <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)] mb-1">测试成绩 ({previewReport.tests.length}条)</div>{previewReport.tests.slice(0, 8).map((t: any, i: number) => <div key={i} className="text-xs text-[var(--text-light)]">{students.find(s => s.id === t.studentId)?.name} - {t.testName}: {t.score}{t.unit} <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${t.level === '优秀' ? 'bg-yellow-100 text-yellow-700' : t.level === '良好' ? 'bg-blue-100 text-blue-700' : t.level === '及格' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.level}</span></div>)}</div>}
                {previewReport.tests.length === 0 && <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)]">测试成绩</div><div className="text-xs text-[var(--text-light)] mt-1">暂无记录</div></div>}
                {previewReport.injuries.length > 0 && <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)] mb-1">伤病观察 ({previewReport.injuries.length}条)</div>{previewReport.injuries.slice(0, 6).map((inj: any, i: number) => <div key={i} className="text-xs text-[var(--text-light)]">{students.find(s => s.id === inj.studentId)?.name} - {inj.bodyPart}: {inj.description} ({inj.severity})</div>)}</div>}
                {previewReport.injuries.length === 0 && <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)]">伤病观察</div><div className="text-xs text-[var(--text-light)] mt-1">暂无记录</div></div>}
                {previewReport.feedback.length > 0 && <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)] mb-1">家长反馈 ({previewReport.feedback.length}条)</div>{previewReport.feedback.slice(0, 6).map((f: any, i: number) => <div key={i} className="text-xs text-[var(--text-light)]">{students.find(s => s.id === f.studentId)?.name} [{f.category}]: {f.content?.slice(0, 60)}</div>)}</div>}
                {previewReport.feedback.length === 0 && <div className="bg-[var(--bg)] rounded-lg p-3"><div className="text-sm font-medium text-[var(--navy)]">家长反馈</div><div className="text-xs text-[var(--text-light)] mt-1">暂无记录</div></div>}
                <div className="bg-[var(--bg)] rounded-lg p-3">
                  <div className="text-sm font-medium text-[var(--navy)] flex items-center gap-1"><Video size={14} />视频点评摘要 ({previewReport.videoComments?.length ?? 0}条)</div>
                  {previewReport.videoComments?.length > 0 ? (
                    <div className="mt-1">{previewReport.videoComments.slice(0, 6).map((c: any, i: number) => <div key={i} className="text-xs text-[var(--text-light)]">{students.find(s => s.id === c.studentId)?.name || '未知'} - {c.videoFilename} [{formatVideoTimestamp(c.timestamp)}]: {c.content?.slice(0, 80)}</div>)}</div>
                  ) : (
                    <div className="text-xs text-[var(--text-light)] mt-1">暂无记录</div>
                  )}
                </div>
                <div className="text-xs text-[var(--text-light)]">生成时间: {previewReport.generatedAt}</div>
              </div>
            )}

            {weeklyReports.length > 0 && (
              <div className="card p-4">
                <h3 className="section-title">历史周报 ({weeklyReports.length})</h3>
                <div className="space-y-2">
                  {weeklyReports.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).map(r => {
                    const gName = r.groupId ? groups.find(g => g.id === r.groupId)?.name : '全部';
                    return (
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                        <div><span className="text-sm font-medium">{r.weekStart} ~ {r.weekEnd}</span> <span className="text-xs text-[var(--text-light)]">| {gName} | {r.generatedAt}</span></div>
                        <div className="flex gap-3">
                          <button className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1" onClick={() => viewHistoryReport(r)}><Eye size={12} /> 查看</button>
                          <button className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1" onClick={() => { const data = JSON.parse(r.content); exportHistoryReportFile(data); }}><Download size={12} /> 导出</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {historyReport && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setHistoryReport(null)}>
                <div className="bg-white rounded-xl p-6 w-[680px] max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>周报详情 ({historyReport.weekStart} ~ {historyReport.weekEnd})</h3><button onClick={() => setHistoryReport(null)} className="text-[var(--text-light)] hover:text-[var(--text)]">✕</button></div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-[var(--bg)] rounded p-2 text-center"><div className="text-lg font-bold text-[var(--primary)]">{historyReport.attendance?.present}</div><div className="text-[10px] text-[var(--text-light)]">出勤</div></div>
                    <div className="bg-[var(--bg)] rounded p-2 text-center"><div className="text-lg font-bold text-[var(--danger)]">{historyReport.attendance?.absent}</div><div className="text-[10px] text-[var(--text-light)]">缺勤</div></div>
                    <div className="bg-[var(--bg)] rounded p-2 text-center"><div className="text-lg font-bold text-[var(--warning)]">{historyReport.attendance?.leave}</div><div className="text-[10px] text-[var(--text-light)]">请假</div></div>
                    <div className="bg-[var(--bg)] rounded p-2 text-center"><div className="text-lg font-bold text-[var(--success)]">{historyReport.attendance?.rate}%</div><div className="text-[10px] text-[var(--text-light)]">出勤率</div></div>
                  </div>
                  <div className="text-xs text-[var(--text-light)] space-y-1">
                    <div>训练次数: {historyReport.training?.sessionCount} | 人均: {historyReport.training?.avgSessionsPerStudent} | 平均RPE: {historyReport.training?.avgFatigue}</div>
                    <div>活跃伤病: {historyReport.injuries?.length ?? 0} 条 | 测试: {historyReport.tests?.length ?? 0} 条 | 反馈: {historyReport.feedback?.length ?? 0} 条</div>
                    {historyReport.videoComments?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-[var(--navy)] flex items-center gap-1"><Video size={14} />视频点评摘要 ({historyReport.videoComments.length}条)</div>
                        <div className="mt-1">{historyReport.videoComments.slice(0, 8).map((c: any, i: number) => <div key={i} className="text-xs text-[var(--text-light)]">{students.find(s => s.id === c.studentId)?.name || '未知'} - {c.videoFilename || '未知视频'} [{c.timestamp != null ? formatVideoTimestamp(c.timestamp) : ''}]: {c.content}</div>)}</div>
                      </div>
                    )}
                    <div>生成时间: {historyReport.generatedAt}</div>
                  </div>
                </div>
              </div>
            )}

            {backupMsg && <div className="card p-3 text-center text-sm font-medium text-[var(--success)] flex items-center justify-center gap-2"><CheckCircle size={16} />{backupMsg}</div>}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4 max-w-5xl">
            <div className="card p-4 flex flex-wrap gap-4 items-end">
              <div><label className="text-xs text-[var(--text-light)]">学员</label><select value={trendStudent} onChange={e => setTrendStudent(Number(e.target.value) || '')} className="select-field mt-1"><option value="">选择学员</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="text-xs text-[var(--text-light)]">时间范围</label><select value={trendPeriod} onChange={e => setTrendPeriod(Number(e.target.value))} className="select-field mt-1"><option value={4}>最近4周</option><option value={8}>最近8周</option><option value={12}>最近12周</option></select></div>
            </div>
            {trendStudent && (
              <div className="space-y-4">
                <div className="card p-4"><h4 className="text-sm font-medium text-[var(--navy)] mb-3">出勤趋势</h4><ResponsiveContainer width="100%" height={220}><BarChart data={trendData.attendance}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="week" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="出勤" fill="var(--success)" /><Bar dataKey="缺勤" fill="var(--danger)" /></BarChart></ResponsiveContainer></div>
                <div className="card p-4"><h4 className="text-sm font-medium text-[var(--navy)] mb-3">疲劳趋势 (RPE)</h4><ResponsiveContainer width="100%" height={220}><LineChart data={trendData.fatigue}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} domain={[0, 10]} /><Tooltip /><Legend /><Line type="monotone" dataKey="RPE" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
                {trendData.testNames && trendData.testNames.length > 0 && <div className="card p-4"><h4 className="text-sm font-medium text-[var(--navy)] mb-3">测试成绩趋势</h4><ResponsiveContainer width="100%" height={220}><LineChart data={trendData.tests}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />{trendData.testNames.map((name: string, i: number) => <Line key={name} type="monotone" dataKey={name} stroke={['var(--primary)', 'var(--navy)', 'var(--success)'][i % 3]} strokeWidth={2} dot={{ r: 3 }} />)}</LineChart></ResponsiveContainer></div>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-4 max-w-md">
            <div className="card p-6 space-y-4">
              <button onClick={handleExport} className="btn-primary flex items-center gap-2 w-full justify-center py-3"><Download size={18} />导出数据</button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2 w-full justify-center py-3"><Upload size={18} />导入数据</button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              <button onClick={() => setShowClearConfirm(true)} className="w-full py-3 rounded-lg border border-[var(--danger)] text-[var(--danger)] flex items-center gap-2 justify-center hover:bg-red-50 transition-colors"><Trash2 size={18} />清空数据</button>
            </div>
            {backupMsg && <div className={`card p-3 text-center text-sm font-medium ${backupMsg.includes('失败') ? 'text-[var(--danger)]' : 'text-[var(--success)]'} flex items-center justify-center gap-2`}><CheckCircle size={16} />{backupMsg}</div>}
            {lastBackup && <div className="text-xs text-[var(--text-light)] text-center">上次备份: {lastBackup}</div>}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm mx-4 space-y-4">
                  <div className="flex items-center gap-2 text-[var(--danger)]"><AlertTriangle size={20} /><span className="font-medium">确认清空所有数据？</span></div>
                  <p className="text-sm text-[var(--text-light)]">此操作不可撤销，建议先导出备份。</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowClearConfirm(false)} className="btn-secondary flex-1">取消</button>
                    <button onClick={handleClear} className="flex-1 py-2 rounded-lg bg-[var(--danger)] text-white font-medium hover:opacity-90">确认清空</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
