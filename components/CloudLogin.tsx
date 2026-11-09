import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from './ui/Button';
import { BeyTop } from './BeyTop';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden arena-pattern">
      <div className="w-full max-w-sm bg-bey-panel soft-card clip-notch p-5 md:p-6 relative z-10 animate-pop">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
            <BeyTop color="cyan" size={52} speed="slow" />
          </div>
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.3em] text-bey-cyan">BLADER LOGIN</p>
            <h1 className="text-xl font-black text-bey-ink">回到競技場</h1>
            <p className="text-xs text-bey-dim font-normal mt-0.5">登入後即可同步所有戰績資料</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="block font-display text-[11px] font-bold tracking-[0.16em] text-bey-dim mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 border border-bey-steel rounded-xl focus:ring-2 focus:ring-bey-cyan/40 focus:border-bey-cyan outline-none text-bey-ink font-bold bg-bey-paper text-base placeholder:text-bey-dim/50"
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-bey-dim mb-1.5">密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 border border-bey-steel rounded-xl focus:ring-2 focus:ring-bey-cyan/40 focus:border-bey-cyan outline-none text-bey-ink font-bold bg-bey-paper text-base placeholder:text-bey-dim/50"
              placeholder="Firebase password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-xl bg-bey-red/10 text-bey-red px-3 py-2.5 font-bold text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '連線中...' : '進入競技場'}
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-bey-void/50 border border-bey-steel px-3 py-2.5 text-xs text-bey-dim font-normal leading-relaxed">
          <span aria-hidden="true">⚡</span>
          <span>首次登入時，舊裝置的本機資料會自動搬到雲端。</span>
        </div>
      </div>
    </div>
  );
};
