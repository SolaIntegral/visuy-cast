'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/firebase/firestore';
import { Schedule, WeatherForecast } from '@/types';
import { generateWeekForecast } from '@/lib/weatherForecast';
import TimeBasedBackground from '@/components/TimeBasedBackground';
import Link from 'next/link';

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weekForecast, setWeekForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);

  const loadSchedules = async () => {
    if (!user) return;

    setLoading(true);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { schedules: fetchedSchedules } = await getSchedules(user.uid, startDate, endDate);
    setSchedules(fetchedSchedules);

    const today = new Date();
    const forecast = generateWeekForecast(today, 30, fetchedSchedules);
    setWeekForecast(forecast);

    setLoading(false);
  };

  const getDayData = (dayNumber: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), dayNumber);
    const forecast = weekForecast.find(f => f.date.getDate() === dayNumber);
    
    return {
      date: dayNumber,
      weather: forecast?.weather || '☀️',
      capacity: forecast ? Math.round((1 - forecast.totalLoad) * 100) : 90,
      events: forecast?.scheduleCount || 0,
      hasGoldenTime: forecast?.scheduleCount === 0 && forecast?.weather === '☀️',
      isToday: today.getDate() === dayNumber
    };
  };

  const getDayBackground = (day: { date: number; weather: string; capacity: number; events: number; hasGoldenTime: boolean; isToday: boolean }) => {
    let baseClass = 'relative p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/10';
    
    if (day.isToday) {
      baseClass += ' ring-1 ring-white/30 bg-white/10';
    } else if (selectedDate === day.date) {
      baseClass += ' bg-white/15';
    }
    
    if (day.hasGoldenTime) {
      baseClass += ' bg-gradient-to-br from-yellow-400/20 to-orange-400/15';
    }
    
    return baseClass;
  };

  const getCapacityColor = (capacity: number) => {
    if (capacity >= 80) return 'text-green-400';
    if (capacity >= 60) return 'text-yellow-400';
    if (capacity >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  };

  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

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
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-light text-white drop-shadow-lg">
              Visuy Cast
            </Link>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-light rounded-lg transition-colors ${
                  viewMode === 'month' 
                    ? 'bg-white/15 text-white' 
                    : 'bg-white/5 text-white/80 border border-white/20'
                }`}
              >
                月
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-light rounded-lg transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-white/15 text-white' 
                    : 'bg-white/5 text-white/80 border border-white/20'
                }`}
              >
                週
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pb-24">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-8">
            <h1 className="text-white drop-shadow-lg text-3xl font-light">カレンダー</h1>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-2">
            <button className="text-white/90 hover:bg-white/10 border-0 font-light px-3 py-2 rounded-lg">
              ←
            </button>
            <h2 className="text-white/95 drop-shadow-sm text-xl font-light">{getCurrentMonth()}</h2>
            <button className="text-white/90 hover:bg-white/10 border-0 font-light px-3 py-2 rounded-lg">
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl">
            <div className="pt-8 px-6 pb-8">
              {/* Week headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                  <div key={index} className="text-center text-sm text-white/70 p-3 font-light">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* 月初めの空セル */}
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }, (_, index) => (
                  <div key={`empty-${index}`} className="p-2"></div>
                ))}
                
                {/* カレンダーの日 */}
                {Array.from({ length: getDaysInMonth() }, (_, index) => {
                  const day = getDayData(index + 1);
                  return (
                    <div
                      key={day.date}
                      className={getDayBackground(day)}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className="text-center">
                        <div className="text-sm mb-2 text-white/95 font-light">{day.date}</div>
                        <div className="text-xl mb-2 drop-shadow-sm">{day.weather}</div>
                        <div className={`text-xs font-light ${getCapacityColor(day.capacity)}`}>
                          {day.capacity}%
                        </div>
                        {day.events > 0 && (
                          <div className="flex justify-center mt-2">
                            <div className="w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                          </div>
                        )}
                        {day.hasGoldenTime && (
                          <div className="absolute top-2 right-2">
                            <span className="text-yellow-300 drop-shadow-sm">✨</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Golden Time Legend */}
          <div className="backdrop-blur-sm bg-gradient-to-r from-yellow-400/15 to-orange-400/10 rounded-3xl">
            <div className="pt-8 px-6 pb-8">
              <div className="flex items-center gap-4">
                <span className="text-2xl drop-shadow-sm">✨</span>
                <div>
                  <h3 className="mb-2 text-white/95 text-lg font-light drop-shadow-sm">ゴールデンタイム</h3>
                  <p className="text-sm text-white/80 font-light leading-relaxed">
                    予定がなく、キャパシティが高い時間帯。新しい挑戦に最適です。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDayData && (
            <div className="backdrop-blur-sm bg-white/3 rounded-3xl">
              <div className="pt-8 px-6">
                <h3 className="flex items-center gap-3 mb-6 text-white/95 text-lg font-light drop-shadow-sm">
                  <span className="text-2xl">{selectedDayData.weather}</span>
                  {getCurrentMonth().slice(0, -1)}{selectedDayData.date}日の詳細
                </h3>
              </div>
              <div className="px-6 pb-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/90 font-light">キャパシティ</span>
                  <div className={`flex items-center gap-3 ${getCapacityColor(selectedDayData.capacity)}`}>
                    <span className="font-light">{selectedDayData.capacity}%</span>
                    <div className="w-24 h-1 bg-white/15 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-current rounded-full transition-all duration-300"
                        style={{ width: `${selectedDayData.capacity}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/90 font-light">予定数</span>
                  <span className="bg-white/10 text-white/90 border-0 font-light px-3 py-1 rounded-lg text-sm">
                    {selectedDayData.events}件
                  </span>
                </div>

                {selectedDayData.hasGoldenTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 font-light">ゴールデンタイム</span>
                    <span className="bg-yellow-400/20 text-white border-0 font-light px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                      <span>✨</span>
                      あり
                    </span>
                  </div>
                )}

                {selectedDayData.hasGoldenTime && (
                  <Link
                    href="/dashboard/schedule/new"
                    className="block w-full mt-6 bg-white/10 hover:bg-white/15 text-white border-0 font-light text-center py-3 rounded-lg"
                  >
                    この日にタスクを配置
                  </Link>
                )}
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
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1 font-light">ホーム</span>
          </Link>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white bg-white/20">
            <span className="text-xl">📅</span>
            <span className="text-xs mt-1 font-light">カレンダー</span>
          </div>

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
