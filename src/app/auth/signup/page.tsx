'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { saveUser } from '@/lib/firebase/firestore';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください。');
      return;
    }

    setLoading(true);

    const { user, error: signupError } = await signUpWithEmail(email, password);
    
    if (signupError) {
      setError('アカウント作成に失敗しました。既に登録されているメールアドレスの可能性があります。');
      setLoading(false);
      return;
    }

    if (user) {
      // ユーザー情報をFirestoreに保存
      await saveUser(user.uid, {
        id: user.uid,
        email: user.email || '',
        displayName: name,
        profile: {
          name: name,
          capacitySettings: {
            dailyCapacity: 1.0,
            weeklyCapacity: 7.0,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      router.push('/dashboard');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    const { user, error: signupError } = await signInWithGoogle();
    
    if (signupError) {
      setError('Googleアカウントでの登録に失敗しました。');
      setLoading(false);
      return;
    }

    if (user) {
      // ユーザー情報をFirestoreに保存
      await saveUser(user.uid, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        profile: {
          name: user.displayName || '',
          capacitySettings: {
            dailyCapacity: 1.0,
            weeklyCapacity: 7.0,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#a0d2eb] to-[#b2f2bb] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-gray-900 mb-2">
            Visuy Cast
          </h1>
          <p className="text-center text-sm text-gray-600">
            こころの天気予報
          </p>
        </div>

        <div>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
            アカウント作成
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleEmailSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（6文字以上）
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a0d2eb] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#a0d2eb] to-[#b2f2bb] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a0d2eb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'アカウント作成中...' : 'アカウント作成'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a0d2eb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでアカウント作成
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="font-medium text-[#4a5568] hover:text-[#2d3748]"
            >
              既にアカウントをお持ちの方はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

