'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/firebase/firestore';
import { generateWeekForecast } from '@/lib/weatherForecast';
import { WeatherForecast } from '@/types';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [weekForecast, setWeekForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [showShare, setShowShare] = useState(false);

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
    // 実際のアプリではサーバーサイドでトークンを生成
    const mockToken = Math.random().toString(36).substring(7);
    const url = `${window.location.origin}/share/${mockToken}`;
    setShareUrl(url);
    setShowShare(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('URLをコピーしました！');
  };

  const getCurrentStatus = () => {
    if (weekForecast.length === 0) return { weather: '☀️', description: 'データなし' };
    
    const today = weekForecast[0];
    return {
      weather: today.weather,
      description: today.description,
    };
  };

  const status = getCurrentStatus();

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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              プロフィール
            </h1>
            <p className="text-gray-600">
              あなたの現在の状態と共有設定
            </p>
          </div>

          {/* User Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.displayName?.[0] || user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {user?.displayName || 'ユーザー'}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb] rounded-2xl p-8 shadow-lg mb-8 text-white">
            <h2 className="text-xl font-semibold mb-4">現在のキャパシティ状況</h2>
            <div className="flex items-center space-x-6">
              <div className="text-7xl">{status.weather}</div>
              <div className="flex-1">
                <div className="text-3xl font-bold mb-2">
                  {status.weather === '☀️' ? '快晴' :
                   status.weather === '🌤️' ? '晴れ時々曇り' :
                   status.weather === '☁️' ? '曇り' :
                   status.weather === '🌧️' ? '雨' : '雷雨'}
                </div>
                <p className="text-lg opacity-90">{status.description}</p>
              </div>
            </div>
          </div>

          {/* Week Forecast Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">週間予報プレビュー</h2>
            <div className="grid grid-cols-7 gap-2">
              {weekForecast.map((forecast, index) => {
                const dayName = ['日', '月', '火', '水', '木', '金', '土'][forecast.date.getDay()];
                return (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">{dayName}</div>
                    <div className="text-3xl">{forecast.weather}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * これは共有時に他の人に表示されるプレビューです（予定名は非表示）
            </p>
          </div>

          {/* Share Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">共有設定</h2>
            <p className="text-gray-600 mb-6">
              あなたの天気予報カレンダーを友人や家族と共有できます。<br />
              予定の内容は表示されず、天気予報のみが共有されます。
            </p>

            {!showShare ? (
              <button
                onClick={handleGenerateShareUrl}
                className="px-6 py-3 bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] text-white rounded-lg font-medium hover:opacity-90"
              >
                共有URLを生成
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                  >
                    コピー
                  </button>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <div className="font-medium mb-1">プライバシーについて</div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>予定のタイトルや詳細は表示されません</li>
                        <li>天気予報（負荷レベル）のみが共有されます</li>
                        <li>このURLを知っている人のみアクセスできます</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Capacity Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">キャパシティ設定</h2>
            <p className="text-gray-600 mb-6">
              あなたのデフォルトキャパシティを設定できます。<br />
              これは天気予報の計算に使用されます。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1日あたりのキャパシティ
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  defaultValue="1.0"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>少なめ</span>
                  <span>標準</span>
                  <span>多め</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  週あたりのキャパシティ
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.5"
                  defaultValue="7.0"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>少なめ</span>
                  <span>標準</span>
                  <span>多め</span>
                </div>
              </div>

              <div className="pt-4">
                <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                  設定を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

