---
name: "Family Points — Sweet Home"
description: "以溫暖童趣的手機介面，讓家庭習慣與獎勵變得清楚、可參與。"
colors:
  garden-mint: "#64B96A"
  garden-mint-deep: "#2C7A4B"
  clear-sky: "#65B7D9"
  clear-sky-deep: "#3282A5"
  achievement-apricot: "#F0A24A"
  achievement-apricot-deep: "#B96828"
  sunlight: "#F6D96B"
  reward-lavender: "#9377D8"
  reward-lavender-deep: "#7556BA"
  feedback-red: "#E76F67"
  cocoa-ink: "#394438"
  garden-mist: "#EDF5E8"
  soft-beige: "#EAF2E5"
  soft-cream: "#F8FBF5"
  paper: "#FFFFFF"
typography:
  display:
    fontFamily: "Varela Round, Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Varela Round, Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Varela Round, Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Varela Round, Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Varela Round, Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.01em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.garden-mint}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.clear-sky}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.feedback-red}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-reward:
    backgroundColor: "{colors.reward-lavender}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cocoa-ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cocoa-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: Family Points — Sweet Home

## 1. Overview

**Creative North Star: "Sweet Home"**

Sweet Home 是一座放在掌心裡的家庭花園：從 Pikmin Bloom 官網擷取「明亮自然、花朵、嫩芽與戶外色彩」的氣質，但不複製角色、商標或圖像素材。家長能在忙碌的日常中快速完成紀錄，孩子則能清楚看到努力如何累積成目標與獎勵。畫面以低彩度花園霧綠、白色資訊表面、深葉綠文字與圓潤字體形成溫暖基底，再用晴空藍、成就橘、日光黃與獎勵紫區分功能。

童趣只出現在有助辨識與回饋的地方，例如成員 Emoji、花朵、星章與具按壓深度的按鈕。介面禁止變成冰冷的企業後台、過度幼兒化的卡通場景，或刺激競爭與成癮的遊戲商城。手機是主要情境：常用任務必須在單手可及範圍內，底部導覽固定承載主要分頁，內容在桌面才展開為側欄。

**Key Characteristics:**

- 薄荷霧面背景與白色內容表面
- 圓潤但清楚的單一字體系統
- 以功能角色分配的柔和全彩色盤
- 緊湊、可按壓且狀態明確的主要操作
- 手機優先、桌面漸進增強的結構
- 裝飾必須服從資訊對比與可辨識性

## 2. Colors

色彩採完整角色色盤，但每個顏色都必須有明確工作；大面積背景維持花園薄荷與白色，較高彩度只標記動作、狀態與獎勵。

### Primary

- **嫩芽薄荷** (`garden-mint`): 主要確認、正向操作與品牌識別；深色版本用於文字、底邊與選取狀態。

### Secondary

- **晴空藍** (`clear-sky`): 資訊、次要操作與成員區分；不得與薄荷綠同時爭奪主要動作。
- **杏桃成就橘** (`achievement-apricot`): 目標、日期、成就與需要家長注意的溫和提醒。

### Tertiary

- **日光黃** (`sunlight`): 輕量鼓勵、日期與低強度提示背景。
- **獎勵薰衣草** (`reward-lavender`): 只用於獎勵兌換相關流程，讓「獎勵」在跨畫面時保持一致。
- **回饋紅** (`feedback-red`): 扣分、錯誤與危險操作；禁止當作一般裝飾色。

### Neutral

- **可可墨棕** (`cocoa-ink`): 全站主要文字與中性色基準；透明度只能用於次要資訊。
- **花園薄霧** (`garden-mist`): 應用程式背景與柔和空間分層。
- **柔米色** (`soft-beige`): 導覽、次要容器與低強度底色。
- **柔奶白** (`soft-cream`): 登入、角色選擇與局部溫暖表面。
- **白紙** (`paper`): 卡片、輸入欄與需要最高可讀性的內容表面。

### Named Rules

**The One Job Per Color Rule.** 綠代表正向與主要確認，藍代表資訊，橘代表目標與成就，紫代表兌換，紅代表錯誤或負向；禁止為了熱鬧任意交換角色。

