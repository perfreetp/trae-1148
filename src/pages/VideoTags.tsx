import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { Video, Plus, Trash2, MessageSquare, Bookmark, Play, Pause, SkipBack, X } from 'lucide-react';
import dayjs from 'dayjs';

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
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVideos = videoAnnotations.filter(v => !selectedStudentId || v.studentId === selectedStudentId);
  const selectedVideo = videoAnnotations.find(v => v.id === selectedVideoId) || null;
  const videoKeyFrames = keyFrames.filter(k => k.videoId === selectedVideoId).sort((a, b) => a.timestamp - b.timestamp);
  const videoComments = coachComments.filter(c => c.videoId === selectedVideoId).sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

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
    await addKeyFrame({ videoId: selectedVideoId, timestamp: Math.round(t * 10) / 10, description: '', thumbnail: '' });
  };

  const handleSaveFrameDesc = async (frameId: number) => {
    setEditingFrameId(null);
    if (frameDesc.trim() && frameId) {
      await updateKeyFrame(frameId, { description: frameDesc });
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
            <div key={v.id} className={`card flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-[var(--primary)] transition-all py-3 ${selectedVideoId === v.id ? 'ring-2 ring-[var(--primary)]' : ''}`} onClick={() => setSelectedVideoId(v.id ?? null)}>
              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                {v.videoBlob ? <Video size={20} className="text-[var(--primary)]" /> : <Video size={20} className="text-gray-400" />}
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
                  <div key={kf.id} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow cursor-pointer hover:scale-125" style={{ left: duration ? `${(kf.timestamp / duration) * 100}%` : '0%', backgroundColor: 'var(--primary-dark)' }} title={kf.description || formatTime(kf.timestamp)} onClick={e => { e.stopPropagation(); seekTo(kf.timestamp); }} />
                ))}
              </div>
              <span className="text-xs font-mono text-[var(--text-light)] w-28 text-right">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <button className="btn-secondary flex items-center justify-center gap-2 w-full" onClick={handleAddKeyFrame}>
              <Bookmark size={16} /> 添加关键帧 (当前: {formatTime(currentTime)})
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
            <h3 className="text-sm font-semibold text-[var(--navy)] mb-2">关键帧 ({videoKeyFrames.length})</h3>
            {videoKeyFrames.length === 0 && <p className="text-xs text-[var(--text-muted)] py-2">暂无关键帧，点击上方按钮添加</p>}
            {videoKeyFrames.map(kf => (
              <div key={kf.id} className="flex items-center gap-2 py-2 border-b border-[var(--border)] last:border-0">
                <button className="text-xs font-mono bg-[var(--navy)] text-white px-2 py-0.5 rounded hover:opacity-80" onClick={() => seekTo(kf.timestamp)}>{formatTime(kf.timestamp)}</button>
                {editingFrameId === kf.id ? (
                  <input className="input-field text-xs flex-1" value={frameDesc} onChange={e => setFrameDesc(e.target.value)} onBlur={() => handleSaveFrameDesc(kf.id!)} onKeyDown={e => e.key === 'Enter' && handleSaveFrameDesc(kf.id!)} autoFocus />
                ) : (
                  <span className="text-sm flex-1 cursor-pointer hover:text-[var(--primary)] truncate" onClick={() => { setEditingFrameId(kf.id!); setFrameDesc(kf.description); }}>
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
              <h3 className="text-sm font-semibold text-[var(--navy)]">教练点评 ({videoComments.length})</h3>
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
                  <button className="text-xs font-mono text-[var(--text-light)] hover:text-[var(--primary)]" onClick={() => seekTo(c.timestamp)}>{formatTime(c.timestamp)}</button>
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
