import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from './ui/Button';
import { GardenFlower } from './GardenFlower';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden leaf-pattern">
      <div className="w-full max-w-sm bg-white rounded-2xl soft-card p-5 md:p-6 relative z-10 animate-pop">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-nook-green/10 flex items-center justify-center flex-shrink-0">
            <GardenFlower size={30} />
          </div>
          <div>
            <p className="text-[11px] font-black tracking-[0.16em] text-nook-greenDark">SWEET HOME</p>
            <h1 className="text-xl font-black text-nook-brown">回到家庭花園</h1>
            <p className="text-xs text-nook-brown/55 font-bold mt-0.5">登入後即可同步所有家庭資料</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="block text-xs font-bold text-nook-brown/70 mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 border border-nook-brown/15 rounded-xl focus:ring-2 focus:ring-nook-green/25 focus:border-nook-green outline-none text-nook-brown font-bold bg-nook-cream text-base"
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="block text-xs font-bold text-nook-brown/70 mb-1.5">密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 border border-nook-brown/15 rounded-xl focus:ring-2 focus:ring-nook-green/25 focus:border-nook-green outline-none text-nook-brown font-bold bg-nook-cream text-base"
              placeholder="Firebase password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-xl bg-nook-red/10 text-nook-red px-3 py-2.5 font-bold text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '登入中...' : '進入家庭花園'}
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-nook-beige/60 px-3 py-2.5 text-xs text-nook-brown/60 font-bold leading-relaxed">
          <span aria-hidden="true">🌱</span>
          <span>首次登入時，舊裝置的本機資料會自動搬到雲端。</span>
        </div>
      </div>
    </div>
  );
};