**The Visible Flower Rule.** 小花只能放在具足夠明暗差的純色或低紋理表面；若背景與花瓣接近，必須改用深色花心、加白色隔離輪廓，或移除花朵，不能讓品牌圖示消失在背景中。

## 3. Typography

**Display Font:** Varela Round（中文後備 Zen Maru Gothic、ui-rounded、system-ui）

**Body Font:** Varela Round（中文後備 Zen Maru Gothic、ui-rounded、system-ui）

**Label Font:** Varela Round（中文後備 Zen Maru Gothic、ui-rounded、system-ui）

**Character:** 單一圓體同時承載標題、操作與資料，保留親切感並降低孩子的閱讀負擔。層級依靠字重與固定尺寸，不使用誇張的流體大標題。

### Hierarchy

- **Display**（900、1.75rem、1.2）：只用於登入或主要入口標題。
- **Headline**（900、1.25rem、1.3）：頁面問候、成員名稱與主要數值標題。
- **Title**（700、1rem、1.4）：區塊標題、卡片標題與對話框標題。
- **Body**（400、0.875rem、1.5）：說明、紀錄與主要內容；表單輸入仍維持 1rem，避免手機瀏覽器自動縮放。
- **Label**（700、0.75rem、0.01em、正常大小寫）：狀態、日期、標籤與底部導覽；禁止大量全大寫。

### Named Rules

**The Read Once Rule.** 家長與孩子都應一次讀懂；主要內容使用完整文字與清楚層級，不以小字、低對比或裝飾性字距換取精緻感。

## 4. Elevation

系統採低抬升：背景、內容表面與互動層以色調分層為主，陰影只輔助重要卡片、固定導覽與 Modal。`soft-card` 使用短而淡的綠色陰影；新元件若已有實色邊界，就不得再疊加寬廣陰影。

### Shadow Vocabulary

- **Ambient Card** (`0 4px 8px -4px rgba(44, 122, 75, 0.24)`): 主要積分或目標表面的短陰影。
- **Control Press** (`0 3px 0 rgba(0, 0, 0, 0.15)`): 主要按鈕的按壓深度；active 狀態向下位移 3px 並移除陰影。
- **Sticky Navigation** (`0 -4px 20px rgba(0, 0, 0, 0.08)`): 手機底部導覽與內容的結構分離。

### Named Rules

**The One Boundary Rule.** 卡片用色調、邊框或陰影其中一種建立邊界；禁止同時使用 1px 邊框與 16px 以上模糊陰影。

**The State, Not Spectacle Rule.** 動態只回應選取、開啟、按壓與狀態變更；一般 transition 介於 150–250ms，並提供 reduced-motion 替代。

## 5. Components

### Buttons

- **Shape:** 主要操作使用 12px 圓角；狀態 chip 才使用完整膠囊。
- **Primary:** 嫩芽綠配白字，標準內距 8px × 16px，3px 深色底邊提供可按壓感。
- **Hover / Focus / Active:** hover 僅微幅提亮；focus-visible 使用清楚外框；active 向下 3px 並移除底邊。disabled 降低透明度且停止互動。
- **Secondary / Danger / Reward / Ghost:** 晴空藍、回饋紅與獎勵薰衣草沿用相同結構；ghost 只保留可可墨棕文字與淡色 hover 面。

### Chips

- **Style:** 膠囊形，使用低彩度背景搭配同色系深色文字；分類與狀態可加 1px 同色邊界。
- **State:** 選取狀態提高背景彩度與文字對比；未選取狀態保持白色或透明，不使用飽和色搶焦點。

### Cards / Containers

- **Corner Style:** 新卡片統一 16px；24px 只用於大型分區。現有 32px 以上舊表面應在後續 polish 收斂，不得繼續擴散。
- **Background:** 主要內容使用白紙，次要區塊使用白色透明層或功能色 10–20% tint。
- **Shadow Strategy:** 依 Elevation 的 One Boundary Rule；主要表面可用 Ambient Card，其餘優先色調分層。
- **Border:** 只在狀態、分組或需要明確邊界時使用；白色粗邊只保留於品牌入口或特殊對話框。
- **Internal Padding:** 手機統一 16px；密集列表 12px，較寬畫面最多 20px。

### Inputs / Fields

