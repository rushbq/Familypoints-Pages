import React from 'react';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import {
  DEFAULT_SCRAP_PER_DRAW,
  DUPLICATE_SCRAP_REFUND,
} from '../services/beyUtils';
import { UPSET_CHANCE, WEAKENED_MULTIPLIER } from '../services/beyBossUtils';

interface BeyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 一條規則：左邊編號、右邊白話說明。 */
const Rule: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <li className="flex gap-2.5">
    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-bey-cyan/20 text-xs font-bold text-bey-cyan">
      {n}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-bold text-bey-ink">{title}</p>
      <p className="mt-0.5 text-xs font-normal leading-relaxed text-bey-dim">{children}</p>
    </div>
  </li>
);

/**
 * 玩法說明。
 * 讀者是國小生，所以用短句、具體數字、第二人稱，避免「三圍」「稀有度」這類詞彙。
 * 規則裡的數字直接取自設定常數，改了平衡不用回來改文案。
 */
export const BeyRulesModal: React.FC<BeyRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const weakPercent = Math.round(WEAKENED_MULTIPLIER * 100);
  const upsetPercent = Math.round(UPSET_CHANCE * 100);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bey-void/80 p-4 animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bey-rules-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-md flex-col bg-bey-panel soft-card clip-notch">
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-bey-steel px-4 py-3">
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.26em] text-bey-cyan">HOW TO PLAY</p>
            <h2 id="bey-rules-title" className="text-base font-black text-bey-ink">陀螺玩法說明</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-bey-dim hover:text-bey-ink"
            aria-label="關閉說明"
          >
            <Icons.X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
          <section>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-black text-bey-lime">
              <span aria-hidden="true">🌀</span> 陀螺工房
            </h3>
            <ol className="space-y-3">
              <Rule n={1} title="鋼料怎麼來？">
                爸爸媽媽幫你加分的時候，加幾分就會變成幾點鋼料。
                就算之後被扣分，已經拿到的鋼料也不會不見。
              </Rule>
              <Rule n={2} title="怎麼拿到零件？">
                集滿 {DEFAULT_SCRAP_PER_DRAW} 點鋼料，就可以按一次「鍛造零件」，抽到一個零件。
                如果抽到你已經有的，會換成 {DUPLICATE_SCRAP_REFUND} 點鋼料還給你，不會白抽。
              </Rule>
              <Rule n={3} title="怎麼組出一顆陀螺？">
                一顆陀螺要三個零件：上面的<b className="text-bey-ink">刃環</b>、
                中間的<b className="text-bey-ink">齒輪</b>、下面的<b className="text-bey-ink">軸尖</b>。
                三個都選好、取個名字，就組起來了。
              </Rule>
              <Rule n={4} title="陀螺的三個能力">
                <b className="text-bey-ink">攻擊</b>是打人的力氣、
                <b className="text-bey-ink">防禦</b>是被打的時候撐不撐得住、
                <b className="text-bey-ink">持久</b>是可以轉多久。
                三個零件的數字加起來，就是這顆陀螺的能力。
              </Rule>
              <Rule n={5} title="更厲害的零件">
                達成目標、集點卡蓋滿、或拿到獎勵卡的時候，會多送你一個比較厲害的零件。
              </Rule>
            </ol>
          </section>

          <section className="mt-5 border-t border-bey-steel pt-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-black text-bey-red">
              <span aria-hidden="true">⚔️</span> 週魔王
            </h3>
            <ol className="space-y-3">
              <Rule n={1} title="什麼時候可以打？">
                只有<b className="text-bey-ink">星期六和星期天</b>可以打，一天一次。
                其他日子可以先看魔王有多強，但不能開打。
              </Rule>
              <Rule n={2} title="平常日要做什麼？">
                看魔王哪一項數字最大，那就是他最強的地方。
                平常日就去鍛造零件，把你比較弱的那一項補起來。
              </Rule>
              <Rule n={3} title="要怎麼打？">
                你和哥哥（弟弟）各派一顆陀螺出來，
                <b className="text-bey-ink">兩顆的數字會加在一起</b>一起對付魔王。
                所以就算你的陀螺比較弱，派出來還是有幫助。
              </Rule>
              <Rule n={4} title="怎麼算輸贏？">
                總共打三回合：第一回合比攻擊、第二回合比防禦、第三回合比持久。
                每一回合數字大的那邊贏。<b className="text-bey-ink">贏兩回合就贏了。</b>
              </Rule>
              <Rule n={5} title="數字小也可能贏！">
                每一回合都有大約 {upsetPercent}% 的機會「爆冷」，
                就是數字小的那邊反而贏。所以不要還沒打就放棄。
              </Rule>
              <Rule n={6} title="贏了有什麼？">
                兩個人都有派陀螺的時候打贏，可以拿到<b className="text-bey-ink">這隻魔王專屬的零件</b>，
                一人一個。這種零件只有打贏魔王才拿得到，別的地方都抽不到。
              </Rule>
              <Rule n={7} title="只有一個人可以打嗎？">
                可以，但只能打比較弱的魔王（能力剩下 {weakPercent}%），
                贏了拿一個厲害的零件，但<b className="text-bey-ink">拿不到專屬零件</b>。
                專屬零件要兩個人一起才有，而且這種時候魔王不會消失，
                等另一個人準備好還可以再打一次。
              </Rule>
              <Rule n={8} title="輸了會怎樣？">
                什麼都不會少，零件和分數都不會扣。明天再來就好。
              </Rule>
            </ol>
          </section>
        </div>

        <div className="flex-shrink-0 border-t border-bey-steel px-4 py-3">
          <Button variant="primary" className="w-full" onClick={onClose}>
            我知道了
          </Button>
        </div>
      </div>
    </div>
  );
};
