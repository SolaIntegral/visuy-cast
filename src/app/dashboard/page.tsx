'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/firebase/auth';
import { getSchedules } from '@/lib/firebase/firestore';
import { generateWeekForecast } from '@/lib/weatherForecast';
import { Schedule, WeatherForecast } from '@/types';
import Link from 'next/link';

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
      // 過去7日から未来30日までのデータを取得
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0); // 時刻を0時に設定
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999); // 時刻を23:59:59に設定

      console.log('Loading dashboard data for user:', user.uid);
      console.log('Date range:', startDate, 'to', endDate);

      const { schedules: fetchedSchedules, error } = await getSchedules(user.uid, startDate, endDate);
      
      if (error) {
        console.error('Error fetching schedules:', error);
      }
      
      console.log('Fetched schedules:', fetchedSchedules.length, 'items');
      console.log('Schedule details:', fetchedSchedules);
      setSchedules(fetchedSchedules);

      // 天気予報は今日から7日間
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const forecast = generateWeekForecast(today, 7, fetchedSchedules);
      console.log('Generated forecast:', forecast);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Visuy Cast
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-[#4a5568] font-medium">
                ダッシュボード
              </Link>
              <Link href="/dashboard/schedule" className="text-gray-700 hover:text-[#4a5568] font-medium">
                スケジュール
              </Link>
              <Link href="/dashboard/analysis" className="text-gray-700 hover:text-[#4a5568] font-medium">
                分析
              </Link>
              <Link href="/dashboard/profile" className="text-gray-700 hover:text-[#4a5568] font-medium">
                プロフィール
              </Link>
            </nav>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              {loggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            おかえりなさい、{user.displayName || 'ユーザー'}さん
          </h1>
          <p className="text-gray-600">
            今日もあなたの成長の余白を見つけましょう
          </p>
        </div>

        {/* Today's Weather */}
        {dataLoading ? (
          <div className="text-center text-gray-600 mb-8">天気予報を読み込み中...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb] rounded-2xl p-6 text-white shadow-lg">
              <h2 className="text-xl font-semibold mb-4">今日の天気</h2>
              <div className="flex items-center justify-between mb-4">
                <div className="text-7xl">{weekForecast[0]?.weather || '☀️'}</div>
                <div className="text-right">
                  <p className="text-3xl font-bold mb-1">
                    {weekForecast[0]?.weather === '☀️' ? '快晴' :
                     weekForecast[0]?.weather === '🌤️' ? '晴れ時々曇り' :
                     weekForecast[0]?.weather === '☁️' ? '曇り' :
                     weekForecast[0]?.weather === '🌧️' ? '雨' : '雷雨'}
                  </p>
                  <p className="text-lg font-medium">
                    キャパシティ {weekForecast[0] ? Math.round((1 - weekForecast[0].totalLoad) * 100) : 90}%
                  </p>
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-sm font-medium mb-1">💡 今日のアドバイス</p>
                <p className="text-sm opacity-90">
                  {weekForecast[0]?.weather === '☀️' ? '新しい挑戦に最適な日です！難しいタスクに取り組みましょう。' :
                   weekForecast[0]?.weather === '🌤️' ? '適度な負荷です。計画的に進めれば問題ありません。' :
                   weekForecast[0]?.weather === '☁️' ? '少し休憩を入れながら、無理のないペースで進めましょう。' :
                   weekForecast[0]?.weather === '🌧️' ? '軽めのタスクを中心に。自分を労わる時間も大切です。' : 
                   '今日は休養日に。予定の見直しを検討しましょう。'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">明日の予報</h2>
              <div className="text-6xl mb-2">{weekForecast[1]?.weather || '🌤️'}</div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {weekForecast[1]?.weather === '☀️' ? '快晴' :
                 weekForecast[1]?.weather === '🌤️' ? '晴れ時々曇り' :
                 weekForecast[1]?.weather === '☁️' ? '曇り' :
                 weekForecast[1]?.weather === '🌧️' ? '雨' : '雷雨'}
              </p>
              <p className="text-sm text-gray-600">
                {weekForecast[1]?.description || '適度な負荷です。'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">週間予報</h2>
              <div className="space-y-2">
                {weekForecast.map((forecast, index) => {
                  const dayName = ['日', '月', '火', '水', '木', '金', '土'][forecast.date.getDay()];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{dayName}</span>
                      <span className="text-2xl">{forecast.weather}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Today's Events */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">③ 今日のイベント</h2>
          {schedules.filter(s => {
            const today = new Date();
            const scheduleDate = new Date(s.date);
            return today.toDateString() === scheduleDate.toDateString();
          }).length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              今日の予定はありません 🎉<br />
              <span className="text-sm">ゴールデンタイムを活用しましょう！</span>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.filter(s => {
                const today = new Date();
                const scheduleDate = new Date(s.date);
                return today.toDateString() === scheduleDate.toDateString();
              }).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{schedule.title}</h3>
                    {schedule.startTime && schedule.endTime && (
                      <p className="text-sm text-gray-500">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {schedule.load.emotional > 0 ? '😊' : '😰'}
                    </span>
                    <span className="text-xl">
                      {schedule.load.activity > 0 ? '📤' : '📥'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unscheduled Tasks */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">④ 未スケジュールタスク</h2>
          <p className="text-sm text-gray-600 mb-4">締切が近づいているタスクから配置していきましょう</p>
          
          {/* サンプルタスク（モック） */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">📝 プログラミング課題</h3>
                  <p className="text-sm text-gray-600">締切: 3日後 • 所要時間: 3時間</p>
                </div>
                <span className="text-2xl">⚠️</span>
              </div>
              <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                このタスクを配置する
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">📚 読書レポート作成</h3>
                  <p className="text-sm text-gray-600">締切: 1週間後 • 所要時間: 2時間</p>
                </div>
                <span className="text-2xl">📖</span>
              </div>
              <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                このタスクを配置する
              </button>
            </div>

            <Link
              href="/dashboard/schedule/new"
              className="block text-center py-3 text-[#4a5568] hover:text-[#2d3748] font-medium"
            >
              + 新しいタスクを追加
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/schedule/new"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#a0d2eb] hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">➕</div>
                <div className="font-medium text-gray-700">イベント/タスク追加</div>
              </div>
            </Link>

            <Link
              href="/dashboard/analysis"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#a0d2eb] hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="font-medium text-gray-700">成長ジャーナル</div>
              </div>
            </Link>

            <Link
              href="/dashboard/profile"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#a0d2eb] hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">👤</div>
                <div className="font-medium text-gray-700">プロフィール</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Schedules */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最近の予定</h2>
          {schedules.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              まだ予定が登録されていません。<br />
              <Link href="/dashboard/schedule/new" className="text-[#4a5568] hover:underline font-medium">
                予定を追加
              </Link>
              して、こころの天気予報を始めましょう！
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.slice(0, 5).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{schedule.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(schedule.date).toLocaleDateString('ja-JP', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {schedule.load.emotional > 0 ? '😊' : '😰'}
                    </span>
                    <span className="text-xl">
                      {schedule.load.activity > 0 ? '📤' : '📥'}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {(schedule.load.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {schedules.length > 5 && (
                <Link
                  href="/dashboard/schedule"
                  className="block text-center text-[#4a5568] hover:underline font-medium pt-2"
                >
                  全ての予定を見る
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

