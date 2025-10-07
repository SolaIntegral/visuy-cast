'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import QuadrantMapping from '@/components/QuadrantMapping';
import { LoadData, WeatherForecast } from '@/types';
import { createSchedule, getSchedules } from '@/lib/firebase/firestore';
import { generateWeekForecast, suggestOptimalDates } from '@/lib/weatherForecast';
import Link from 'next/link';

export default function NewSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // 種別選択（イベント or タスク）
  const [type, setType] = useState<'event' | 'task'>('event');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // タスク専用フィールド
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [loadData, setLoadData] = useState<LoadData>({
    emotional: 0,
    activity: 0,
    intensity: 0.5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [suggestedDates, setSuggestedDates] = useState<Date[]>([]);

  // AI提案を取得
  const handleGetSuggestions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 既存のスケジュールを取得
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // 2週間先まで
      
      const { schedules } = await getSchedules(user.uid, today, endDate);
      
      // 週間予報を生成
      const forecast = generateWeekForecast(today, 14, schedules);
      
      // 最適な日付を提案
      const optimal = suggestOptimalDates(forecast, loadData, 3);
      setSuggestedDates(optimal);
      setShowAISuggestions(true);
    } catch (err) {
      setError('AI提案の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 提案された日付を選択
  const handleSelectSuggestion = (suggestedDate: Date) => {
    const dateString = suggestedDate.toISOString().split('T')[0];
    setDate(dateString);
    setShowAISuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('ログインしてください。');
      return;
    }

    if (!title || !date) {
      setError('タイトルと日付は必須です。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const scheduleDate = new Date(date);
      
      console.log('Creating schedule with data:', {
        title,
        description,
        date: scheduleDate,
        startTime,
        endTime,
        load: loadData,
      });

      const { schedule, error: createError } = await createSchedule(user.uid, {
        title,
        description,
        date: scheduleDate,
        startTime,
        endTime,
        load: loadData,
      });

      if (createError) {
        console.error('Create schedule error:', createError);
        setError(`予定の作成に失敗しました: ${createError.message}`);
        setLoading(false);
        return;
      }

      console.log('Schedule created successfully:', schedule);

      // 成功したらダッシュボードに戻る
      router.push('/dashboard');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`予定の作成中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Visuy Cast
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900"
            >
              ← 戻る
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            新しい予定を追加
          </h1>
          
          {/* ① 種別選択トグル */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-2 shadow-lg inline-flex">
              <button
                type="button"
                onClick={() => setType('event')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  type === 'event'
                    ? 'bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 イベント（日時指定）
              </button>
              <button
                type="button"
                onClick={() => setType('task')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  type === 'task'
                    ? 'bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✓ タスク（日時未定）
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {type === 'event' 
                ? '日時が確定している予定を登録します（例: 授業、アルバイト）'
                : 'やるべきことだが日時は未定のタスクを登録します（例: レポート作成、課題）'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 基本情報 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: プログラミング課題"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  説明（任意）
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="予定の詳細を入力してください"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                />
              </div>

              {/* イベント用フィールド */}
              {type === 'event' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                      日付 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                      開始時刻（任意）
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                      終了時刻（任意）
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* タスク用フィールド */}
              {type === 'task' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                        所要時間 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                        required
                      >
                        <option value="">選択してください</option>
                        <option value="30">30分</option>
                        <option value="60">1時間</option>
                        <option value="90">1時間30分</option>
                        <option value="120">2時間</option>
                        <option value="180">3時間</option>
                        <option value="240">4時間</option>
                        <option value="300">5時間以上</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                        締切日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 所要時間と締切日を入力すると、キャパシティに余裕がある最適な実行日を提案します
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI提案表示 */}
            {showAISuggestions && suggestedDates.length > 0 && (
              <div className="bg-gradient-to-br from-[#a0d2eb]/10 to-[#b2f2bb]/10 rounded-2xl p-6 border-2 border-[#a0d2eb]">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🤖</span>
                  AI推奨日程
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  キャパシティに余裕のある日程を提案しました。クリックして選択できます。
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {suggestedDates.map((suggestedDate, index) => {
                    const dateString = suggestedDate.toLocaleDateString('ja-JP', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    });
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestedDate)}
                        className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#a0d2eb] text-left"
                      >
                        <div className="text-sm text-gray-500 mb-1">推奨 {index + 1}</div>
                        <div className="font-semibold text-gray-900">{dateString}</div>
                        <div className="text-xs text-green-600 mt-2">✓ 余裕あり</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 負荷設定 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                負荷の設定
              </h2>
              <p className="text-gray-600 mb-6">
                この予定があなたに与える負荷を、感情と活動の2軸で設定してください。<br />
                円の中心から離れるほど、負荷が大きくなります。
              </p>

              <div className="flex justify-center">
                <QuadrantMapping
                  value={loadData}
                  onChange={setLoadData}
                  size={400}
                />
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">💡 使い方のヒント</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>上（ポジティブ）</strong>: 楽しい、やる気が出る</li>
                  <li>• <strong>下（ネガティブ）</strong>: ストレス、プレッシャー</li>
                  <li>• <strong>左（インプット）</strong>: 講義、読書など受け身的な活動</li>
                  <li>• <strong>右（アウトプット）</strong>: 発表、制作など能動的な活動</li>
                  <li>• <strong>中心からの距離</strong>: 負荷の強さ（遠いほど強い）</li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              {type === 'event' ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a0d2eb] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '保存中...' : '📅 イベントを保存'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '提案中...' : '🤖 最適日を探す'}
                </button>
              )}
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

