import { useState } from 'react';
import { useStore } from '@/store';
import type { TrainingPlan, ExerciseItem, PlanTemplate } from '@/lib/types';
import { Dumbbell, Plus, Trash2, Edit3, Copy, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import dayjs from 'dayjs';

const CATEGORY_COLORS: Record<string, string> = {
  力量: 'bg-red-100 text-red-700',
  速度: 'bg-blue-100 text-blue-700',
  柔韧: 'bg-green-100 text-green-700',
  综合: 'bg-purple-100 text-purple-700',
};

export default function Plans() {
  const { trainingPlans, exerciseItems, planTemplates, addTrainingPlan, updateTrainingPlan, deleteTrainingPlan, addExerciseItem, updateExerciseItem, deleteExerciseItem, addPlanTemplate } = useStore();
  const [activeTab, setActiveTab] = useState<'templates' | 'plans'>('templates');
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [targetPlanId, setTargetPlanId] = useState<number>(0);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const [templateForm, setTemplateForm] = useState({ name: '', category: '力量', description: '', duration: 30 });
  const [planForm, setPlanForm] = useState({ name: '', type: '力量', description: '', duration: 30 });
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });

  const getExercisesForPlan = (planId: number) => exerciseItems.filter((e) => e.planId === planId);

  const handleUseTemplate = async (tpl: PlanTemplate) => {
    const planId = await addTrainingPlan({ name: tpl.name, type: tpl.category, templateId: tpl.id ?? null, description: tpl.description, duration: tpl.duration });
    const tplExercises = exerciseItems.filter(e => e.planId === tpl.id);
    for (const ex of tplExercises) {
      await addExerciseItem({ planId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, sortOrder: ex.sortOrder });
    }
    setActiveTab('plans');
  };

  const handleAddTemplate = async () => {
    await addPlanTemplate({ name: templateForm.name, category: templateForm.category, description: templateForm.description, duration: templateForm.duration });
    setShowTemplateModal(false);
    setTemplateForm({ name: '', category: '力量', description: '', duration: 30 });
  };

  const handleAddPlan = async () => {
    await addTrainingPlan({ name: planForm.name, type: planForm.type, templateId: null, description: planForm.description, duration: planForm.duration });
    setShowPlanModal(false);
    setPlanForm({ name: '', type: '力量', description: '', duration: 30 });
  };

  const handleCreateFromTemplate = async (tpl: PlanTemplate) => {
    const planId = await addTrainingPlan({ name: tpl.name, type: tpl.category, templateId: tpl.id ?? null, description: tpl.description, duration: tpl.duration });
    const tplExercises = exerciseItems.filter(e => e.planId === tpl.id);
    for (const ex of tplExercises) {
      await addExerciseItem({ planId, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds, sortOrder: ex.sortOrder });
    }
    setShowTemplateDropdown(false);
  };

  const handleAddExercise = async () => {
    const maxOrder = exerciseItems.filter(e => e.planId === targetPlanId).length;
    await addExerciseItem({ planId: targetPlanId, name: exerciseForm.name, sets: exerciseForm.sets, reps: exerciseForm.reps, weight: exerciseForm.weight, restSeconds: exerciseForm.restSeconds, sortOrder: maxOrder + 1 });
    setShowExerciseModal(false);
    setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });
  };

  const handleEditExercise = async () => {
    if (!editingExercise?.id) return;
    await updateExerciseItem(editingExercise.id, { ...exerciseForm });
    setShowExerciseModal(false);
    setEditingExercise(null);
    setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 });
  };

  const openEditExercise = (ex: ExerciseItem) => {
    setEditingExercise(ex);
    setExerciseForm({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight, restSeconds: ex.restSeconds });
    setShowExerciseModal(true);
  };

  const openAddExercise = (planId: number) => {
    setTargetPlanId(planId);
    setEditingExercise(null);
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
              <button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowTemplateModal(true)}><Plus size={14} /> 添加模板</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {planTemplates.map((tpl) => (
                <div key={tpl.id} className="card cursor-pointer" onClick={() => setExpandedTemplate(expandedTemplate === tpl.id ? null : tpl.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[tpl.category] || 'bg-gray-100 text-gray-700'}`}>{tpl.category}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-light)' }}><Clock size={12} />{tpl.duration}分钟</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{tpl.name}</h3>
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-light)' }}>{tpl.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-light)' }}><Dumbbell size={12} />{getExercisesForPlan(tpl.id!).length} 个动作</span>
                    <button className="btn-secondary text-xs flex items-center gap-1 py-1 px-2" onClick={(e) => { e.stopPropagation(); handleUseTemplate(tpl); }}><Copy size={12} /> 使用模板</button>
                  </div>
                  {expandedTemplate === tpl.id && getExercisesForPlan(tpl.id!).length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      {getExercisesForPlan(tpl.id!).map((ex) => (
                        <div key={ex.id} className="flex justify-between text-xs py-1" style={{ color: 'var(--text-light)' }}>
                          <span>{ex.name}</span><span>{ex.sets}×{ex.reps} {ex.weight}kg</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
              {trainingPlans.map((plan) => (
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
                          {getExercisesForPlan(plan.id!).map((ex) => (
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
                      <button className="btn-secondary text-xs flex items-center gap-1 mt-2" onClick={() => openAddExercise(plan.id!)}><Plus size={12} /> 添加动作</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>添加模板</h2><button onClick={() => setShowTemplateModal(false)}><X size={18} /></button></div>
            <div className="space-y-3">
              <input className="input-field" placeholder="模板名称" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
              <select className="select-field" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}>
                <option value="力量">力量</option><option value="速度">速度</option><option value="柔韧">柔韧</option><option value="综合">综合</option>
              </select>
              <textarea className="input-field min-h-[60px]" placeholder="描述" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
              <input className="input-field" type="number" placeholder="时长(分钟)" value={templateForm.duration} onChange={(e) => setTemplateForm({ ...templateForm, duration: Number(e.target.value) })} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowExerciseModal(false); setEditingExercise(null); }}>
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>{editingExercise ? '编辑动作' : '添加动作'}</h2><button onClick={() => { setShowExerciseModal(false); setEditingExercise(null); }}><X size={18} /></button></div>
            <div className="space-y-3">
              <input className="input-field" placeholder="动作名称" value={exerciseForm.name} onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" type="number" placeholder="组数" value={exerciseForm.sets} onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Number(e.target.value) })} />
                <input className="input-field" type="number" placeholder="次数" value={exerciseForm.reps} onChange={(e) => setExerciseForm({ ...exerciseForm, reps: Number(e.target.value) })} />
                <input className="input-field" type="number" placeholder="重量(kg)" value={exerciseForm.weight} onChange={(e) => setExerciseForm({ ...exerciseForm, weight: Number(e.target.value) })} />
                <input className="input-field" type="number" placeholder="休息(秒)" value={exerciseForm.restSeconds} onChange={(e) => setExerciseForm({ ...exerciseForm, restSeconds: Number(e.target.value) })} />
              </div>
              <button className="btn-primary w-full py-2" onClick={editingExercise ? handleEditExercise : handleAddExercise}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
