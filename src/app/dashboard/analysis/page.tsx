'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/firebase/firestore';
import { Schedule } from '@/types';
import { calculateLoadScore, groupSchedulesByDate } from '@/lib/weatherForecast';
import TimeBasedBackground from '@/components/TimeBasedBackground';
import Link from 'next/link';

export default function AnalysisPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalContent, setNewJournalContent] = useState('');

  // モックジャーナルデータ
  const journalEntries = [
    {
      id: 1,
      date: '10/7',
      weather: '☀️',
      capacity: 90,
      title: '新しいプログラミング言語に挑戦',
      content: '今日はPythonの基礎を学んだ。思ったより理解しやすくて、どんどん進められた。明日も続けたい。',
      tags: ['学習', '成長', 'プログラミング']
    },
    {
      id: 2,
      date: '10/6',
      weather: '🌧️',
      capacity: 35,
      title: '疲れた日の過ごし方',
      content: 'バイトが忙しくて疲れた。こんな日は無理せず、好きな映画を見てリラックスした。',
      tags: ['休息', 'リフレッシュ']
    },
    {
      id: 3,
      date: '10/4',
      weather: '☀️',
      capacity: 90,
      title: 'プレゼンテーション成功',
      content: 'ゼミでのプレゼンが上手くいった！準備をしっかりしたおかげで自信を持って話せた。',
      tags: ['達成感', '自信', 'プレゼン']
    }
  ];

  useEffect(() => {
    if (user) {
      loadAnalysisData();
    }
  }, [user, selectedPeriod]);

  const loadAnalysisData = async () => {
    if (!user) return;

    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    
    if (selectedPeriod === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const { schedules: fetchedSchedules } = await getSchedules(user.uid, startDate, endDate);
    setSchedules(fetchedSchedules);
    setLoading(false);
  };

  const prepareChartData = () => {
    const grouped = groupSchedulesByDate(schedules);
    const data: { date: string; load: number; count: number }[] = [];

    const days = selectedPeriod === 'week' ? 7 : 30;
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const daySchedules = grouped.get(dateKey) || [];
      const totalLoad = daySchedules.reduce((sum, s) => sum + calculateLoadScore(s.load), 0);

      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        load: totalLoad,
        count: daySchedules.length,
      });
    }

    return data;
  };

  const chartData = prepareChartData();
  const maxLoad = Math.max(...chartData.map(d => d.load), 1);
  
  const totalSchedules = schedules.length;
  const avgLoad = schedules.length > 0
    ? schedules.reduce((sum, s) => sum + calculateLoadScore(s.load), 0) / schedules.length
    : 0;
  const avgCapacity = Math.round((1 - avgLoad) * 100);
  const sunnyDays = chartData.filter(d => d.load < 0.3).length;

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
            <h1 className="mb-3 text-white drop-shadow-lg text-3xl font-light">分析＆ジャーナル</h1>
            <p className="text-white/80 drop-shadow-sm font-light text-lg">データと感情で振り返る成長の軌跡</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="backdrop-blur-sm bg-white/3 rounded-3xl">
              <div className="pt-8 px-6 pb-8">
                <div className="text-center">
                  <div className="text-3xl mb-3 drop-shadow-sm">☀️</div>
                  <div className="text-3xl mb-2 text-white/95 font-thin drop-shadow-sm">{sunnyDays}</div>
                  <div className="text-sm text-white/70 font-light">今週の快晴日数</div>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-white/3 rounded-3xl">
              <div className="pt-8 px-6 pb-8">
                <div className="text-center">
                  <div className="text-3xl mb-3 drop-shadow-sm">📊</div>
                  <div className="text-3xl mb-2 text-white/95 font-thin drop-shadow-sm">{avgCapacity}%</div>
                  <div className="text-sm text-white/70 font-light">平均キャパシティ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-6 py-2 rounded-lg font-light transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 text-white/80 border border-white/20'
              }`}
            >
              週間
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-6 py-2 rounded-lg font-light transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 text-white/80 border border-white/20'
              }`}
            >
              月間
            </button>
          </div>

          {/* Capacity Chart */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl">
            <div className="pt-8 px-6">
              <h3 className="flex items-center gap-3 mb-6 text-white/95 text-lg font-light drop-shadow-sm">
                <span>📈</span>
                こころの気圧変動グラフ
              </h3>
            </div>
            <div className="px-6 pb-8">
              <div className="h-64 flex items-end justify-between gap-1">
                {chartData.map((data, index) => {
                  const height = (data.load / maxLoad) * 100;
                  
                  let barColor = 'bg-green-400/70';
                  if (data.load > maxLoad * 0.7) {
                    barColor = 'bg-red-400/70';
                  } else if (data.load > maxLoad * 0.4) {
                    barColor = 'bg-yellow-400/70';
                  }

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                      <div className="w-full flex flex-col items-center justify-end h-64">
                        <div
                          className={`w-full ${barColor} rounded-t-lg transition-all hover:opacity-80 cursor-pointer backdrop-blur-sm`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/70 mt-2 font-light">{data.date.split('/')[1]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/20 mt-2" />
            </div>
          </div>

          {/* Journal Section */}
          <div className="backdrop-blur-sm bg-white/3 rounded-3xl">
            <div className="pt-8 px-6">
              <h3 className="flex items-center gap-3 mb-6 text-white/95 text-lg font-light drop-shadow-sm">
                <span>💝</span>
                成長ジャーナル
              </h3>
            </div>
            <div className="px-6 pb-8 space-y-6">
              {/* Add Journal Button */}
              {!showJournalForm && (
                <button 
                  onClick={() => setShowJournalForm(true)}
                  className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 font-light py-3 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  今日の振り返りを記録
                </button>
              )}

              {/* Journal Form */}
              {showJournalForm && (
                <div className="space-y-5 p-6 backdrop-blur-sm bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span>📅</span>
                    <span className="text-sm text-white/90 font-light">
                      {new Date().toLocaleDateString('ja-JP')} ☀️ キャパシティ90%
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-light text-white/90 block mb-2">タイトル</label>
                    <input
                      type="text"
                      value={newJournalTitle}
                      onChange={(e) => setNewJournalTitle(e.target.value)}
                      placeholder="今日の学びや達成感を一言で..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 backdrop-blur-sm font-light"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-light text-white/90 block mb-2">内容</label>
                    <textarea
                      value={newJournalContent}
                      onChange={(e) => setNewJournalContent(e.target.value)}
                      placeholder="今日あった出来事、学んだこと、感じたことを自由に書いてください..."
                      rows={4}
                      className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-white/50 backdrop-blur-sm font-light rounded-2xl"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowJournalForm(false)}
                      className="bg-white/15 hover:bg-white/20 text-white border-0 font-light px-4 py-2 rounded-lg"
                    >
                      保存
                    </button>
                    <button 
                      onClick={() => setShowJournalForm(false)}
                      className="bg-white/10 hover:bg-white/15 text-white border border-white/20 font-light px-4 py-2 rounded-lg"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {/* Journal Entries */}
              <div className="space-y-5">
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="backdrop-blur-sm bg-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/70 font-light">{entry.date}</span>
                        <span className="text-lg">{entry.weather}</span>
                        <span className="text-xs bg-white/10 text-white/90 border-0 font-light px-2 py-1 rounded-lg">
                          {entry.capacity}%
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="mb-3 text-white/95 font-light drop-shadow-sm">{entry.title}</h4>
                    <p className="text-sm text-white/80 mb-4 font-light leading-relaxed">{entry.content}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-white/5 text-white/70 border border-white/20 font-light px-2 py-1 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="backdrop-blur-sm bg-gradient-to-r from-blue-400/15 to-purple-400/10 rounded-3xl">
            <div className="pt-8 px-6">
              <h3 className="flex items-center gap-3 mb-6 text-white/95 text-lg font-light drop-shadow-sm">
                <span>🧠</span>
                インサイト
              </h3>
            </div>
            <div className="px-6 pb-8">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-blue-300/80 rounded-full mt-3"></div>
                  <div>
                    <p className="text-sm text-white/90 font-light leading-relaxed">
                      <strong className="font-medium">パターン発見:</strong> 午前中のタスクを完了した日は、キャパシティが20%高い傾向があります。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-green-300/80 rounded-full mt-3"></div>
                  <div>
                    <p className="text-sm text-white/90 font-light leading-relaxed">
                      <strong className="font-medium">成長ポイント:</strong> プレゼンテーション関連のタスクで自信を獲得していることがジャーナルから読み取れます。
                    </p>
                  </div>
                </div>
              </div>
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

          <div className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white bg-white/20">
            <span className="text-xl">📊</span>
            <span className="text-xs mt-1 font-light">分析</span>
          </div>

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
