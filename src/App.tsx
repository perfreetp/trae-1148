import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import Layout from '@/components/Layout';
import Students from '@/pages/Students';
import Plans from '@/pages/Plans';
import Records from '@/pages/Records';
import Assessments from '@/pages/Assessments';
import VideoTags from '@/pages/VideoTags';
import Injuries from '@/pages/Injuries';
import Reports from '@/pages/Reports';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-[var(--bg)]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
        </div>
        <p className="text-[var(--text-light)] text-sm">正在加载数据...</p>
      </div>
    </div>
  );
}

export default function App() {
  const initialized = useStore((s) => s.initialized);
  const initialize = useStore((s) => s.initialize);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize().finally(() => setLoading(false));
  }, [initialize]);

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/students" replace />} />
          <Route path="students" element={<Students />} />
          <Route path="plans" element={<Plans />} />
          <Route path="records" element={<Records />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="video-tags" element={<VideoTags />} />
          <Route path="injuries" element={<Injuries />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
