import Dexie, { type Table } from 'dexie';
import type {
  Student, Group, Attendance, TrainingPlan, ExerciseItem,
  SessionRecord, SetRecord, TestResult, VideoAnnotation,
  KeyFrame, CoachComment, InjuryRecord, ParentFeedback,
  WeeklyReport, PlanTemplate,
} from './types';

class SmartTrainingDB extends Dexie {
  students!: Table<Student, number>;
  groups!: Table<Group, number>;
  attendance!: Table<Attendance, number>;
  trainingPlans!: Table<TrainingPlan, number>;
  exerciseItems!: Table<ExerciseItem, number>;
  sessionRecords!: Table<SessionRecord, number>;
  setRecords!: Table<SetRecord, number>;
  testResults!: Table<TestResult, number>;
  videoAnnotations!: Table<VideoAnnotation, number>;
  keyFrames!: Table<KeyFrame, number>;
  coachComments!: Table<CoachComment, number>;
  injuryRecords!: Table<InjuryRecord, number>;
  parentFeedback!: Table<ParentFeedback, number>;
  weeklyReports!: Table<WeeklyReport, number>;
  planTemplates!: Table<PlanTemplate, number>;

  constructor() {
    super('SmartTrainingDB');
    this.version(1).stores({
      students: '++id, name, groupId, createdAt',
      groups: '++id, name',
      attendance: '++id, studentId, date, status',
      trainingPlans: '++id, name, type, templateId, createdAt',
      exerciseItems: '++id, planId, sortOrder',
      planTemplates: '++id, name, category',
      sessionRecords: '++id, studentId, planId, date',
      setRecords: '++id, sessionId, exerciseId',
      testResults: '++id, studentId, testName, testDate',
      videoAnnotations: '++id, studentId, recordDate',
      keyFrames: '++id, videoId, timestamp',
      coachComments: '++id, videoId, frameId, createdAt',
      injuryRecords: '++id, studentId, bodyPart, occurredAt',
      parentFeedback: '++id, studentId, feedbackDate',
      weeklyReports: '++id, groupId, weekStart',
    });
  }
}

export const db = new SmartTrainingDB();

