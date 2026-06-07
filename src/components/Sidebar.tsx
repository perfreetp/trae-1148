import { NavLink, useLocation } from 'react-router-dom';
import {
  Users, ClipboardList, PenLine, BarChart3,
  Video, HeartPulse, FileText, ChevronLeft, ChevronRight,
  Dumbbell,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/students', label: '学员列表', icon: Users },
  { path: '/plans', label: '训练计划', icon: ClipboardList },
  { path: '/records', label: '现场记录', icon: PenLine },
  { path: '/assessments', label: '测试评估', icon: BarChart3 },
  { path: '/video-tags', label: '视频标注', icon: Video },
  { path: '/injuries', label: '伤病观察', icon: HeartPulse },
  { path: '/reports', label: '周报导出', icon: FileText },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`h-full bg-[var(--navy)] flex flex-col transition-all duration-300 relative ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-sm leading-tight">智慧体育训练</h1>
            <p className="text-white/50 text-[10px]">Smart Training System</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-md border border-[var(--border)] flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-light)]" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-light)]" />
        )}
      </button>

      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">教练</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white text-xs font-medium truncate">王教练</p>
              <p className="text-white/40 text-[10px] truncate">体能训练主管</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
