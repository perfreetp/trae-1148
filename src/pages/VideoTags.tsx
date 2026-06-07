import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { KEYFRAME_CATEGORIES } from '@/lib/types';
import { Video, Plus, Trash2, MessageSquare, Bookmark, Play, Pause, SkipBack, X, Filter, Tag, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import dayjs from 'dayjs';

const CATEGORY_COLORS: Record<string, string> = {
  '技术动作': '#3B82F6',
  '力量问题': '#EF4444',
  '速度问题': '#F59E0B',
  '柔韧问题': '#8B5CF6',
  '疲劳信号': '#6B7280',
  '伤病风险': '#DC2626',
  '优秀表现': '#10B981',
  '其他': '#9CA3AF',
};

export default function VideoTags() {
  const { students, videoAnnotations, keyFrames, coachComments, addVideoAnnotation, deleteVideoAnnotation, addKeyFrame, updateKeyFrame, deleteKeyFrame, addCoachComment } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editingFrameId, setEditingFrameId] = useState<number | null>(null);
  const [frameDesc, setFrameDesc] = useState('');
  const [editingFrameCategory, setEditingFrameCategory] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [selectedCommentStudent, setSelectedCommentStudent] = useState<number | ''>('');
  const [newFrameCategory, setNewFrameCategory] = useState<string>('技术动作');
  const [expandedVideoGroups, setExpandedVideoGroups] = useState<Set<number>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVideos = videoAnnotations.filter(v => !selectedStudentId || v.studentId === selectedStudentId);
  const selectedVideo = videoAnnotations.find(v => v.id === selectedVideoId) || null;
  const videoKeyFrames = keyFrames.filter(k => k.videoId === selectedVideoId).sort((a, b) => a.timestamp - b.timestamp);

  const getDisplayCategory = (kf: typeof keyFrames[0]) => kf.category || '其他';

  const filteredKeyFrames = selectedCategoryFilter
    ? videoKeyFrames.filter(kf => getDisplayCategory(kf) === selectedCategoryFilter)
    : videoKeyFrames;

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    videoKeyFrames.forEach(kf => {
      const cat = getDisplayCategory(kf);
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }, [videoKeyFrames]);

  const groupedComments = useMemo(() => {
    let comments: typeof coachComments = [];
    if (selectedCommentStudent) {
      comments = coachComments.filter(c => {
        const cv = videoAnnotations.find(v => v.id === c.videoId);
        return cv?.studentId === selectedCommentStudent;
      });
    } else if (selectedVideoId) {
      comments = coachComments.filter(c => c.videoId === selectedVideoId);
    }
    comments.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

    const groups: { videoId: number; videoPath: string; recordDate: string; studentId: number; comments: typeof comments }[] = [];
    const videoMap = new Map<number, typeof comments>();
    comments.forEach(c => {
      if (!videoMap.has(c.videoId)) videoMap.set(c.videoId, []);
      videoMap.get(c.videoId)!.push(c);
    });
    videoMap.forEach((vidComments, videoId) => {
      const va = videoAnnotations.find(v => v.id === videoId);
      if (va) {
        groups.push({ videoId, videoPath: va.videoPath, recordDate: va.recordDate, studentId: va.studentId, comments: vidComments });
      }
    });
    return groups;
  }, [selectedCommentStudent, selectedVideoId, coachComments, videoAnnotations]);

  const toggleVideoGroup = (videoId: number) => {
    setExpandedVideoGroups(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId); else next.add(videoId);
      return next;
    });
  };

  useEffect(() => {
    const urls: Record<number, string> = {};
    videoAnnotations.forEach(v => {
      if (v.videoBlob && v.id) {
        urls[v.id] = URL.createObjectURL(v.videoBlob);
      }
    });
    setObjectUrls(prev => {
      Object.values(prev).forEach(u => URL.revokeObjectURL(u));
      return urls;
    });
    return () => { Object.values(urls).forEach(u => URL.revokeObjectURL(u)); };
  }, [videoAnnotations]);

  useEffect(() => {
    if (videoRef.current && selectedVideoId && objectUrls[selectedVideoId]) {
      videoRef.current.src = objectUrls[selectedVideoId];
      videoRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [selectedVideoId, objectUrls]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpToVideoAndTime = (videoId: number, time: number) => {
    setSelectedVideoId(videoId);
    setTimeout(() => seekTo(time), 100);
  };

  const handleImportVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const studentId = selectedStudentId ? Number(selectedStudentId) : students[0]?.id;
    if (!studentId) return;
    await addVideoAnnotation({ studentId, videoPath: file.name, videoBlob: file, recordDate: dayjs().format('YYYY-MM-DD') });
    e.target.value = '';
  };

  const handleAddKeyFrame = async () => {
    if (!selectedVideoId) return;
    const t = videoRef.current ? videoRef.current.currentTime : currentTime;
    await addKeyFrame({ videoId: selectedVideoId, timestamp: Math.round(t * 10) / 10, description: '', thumbnail: '', category: newFrameCategory });
  };

  const handleSaveFrameDesc = async (frameId: number) => {
    setEditingFrameId(null);
    if (frameId) {
      await updateKeyFrame(frameId, { description: frameDesc, category: editingFrameCategory || '其他' });
    }
  };

  const handleAddComment = async () => {
    if (!selectedVideoId || !commentText.trim()) return;
    await addCoachComment({ videoId: selectedVideoId, frameId: null, content: commentText, timestamp: commentTimestamp });
    setCommentText('');
    setCommentTimestamp(0);
    setShowCommentInput(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStudentName = (studentId: number) => students.find(s => s.id === studentId)?.name || '未知';

  const totalCommentsCount = groupedComments.reduce((sum, g) => sum + g.comments.length, 0);

  return (
    <div className="flex gap-4 h-full p-4">
      <div className="w-1/4 flex flex-col gap-3">
        <h2 className="section-title">视频列表</h2>
        <select className="select-field" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredVideos.map(v => (
            <div key={v.id} className={`card flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-[var(--primary)] transition-all py-3 ${selectedVideoId === v.id ? 'ring-2 ring-[var(--primary)]' : ''}`} onClick={() => setSelectedVideoId(v.id ?? null)}>
              <div className="w-14 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                {v.videoBlob ? <Video size={16} className="text-[var(--primary)]" /> : <Video size={16} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getStudentName(v.studentId)}</p>
                <p className="text-xs text-[var(--text-light)] truncate">{v.videoPath}</p>
                <p className="text-xs text-[var(--text-muted)]">{v.recordDate}</p>
              </div>
              <button className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); deleteVideoAnnotation(v.id!); if (selectedVideoId === v.id) setSelectedVideoId(null); }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {filteredVideos.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-8">暂无视频</p>}
        </div>
        <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleImportVideo} />
        <button className="btn-primary flex items-center justify-center gap-2 w-full" onClick={() => fileInputRef.current?.click()}>
          <Plus size={16} /> 导入视频
        </button>
      </div>

      <div className="w-1/3 flex flex-col gap-3">
        <h2 className="section-title">视频播放</h2>
        {selectedVideo ? (
          <>
            <div className="bg-black rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={handleVideoLoaded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              {!isPlaying && (
                <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors" onClick={togglePlay}>
                  <Play size={48} className="text-white/80" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-gray-100" onClick={() => seekTo(0)}>
                <SkipBack size={16} />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" onClick={togglePlay}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1 relative h-2 bg-gray-200 rounded-full cursor-pointer" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); const t = ((e.clientX - rect.left) / rect.width) * duration; seekTo(t); }}>
                <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
                {videoKeyFrames.map(kf => (
                  <div key={kf.id} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow cursor-pointer hover:scale-125" style={{ left: duration ? `${(kf.timestamp / duration) * 100}%` : '0%', backgroundColor: CATEGORY_COLORS[getDisplayCategory(kf)] || 'var(--primary-dark)' }} title={`${getDisplayCategory(kf)} - ${kf.description || formatTime(kf.timestamp)}`} onClick={e => { e.stopPropagation(); seekTo(kf.timestamp); }} />
                ))}
              </div>
              <span className="text-xs font-mono text-[var(--text-light)] w-28 text-right">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-light)] whitespace-nowrap">分类:</label>
                <select className="select-field text-xs flex-1" value={newFrameCategory} onChange={e => setNewFrameCategory(e.target.value)}>
                  {KEYFRAME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <button className="btn-secondary flex items-center justify-center gap-2 w-full" onClick={handleAddKeyFrame}>
                <Bookmark size={16} /> 添加关键帧 (当前: {formatTime(currentTime)})
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 card flex items-center justify-center text-[var(--text-muted)]">
            请从左侧选择视频
          </div>
        )}
      </div>

      <div className="w-[38%] flex flex-col gap-3 overflow-hidden">
        <h2 className="section-title">标注与点评</h2>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--navy)]">关键帧 ({filteredKeyFrames.length})</h3>
              <div className="flex items-center gap-1">
                <Filter size={12} className="text-[var(--text-muted)]" />
                <select className="text-xs border border-[var(--border)] rounded px-1 py-0.5 bg-white" value={selectedCategoryFilter} onChange={e => setSelectedCategoryFilter(e.target.value)}>
                  <option value="">全部分类</option>
                  {KEYFRAME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}{categoryStats[cat] ? ` (${categoryStats[cat]})` : ''}</option>)}
                </select>
              </div>
            </div>
            {Object.keys(categoryStats).length > 0 && !selectedCategoryFilter && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Object.entries(categoryStats).map(([cat, count]) => (
                  <button key={cat} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full text-white hover:opacity-80 transition-opacity" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#9CA3AF' }} onClick={() => setSelectedCategoryFilter(cat)}>
                    <Tag size={8} />{cat} {count}
                  </button>
                ))}
              </div>
            )}
            {selectedCategoryFilter && (
              <button className="text-[10px] text-[var(--primary)] hover:underline mb-1" onClick={() => setSelectedCategoryFilter('')}>← 返回全部 ({videoKeyFrames.length})</button>
            )}
            {filteredKeyFrames.length === 0 && <p className="text-xs text-[var(--text-muted)] py-2">暂无关键帧，点击上方按钮添加</p>}
            {filteredKeyFrames.map(kf => (
              <div key={kf.id} className="py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-2">
                  <button className="text-xs font-mono bg-[var(--navy)] text-white px-2 py-0.5 rounded hover:opacity-80 flex-shrink-0" onClick={() => seekTo(kf.timestamp)}>{formatTime(kf.timestamp)}</button>
                  {editingFrameId === kf.id ? (
                    <select className="text-xs border border-[var(--border)] rounded px-1 py-0.5 flex-shrink-0" value={editingFrameCategory} onChange={e => setEditingFrameCategory(e.target.value)}>
                      {KEYFRAME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full text-white whitespace-nowrap flex-shrink-0 cursor-pointer hover:opacity-80" style={{ backgroundColor: CATEGORY_COLORS[getDisplayCategory(kf)] || '#9CA3AF' }} onClick={() => { setEditingFrameId(kf.id!); setFrameDesc(kf.description); setEditingFrameCategory(getDisplayCategory(kf)); }}>
                      <Tag size={8} />{getDisplayCategory(kf)}
                    </span>
                  )}
                  {editingFrameId === kf.id ? (
                    <input className="input-field text-xs flex-1 min-w-0" value={frameDesc} onChange={e => setFrameDesc(e.target.value)} onBlur={() => handleSaveFrameDesc(kf.id!)} onKeyDown={e => e.key === 'Enter' && handleSaveFrameDesc(kf.id!)} autoFocus />
                  ) : (
                    <span className="text-sm flex-1 cursor-pointer hover:text-[var(--primary)] truncate" onClick={() => { setEditingFrameId(kf.id!); setFrameDesc(kf.description); setEditingFrameCategory(getDisplayCategory(kf)); }}>
                      {kf.description || '点击添加描述...'}
                    </span>
                  )}
                  <button className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] flex-shrink-0" onClick={() => deleteKeyFrame(kf.id!)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--navy)] flex items-center gap-1"><MessageSquare size={14} />教练点评 ({totalCommentsCount})</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Filter size={12} className="text-[var(--text-muted)]" />
                  <select className="text-xs border border-[var(--border)] rounded px-1 py-0.5 bg-white" value={selectedCommentStudent} onChange={e => setSelectedCommentStudent(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">当前视频</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} (全部视频)</option>)}
                  </select>
                </div>
                {selectedVideoId && (
                  <button className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1" onClick={() => { setShowCommentInput(true); setCommentTimestamp(Math.round(currentTime)); }}>
                    <Plus size={12} /> 添加
                  </button>
                )}
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mb-1">
              {selectedCommentStudent
                ? `汇总 ${getStudentName(selectedCommentStudent)} 所有视频的点评，按视频分组`
                : selectedVideoId
                  ? `显示当前视频的点评`
                  : '请选择视频或学员查看点评'}
            </div>
            {totalCommentsCount === 0 && <p className="text-xs text-[var(--text-muted)] py-2">暂无点评</p>}
            {groupedComments.map(group => {
              const isExpanded = expandedVideoGroups.has(group.videoId) || selectedVideoId === group.videoId;
              return (
                <div key={group.videoId} className="mb-2 border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => { if (selectedVideoId !== group.videoId) toggleVideoGroup(group.videoId); }}>
                    {selectedVideoId !== group.videoId && (isExpanded ? <ChevronDown size={12} className="text-[var(--text-muted)] flex-shrink-0" /> : <ChevronRight size={12} className="text-[var(--text-muted)] flex-shrink-0" />)}
                    <Video size={12} className="text-[var(--primary)] flex-shrink-0" />
                    <span className="text-xs font-medium text-[var(--navy)] truncate flex-1">{group.videoPath}</span>
                    <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{group.recordDate}</span>
                    <span className="text-[10px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-full flex-shrink-0">{group.comments.length}</span>
                    {selectedVideoId !== group.videoId && (
                      <button className="text-[10px] text-[var(--primary)] hover:underline flex-shrink-0" onClick={e => { e.stopPropagation(); setSelectedVideoId(group.videoId); }}>打开</button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="px-3 py-1">
                      {group.comments.map(c => (
                        <div key={c.id} className="py-2 border-b border-[var(--border)] last:border-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <button className="text-xs font-mono text-[var(--text-light)] hover:text-[var(--primary)] bg-gray-100 px-1.5 py-0.5 rounded" onClick={() => jumpToVideoAndTime(group.videoId, c.timestamp)}>{formatTime(c.timestamp)}</button>
                            <span className="text-[10px] text-[var(--text-muted)]">{dayjs(c.createdAt).format('MM-DD HH:mm')}</span>
                          </div>
                          <p className="text-sm pl-1">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {showCommentInput && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCommentInput(false)}>
            <div className="card w-80 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h3 className="font-semibold text-[var(--navy)]">添加点评</h3><button onClick={() => setShowCommentInput(false)}><X size={16} /></button></div>
              <div>
                <label className="text-xs text-[var(--text-light)]">时间戳 (秒)</label>
                <input type="number" step="0.1" className="input-field mt-1" value={commentTimestamp} onChange={e => setCommentTimestamp(Number(e.target.value))} min={0} max={duration} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-light)]">点评内容</label>
                <textarea className="input-field mt-1" rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="输入点评..." />
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary text-sm" onClick={() => setShowCommentInput(false)}>取消</button>
                <button className="btn-primary text-sm" onClick={handleAddComment}>确认</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