export async function seedDatabase() {
  const groupCount = await db.groups.count();
  if (groupCount > 0) return;

  const now = new Date().toISOString();

  const groups = await db.groups.bulkAdd([
    { name: 'U12基础组', color: '#FF6B35', description: '12岁以下基础训练', createdAt: now },
    { name: 'U15竞技组', color: '#1A365D', description: '15岁以下竞技训练', createdAt: now },
    { name: 'U18精英组', color: '#38A169', description: '18岁以下精英训练', createdAt: now },
  ], { allKeys: true }) as number[];

  const students = await db.students.bulkAdd([
    { name: '张明轩', age: 11, gender: '男', groupId: groups[0], avatar: '', phone: '13800000001', parentName: '张建国', parentPhone: '13900000001', createdAt: now, updatedAt: now },
    { name: '李思琪', age: 10, gender: '女', groupId: groups[0], avatar: '', phone: '13800000002', parentName: '李伟', parentPhone: '13900000002', createdAt: now, updatedAt: now },
    { name: '王浩然', age: 12, gender: '男', groupId: groups[0], avatar: '', phone: '13800000003', parentName: '王刚', parentPhone: '13900000003', createdAt: now, updatedAt: now },
    { name: '赵雨萱', age: 13, gender: '女', groupId: groups[1], avatar: '', phone: '13800000004', parentName: '赵磊', parentPhone: '13900000004', createdAt: now, updatedAt: now },
    { name: '刘子墨', age: 14, gender: '男', groupId: groups[1], avatar: '', phone: '13800000005', parentName: '刘洋', parentPhone: '13900000005', createdAt: now, updatedAt: now },
    { name: '陈思远', age: 16, gender: '男', groupId: groups[2], avatar: '', phone: '13800000006', parentName: '陈强', parentPhone: '13900000006', createdAt: now, updatedAt: now },
    { name: '杨诗涵', age: 17, gender: '女', groupId: groups[2], avatar: '', phone: '13800000007', parentName: '杨华', parentPhone: '13900000007', createdAt: now, updatedAt: now },
    { name: '吴天佑', age: 15, gender: '男', groupId: groups[1], avatar: '', phone: '13800000008', parentName: '吴刚', parentPhone: '13900000008', createdAt: now, updatedAt: now },
  ], { allKeys: true }) as number[];

  const today = new Date().toISOString().split('T')[0];
  for (const sid of students) {
    await db.attendance.add({ studentId: sid, date: today, status: 'present', note: '' });
  }

  const templates = await db.planTemplates.bulkAdd([
    { name: '力量基础训练', category: '力量', description: '基础力量训练计划，适合初学者', duration: 60 },
    { name: '速度灵敏训练', category: '速度', description: '提升速度与敏捷性', duration: 45 },
    { name: '柔韧恢复训练', category: '柔韧', description: '拉伸与恢复训练', duration: 30 },
    { name: '综合体能训练', category: '综合', description: '全面提升体能素质', duration: 75 },
  ], { allKeys: true }) as number[];

  const plan1Exercises = [
    { name: '深蹲', sets: 4, reps: 10, weight: 20, restSeconds: 90, sortOrder: 1 },
    { name: '卧推', sets: 3, reps: 8, weight: 15, restSeconds: 90, sortOrder: 2 },
    { name: '硬拉', sets: 3, reps: 8, weight: 25, restSeconds: 120, sortOrder: 3 },
    { name: '哑铃飞鸟', sets: 3, reps: 12, weight: 8, restSeconds: 60, sortOrder: 4 },
    { name: '平板支撑', sets: 3, reps: 30, weight: 0, restSeconds: 45, sortOrder: 5 },
  ];
  const plan1 = await db.trainingPlans.add({
    name: '力量基础训练', type: '力量', templateId: templates[0],
    description: '基础力量训练计划', duration: 60, createdAt: now,
  });
  for (const ex of plan1Exercises) {
    await db.exerciseItems.add({ ...ex, planId: plan1 as number });
  }

  const plan2Exercises = [
    { name: '30米冲刺', sets: 6, reps: 1, weight: 0, restSeconds: 120, sortOrder: 1 },
    { name: 'T字跑', sets: 4, reps: 1, weight: 0, restSeconds: 90, sortOrder: 2 },
    { name: '绳梯训练', sets: 4, reps: 1, weight: 0, restSeconds: 60, sortOrder: 3 },
    { name: '折返跑', sets: 3, reps: 1, weight: 0, restSeconds: 90, sortOrder: 4 },
  ];
  const plan2 = await db.trainingPlans.add({
    name: '速度灵敏训练', type: '速度', templateId: templates[1],
    description: '提升速度与敏捷性', duration: 45, createdAt: now,
  });
  for (const ex of plan2Exercises) {
    await db.exerciseItems.add({ ...ex, planId: plan2 as number });
  }

  const testNames = ['50米跑', '立定跳远', '引体向上', '耐力跑', '仰卧起坐', '坐位体前屈'];
  const units: Record<string, string> = { '50米跑': '秒', '立定跳远': '厘米', '引体向上': '次', '耐力跑': '秒', '仰卧起坐': '次/分', '坐位体前屈': '厘米' };
  const dates = ['2025-01-15', '2025-03-20', '2025-05-10'];
  for (const sid of students.slice(0, 4)) {
    for (const testDate of dates) {
      for (const testName of testNames) {
        let score: number;
        if (testName === '50米跑') score = 7 + Math.random() * 2;
        else if (testName === '立定跳远') score = 150 + Math.random() * 50;
        else if (testName === '引体向上') score = Math.floor(Math.random() * 12) + 1;
        else if (testName === '耐力跑') score = 180 + Math.random() * 120;
        else if (testName === '仰卧起坐') score = Math.floor(Math.random() * 30) + 15;
        else score = 5 + Math.random() * 15;
        const level = score > 80 ? '优秀' : score > 60 ? '良好' : score > 40 ? '及格' : '不及格';
        await db.testResults.add({
          studentId: sid, testName, score: Math.round(score * 10) / 10,
          unit: units[testName], level, testDate,
        });
      }
    }
  }

  await db.injuryRecords.add({
    studentId: students[0], bodyPart: '左膝', severity: 'mild',
    description: '训练后轻微疼痛', status: 'recovering',
    occurredAt: '2025-05-01', recoveredAt: '',
  });
  await db.injuryRecords.add({
    studentId: students[3], bodyPart: '右踝', severity: 'moderate',
    description: '跳跃落地扭伤', status: 'active',
    occurredAt: '2025-05-20', recoveredAt: '',
  });

  await db.parentFeedback.add({
    studentId: students[0], content: '最近睡眠质量较好，饮食正常', category: '睡眠',
    feedbackDate: '2025-05-18',
  });
  await db.parentFeedback.add({
    studentId: students[1], content: '学业压力较大，情绪有些波动', category: '情绪',
    feedbackDate: '2025-05-19',
  });
}

export async function exportAllData() {
  const data = {
    students: await db.students.toArray(),
    groups: await db.groups.toArray(),
    attendance: await db.attendance.toArray(),
    trainingPlans: await db.trainingPlans.toArray(),
    exerciseItems: await db.exerciseItems.toArray(),
    sessionRecords: await db.sessionRecords.toArray(),
    setRecords: await db.setRecords.toArray(),
    testResults: await db.testResults.toArray(),
    videoAnnotations: await db.videoAnnotations.toArray(),
    keyFrames: await db.keyFrames.toArray(),
    coachComments: await db.coachComments.toArray(),
    injuryRecords: await db.injuryRecords.toArray(),
    parentFeedback: await db.parentFeedback.toArray(),
    weeklyReports: await db.weeklyReports.toArray(),
    planTemplates: await db.planTemplates.toArray(),
  };
  return data;
}

export async function importAllData(data: Record<string, unknown[]>) {
  const tables = [
    'groups', 'students', 'attendance', 'planTemplates', 'trainingPlans',
    'exerciseItems', 'sessionRecords', 'setRecords', 'testResults',
    'videoAnnotations', 'keyFrames', 'coachComments', 'injuryRecords',
    'parentFeedback', 'weeklyReports',
  ];
  for (const tableName of tables) {
    if (data[tableName]) {
      await (db as any)[tableName]?.clear?.();
      await (db as any)[tableName]?.bulkAdd?.(data[tableName]);
    }
  }
}
