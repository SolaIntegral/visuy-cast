'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/firebase/auth';
import { getSchedules } from '@/lib/firebase/firestore';
import { generateWeekForecast } from '@/lib/weatherForecast';
import { Schedule, WeatherForecast } from '@/types';
import Link from 'next/link';
import TimeBasedBackground from '@/components/TimeBasedBackground';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weekForecast, setWeekForecast] = useState<WeatherForecast[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);

      const { schedules: fetchedSchedules } = await getSchedules(user.uid, startDate, endDate);
      setSchedules(fetchedSchedules);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const forecast = generateWeekForecast(today, 7, fetchedSchedules);
      setWeekForecast(forecast);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TimeBasedBackground />
        <div className="text-white text-xl font-light drop-shadow-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const todayEvents = schedules.filter(s => {
    const today = new Date();
    const scheduleDate = new Date(s.date);
    return today.toDateString() === scheduleDate.toDateString();
  });

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
            
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 text-sm font-light text-white/90 hover:text-white disabled:opacity-50 backdrop-blur-sm bg-white/10 rounded-lg"
            >
              {loggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pb-24">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Welcome */}
          <div className="text-center pt-8">
            <h1 className="mb-3 text-white drop-shadow-lg text-3xl font-light">
              おかえりなさい、{user.displayName || 'ユーザー'}さん
            </h1>
            <p className="text-white/90 drop-shadow-sm text-lg font-light">
              今日も素晴らしい一日を！
            </p>
          </div>

          {/* Today's Weather - 透明デザイン */}
          <div className="min-h-[40vh] flex flex-col justify-center px-4">
            <div className="text-center">
              <div className="text-9xl mb-8 drop-shadow-2xl">
                {weekForecast[0]?.weather || '☀️'}
              </div>
              <div className="space-y-6">
                <div className="text-6xl text-white drop-shadow-lg font-thin">
                  {weekForecast[0] ? Math.round((1 - weekForecast[0].totalLoad) * 100) : 90}%
                </div>
                <h2 className="text-2xl text-white/95 drop-shadow-md font-light">
                  {weekForecast[0]?.weather === '☀️' ? '快晴' :
                   weekForecast[0]?.weather === '🌤️' ? '晴れ時々曇り' :
                   weekForecast[0]?.weather === '☁️' ? '曇り' :
                   weekForecast[0]?.weather === '🌧️' ? '雨' : '雷雨'}
                </h2>
                <p className="text-lg text-white/85 drop-shadow-sm max-w-sm mx-auto leading-relaxed font-light">
                  {weekForecast[0]?.weather === '☀️' ? '新しい挑戦に最適な日です！難しいタスクに取り組みましょう。' :
                   weekForecast[0]?.weather === '🌤️' ? '適度な負荷です。計画的に進めれば問題ありません。' :
                   weekForecast[0]?.weather === '☁️' ? '少し休憩を入れながら、無理のないペースで進めましょう。' :
                   weekForecast[0]?.weather === '🌧️' ? '軽めのタスクを中心に。自分を労わる時間も大切です。' : 
                   '今日は休養日に。予定の見直しを検討しましょう。'}
                </p>
              </div>
              
              {/* Capacity Bar */}
              <div className="mt-8 max-w-sm mx-auto">
                <div className="relative">
                  <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-white/60 to-white/40 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${weekForecast[0] ? Math.round((1 - weekForecast[0].totalLoad) * 100) : 90}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-3 drop-shadow-sm font-light">
                    メンタルキャパシティ
                  </div>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="mt-6 inline-flex items-center gap-2">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-sm text-white/90 drop-shadow-sm font-light">絶好調</span>
              </div>
            </div>
          </div>

          {/* Weekly Forecast */}
          <div className="px-2">
            <h3 className="mb-4 text-white/90 drop-shadow-sm font-light text-lg">週間予報</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {weekForecast.map((forecast, index) => {
                const dayName = ['日', '月', '火', '水', '木', '金', '土'][forecast.date.getDay()];
                const dateStr = `${forecast.date.getMonth() + 1}/${forecast.date.getDate()}`;
                const capacity = Math.round((1 - forecast.totalLoad) * 100);
                
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 backdrop-blur-sm bg-white/5 rounded-2xl p-4 min-w-[75px] text-center"
                  >
                    <div className="text-xs text-white/70 drop-shadow-sm mb-2 font-light">
                      {index === 0 ? '今日' : index === 1 ? '明日' : dayName}
                    </div>
                    <div className="text-xs text-white/60 drop-shadow-sm mb-3 font-light">{dateStr}</div>
                    <div className="text-2xl mb-3 drop-shadow-md">{forecast.weather}</div>
                    <div className="text-xs text-white/80 drop-shadow-sm font-light">{capacity}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Events */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-white/80 drop-shadow-sm">📅</span>
              <h3 className="text-white/90 drop-shadow-sm font-light text-lg">今日のイベント</h3>
            </div>
            <div className="space-y-4">
              {todayEvents.length === 0 ? (
                <div className="text-center text-white/70 py-6 font-light">
                  今日の予定はありません 🎉<br />
                  <span className="text-sm">ゴールデンタイムを活用しましょう！</span>
                </div>
              ) : (
                todayEvents.map((schedule) => (
                  <div key={schedule.id} className="backdrop-blur-sm bg-white/5 rounded-2xl p-4">
                    <div className="font-light text-white/95 drop-shadow-sm mb-2">{schedule.title}</div>
                    {schedule.startTime && schedule.endTime && (
                      <div className="text-white/70 flex items-center gap-2 text-sm font-light drop-shadow-sm">
                        <span>🕐</span>
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unscheduled Tasks */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-white/80 drop-shadow-sm">🎯</span>
              <h3 className="text-white/90 drop-shadow-sm font-light text-lg">未スケジュールタスク</h3>
            </div>
            <div className="space-y-4">
              {/* モックタスク */}
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-light text-white/95 drop-shadow-sm mb-2">📝 プログラミング課題</div>
                    <div className="text-sm text-white/70 drop-shadow-sm font-light mb-3">
                      締切: 3日後 • 所要時間: 3時間
                    </div>
                    <div className="inline-flex items-center backdrop-blur-sm bg-white/10 border border-white/20 text-white/90 font-light px-2 py-1 rounded-lg text-xs">
                      高優先度
                    </div>
                  </div>
                  <button className="backdrop-blur-sm bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 font-light px-3 py-1 rounded-lg text-sm">
                    配置する
                  </button>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-light text-white/95 drop-shadow-sm mb-2">📚 読書レポート作成</div>
                    <div className="text-sm text-white/70 drop-shadow-sm font-light mb-3">
                      締切: 1週間後 • 所要時間: 2時間
                    </div>
                    <div className="inline-flex items-center backdrop-blur-sm bg-white/10 border border-white/20 text-white/90 font-light px-2 py-1 rounded-lg text-xs">
                      中優先度
                    </div>
                  </div>
                  <button className="backdrop-blur-sm bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 font-light px-3 py-1 rounded-lg text-sm">
                    配置する
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Golden Time Alert */}
          {weekForecast.some(f => f.scheduleCount === 0 && f.weather === '☀️') && (
            <div className="backdrop-blur-sm bg-gradient-to-r from-yellow-400/15 to-orange-400/10 rounded-3xl p-8">
              <div className="text-center">
                <div className="text-3xl mb-4 drop-shadow-lg">✨</div>
                <h3 className="mb-3 text-white/95 drop-shadow-sm font-light text-lg">ゴールデンタイム発見！</h3>
                <p className="text-sm text-white/80 mb-6 drop-shadow-sm font-light leading-relaxed max-w-xs mx-auto">
                  明日の午前中に余裕があります。新しいタスクに最適です
                </p>
                <Link
                  href="/dashboard/schedule/new"
                  className="inline-block backdrop-blur-sm bg-white/15 hover:bg-white/20 text-white border border-white/20 font-light px-6 py-2 rounded-lg"
                >
                  タスクを配置
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 z-20">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white bg-white/20"
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
