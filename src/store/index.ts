import { create } from 'zustand';
import type { Student, Group, Attendance, TrainingPlan, ExerciseItem, SessionRecord, SetRecord, TestResult, InjuryRecord, ParentFeedback, PlanTemplate, VideoAnnotation, KeyFrame, CoachComment } from '@/lib/types';
import { db, seedDatabase } from '@/lib/db';

interface AppState {
  students: Student[];
  groups: Group[];
  attendance: Attendance[];
  trainingPlans: TrainingPlan[];
  exerciseItems: ExerciseItem[];
  sessionRecords: SessionRecord[];
  setRecords: SetRecord[];
  testResults: TestResult[];
  injuryRecords: InjuryRecord[];
  parentFeedback: ParentFeedback[];
  planTemplates: PlanTemplate[];
  videoAnnotations: VideoAnnotation[];
  keyFrames: KeyFrame[];
  coachComments: CoachComment[];
  initialized: boolean;
  initialize: () => Promise<void>;
  loadStudents: () => Promise<void>;
  loadGroups: () => Promise<void>;
  loadAttendance: () => Promise<void>;
  loadTrainingPlans: () => Promise<void>;
  loadExerciseItems: () => Promise<void>;
  loadSessionRecords: () => Promise<void>;
  loadSetRecords: () => Promise<void>;
  loadTestResults: () => Promise<void>;
  loadInjuryRecords: () => Promise<void>;
  loadParentFeedback: () => Promise<void>;
  loadPlanTemplates: () => Promise<void>;
  loadVideoAnnotations: () => Promise<void>;
  loadKeyFrames: () => Promise<void>;
  loadCoachComments: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: number, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  updateGroup: (id: number, data: Partial<Group>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  addAttendance: (record: Omit<Attendance, 'id'>) => Promise<void>;
  updateAttendance: (id: number, data: Partial<Attendance>) => Promise<void>;
  addTrainingPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt'>) => Promise<number>;
  updateTrainingPlan: (id: number, data: Partial<TrainingPlan>) => Promise<void>;
  deleteTrainingPlan: (id: number) => Promise<void>;
  addExerciseItem: (item: Omit<ExerciseItem, 'id'>) => Promise<void>;
  updateExerciseItem: (id: number, data: Partial<ExerciseItem>) => Promise<void>;
  deleteExerciseItem: (id: number) => Promise<void>;
  addSessionRecord: (record: Omit<SessionRecord, 'id'>) => Promise<number>;
  updateSessionRecord: (id: number, data: Partial<SessionRecord>) => Promise<void>;
  addSetRecord: (record: Omit<SetRecord, 'id'>) => Promise<void>;
  updateSetRecord: (id: number, data: Partial<SetRecord>) => Promise<void>;
  addTestResult: (result: Omit<TestResult, 'id'>) => Promise<void>;
  updateTestResult: (id: number, data: Partial<TestResult>) => Promise<void>;
  deleteTestResult: (id: number) => Promise<void>;
  addInjuryRecord: (record: Omit<InjuryRecord, 'id'>) => Promise<void>;
  updateInjuryRecord: (id: number, data: Partial<InjuryRecord>) => Promise<void>;
  addParentFeedback: (feedback: Omit<ParentFeedback, 'id'>) => Promise<void>;
  addPlanTemplate: (template: Omit<PlanTemplate, 'id'>) => Promise<void>;
  addVideoAnnotation: (annotation: Omit<VideoAnnotation, 'id'>) => Promise<void>;
  deleteVideoAnnotation: (id: number) => Promise<void>;
  addKeyFrame: (frame: Omit<KeyFrame, 'id'>) => Promise<void>;
  deleteKeyFrame: (id: number) => Promise<void>;
  addCoachComment: (comment: Omit<CoachComment, 'id' | 'createdAt'>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  students: [],
  groups: [],
  attendance: [],
  trainingPlans: [],
  exerciseItems: [],
  sessionRecords: [],
  setRecords: [],
  testResults: [],
  injuryRecords: [],
  parentFeedback: [],
  planTemplates: [],
  videoAnnotations: [],
  keyFrames: [],
  coachComments: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    await seedDatabase();
    await Promise.all([
      get().loadStudents(),
      get().loadGroups(),
      get().loadAttendance(),
      get().loadTrainingPlans(),
      get().loadExerciseItems(),
      get().loadSessionRecords(),
      get().loadSetRecords(),
      get().loadTestResults(),
      get().loadInjuryRecords(),
      get().loadParentFeedback(),
      get().loadPlanTemplates(),
      get().loadVideoAnnotations(),
      get().loadKeyFrames(),
      get().loadCoachComments(),
    ]);
    set({ initialized: true });
  },

  loadStudents: async () => { const items = await db.students.toArray(); set({ students: items }); },
  loadGroups: async () => { const items = await db.groups.toArray(); set({ groups: items }); },
  loadAttendance: async () => { const items = await db.attendance.toArray(); set({ attendance: items }); },
  loadTrainingPlans: async () => { const items = await db.trainingPlans.toArray(); set({ trainingPlans: items }); },
  loadExerciseItems: async () => { const items = await db.exerciseItems.toArray(); set({ exerciseItems: items }); },
  loadSessionRecords: async () => { const items = await db.sessionRecords.toArray(); set({ sessionRecords: items }); },
  loadSetRecords: async () => { const items = await db.setRecords.toArray(); set({ setRecords: items }); },
  loadTestResults: async () => { const items = await db.testResults.toArray(); set({ testResults: items }); },
  loadInjuryRecords: async () => { const items = await db.injuryRecords.toArray(); set({ injuryRecords: items }); },
  loadParentFeedback: async () => { const items = await db.parentFeedback.toArray(); set({ parentFeedback: items }); },
  loadPlanTemplates: async () => { const items = await db.planTemplates.toArray(); set({ planTemplates: items }); },
  loadVideoAnnotations: async () => { const items = await db.videoAnnotations.toArray(); set({ videoAnnotations: items }); },
  loadKeyFrames: async () => { const items = await db.keyFrames.toArray(); set({ keyFrames: items }); },
  loadCoachComments: async () => { const items = await db.coachComments.toArray(); set({ coachComments: items }); },

  addStudent: async (student) => {
    const now = new Date().toISOString();
    await db.students.add({ ...student, createdAt: now, updatedAt: now });
    await get().loadStudents();
  },
  updateStudent: async (id, data) => {
    await db.students.update(id, { ...data, updatedAt: new Date().toISOString() });
    await get().loadStudents();
  },
  deleteStudent: async (id) => {
    await db.students.delete(id);
    await get().loadStudents();
  },
  addGroup: async (group) => {
    await db.groups.add({ ...group, createdAt: new Date().toISOString() });
    await get().loadGroups();
  },
  updateGroup: async (id, data) => {
    await db.groups.update(id, data);
    await get().loadGroups();
  },
  deleteGroup: async (id) => {
    await db.groups.delete(id);
    await get().loadGroups();
  },
  addAttendance: async (record) => {
    await db.attendance.add(record);
    await get().loadAttendance();
  },
  updateAttendance: async (id, data) => {
    await db.attendance.update(id, data);
    await get().loadAttendance();
  },
  addTrainingPlan: async (plan) => {
    const id = await db.trainingPlans.add({ ...plan, createdAt: new Date().toISOString() });
    await get().loadTrainingPlans();
    return id as number;
  },
  updateTrainingPlan: async (id, data) => {
    await db.trainingPlans.update(id, data);
    await get().loadTrainingPlans();
  },
  deleteTrainingPlan: async (id) => {
    await db.trainingPlans.delete(id);
    await db.exerciseItems.where('planId').equals(id).delete();
    await get().loadTrainingPlans();
    await get().loadExerciseItems();
  },
  addExerciseItem: async (item) => {
    await db.exerciseItems.add(item);
    await get().loadExerciseItems();
  },
  updateExerciseItem: async (id, data) => {
    await db.exerciseItems.update(id, data);
    await get().loadExerciseItems();
  },
  deleteExerciseItem: async (id) => {
    await db.exerciseItems.delete(id);
    await get().loadExerciseItems();
  },
  addSessionRecord: async (record) => {
    const id = await db.sessionRecords.add(record);
    await get().loadSessionRecords();
    return id as number;
  },
  updateSessionRecord: async (id, data) => {
    await db.sessionRecords.update(id, data);
    await get().loadSessionRecords();
  },
  addSetRecord: async (record) => {
    await db.setRecords.add(record);
    await get().loadSetRecords();
  },
  updateSetRecord: async (id, data) => {
    await db.setRecords.update(id, data);
    await get().loadSetRecords();
  },
  addTestResult: async (result) => {
    await db.testResults.add(result);
    await get().loadTestResults();
  },
  updateTestResult: async (id, data) => {
    await db.testResults.update(id, data);
    await get().loadTestResults();
  },
  deleteTestResult: async (id) => {
    await db.testResults.delete(id);
    await get().loadTestResults();
  },
  addInjuryRecord: async (record) => {
    await db.injuryRecords.add(record);
    await get().loadInjuryRecords();
  },
  updateInjuryRecord: async (id, data) => {
    await db.injuryRecords.update(id, data);
    await get().loadInjuryRecords();
  },
  addParentFeedback: async (feedback) => {
    await db.parentFeedback.add(feedback);
    await get().loadParentFeedback();
  },
  addPlanTemplate: async (template) => {
    await db.planTemplates.add(template);
    await get().loadPlanTemplates();
  },
  addVideoAnnotation: async (annotation) => {
    await db.videoAnnotations.add(annotation);
    await get().loadVideoAnnotations();
  },
  deleteVideoAnnotation: async (id) => {
    await db.videoAnnotations.delete(id);
    await get().loadVideoAnnotations();
  },
  addKeyFrame: async (frame) => {
    await db.keyFrames.add(frame);
    await get().loadKeyFrames();
  },
  deleteKeyFrame: async (id) => {
    await db.keyFrames.delete(id);
    await get().loadKeyFrames();
  },
  addCoachComment: async (comment) => {
    await db.coachComments.add({ ...comment, createdAt: new Date().toISOString() });
    await get().loadCoachComments();
  },
}));
