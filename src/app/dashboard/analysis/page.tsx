'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/firebase/firestore';
import { Schedule } from '@/types';
import { 
  calculateLoadScore, 
  groupSchedulesByDate,
  calculateAverageLoad,
  findPeakLoadDay,
  generateWeekForecast
} from '@/lib/weatherForecast';
import Link from 'next/link';

export default function AnalysisPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

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

  // 日別の負荷データを準備
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
        date: dateKey,
        load: totalLoad,
        count: daySchedules.length,
      });
    }

    return data;
  };

  const chartData = prepareChartData();
  const maxLoad = Math.max(...chartData.map(d => d.load), 1);
  
  // 統計情報の計算
  const totalSchedules = schedules.length;
  const avgLoad = schedules.length > 0
    ? schedules.reduce((sum, s) => sum + calculateLoadScore(s.load), 0) / schedules.length
    : 0;

  const positiveCount = schedules.filter(s => s.load.emotional > 0).length;
  const negativeCount = schedules.filter(s => s.load.emotional < 0).length;
  const outputCount = schedules.filter(s => s.load.activity > 0).length;
  const inputCount = schedules.filter(s => s.load.activity < 0).length;

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
            分析レポート
          </h1>
          <p className="text-gray-600">
            あなたのこころの気圧変動を可視化
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            週間
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            月間
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">総予定数</div>
            <div className="text-3xl font-bold text-gray-900">{totalSchedules}</div>
            <div className="text-xs text-gray-500 mt-1">件</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">平均負荷</div>
            <div className="text-3xl font-bold text-gray-900">
              {(avgLoad * 100).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">%</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">感情バランス</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                <span className="text-xl">😊</span>
                <span className="ml-1 text-sm font-medium">{positiveCount}</span>
              </div>
              <div className="text-gray-400">/</div>
              <div className="flex items-center">
                <span className="text-xl">😰</span>
                <span className="ml-1 text-sm font-medium">{negativeCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 mb-1">活動バランス</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                <span className="text-xl">📤</span>
                <span className="ml-1 text-sm font-medium">{outputCount}</span>
              </div>
              <div className="text-gray-400">/</div>
              <div className="flex items-center">
                <span className="text-xl">📥</span>
                <span className="ml-1 text-sm font-medium">{inputCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 気圧変動グラフ */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            こころの気圧変動グラフ
          </h2>
          
          {chartData.length === 0 || maxLoad === 1 ? (
            <div className="text-center text-gray-500 py-12">
              この期間のデータがありません
            </div>
          ) : (
            <div className="relative">
              {/* Y軸ラベル */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                <div>高</div>
                <div>中</div>
                <div>低</div>
              </div>

              {/* グラフ本体 */}
              <div className="ml-8">
                <div className="h-64 flex items-end justify-between gap-1">
                  {chartData.map((data, index) => {
                    const height = (data.load / maxLoad) * 100;
                    const date = new Date(data.date);
                    const dayLabel = date.getDate();
                    
                    let barColor = 'bg-green-400';
                    if (data.load > maxLoad * 0.7) {
                      barColor = 'bg-red-400';
                    } else if (data.load > maxLoad * 0.4) {
                      barColor = 'bg-yellow-400';
                    }

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group relative">
                        <div className="w-full flex flex-col items-center justify-end h-64">
                          <div
                            className={`w-full ${barColor} rounded-t-lg transition-all hover:opacity-80 cursor-pointer`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{dayLabel}</div>
                        
                        {/* ツールチップ */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {data.date}<br />
                          負荷: {(data.load * 100).toFixed(0)}%<br />
                          予定: {data.count}件
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* X軸 */}
                <div className="border-t-2 border-gray-300 mt-2" />
              </div>
            </div>
          )}
        </div>

        {/* パターン分析 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            パターン分析
          </h2>
          
          <div className="space-y-4">
            {positiveCount > negativeCount ? (
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-medium text-gray-900">ポジティブ傾向</div>
                  <div className="text-sm text-gray-600">
                    ポジティブな予定が多い傾向にあります。この調子を維持しましょう！
                  </div>
                </div>
              </div>
            ) : negativeCount > positiveCount ? (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-medium text-gray-900">ストレス注意</div>
                  <div className="text-sm text-gray-600">
                    ネガティブな予定が多めです。リフレッシュの時間を確保することをお勧めします。
                  </div>
                </div>
              </div>
            ) : null}

            {outputCount > inputCount * 1.5 ? (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <span className="text-2xl">💪</span>
                <div>
                  <div className="font-medium text-gray-900">アウトプット重視</div>
                  <div className="text-sm text-gray-600">
                    アウトプット型の活動が多い傾向です。インプットの時間も大切にしましょう。
                  </div>
                </div>
              </div>
            ) : inputCount > outputCount * 1.5 ? (
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-medium text-gray-900">インプット重視</div>
                  <div className="text-sm text-gray-600">
                    インプット型の活動が多い傾向です。学んだことをアウトプットする機会も作りましょう。
                  </div>
                </div>
              </div>
            ) : null}

            {avgLoad > 0.7 ? (
              <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="font-medium text-gray-900">高負荷警告</div>
                  <div className="text-sm text-gray-600">
                    全体的に負荷が高めです。予定の見直しや休息の確保を強く推奨します。
                  </div>
                </div>
              </div>
            ) : avgLoad < 0.3 ? (
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <span className="text-2xl">☀️</span>
                <div>
                  <div className="font-medium text-gray-900">良好な状態</div>
                  <div className="text-sm text-gray-600">
                    負荷が適切に管理されています。この調子で続けましょう！
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

