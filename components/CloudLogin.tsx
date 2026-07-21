import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from './ui/Button';

export const CloudLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登入失敗，請確認帳號密碼';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E3F6ED] p-6 relative overflow-hidden leaf-pattern">
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-nook-yellow/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-nook-blue/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-nook-cream border-8 border-white rounded-[3rem] shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-nook-beige text-4xl mb-4">
            ☁️
          </div>
          <h1 className="text-3xl font-black text-nook-brown mb-3">雲端登入</h1>
          <p className="text-nook-brown/70 font-bold leading-relaxed">
            請輸入你在 Firebase 建立的 Email 與密碼。
            <br />
            同一組帳號登入不同裝置，就會看到同一份家庭資料。
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="block text-sm font-bold text-nook-brown mb-2 ml-1">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-nook-green/20 focus:border-nook-green outline-none text-nook-brown font-bold bg-white"
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm font-bold text-nook-brown mb-2 ml-1">密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full p-4 border-2 border-nook-brown/10 rounded-2xl focus:ring-4 focus:ring-nook-green/20 focus:border-nook-green outline-none text-nook-brown font-bold bg-white"
              placeholder="Firebase password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-2xl bg-nook-red/10 border-2 border-nook-red/20 text-nook-red px-4 py-3 font-bold text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full py-4 text-lg" disabled={isSubmitting}>
            {isSubmitting ? '登入中...' : '進入雲端家庭資料'}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl bg-white/70 border-2 border-nook-brown/10 px-4 py-3 text-sm text-nook-brown/70">
          第一次切換到 Firebase 時，如果這台裝置原本有 IndexedDB 資料，系統會自動搬到雲端。
        </div>
      </div>
    </div>
  );
};
