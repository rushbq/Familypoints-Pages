# 家庭共育花園實作計畫

## 1. 功能目標

在既有家庭積分首頁加入以兩位孩子名字命名的「鈞佑花園」。兩位孩子每累積 100 點由家長核發的正向分數，即取得一次澆水機會；孩子登入自己的角色後親自澆水，共同讓一株真實植物經過五次澆水開花。完成的植物加入圖鑑，藉由常見植物的真實資訊增加學習價值。

本功能不改變既有積分餘額：澆水不扣分，扣分或兌換獎勵也不會讓花園倒退。

## 2. 已確認決策

- 每位孩子每累積 100 點正向分數，取得一次澆水機會。
- 澆水必須由孩子登入後親自執行；家長只查看進度。
- 一株植物需要 5 次澆水才能開花。
- 任一孩子都能推進植物，不強制兩人平均貢獻。
- 同一株植物若兩位孩子都至少澆水一次，取得「協力開花」標記。
- 植物開花只解鎖圖鑑與收藏標記，不另外發放實體獎勵。
- 花園進度永久保留，不因扣分、獎勵兌換或舊紀錄清理倒退。
- 安全機制沿用目前家長 PIN；本次只防止重複計算、連點與誤操作。
- 首頁採「成長與澆水優先」方向；完整學名與辨識資訊放在植物圖鑑。
- 使用既有 Sweet Home 薄荷綠、白色、可可棕與陽光黃；植物使用接近自然的顏色。
- 植物視覺採原創 SVG，不使用任天堂角色、圖像、Logo、名稱或音效。

## 3. 遊戲循環

1. 家長新增正向分數紀錄。
2. 系統同步增加該孩子的花園陽光值。
3. 每滿 100 點產生一次可用澆水機會，多出的點數保留。
4. 孩子登入自己的角色並按「幫花澆水」。
5. 共同植物向前成長一個階段。
6. 第五次澆水完成開花並加入圖鑑。
7. 家庭從尚未收藏的常見植物中選擇下一顆種子。

## 4. 計分規則

花園只計入：

- `pointsChange > 0` 的新紀錄。
- 建立者在 `users` 中為 `PARENT` 的紀錄。
- 功能上線後新增的紀錄。

花園不計入：

- 扣分紀錄。
- 獎勵兌換的負分紀錄。
- 獎勵卡兌換的 0 分紀錄。
- 舊雲端資料與舊備份中的歷史分數。

可用澆水次數：

```ts
Math.floor(earnedPositivePoints / pointsPerWatering) - usedWaterings
```

下一次澆水進度：

```ts
earnedPositivePoints % pointsPerWatering
```

## 5. 植物成長階段

| 階段 | 澆水次數 | 顯示名稱 |
| --- | ---: | --- |
| 0 | 0 | 種子 |
| 1 | 1 | 發芽 |
| 2 | 2 | 長出新葉 |
| 3 | 3 | 小植株 |
| 4 | 4 | 花苞 |
| 5 | 5 | 開花 |

## 6. 第一批真實植物圖鑑

第一版採六種常見且外觀容易辨識的園藝植物。圖鑑內容使用兒童能理解的繁體中文摘要，學名與原生範圍以 Royal Botanic Gardens, Kew 的 Plants of the World Online 為主要依據。

| 中文名 | 學名 | 科別 | 主要辨識特徵 | 生長特色 |
| --- | --- | --- | --- | --- |
| 向日葵 | *Helianthus annuus* L. | 菊科 | 黃色舌狀花圍繞深色中央花盤，葉片寬大 | 一年生草本；中央花盤其實由許多小花組成 |
| 大波斯菊 | *Cosmos bipinnatus* Cav. | 菊科 | 葉片細裂，花朵有整齊排列的舌狀花 | 一年生草本，原生於墨西哥 |
| 萬壽菊 | *Tagetes erecta* L. | 菊科 | 黃色或橙色花序密集成球狀，葉片羽狀分裂 | 一年生草本，原生於墨西哥至瓜地馬拉 |
| 百日草 | *Zinnia elegans* Jacq. | 菊科 | 葉片成對排列，花色豐富，花序層次清楚 | 一年生草本，原生於墨西哥至尼加拉瓜 |
| 牽牛花 | *Ipomoea nil* (L.) Roth | 旋花科 | 藍紫色漏斗狀花，莖會纏繞攀爬 | 一年生攀緣植物，原生於熱帶及亞熱帶美洲 |
| 朱槿 | *Hibiscus × rosa-sinensis* L. | 錦葵科 | 大型五瓣花，中央雄蕊柱明顯伸出 | 熱帶灌木，常見園藝品種具有多種花色 |

資料來源：

