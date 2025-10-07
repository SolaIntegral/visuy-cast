'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/firebase/firestore';
import { Schedule, WeatherForecast } from '@/types';
import { generateWeekForecast } from '@/lib/weatherForecast';
import Link from 'next/link';

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weekForecast, setWeekForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

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

    // 週間予報を生成
    const today = new Date();
    const forecast = generateWeekForecast(today, 7, fetchedSchedules);
    setWeekForecast(forecast);

    setLoading(false);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getSchedulesForDate = (date: Date): Schedule[] => {
    const dateKey = new Date(date).toISOString().split('T')[0];
    return schedules.filter((schedule) => {
      const scheduleKey = new Date(schedule.date).toISOString().split('T')[0];
      return scheduleKey === dateKey;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Visuy Cast
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">読み込み中...</div>
        </main>
      </div>
    );
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
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900"
            >
              ← ダッシュボード
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            スケジュール
          </h1>
          <p className="text-gray-600">
            あなたの予定とこころの天気予報
          </p>
        </div>

        {/* Week Forecast */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">週間天気予報</h2>
          <div className="grid grid-cols-7 gap-4">
            {weekForecast.map((forecast, index) => {
              const dayName = ['日', '月', '火', '水', '木', '金', '土'][forecast.date.getDay()];
              const isToday = new Date().toDateString() === forecast.date.toDateString();
              
              return (
                <div
                  key={index}
                  className={`text-center p-4 rounded-lg ${
                    isToday ? 'bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb] text-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium mb-2">{dayName}</div>
                  <div className="text-3xl mb-2">{forecast.weather}</div>
                  <div className="text-xs">
                    {forecast.scheduleCount}件
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">カレンダー</h2>
            <Link
              href="/dashboard/schedule/new"
              className="px-4 py-2 bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white rounded-lg font-medium hover:opacity-90"
            >
              + 予定を追加
            </Link>
          </div>

          {weekForecast.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              予定がありません。
            </div>
          ) : (
            <div className="space-y-6">
              {weekForecast.map((forecast, index) => {
                const daySchedules = getSchedulesForDate(forecast.date);
                if (daySchedules.length === 0) return null;

                return (
                  <div key={index} className="border-l-4 border-[#a0d2eb] pl-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{forecast.weather}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {formatDate(forecast.date)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {forecast.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {schedule.title}
                              </h4>
                              {schedule.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {schedule.description}
                                </p>
                              )}
                              {schedule.startTime && schedule.endTime && (
                                <p className="text-sm text-gray-500">
                                  {schedule.startTime} - {schedule.endTime}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-xs text-gray-500 mb-1">負荷</div>
                              <div className="flex items-center space-x-1">
                                <span className="text-sm">
                                  {schedule.load.emotional > 0 ? '😊' : '😰'}
                                </span>
                                <span className="text-sm">
                                  {schedule.load.activity > 0 ? '📤' : '📥'}
                                </span>
                                <span className="text-sm font-medium">
                                  {(schedule.load.intensity * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Schedules */}
        {schedules.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              全ての予定（{schedules.length}件）
            </h2>
            <div className="space-y-2">
              {schedules
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{schedule.title}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(schedule.date)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>
                        {schedule.load.emotional > 0 ? '😊' : '😰'}
                      </span>
                      <span>
                        {schedule.load.activity > 0 ? '📤' : '📥'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

