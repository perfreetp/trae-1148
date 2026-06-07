import { useState } from 'react';
import { useStore } from '@/store';
import type { PlanTemplate } from '@/lib/types';
import { Dumbbell, Plus, Trash2, Edit3, Copy, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  力量: 'bg-red-100 text-red-700',
  速度: 'bg-blue-100 text-blue-700',
  柔韧: 'bg-green-100 text-green-700',
  综合: 'bg-purple-100 text-purple-700',
};

interface DraftExercise { name: string; sets: number; reps: number; weight: number; restSeconds: number }

export default function Plans() {
  const { trainingPlans, exerciseItems, planTemplates, addTrainingPlan, deleteTrainingPlan, addExerciseItem, updateExerciseItem, deleteExerciseItem, addPlanTemplate } = useStore();
  const [activeTab, setActiveTab] = useState<'templates' | 'plans'>('templates');
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const [targetRef, setTargetRef] = useState<{ planId: number | null; templateId: number | null }>({ planId: null, templateId: null });
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const [templateForm, setTemplateForm] = useState({ name: '', category: '力量', description: '', duration: 30 });
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([]);
  const [planForm, setPlanForm] = useState({ name: '', type: '力量', description: '', duration: 30 });
  const [exerciseForm, setExerciseForm] = useState<DraftExercise>({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });

  const getTemplateExercises = (templateId: number) => exerciseItems.filter(e => e.templateId === templateId);
  const getPlanExercises = (planId: number) => exerciseItems.filter(e => e.planId === planId);

  const addDraftExercise = () => {
    setDraftExercises(prev => [...prev, { name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 }]);
  };
  const updateDraftExercise = (idx: number, field: string, value: string | number) => {
    setDraftExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };
  const removeDraftExercise = (idx: number) => {
    setDraftExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddTemplate = async () => {
    const tplId = await addPlanTemplate({ name: templateForm.name, category: templateForm.category, description: templateForm.description, duration: templateForm.duration });
    for (let i = 0; i < draftExercises.length; i++) {
      const ex = draftExercises[i];
      if (ex.name.trim()) {
        await addExerciseItem({ planId: null, templateId: tplId as number, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, sortOrder: i + 1 });
      }
    }
    setShowTemplateModal(false);
    setTemplateForm({ name: '', category: '力量', description: '', duration: 30 });
    setDraftExercises([]);
  };

  const handleUseTemplate = async (tpl: PlanTemplate) => {
    const planId = await addTrainingPlan({ name: tpl.name, type: tpl.category, templateId: tpl.id ?? null, description: tpl.description, duration: tpl.duration });
    const tplExercises = getTemplateExercises(tpl.id!);
    for (const ex of tplExercises) {
      await addExerciseItem({ planId: planId as number, templateId: null, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, sortOrder: ex.sortOrder });
    }
    setActiveTab('plans');
  };

  const handleAddPlan = async () => {
    await addTrainingPlan({ name: planForm.name, type: planForm.type, templateId: null, description: planForm.description, duration: planForm.duration });
    setShowPlanModal(false);
    setPlanForm({ name: '', type: '力量', description: '', duration: 30 });
  };

  const handleCreateFromTemplate = async (tpl: PlanTemplate) => {
    const planId = await addTrainingPlan({ name: tpl.name, type: tpl.category, templateId: tpl.id ?? null, description: tpl.description, duration: tpl.duration });
    const tplExercises = getTemplateExercises(tpl.id!);
    for (const ex of tplExercises) {
      await addExerciseItem({ planId: planId as number, templateId: null, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, sortOrder: ex.sortOrder });
    }
    setShowTemplateDropdown(false);
  };

  const handleAddExercise = async () => {
    const existingCount = exerciseItems.filter(e => {
      if (targetRef.planId) return e.planId === targetRef.planId;
      if (targetRef.templateId) return e.templateId === targetRef.templateId;
      return false;
    }).length;
    await addExerciseItem({
      planId: targetRef.planId, templateId: targetRef.templateId,
      name: exerciseForm.name, sets: exerciseForm.sets, reps: exerciseForm.reps,
      weight: exerciseForm.weight, restSeconds: exerciseForm.restSeconds,
      sortOrder: existingCount + 1,
    });
    setShowExerciseModal(false);
    setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });
  };

  const handleEditExercise = async () => {
    if (!editingExerciseId) return;
    await updateExerciseItem(editingExerciseId, { name: exerciseForm.name, sets: exerciseForm.sets, reps: exerciseForm.reps, weight: exerciseForm.weight, restSeconds: exerciseForm.restSeconds });
    setShowExerciseModal(false);
    setEditingExerciseId(null);
    setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });
  };

  const openEditExercise = (ex: typeof exerciseItems[0]) => {
    setEditingExerciseId(ex.id ?? null);
    setExerciseForm({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds });
    setShowExerciseModal(true);
  };

  const openAddExercise = (ref: { planId: number | null; templateId: number | null }) => {
    setTargetRef(ref);
    setEditingExerciseId(null);
    setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });
    setShowExerciseModal(true);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>训练计划</h1>
        <div className="flex gap-1 mt-4 p-1 rounded-lg" style={{ background: 'var(--border)' }}>
          {([['templates', '计划模板'], ['plans', '我的计划']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === key ? 'bg-white shadow-sm' : ''}`} style={{ color: activeTab === key ? 'var(--primary)' : 'var(--text-light)' }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'templates' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="section-title">模板列表</span>
              <button className="btn-primary text-sm flex items-center gap-1" onClick={() => { setShowTemplateModal(true); setDraftExercises([{ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 }]); }}><Plus size={14} /> 添加模板</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {planTemplates.map((tpl) => {
                const tplEx = getTemplateExercises(tpl.id!);
                return (
                  <div key={tpl.id} className="card cursor-pointer" onClick={() => setExpandedTemplate(expandedTemplate === tpl.id ? null : tpl.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[tpl.category] || 'bg-gray-100 text-gray-700'}`}>{tpl.category}</span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-light)' }}><Clock size={12} />{tpl.duration}分钟</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{tpl.name}</h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-light)' }}>{tpl.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-light)' }}><Dumbbell size={12} />{tplEx.length} 个动作</span>
                      <button className="btn-secondary text-xs flex items-center gap-1 py-1 px-2" onClick={(e) => { e.stopPropagation(); handleUseTemplate(tpl); }}><Copy size={12} /> 使用模板</button>
                    </div>
                    {expandedTemplate === tpl.id && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                        {tplEx.length > 0 ? tplEx.map((ex) => (
                          <div key={ex.id} className="flex justify-between text-xs py-1 group" style={{ color: 'var(--text-light)' }}>
                            <span>{ex.name}</span>
                            <span className="flex items-center gap-2">{ex.sets}×{ex.reps} {ex.weight}kg
                              <button className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-blue-500" onClick={(e) => { e.stopPropagation(); openEditExercise(ex); setTargetRef({ planId: null, templateId: tpl.id! }); }}><Edit3 size={11} /></button>
                              <button className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); ex.id && deleteExerciseItem(ex.id); }}><Trash2 size={11} /></button>
                            </span>
                          </div>
                        )) : <div className="text-xs text-[var(--text-muted)] py-1">暂无动作</div>}
                        <button className="btn-secondary text-xs flex items-center gap-1 mt-2 py-1 px-2" onClick={(e) => { e.stopPropagation(); openAddExercise({ planId: null, templateId: tpl.id! }); }}><Plus size={11} /> 添加动作</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-4 gap-2">
              <span className="section-title">我的计划</span>
              <div className="flex gap-2">
                <div className="relative">
                  <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}><Copy size={14} /> 从模板创建 <ChevronDown size={12} /></button>
                  {showTemplateDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-10 py-1 min-w-[160px]" style={{ border: '1px solid var(--border)' }}>
                      {planTemplates.map((tpl) => (
                        <button key={tpl.id} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" style={{ color: 'var(--text)' }} onClick={() => { handleCreateFromTemplate(tpl); setExpandedPlan(null); }}>{tpl.name}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowPlanModal(true)}><Plus size={14} /> 添加计划</button>
              </div>
            </div>
            <div className="space-y-3">
              {trainingPlans.map((plan) => {
                const planEx = getPlanExercises(plan.id!);
                return (
                  <div key={plan.id} className="card">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[plan.type] || 'bg-gray-100 text-gray-700'}`}>{plan.type}</span>
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{plan.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-light)' }}><Clock size={12} />{plan.duration}分钟</span>
                        <span className="text-xs" style={{ color: 'var(--text-light)' }}>{plan.createdAt}</span>
                        <button className="p-1 hover:text-red-500" onClick={(e) => { e.stopPropagation(); plan.id && deleteTrainingPlan(plan.id); }}><Trash2 size={14} /></button>
                        {expandedPlan === plan.id ? <ChevronUp size={16} style={{ color: 'var(--text-light)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-light)' }} />}
                      </div>
                    </div>
                    {expandedPlan === plan.id && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                        <table className="w-full text-sm">
                          <thead><tr className="text-left" style={{ color: 'var(--text-light)' }}>
                            <th className="pb-2 font-medium">动作</th><th className="pb-2 font-medium">组数</th><th className="pb-2 font-medium">次数</th><th className="pb-2 font-medium">重量(kg)</th><th className="pb-2 font-medium">休息(s)</th><th className="pb-2 font-medium"></th>
                          </tr></thead>
                          <tbody>
                            {planEx.map((ex) => (
                              <tr key={ex.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                <td className="py-2" style={{ color: 'var(--text)' }}>{ex.name}</td>
                                <td className="py-2">{ex.sets}</td><td className="py-2">{ex.reps}</td><td className="py-2">{ex.weight}</td><td className="py-2">{ex.restSeconds}</td>
                                <td className="py-2 flex gap-1">
                                  <button className="p-1 hover:text-blue-500" onClick={() => openEditExercise(ex)}><Edit3 size={13} /></button>
                                  <button className="p-1 hover:text-red-500" onClick={() => ex.id && deleteExerciseItem(ex.id)}><Trash2 size={13} /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button className="btn-secondary text-xs flex items-center gap-1 mt-2" onClick={() => openAddExercise({ planId: plan.id!, templateId: null })}><Plus size={12} /> 添加动作</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowTemplateModal(false); setDraftExercises([]); }}>
          <div className="bg-white rounded-xl p-6 w-[560px] max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>添加模板</h2><button onClick={() => { setShowTemplateModal(false); setDraftExercises([]); }}><X size={18} /></button></div>
            <div className="space-y-3">
              <input className="input-field" placeholder="模板名称" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="select-field" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}>
                  <option value="力量">力量</option><option value="速度">速度</option><option value="柔韧">柔韧</option><option value="综合">综合</option>
                </select>
                <input className="input-field" type="number" placeholder="时长(分钟)" value={templateForm.duration} onChange={(e) => setTemplateForm({ ...templateForm, duration: Number(e.target.value) })} />
              </div>
              <textarea className="input-field min-h-[50px]" placeholder="描述" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--navy)' }}>动作列表</span>
                  <button className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline" onClick={addDraftExercise}><Plus size={12} />添加动作</button>
                </div>
                {draftExercises.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-end mb-2">
                    <input className="input-field flex-[2]" placeholder="动作名称" value={ex.name} onChange={e => updateDraftExercise(idx, 'name', e.target.value)} />
                    <input className="input-field w-14" type="number" placeholder="组" value={ex.sets || ''} onChange={e => updateDraftExercise(idx, 'sets', Number(e.target.value))} />
                    <input className="input-field w-14" type="number" placeholder="次" value={ex.reps || ''} onChange={e => updateDraftExercise(idx, 'reps', Number(e.target.value))} />
                    <input className="input-field w-16" type="number" placeholder="kg" value={ex.weight || ''} onChange={e => updateDraftExercise(idx, 'weight', Number(e.target.value))} />
                    <input className="input-field w-16" type="number" placeholder="休息s" value={ex.restSeconds || ''} onChange={e => updateDraftExercise(idx, 'restSeconds', Number(e.target.value))} />
                    <button className="p-2 text-[var(--danger)] hover:bg-red-50 rounded" onClick={() => removeDraftExercise(idx)}><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button className="btn-primary w-full py-2" onClick={handleAddTemplate}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPlanModal(false)}>
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>添加计划</h2><button onClick={() => setShowPlanModal(false)}><X size={18} /></button></div>
            <div className="space-y-3">
              <input className="input-field" placeholder="计划名称" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
              <select className="select-field" value={planForm.type} onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}>
                <option value="力量">力量</option><option value="速度">速度</option><option value="柔韧">柔韧</option><option value="综合">综合</option>
              </select>
              <textarea className="input-field min-h-[60px]" placeholder="描述" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
              <input className="input-field" type="number" placeholder="时长(分钟)" value={planForm.duration} onChange={(e) => setPlanForm({ ...planForm, duration: Number(e.target.value) })} />
              <button className="btn-primary w-full py-2" onClick={handleAddPlan}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {showExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowExerciseModal(false); setEditingExerciseId(null); }}>
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>{editingExerciseId ? '编辑动作' : '添加动作'}</h2><button onClick={() => { setShowExerciseModal(false); setEditingExerciseId(null); }}><X size={18} /></button></div>
            <div className="space-y-3">
              <input className="input-field" placeholder="动作名称" value={exerciseForm.name} onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" type="number" placeholder="组数" value={exerciseForm.sets || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Number(e.target.value) })} />
                <input className="input-field" type="number" placeholder="次数" value={exerciseForm.reps || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, reps: Number(e.target.value) })} />
                <input className="input-field" type="number" placeholder="重量(kg)" value={exerciseForm.weight || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, weight: Number(e.target.value) })} />
                <input className="input-field" type="number" placeholder="休息(秒)" value={exerciseForm.restSeconds || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, restSeconds: Number(e.target.value) })} />
              </div>
              <button className="btn-primary w-full py-2" onClick={editingExerciseId ? handleEditExercise : handleAddExercise}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
