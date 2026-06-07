import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import type { VideoAnnotation, KeyFrame, CoachComment } from '@/lib/types';
import { Video, Plus, Trash2, MessageSquare, Bookmark, Play, Pause, SkipBack } from 'lucide-react';
import dayjs from 'dayjs';

export default function VideoTags() {
  const { students, videoAnnotations, keyFrames, coachComments, addVideoAnnotation, deleteVideoAnnotation, addKeyFrame, deleteKeyFrame, addCoachComment } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingFrameId, setEditingFrameId] = useState<number | null>(null);
  const [frameDesc, setFrameDesc] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredVideos = videoAnnotations.filter(v => !selectedStudentId || v.studentId === selectedStudentId);
  const selectedVideo = videoAnnotations.find(v => v.id === selectedVideoId) || null;
  const videoKeyFrames = keyFrames.filter(k => k.videoId === selectedVideoId);
  const videoComments = coachComments.filter(c => c.videoId === selectedVideoId);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(t => {
          if (t >= duration) { setIsPlaying(false); return duration; }
          return t + 0.1;
        });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, duration]);

  const handleImportVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const studentId = selectedStudentId ? Number(selectedStudentId) : students[0]?.id;
    if (!studentId) return;
    await addVideoAnnotation({ studentId, videoPath: file.name, recordDate: dayjs().format('YYYY-MM-DD') });
    e.target.value = '';
  };

  const handleAddKeyFrame = async () => {
    if (!selectedVideoId) return;
    await addKeyFrame({ videoId: selectedVideoId, timestamp: Math.round(currentTime * 10) / 10, description: '', thumbnail: '' });
  };

  const handleSaveFrameDesc = async (frame: KeyFrame) => {
    setEditingFrameId(null);
    if (frameDesc.trim() && frame.id) {
      await addKeyFrame({ videoId: frame.videoId, timestamp: frame.timestamp, description: frameDesc, thumbnail: frame.thumbnail });
      await deleteKeyFrame(frame.id);
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

  return (
    <div className="flex gap-4 h-full p-4">
      <div className="w-1/3 flex flex-col gap-3">
        <h2 className="section-title">视频列表</h2>
        <select className="select-field" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredVideos.map(v => (
            <div key={v.id} className={`card flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-[var(--primary)] transition-all ${selectedVideoId === v.id ? 'ring-2 ring-[var(--primary)]' : ''}`} onClick={() => { setSelectedVideoId(v.id!); setCurrentTime(0); setIsPlaying(false); }}>
              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <Video size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getStudentName(v.studentId)}</p>
                <p className="text-xs text-[var(--text-light)]">{v.videoPath}</p>
                <p className="text-xs text-[var(--text-muted)]">{v.recordDate}</p>
              </div>
              <button className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); deleteVideoAnnotation(v.id!); if (selectedVideoId === v.id) setSelectedVideoId(null); }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {filteredVideos.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-8">暂无视频</p>}
        </div>
        <input ref={fileInputRef} type="file" accept=".mp4,.mov" className="hidden" onChange={handleImportVideo} />
        <button className="btn-primary flex items-center justify-center gap-2 w-full" onClick={() => fileInputRef.current?.click()}>
          <Plus size={16} /> 导入视频
        </button>
      </div>

      <div className="w-1/3 flex flex-col gap-3">
        <h2 className="section-title">视频播放</h2>
        {selectedVideo ? (
          <>
            <div className="bg-[var(--navy-dark)] rounded-xl aspect-video flex items-center justify-center relative">
              {isPlaying ? (
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setIsPlaying(false)}>
                  <Pause size={48} />
                </button>
              ) : (
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setIsPlaying(true)}>
                  <Play size={48} />
                </button>
              )}
              <p className="absolute bottom-3 text-white/40 text-xs">{selectedVideo.videoPath}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-gray-100" onClick={() => { setCurrentTime(0); setIsPlaying(false); }}>
                <SkipBack size={16} />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1 relative h-2 bg-gray-200 rounded-full cursor-pointer" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setCurrentTime(((e.clientX - rect.left) / rect.width) * duration); }}>
                <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
                {videoKeyFrames.map(kf => (
                  <div key={kf.id} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--primary-dark)] rounded-full border-2 border-white shadow" style={{ left: `${(kf.timestamp / duration) * 100}%` }} />
                ))}
              </div>
              <span className="text-xs font-mono text-[var(--text-light)] w-24 text-right">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <button className="btn-secondary flex items-center justify-center gap-2 w-full" onClick={handleAddKeyFrame}>
              <Bookmark size={16} /> 添加关键帧
            </button>
          </>
        ) : (
          <div className="flex-1 card flex items-center justify-center text-[var(--text-muted)]">
            请从左侧选择视频
          </div>
        )}
      </div>

      <div className="w-1/3 flex flex-col gap-3 overflow-hidden">
        <h2 className="section-title">标注与点评</h2>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--navy)] mb-2">关键帧</h3>
            {videoKeyFrames.length === 0 && <p className="text-xs text-[var(--text-muted)] py-2">暂无关键帧</p>}
            {videoKeyFrames.map(kf => (
              <div key={kf.id} className="flex items-center gap-2 py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-xs font-mono bg-[var(--navy)] text-white px-2 py-0.5 rounded">{formatTime(kf.timestamp)}</span>
                {editingFrameId === kf.id ? (
                  <input className="input-field text-xs flex-1" value={frameDesc} onChange={e => setFrameDesc(e.target.value)} onBlur={() => handleSaveFrameDesc(kf)} onKeyDown={e => e.key === 'Enter' && handleSaveFrameDesc(kf)} autoFocus />
                ) : (
                  <span className="text-sm flex-1 cursor-pointer hover:text-[var(--primary)]" onClick={() => { setEditingFrameId(kf.id!); setFrameDesc(kf.description); setCurrentTime(kf.timestamp); }}>
                    {kf.description || '点击添加描述...'}
                  </span>
                )}
                <button className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={() => deleteKeyFrame(kf.id!)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--navy)]">教练点评</h3>
              {selectedVideoId && (
                <button className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1" onClick={() => { setShowCommentInput(true); setCommentTimestamp(Math.round(currentTime)); }}>
                  <Plus size={12} /> 添加点评
                </button>
              )}
            </div>
            {videoComments.length === 0 && <p className="text-xs text-[var(--text-muted)] py-2">暂无点评</p>}
            {videoComments.map(c => (
              <div key={c.id} className="py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={12} className="text-[var(--primary)]" />
                  <span className="text-xs font-mono text-[var(--text-light)]">{formatTime(c.timestamp)}</span>
                  <span className="text-xs text-[var(--text-muted)]">{dayjs(c.createdAt).format('MM-DD HH:mm')}</span>
                </div>
                <p className="text-sm pl-5">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
        {showCommentInput && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCommentInput(false)}>
            <div className="card w-80 space-y-3" onClick={e => e.stopPropagation()}>
              <h3 className="font-semibold text-[var(--navy)]">添加点评</h3>
              <div>
                <label className="text-xs text-[var(--text-light)]">时间戳 (秒)</label>
                <input type="number" className="input-field mt-1" value={commentTimestamp} onChange={e => setCommentTimestamp(Number(e.target.value))} min={0} max={duration} />
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
