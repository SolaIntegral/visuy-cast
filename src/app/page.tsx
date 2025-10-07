'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb]">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Visuy Cast
          </h1>
          <p className="text-2xl text-white mb-4">
            こころの天気予報
          </p>
          <p className="text-lg text-white/90 mb-12">
            未来の「こころの容量」を予報する、次世代のセルフケア・スケジュール帳
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
            >
              今すぐ始める
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              メンタルウェザー予報
            </h3>
            <p className="text-gray-600">
              未来のキャパシティを天気予報のように可視化。一目で「ヤバい日」が分かります。
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              4象限マッピングUI
            </h3>
            <p className="text-gray-600">
              予定の負荷を感情と活動の2軸で記録。多角的な自己理解を促します。
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AIタスク提案
            </h3>
            <p className="text-gray-600">
              キャパシティに余裕のある最適な実行日をAIが提案します。
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-24 max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            なぜVisuy Castなのか
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              従来のスケジュール帳は「時間」を管理するものでした。しかし、時間管理だけでは防げない「見えない負荷」による燃え尽きやストレスが問題となっています。
            </p>
            <p>
              Visuy Castは、予定の「精神的負荷」という新しい指標を導入。あなたのメンタルキャパシティを天気予報のように予測・可視化し、キャパシティオーバーを未然に防ぎます。
            </p>
            <p className="font-medium text-[#4a5568]">
              「時間（What/When）」ではなく「こころの容量（How you feel）」を管理する、全く新しいカテゴリーのツールです。
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/auth/signup"
            className="inline-block px-12 py-5 bg-white text-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-2xl"
          >
            無料で始める
          </Link>
        </div>
      </div>
    </div>
  );
}