- **Style:** 白底、低對比邊框、12px 圓角、10–12px 內距；輸入文字至少 16px，避免手機瀏覽器自動縮放。
- **Focus:** 邊框切換至當前功能色並提供清楚 focus ring。
- **Error / Disabled:** 錯誤使用回饋紅文字與淡紅背景；disabled 降低對比但仍須可辨識內容。
- **Select Arrow:** 原生箭頭改由元件內的向下圖示呈現，固定距右側 12px，選單保留至少 40px 右內距。

### Settings Workspace

- 第一層只切換「目標與卡片／積分與兌換」兩種工作情境；第二層頁籤與情境說明必須放在同一個帶色容器，避免導覽與內容脫節。
- 加分與扣分使用雙頁籤控制表單與清單，手機不得同時並排兩份清單，也不得在頁面捲動之外再加入固定高度捲軸。
- 孩子選擇使用含頭像、姓名與選取圓點的單選卡；兩位孩子時在手機維持雙欄，一眼即可確認套用對象。
- 圖示選擇器固定為 8 個附文字的大方向：評分以通用、學習、家事、合作、活動、習慣、才藝、作息為主；獎勵則依遊戲、點心、影音、購物、出遊、音樂、運動等類型辨識。

### Compact Lists

- 日誌每筆以「分數、事件、時間」為第一層，「孩子、分類、記錄者」為第二層；備註最多顯示一列，完整內容仍保留於資料中。
- 列表使用頁面自然捲動，不建立內層固定高度捲軸；390px × 844px 應能看見至少 8 筆一般高度的日誌。
- 雙欄收藏卡的獎勵名稱維持單列；主要兌換按鈕置於內容下方滿寬呈現，不與名稱爭搶水平空間。

### Navigation

- 手機使用固定底部導覽，圖示在上、10–12px 標籤在下；目前項目使用嫩芽薄荷淡底與深綠文字。
- 桌面在 1024px 以上切換為左側欄；兩種導覽必須使用相同圖示與名稱，不能形成兩套資訊架構。
- 手機頂部列只保留產品識別、雲端狀態與目前成員，不加入次要操作。

### Score and Reward Surfaces

- 分數是積分卡的主要視覺焦點；成員、卡片數量與動作次之。
- 目標使用杏桃橘，兌換使用獎勵薰衣草，集點使用星章；所有狀態都必須同時有文字，不能只靠顏色或 Emoji。
- 加分、扣分與兌換在所有畫面沿用一致色彩與操作詞，禁止同一動作出現不同外觀。

## 6. Do's and Don'ts

### Do:

- **Do** 以手機 390px 寬度為主要檢查基準，先確保家長能單手完成常用任務，再擴充桌面版。
- **Do** 保留薄荷霧面背景、白色表面、可可墨棕文字與功能角色色，讓每個顏色只負責一種訊息。
- **Do** 讓小花與其他品牌圖示在實際背景上清楚可見；對比不足時改色、加隔離輪廓或移除。
- **Do** 使用一致的按壓回饋、focus 狀態、disabled 狀態與 150–250ms transition。
- **Do** 讓童趣服務於理解：Emoji、星章與柔和色彩必須幫助辨識成員、狀態或獎勵。
- **Do** 讓家長首頁在 390px 首屏同時看見目標提醒、兩位孩子分數與主要操作。
- **Do** 用 390px × 844px 實際預覽驗證表單、收藏卡與日誌密度，再檢查 1280px 桌機側欄。

### Don't:

- **Don't** 採用企業後台般冰冷、複雜或高密度的視覺語言。
- **Don't** 過度幼兒化，也不要堆疊大量卡通裝飾而干擾操作。
- **Don't** 塑造成遊戲商城，不以競爭、成癮機制或只追求獎品作為主要動機。
- **Don't** 使用漸層文字、裝飾性斜紋、彩色側邊粗線或無功能的玻璃效果。
- **Don't** 在卡片同時使用 1px 邊框與 16px 以上模糊陰影，也不要新增 32px 以上卡片圓角。
- **Don't** 讓低對比的小花、淡色文字或透明圖示消失在薄荷與白色背景中。
- **Don't** 在手機設定頁放置巢狀捲軸、過量 Emoji，或讓下拉箭頭貼近欄位邊界。
