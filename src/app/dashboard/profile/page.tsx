'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/firebase/firestore';
import { generateWeekForecast } from '@/lib/weatherForecast';
import { WeatherForecast } from '@/types';
import TimeBasedBackground from '@/components/TimeBasedBackground';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [weekForecast, setWeekForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [showShare, setShowShare] = useState(false);

  // モック統計データ
  const userStats = {
    sunnyDays: 5,
    completedTasks: 8,
    goldenTimeHours: 12,
    averageCapacity: 78
  };

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { schedules } = await getSchedules(user.uid, today, endDate);
    const forecast = generateWeekForecast(today, 7, schedules);
    setWeekForecast(forecast);
    setLoading(false);
  };

  const handleGenerateShareUrl = () => {
    const mockToken = Math.random().toString(36).substring(7);
    const url = `${window.location.origin}/share/${mockToken}`;
    setShareUrl(url);
    setShowShare(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('URLをコピーしました！');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TimeBasedBackground />
        <div className="text-white text-xl font-light drop-shadow-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <TimeBasedBackground />

      {/* Header */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-2xl font-light text-white drop-shadow-lg">
            Visuy Cast
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pb-24">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center pt-8">
            <h1 className="mb-3 text-white drop-shadow-lg text-3xl font-light">プロフィール</h1>
            <p className="text-white/80 drop-shadow-sm font-light text-lg">あなたの成長を可視化</p>
          </div>

          {/* User Info */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full backdrop-blur-sm bg-white/15 flex items-center justify-center text-white text-2xl font-light">
                {user?.displayName?.[0] || user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-white/95 drop-shadow-sm text-xl font-light">
                  {user?.displayName || 'ユーザー'}
                </h2>
                <p className="text-sm text-white/70 drop-shadow-sm font-light">{user?.email}</p>
              </div>
              <button className="backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 font-light px-3 py-2 rounded-lg text-sm">
                ⚙️
              </button>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-white/90 drop-shadow-sm text-xl">🏆</span>
              <h3 className="text-white/95 drop-shadow-sm text-lg font-light">今週のサマリー</h3>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="text-center p-5 backdrop-blur-sm bg-white/5 rounded-2xl">
                <div className="text-3xl mb-2 drop-shadow-sm">☀️</div>
                <div className="text-2xl mb-2 text-white/95 drop-shadow-sm font-thin">{userStats.sunnyDays}</div>
                <div className="text-xs text-white/70 drop-shadow-sm font-light">快晴日数</div>
              </div>
              
              <div className="text-center p-5 backdrop-blur-sm bg-white/5 rounded-2xl">
                <div className="text-3xl mb-2 drop-shadow-sm">✅</div>
                <div className="text-2xl mb-2 text-white/95 drop-shadow-sm font-thin">{userStats.completedTasks}</div>
                <div className="text-xs text-white/70 drop-shadow-sm font-light">完了タスク</div>
              </div>
              
              <div className="text-center p-5 backdrop-blur-sm bg-white/5 rounded-2xl">
                <div className="text-3xl mb-2 drop-shadow-sm">⏰</div>
                <div className="text-2xl mb-2 text-white/95 drop-shadow-sm font-thin">{userStats.goldenTimeHours}h</div>
                <div className="text-xs text-white/70 drop-shadow-sm font-light">ゴールデンタイム</div>
              </div>
              
              <div className="text-center p-5 backdrop-blur-sm bg-white/5 rounded-2xl">
                <div className="text-3xl mb-2 drop-shadow-sm">📊</div>
                <div className="text-2xl mb-2 text-white/95 drop-shadow-sm font-thin">{userStats.averageCapacity}%</div>
                <div className="text-xs text-white/70 drop-shadow-sm font-light">平均キャパシティ</div>
              </div>
            </div>
          </div>

          {/* Capacity Sharing */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-white/90 drop-shadow-sm text-xl">📤</span>
              <h3 className="text-white/95 drop-shadow-sm text-lg font-light">キャパシティ共有</h3>
            </div>
            <div className="space-y-6">
              <div className="text-sm text-white/70 drop-shadow-sm font-light leading-relaxed">
                あなたの「天気予報」を友達や家族と共有できます。予定の詳細は共有されません。
              </div>

              {/* Share Preview */}
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-5">
                <h4 className="mb-4 text-center text-white/95 drop-shadow-sm font-light">
                  {user?.displayName || 'ユーザー'}さんのキャパシティ共有
                </h4>
                <div className="grid grid-cols-7 gap-3">
                  {weekForecast.map((forecast, index) => {
                    const dayName = ['日', '月', '火', '水', '木', '金', '土'][forecast.date.getDay()];
                    const capacity = Math.round((1 - forecast.totalLoad) * 100);
                    const status = capacity >= 80 ? '余裕あり' : capacity >= 60 ? '普通' : capacity >= 40 ? '忙しい' : '休息日';
                    
                    return (
                      <div key={index} className="text-center">
                        <div className="text-xs text-white/70 mb-2 drop-shadow-sm font-light">{dayName}</div>
                        <div className="text-xl mb-2 drop-shadow-sm">{forecast.weather}</div>
                        <div className="text-xs text-white/70 drop-shadow-sm font-light">{status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 backdrop-blur-sm bg-white/5 rounded-2xl">
                <span className="text-white/80">🛡️</span>
                <div className="text-sm text-white/90 drop-shadow-sm font-light leading-relaxed">
                  プライバシー保護: 予定の内容や場所などの詳細情報は一切共有されません
                </div>
              </div>

              {!showShare ? (
                <button 
                  onClick={handleGenerateShareUrl}
                  className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 font-light rounded-2xl py-3 flex items-center justify-center gap-2"
                >
                  <span>📤</span>
                  キャパシティ共有URLを作成
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white font-light"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-4 py-2 bg-white/15 text-white rounded-lg hover:bg-white/20 font-light"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-white/90 drop-shadow-sm text-xl">⚙️</span>
              <h3 className="text-white/95 drop-shadow-sm text-lg font-light">設定</h3>
            </div>
            <div className="space-y-4">
              <button className="w-full justify-start backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 font-light rounded-2xl px-4 py-3 flex items-center gap-3">
                <span>📅</span>
                通知設定
              </button>
              <button className="w-full justify-start backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 font-light rounded-2xl px-4 py-3 flex items-center gap-3">
                <span>🎯</span>
                目標設定
              </button>
              <button className="w-full justify-start backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 font-light rounded-2xl px-4 py-3 flex items-center gap-3">
                <span>🛡️</span>
                プライバシー設定
              </button>
            </div>
          </div>
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

          <Link
            href="/dashboard/schedule/new"
            className="flex flex-col items-center justify-center p-3 bg-white/30 text-white rounded-full shadow-lg backdrop-blur-md -mt-8"
          >
            <span className="text-2xl">➕</span>
          </Link>

          <Link
            href="/dashboard/analysis"
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <span className="text-xl">📊</span>
            <span className="text-xs mt-1 font-light">分析</span>
          </Link>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white bg-white/20">
            <span className="text-xl">👤</span>
            <span className="text-xs mt-1 font-light">プロフィール</span>
          </div>
        </div>
      </div>
    </div>
  );
}