- [Helianthus annuus — Kew Science](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A119003-2)
- [Cosmos bipinnatus — Kew Science](https://powo.science.kew.org/taxon/198320-1)
- [Tagetes erecta — Kew Science](https://powo.science.kew.org/taxon/252092-1)
- [Zinnia elegans — Kew Science](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A261331-1)
- [Ipomoea nil — Kew Science](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A1071575-2/general-information)
- [Hibiscus × rosa-sinensis — Kew Science](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A560756-1)

## 7. 首頁體驗

### 孩子模式

- 顯示目前植物的大型成長插圖。
- 顯示植物名稱、階段與一則簡短小知識。
- 顯示自己的陽光進度與「還差幾分」。
- 有澆水機會時顯示主要按鈕「幫花澆水」。
- 明確說明「澆水不會扣除你的分數」。
- 顯示本株總進度與兩位孩子的澆水貢獻。

### 家長模式

- 顯示共同植物、階段與圖鑑入口。
- 顯示兩位孩子的陽光、可用澆水次數及本株貢獻。
- 不提供代替孩子澆水的按鈕。

### 開花與選種

- 第五次澆水後顯示開花結果。
- 兩位孩子都曾澆水時顯示「協力開花」。
- 完成植物保留在圖鑑中。
- 開花後停止澆水，直到孩子或家長選擇下一種植物。
- 尚未收藏的植物優先顯示；全部收集完成後可重新種植並累計開花次數。

## 8. 資料模型

```ts
interface GardenChildProgress {
  childId: string;
  earnedPositivePoints: number;
  usedWaterings: number;
}

interface GardenWateringEvent {
  id: string;
  childId: string;
  childName: string;
  wateredAt: number;
}

interface GardenPlantCycle {
  id: string;
  speciesId: string;
  startedAt: number;
  completedAt?: number | null;
  waterings: GardenWateringEvent[];
}

interface FamilyGardenState {
  version: 1;
  pointsPerWatering: 100;
  wateringsToBloom: 5;
  activePlantId?: string | null;
  childProgress: GardenChildProgress[];
  plants: GardenPlantCycle[];
}
```

`AppState` 新增 `familyGarden`。植物階段、可用澆水次數、協力開花與圖鑑開花次數均由上述資料衍生，不重複儲存。

## 9. 資料相容策略

- `normalizeAppState()` 遇到沒有 `familyGarden` 的資料時，自動建立預設花園並種下向日葵。
- 初始陽光從 0 開始，不回溯既有紀錄。
- 新備份包含花園資料；舊備份匯入後自動初始化花園。
- 匯出版本更新為 `4.1-family-garden`。
- 不新增 Dexie table；IndexedDB 仍只負責舊資料遷移與快取，因此不提升 schema 版本。
- 刪除或清理舊分數紀錄不影響已累積的花園陽光與圖鑑。

## 10. 程式結構

修改：

- `types.ts`：花園型別與 `AppState`。
- `App.tsx`：加分累積陽光、澆水、選種 handler。
- `services/storageService.ts`：正規化花園資料與舊備份相容。
- `services/database.ts`：預設花園資料。
- `components/Dashboard.tsx`：首頁插入花園並傳遞互動。
- `components/PreviewHarness.tsx`：預覽模式花園互動。
- `services/mockData.ts`：提供可預覽的花園狀態。
- `components/PikminFlower.tsx`：重新命名為中性的花園元件並移除品牌註解。

新增：

- `services/gardenUtils.ts`：植物資料、衍生計算與狀態更新純函式。
- `components/FamilyGarden.tsx`：首頁花園主體、澆水、開花與選種。
- `components/GardenPlant.tsx`：六種植物的原創 SVG 成長視覺。
- `components/GardenAlbum.tsx`：真實植物圖鑑。

## 11. MVP 邊界

本次包含：共同植物、五階段成長、個人陽光與澆水、協力開花、六種常見植物、真實圖鑑、選種、雲端同步、備份相容、手機與桌面響應式及 reduced-motion。

本次不包含：多 Firebase 帳號、Cloud Functions、排行榜、每日任務、花朵枯萎、實體獎勵、音效、推播、門檻設定與季節活動。

## 12. 驗收重點

- 正向加分會增加陽光；負分、0 分與兌換不增加。
- 100 點產生一次澆水；250 點可澆兩次並保留 50 點。
- 澆水不扣原分數，扣分也不移除澆水資格。
- 家長不能澆水，孩子只能使用自己的澆水機會。
- 快速連點不會超額澆水。
- 第五次澆水開花並加入圖鑑；開花後不能繼續澆水。
- 兩人都澆過會產生協力標記。
- 重新整理、Firebase 回寫與備份還原不會重複計算。
- 390 × 844、768px 與 1280px 版面可正常使用。
- 動態減量模式仍能清楚呈現階段變化。
- `npm run build` 成功，瀏覽器 console 無新增錯誤。

## 13. 已知限制

目前 Firestore 會寫入整份 `AppState`。兩台裝置若在同一時間修改資料，仍存在後寫覆蓋先寫的既有風險。MVP 沿用現有架構；如果家庭實際遇到同步衝突，再將澆水行為升級為 Firestore Transaction 或獨立事件集合。
