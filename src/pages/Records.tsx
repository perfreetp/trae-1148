import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import type { ExerciseItem } from '@/lib/types';
import { Timer, Heart, Activity, Play, Pause, RotateCcw, Plus, Save, Minus, Calendar, Clock } from 'lucide-react';
import dayjs from 'dayjs';

export default function Records() {
  const { students, groups, trainingPlans, exerciseItems, sessionRecords, weeklySchedules, addSessionRecord, updateSessionRecord, addSetRecord } = useStore();
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [selectedPlan, setSelectedPlan] = useState<number | ''>('');
  const [recordDate, setRecordDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<number>(0);

  const [setGrid, setSetGrid] = useState<Record<number, { weight: string; reps: string; done: boolean }[]>>({});
  const [timerMs, setTimerMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [counter, setCounter] = useState(0);
  const [restSec, setRestSec] = useState(60);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [heartRate, setHeartRate] = useState('');
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');

  const plan = trainingPlans.find(p => p.id === selectedPlan);
  const planExercises: ExerciseItem[] = plan ? exerciseItems.filter(e => e.planId === plan.id) : [];

  const todayStr = dayjs().format('YYYY-MM-DD');
  const todaySchedules = weeklySchedules.filter(s => s.date === todayStr);

  const handleStartFromSchedule = (groupId: number, planId: number, date: string) => {
    const groupStudents = students.filter(s => s.groupId === groupId);
    if (groupStudents.length === 1) {
      setSelectedStudent(groupStudents[0].id!);
    }
    setSelectedPlan(planId);
    setRecordDate(date);
  };

  useEffect(() => {
    if (timerRunning) {
      const start = Date.now() - timerMs;
      timerRef.current = setInterval(() => setTimerMs(Date.now() - start), 50);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => {
    if (restRunning && restRemaining > 0) {
      restRef.current = setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) { setRestRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (restRef.current) {
      clearInterval(restRef.current);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restRunning, restRemaining > 0]);

  const handleStart = useCallback(async () => {
    if (!selectedStudent || !selectedPlan) return;
    const newId = await addSessionRecord({
      studentId: selectedStudent as number,
      planId: selectedPlan as number,
      date: recordDate,
      fatigueScore: rpe,
      heartRate: 0,
      note: '',
    });
    setSessionId(newId);
    const grid: Record<number, { weight: string; reps: string; done: boolean }[]> = {};
    planExercises.forEach((ex) => {
      if (ex.id) grid[ex.id] = Array.from({ length: ex.sets || 5 }, () => ({ weight: '', reps: '', done: false }));
    });
    setSetGrid(grid);
    setStarted(true);
  }, [selectedStudent, selectedPlan, recordDate, planExercises, addSessionRecord, rpe]);

  const updateCell = (exId: number, setIdx: number, field: 'weight' | 'reps' | 'done', value: string | boolean) => {
    setSetGrid(prev => {
      const rows = [...(prev[exId] || [])];
      rows[setIdx] = { ...rows[setIdx], [field]: value };
      return { ...prev, [exId]: rows };
    });
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalCells = planExercises.reduce((acc, ex) => acc + (setGrid[ex.id!]?.length || 0), 0);
  const doneCells = Object.values(setGrid).reduce((acc, rows) => acc + rows.filter(r => r.done).length, 0);
  const completionPct = totalCells > 0 ? Math.round((doneCells / totalCells) * 100) : 0;

  const rpeColor = rpe <= 3 ? 'var(--success)' : rpe <= 6 ? 'var(--warning)' : rpe <= 8 ? '#DD6B20' : 'var(--danger)';
  const hrColor = heartRate && (Number(heartRate) > 180 || Number(heartRate) < 40) ? 'var(--danger)' : 'inherit';

  const handleSave = async () => {
    await updateSessionRecord(sessionId, {
      heartRate: Number(heartRate) || 0,
      fatigueScore: rpe,
      note: notes,
    });
    for (const [exIdStr, rows] of Object.entries(setGrid)) {
      const exId = Number(exIdStr);
      rows.forEach((row, setIdx) => {
        addSetRecord({
          sessionId,
          exerciseId: exId,
          setNumber: setIdx + 1,
          actualWeight: Number(row.weight) || 0,
          actualReps: Number(row.reps) || 0,
          completed: row.done,
        });
      });
    }
    setStarted(false);
    setSetGrid({});
    setHeartRate('');
    setRpe(5);
    setNotes('');
    setTimerMs(0);
    setTimerRunning(false);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>现场记录</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 max-w-4xl">
        {todaySchedules.length > 0 && !started && (
          <div className="card p-4 space-y-3">
            <h3 className="section-title flex items-center gap-2"><Calendar size={18} /> 今日排课</h3>
            <div className="space-y-2">
              {todaySchedules.map(schedule => {
                const group = groups.find(g => g.id === schedule.groupId);
                const schedPlan = trainingPlans.find(p => p.id === schedule.planId);
                const schedExercises = exerciseItems.filter(e => e.planId === schedule.planId);
                return (
                  <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary, var(--bg))', border: '1px solid var(--border)' }}>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: group?.color || 'var(--navy)' }}>{group?.name || '未知分组'}</span>
                        <span className="text-sm" style={{ color: 'var(--text)' }}>{schedPlan?.name || '未知计划'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary, var(--text))' }}>
                        {schedPlan?.duration != null && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {schedPlan.duration}分钟</span>
                        )}
                        <span>{schedExercises.length}个动作</span>
                        {schedule.notes && <span className="truncate max-w-[200px]" title={schedule.notes}>{schedule.notes}</span>}
                      </div>
                    </div>
                    <button
                      className="btn-primary flex items-center gap-1 text-sm whitespace-nowrap"
                      onClick={() => handleStartFromSchedule(schedule.groupId, schedule.planId, schedule.date)}
                    >
                      <Play size={14} /> 从排课开始
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs" style={{ color: 'var(--text)' }}>学员</label>
              <select className="select-field" value={selectedStudent} onChange={e => setSelectedStudent(Number(e.target.value) || '')}>
                <option value="">选择学员</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs" style={{ color: 'var(--text)' }}>训练计划</label>
              <select className="select-field" value={selectedPlan} onChange={e => setSelectedPlan(Number(e.target.value) || '')}>
                <option value="">选择计划</option>
                {trainingPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="min-w-[130px]">
              <label className="text-xs" style={{ color: 'var(--text)' }}>日期</label>
              <input type="date" className="input-field" value={recordDate} onChange={e => setRecordDate(e.target.value)} />
            </div>
            <button className="btn-primary flex items-center gap-1" onClick={handleStart} disabled={!selectedStudent || !selectedPlan || started}>
              <Activity size={16} /> {started ? '记录中...' : '开始记录'}
            </button>
          </div>
        </div>

        {started && (
          <>
            <div className="card p-4 space-y-3">
              <h3 className="section-title">组数重量记录</h3>
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--border)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${completionPct}%`, background: 'var(--primary)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text)' }}>完成度: {completionPct}%</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--navy)', color: '#fff' }}>
                      <th className="p-2 text-left">动作</th>
                      {planExercises.length > 0 && planExercises[0] && Array.from({ length: setGrid[planExercises[0].id!]?.length || 5 }, (_, n) => (
                        <th key={n} className="p-2 text-center">第{n + 1}组</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planExercises.map((ex) => (
                      <tr key={ex.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="p-2 font-medium" style={{ color: 'var(--text)' }}>{ex.name}</td>
                        {(setGrid[ex.id!] || []).map((_, si) => (
                          <td key={si} className="p-1 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <input type="number" placeholder="kg" className="input-field w-14 text-center text-xs p-1"
                                value={setGrid[ex.id!]?.[si]?.weight ?? ''} onChange={e => updateCell(ex.id!, si, 'weight', e.target.value)} />
                              <input type="number" placeholder="次" className="input-field w-14 text-center text-xs p-1"
                                value={setGrid[ex.id!]?.[si]?.reps ?? ''} onChange={e => updateCell(ex.id!, si, 'reps', e.target.value)} />
                              <input type="checkbox" checked={setGrid[ex.id!]?.[si]?.done ?? false}
                                onChange={e => updateCell(ex.id!, si, 'done', e.target.checked)}
                                className="accent-[var(--primary)]" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-4 space-y-4">
              <h3 className="section-title flex items-center gap-2"><Timer size={18} /> 计时计数器</h3>
              <div className="text-center">
                <p className="font-mono text-5xl font-bold" style={{ color: 'var(--navy)' }}>{formatTime(timerMs)}</p>
                <div className="flex justify-center gap-3 mt-3">
                  <button className="btn-primary" onClick={() => setTimerRunning(true)}><Play size={16} /> 开始</button>
                  <button className="btn-secondary" onClick={() => setTimerRunning(false)}><Pause size={16} /> 暂停</button>
                  <button className="btn-secondary" onClick={() => { setTimerRunning(false); setTimerMs(0); }}><RotateCcw size={16} /> 重置</button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button className="btn-secondary p-2" onClick={() => setCounter(c => c - 1)}><Minus size={20} /></button>
                <span className="font-mono text-4xl font-bold" style={{ color: 'var(--navy)' }}>{counter}</span>
                <button className="btn-secondary p-2" onClick={() => setCounter(c => c + 1)}><Plus size={20} /></button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>间歇倒计时 (秒)</label>
                <div className="flex items-center gap-3">
                  <input type="number" className="input-field w-24" value={restSec} onChange={e => setRestSec(Number(e.target.value))} min={1} />
                  <button className="btn-primary" onClick={() => { setRestRemaining(restSec); setRestRunning(true); }} disabled={restRunning}>开始倒计时</button>
                  {restRunning && <span className="font-mono text-xl font-bold" style={{ color: 'var(--primary)' }}>{restRemaining}s</span>}
                </div>
                {restSec > 0 && (
                  <div className="w-full h-3 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-3 rounded-full transition-all" style={{ width: `${(restRemaining / restSec) * 100}%`, background: 'var(--primary)' }} />
                  </div>
                )}
              </div>
            </div>

            <div className="card p-4 space-y-4">
              <h3 className="section-title flex items-center gap-2"><Heart size={18} /> 心率与疲劳</h3>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>心率 (bpm)</label>
                <input type="number" className="input-field w-32" value={heartRate} onChange={e => setHeartRate(e.target.value)}
                  style={{ borderColor: hrColor, color: hrColor }} />
                {heartRate && (Number(heartRate) > 180 || Number(heartRate) < 40) && (
                  <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>心率异常!</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>疲劳度 RPE: {rpe}</label>
                <input type="range" min={1} max={10} value={rpe} onChange={e => setRpe(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]" />
                <div className="flex h-3 rounded-full overflow-hidden mt-1">
                  <div style={{ width: '30%', background: 'var(--success)' }} />
                  <div style={{ width: '30%', background: 'var(--warning)' }} />
                  <div style={{ width: '20%', background: '#DD6B20' }} />
                  <div style={{ width: '20%', background: 'var(--danger)' }} />
                </div>
                <div className="relative h-4">
                  <div className="absolute transition-all" style={{ left: `${((rpe - 1) / 9) * 100}%`, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${rpeColor}` }} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>教练备注</label>
                <textarea className="input-field w-full h-20" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={handleSave}><Save size={16} /> 保存记录</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
