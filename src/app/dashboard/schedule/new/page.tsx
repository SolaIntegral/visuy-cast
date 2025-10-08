'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import QuadrantMapping from '@/components/QuadrantMapping';
import TimeBasedBackground from '@/components/TimeBasedBackground';
import { LoadData } from '@/types';
import { createSchedule } from '@/lib/firebase/firestore';
import Link from 'next/link';

type InputType = 'event' | 'task';

export default function NewSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [inputType, setInputType] = useState<InputType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // イベント用
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  
  // タスク用
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('');
  
  const [loadData, setLoadData] = useState<LoadData>({
    emotional: 0,
    activity: 0,
    intensity: 0.5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('ログインしてください。');
      return;
    }

    if (inputType === 'event' && !date) {
      setError('日付は必須です。');
      return;
    }

    if (inputType === 'task' && (!deadline || !duration)) {
      setError('締切日と所要時間は必須です。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (inputType === 'event') {
        const scheduleDate = new Date(date);
        
        await createSchedule(user.uid, {
          title,
          description,
          date: scheduleDate,
          startTime,
          endTime,
          load: loadData,
        });

        router.push('/dashboard');
      } else {
        // タスクの場合は最適日提案を表示（今はシミュレート）
        alert('タスクの最適日提案機能は次のフェーズで実装されます！');
      }
    } catch (err) {
      setError('登録中にエラーが発生しました。');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <TimeBasedBackground />
      
      {/* Header */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-light text-white drop-shadow-lg">
              Visuy Cast
            </Link>
            <Link
              href="/dashboard"
              className="text-white/90 hover:text-white font-light"
            >
              ← 戻る
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pb-24">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center pt-8">
            <h1 className="mb-3 text-white drop-shadow-lg text-3xl font-light">新規登録</h1>
            <p className="text-white/80 drop-shadow-sm font-light text-lg">イベントまたはタスクを追加</p>
          </div>

          {/* Type Toggle */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-8">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setInputType('event')}
                className={`px-6 py-3 rounded-xl font-light transition-all ${
                  inputType === 'event'
                    ? 'bg-white/20 text-white drop-shadow-md'
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                📅 イベント（日時確定）
              </button>
              <button
                type="button"
                onClick={() => setInputType('task')}
                className={`px-6 py-3 rounded-xl font-light transition-all ${
                  inputType === 'task'
                    ? 'bg-white/20 text-white drop-shadow-md'
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                🎯 タスク（日時未定）
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="backdrop-blur-sm bg-red-500/20 border border-red-300/30 text-white px-4 py-3 rounded-2xl font-light">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
              <h3 className="text-white/95 drop-shadow-sm mb-6 text-lg font-light">基本情報</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2">
                    タイトル
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={inputType === 'event' ? '講義名、アルバイトなど' : 'レポート作成、課題など'}
                    className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-light rounded-2xl px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2">
                    詳細（任意）
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="詳細な説明を入力..."
                    rows={3}
                    className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-light rounded-2xl px-4 py-3"
                  />
                </div>

                {inputType === 'event' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2">
                          日付
                        </label>
                        <input
                          id="date"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white font-light rounded-2xl px-4 py-3"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="time" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2">
                          時間
                        </label>
                        <input
                          id="time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white font-light rounded-2xl px-4 py-3"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2 flex items-center gap-2">
                        <span>📍</span>
                        場所（任意）
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="教室、勤務先など"
                        className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-light rounded-2xl px-4 py-3"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="deadline" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2">
                          締切日
                        </label>
                        <input
                          id="deadline"
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white font-light rounded-2xl px-4 py-3"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="duration" className="text-white/90 drop-shadow-sm font-light text-sm block mb-2 flex items-center gap-2">
                          <span>⏰</span>
                          所要時間
                        </label>
                        <select
                          id="duration"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white font-light rounded-2xl px-4 py-3"
                          required
                        >
                          <option value="">選択</option>
                          <option value="30">30分</option>
                          <option value="60">1時間</option>
                          <option value="90">1.5時間</option>
                          <option value="120">2時間</option>
                          <option value="180">3時間</option>
                          <option value="240">4時間</option>
                          <option value="300">5時間以上</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Load Quadrant Mapping */}
            <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-white/90 drop-shadow-sm text-xl">🧠</span>
                <h3 className="text-white/95 drop-shadow-sm text-lg font-light">メンタル負荷マッピング</h3>
              </div>
              <div className="space-y-6">
                <div className="text-sm text-white/70 text-center drop-shadow-sm font-light">
                  このタスクがあなたに与える影響を選択してください
                </div>
                
                <div className="flex justify-center">
                  <QuadrantMapping
                    value={loadData}
                    onChange={setLoadData}
                    size={350}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 font-light rounded-2xl px-6 py-4 text-lg disabled:opacity-50"
              >
                {inputType === 'event' 
                  ? (loading ? '保存中...' : 'イベントを登録') 
                  : (loading ? '提案中...' : 'タスクを登録')}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 z-20">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1 font-light">ホーム</span>
          </Link>

          <Link
            href="/dashboard/schedule"
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <span className="text-xl">📅</span>
            <span className="text-xs mt-1 font-light">カレンダー</span>
          </Link>

          <div className="flex flex-col items-center justify-center p-3 bg-white/30 text-white rounded-full shadow-lg backdrop-blur-md -mt-8">
            <span className="text-2xl">➕</span>
          </div>

          <Link
            href="/dashboard/analysis"
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <span className="text-xl">📊</span>
            <span className="text-xs mt-1 font-light">分析</span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs mt-1 font-light">プロフィール</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
