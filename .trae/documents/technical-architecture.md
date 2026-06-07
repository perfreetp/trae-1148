## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端层 - React + TypeScript"]
        Router["React Router"]
        Pages["7个页面组件"]
        Store["Zustand 状态管理"]
        Components["公共组件库"]
    end

    subgraph DataLayer["数据层 - IndexedDB + localStorage"]
        IDB["IndexedDB (Dexie.js)"]
        LS["localStorage (设置/缓存)"]
    end

    subgraph Utils["工具层"]
        Backup["数据备份/恢复"]
        Export["周报/Excel导出"]
        Chart["图表渲染 (Recharts)"]
        Video["视频处理 (原生API)"]
    end

    Router --> Pages
    Pages --> Store
    Pages --> Components
    Store --> IDB
    Store --> LS
    Pages --> Utils
```

## 2. 技术说明

- **前端**：React@18 + TypeScript + TailwindCSS@3 + Vite
- **初始化工具**：vite-init (react-ts 模板)
- **后端**：无（纯前端离线应用）
- **数据库**：IndexedDB（通过 Dexie.js ORM），localStorage 用于设置和缓存
- **图表**：Recharts（成绩对比、历史趋势）
- **视频**：原生 HTML5 Video API + Canvas（关键帧截取）
- **导出**：xlsx-js-style（Excel导出）、html2canvas + jsPDF（周报PDF导出）
- **状态管理**：Zustand
- **路由**：React Router DOM v6
- **图标**：lucide-react
- **日期处理**：dayjs
- **拖拽排序**：@dnd-kit/core + @dnd-kit/sortable

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 重定向到 /students |
| /students | 学员列表窗口 |
| /plans | 训练计划窗口 |
| /records | 现场记录窗口 |
| /assessments | 测试评估窗口 |
| /video-tags | 视频标注窗口 |
| /injuries | 伤病观察窗口 |
| /reports | 周报导出窗口 |

## 4. API定义

无后端API，所有数据通过 IndexedDB 本地存储。数据操作通过 Zustand Store + Dexie.js 封装的 Repository 层实现。

## 5. 服务器架构图

不适用（纯前端离线应用）

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Student {
        string id PK
        string name
        number age
        string gender
        string groupId FK
        string avatar
        string phone
        string parentName
        string parentPhone
        date createdAt
        date updatedAt
    }

    Group {
        string id PK
        string name
        string color
        string description
        date createdAt
    }

    Attendance {
        string id PK
        string studentId FK
        date date
        string status
        string note
    }

    TrainingPlan {
        string id PK
        string name
        string type
        string templateId
        string description
        number duration
        date createdAt
    }

    ExerciseItem {
        string id PK
        string planId FK
        string name
        number sets
        number reps
        number weight
        number restSeconds
        number sortOrder
    }

    SessionRecord {
        string id PK
        string studentId FK
        string planId FK
        date date
        number fatigueScore
        number heartRate
        string note
    }

    SetRecord {
        string id PK
        string sessionId FK
        string exerciseId FK
        number setNumber
        number actualWeight
        number actualReps
        boolean completed
    }

    TestResult {
        string id PK
        string studentId FK
        string testName
        number score
        string unit
        string level
        date testDate
    }

    VideoAnnotation {
        string id PK
        string studentId FK
        string videoPath
        date recordDate
    }

    KeyFrame {
        string id PK
        string videoId FK
        number timestamp
        string description
        string thumbnail
    }

    CoachComment {
        string id PK
        string videoId FK
        string frameId FK
        string content
        number timestamp
        date createdAt
    }

    InjuryRecord {
        string id PK
        string studentId FK
        string bodyPart
        string severity
        string description
        string status
        date occurredAt
        date recoveredAt
    }

    ParentFeedback {
        string id PK
        string studentId FK
        string content
        string category
        date feedbackDate
    }

    WeeklyReport {
        string id PK
        string groupId FK
        date weekStart
        date weekEnd
        string content
        date generatedAt
    }

    PlanTemplate {
        string id PK
        string name
        string category
        string description
        number duration
    }

    Student ||--o{ Attendance : "has"
    Group ||--o{ Student : "contains"
    TrainingPlan ||--o{ ExerciseItem : "contains"
    Student ||--o{ SessionRecord : "has"
    SessionRecord ||--o{ SetRecord : "contains"
    TrainingPlan ||--o{ SessionRecord : "used_in"
    Student ||--o{ TestResult : "has"
    Student ||--o{ VideoAnnotation : "has"
    VideoAnnotation ||--o{ KeyFrame : "has"
    VideoAnnotation ||--o{ CoachComment : "has"
    KeyFrame ||--o{ CoachComment : "on"
    Student ||--o{ InjuryRecord : "has"
    Student ||--o{ ParentFeedback : "has"
    Group ||--o{ WeeklyReport : "for"
    PlanTemplate ||--o{ TrainingPlan : "derived_from"
```

### 6.2 数据定义语言

使用 Dexie.js 定义 IndexedDB schema：

```typescript
// Dexie 数据库版本定义
const db = new Dexie('SmartTrainingDB')
db.version(1).stores({
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
  weeklyReports: '++id, groupId, weekStart'
})
```
