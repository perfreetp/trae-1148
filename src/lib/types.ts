export interface Student {
  id?: number;
  name: string;
  age: number;
  gender: string;
  groupId: number | null;
  avatar: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id?: number;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface Attendance {
  id?: number;
  studentId: number;
  date: string;
  status: 'present' | 'absent' | 'leave';
  note: string;
}

export interface TrainingPlan {
  id?: number;
  name: string;
  type: string;
  templateId: number | null;
  description: string;
  duration: number;
  createdAt: string;
}

export interface ExerciseItem {
  id?: number;
  planId: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  sortOrder: number;
}

export interface SessionRecord {
  id?: number;
  studentId: number;
  planId: number;
  date: string;
  fatigueScore: number;
  heartRate: number;
  note: string;
}

export interface SetRecord {
  id?: number;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  actualWeight: number;
  actualReps: number;
  completed: boolean;
}

export interface TestResult {
  id?: number;
  studentId: number;
  testName: string;
  score: number;
  unit: string;
  level: string;
  testDate: string;
}

export interface VideoAnnotation {
  id?: number;
  studentId: number;
  videoPath: string;
  recordDate: string;
}

export interface KeyFrame {
  id?: number;
  videoId: number;
  timestamp: number;
  description: string;
  thumbnail: string;
}

export interface CoachComment {
  id?: number;
  videoId: number;
  frameId: number | null;
  content: string;
  timestamp: number;
  createdAt: string;
}

export interface InjuryRecord {
  id?: number;
  studentId: number;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  status: 'active' | 'recovering' | 'recovered';
  occurredAt: string;
  recoveredAt: string;
}

export interface ParentFeedback {
  id?: number;
  studentId: number;
  content: string;
  category: string;
  feedbackDate: string;
}

export interface WeeklyReport {
  id?: number;
  groupId: number | null;
  weekStart: string;
  weekEnd: string;
  content: string;
  generatedAt: string;
}

export interface PlanTemplate {
  id?: number;
  name: string;
  category: string;
  description: string;
  duration: number;
}

export type AttendanceStatus = Attendance['status'];
export type InjurySeverity = InjuryRecord['severity'];
export type InjuryStatus = InjuryRecord['status'];

export const GROUP_COLORS = [
  '#FF6B35', '#1A365D', '#38A169', '#E53E3E',
  '#ECC94B', '#805AD5', '#DD6B20', '#319795',
];

export const BODY_PARTS = [
  '头部', '颈部', '左肩', '右肩', '左上臂', '右上臂',
  '左肘', '右肘', '左前臂', '右前臂', '左腕', '右腕',
  '胸部', '上背', '下背', '腹部',
  '左髋', '右髋', '左大腿', '右大腿', '左膝', '右膝',
  '左小腿', '右小腿', '左踝', '右踝', '左脚', '右脚',
];

export const TEST_NAMES = [
  '50米跑', '立定跳远', '引体向上', '耐力跑',
  '仰卧起坐', '坐位体前屈', '握力', '纵跳',
];

export const TEST_UNITS: Record<string, string> = {
  '50米跑': '秒',
  '立定跳远': '厘米',
  '引体向上': '次',
  '耐力跑': '秒',
  '仰卧起坐': '次/分',
  '坐位体前屈': '厘米',
  '握力': '千克',
  '纵跳': '厘米',
};

export const FEEDBACK_CATEGORIES = [
  '睡眠', '饮食', '情绪', '学业', '其他',
];
