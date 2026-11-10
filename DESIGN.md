---
name: "Family Points — Bey Arena"
description: "以戰鬥陀螺競技場的深色介面，讓家庭習慣、收集與獎勵變得清楚、有目標感。"
colors:
  void: "#05080F"
  arena-deep: "#0D1424"
  panel: "#16213A"
  paper: "#1D2B4D"
  steel: "#2C3B60"
  dim: "#9FB3D9"
  ink: "#E6EEFB"
  system-cyan: "#13FFF3"
  system-cyan-deep: "#0A9C95"
  team-purple: "#C44DFF"
  team-purple-deep: "#7D1FB0"
  team-orange: "#FF7A2F"
  team-orange-deep: "#A8441A"
  burst-lime: "#A2FF1F"
  referee-gold: "#FCEE21"
  alert-red: "#FF4D4D"
  info-blue: "#1C93E5"
typography:
  display:
    fontFamily: "Orbitron, Chakra Petch, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Chakra Petch, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
    lineHeight: 1.3
  body:
    fontFamily: "Chakra Petch, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Orbitron, Chakra Petch, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.2em"
    textTransform: "uppercase"
---

# Design System: Family Points — Bey Arena

## 1. Overview

**Creative North Star: "Bey Arena"**

一座放在掌心裡的家庭競技場。深藍鋼的場地、投射燈、同心刻線與速度線構成背景，資訊則像賽事 HUD 一樣疊在上面：分數大、標籤小、狀態一眼可讀。孩子的身分是「Blader」，家長是「裁判席」。

視覺語彙取自對戰陀螺的結構本身——同心環、刀刃、齒輪、軸尖、斜切角——而**全部由程式繪製的原創圖形組成**。本專案不使用任何既有商品的 logo、角色或商品照。

這套風格服務於產品原則，而不是蓋過它：深色是為了讓數字與狀態跳出來，不是為了酷；競技場敘事是為了讓「累積」有方向感，不是為了製造輸贏。

## 2. Colors

深底高彩的組合很容易變成霓虹亂鬥，所以色彩規則比淺色主題更嚴格：**每個強調色只有一個工作，而且隊色是保留色**。

### Surfaces

由深到淺四層，用邊框而非陰影分層：

- **虛空** (`void`): 遮罩、凹陷區塊與最深層底。
- **競技場底** (`arena-deep`): 整體頁面背景。
- **面板** (`panel`): 一般卡片。
- **浮起面** (`paper`): 輸入框、浮起區塊、列表項。
- **鋼邊** (`steel`): 所有分隔線與卡片外框。

### Text

- **主文字** (`ink`): 標題、數值、名稱。
- **次要文字** (`dim`): 說明、時間、提示。這是**唯一**的次要文字色。

### System

- **系統青** (`system-cyan`): 作用中頁簽、主要確認、焦點框、進度條、App 標誌。它代表「這是可以按的東西」。

### Team（保留色）

- **隊色紫** (`team-purple`): 第一位孩子。
- **隊色橘** (`team-orange`): 第二位孩子。

### Semantic

- **爆發綠** (`burst-lime`): 加分、成功、已達成。
- **裁判金** (`referee-gold`): 家長身分、獎勵卡、五折卡、花園陽光。
- **警示紅** (`alert-red`): 扣分、刪除、危險操作。
- **資訊藍** (`info-blue`): 導覽與中性資訊。

### Named Rules

**The One Job Per Color Rule.** 青＝系統、紫／橘＝隊伍、綠＝加分、紅＝扣分、金＝裁判與獎勵、藍＝資訊。禁止為了畫面熱鬧交換角色。

**The Reserved Team Color Rule.** 紫與橘**只能**用於隊伍識別，系統控制項一律不得使用；反過來，**孩子的隊色永遠不能是青色**。青色在這套系統裡意味「作用中的控制項」，拿它當隊色會讓孩子的識別和 UI chrome 混在一起——這正是第一版犯過的錯。

**The Solid Secondary Rule.** 次要文字一律使用 `dim` 實色，不得用 `ink` 加透明度。在 `panel` 上，低於約 70% 的 `ink` 對比不足 4.5:1。透明度只留給邊框與底色，以及刻意標示為停用的控制項。

**The Dark Divider Rule.** 分隔線用 `steel`。帶色透明邊框（例如 `cyan/10`）在深底上等於不存在。

**The Bright Fill Rule.** 亮色填滿（青、綠、金）上的文字一律用近黑的 `void`，不可用白字——白字在這些底色上只有約 2:1。

## 3. Typography

**Display Font:** Orbitron（寬體科技感，僅限拉丁字母）
**Body Font:** Chakra Petch（中文後備 Noto Sans TC）

### Hierarchy

| 層級 | 字重 | 用途 |
|---|---|---|
| Display | 900 | 區塊標題（`text-base` 以上）、分數 |
| Headline | 700 | 卡片標題、名稱、按鈕、晶片、值 |
| Label | 500 | 表單標籤、清單標籤 |
| Body | 400 | 說明、提示、時間，以及任何完整句子 |

### Named Rules

**The Latin-Only Display Rule.** Orbitron 沒有中文字符，**絕不可套在中文上**——會退回備援字型，而且附帶的字距會把中文拆散。它只用於全大寫的短英文標籤（`BLADER STATUS`、`WEEKLY BOSS`）。

**The Readable Zero Rule.** 分數不使用 Orbitron。它的零帶斜線，放大後會被誤認成符號；數值一律用 Chakra Petch 粗斜體搭配 `tabular-nums`。

**The Weight Is Hierarchy Rule.** 字重是層級，不是裝飾。整段說明文字用 400；全部加粗等於沒有重點，而且小字級的中文在深底上筆畫會糊在一起。

**The Minimum Size Rule.** 最小字級 `10px`，且僅限拉丁 Orbitron 標籤；中文不低於 `12px`。

## 4. Elevation

深色主題沒有「投影 = 浮起」的直覺，所以分層靠**邊框與底色明度**，陰影只做輕微的地面接觸。

### Shadow Vocabulary

- `soft-card`: 1px `steel` 外框 + 向下 24px 的深色暈開 + 頂部 1px 內高光。這是唯一的卡片樣式。

### Named Rules

**The Border-First Rule.** 要讓元素看起來浮起，先換底色（`panel` → `paper`）再加邊框，最後才考慮陰影。

## 5. Components

### Buttons

沿用「AC squishy」的按壓結構：`border-b-[3px]` + `active:border-b-0 active:translate-y-[3px]`。變體對應語義色：primary 青、success 綠、danger 紅、reward 橘、secondary 藍、outline 鋼框、ghost 透明。亮底變體一律配 `void` 文字。

### Clipped Corners

`clip-notch`（14px）與 `clip-notch-sm`（8px）切掉左上與右下，是競技場 HUD 的招牌輪廓。用於卡片、頁簽與主要面板；不要用在小晶片上，會糊成一團。

### Arena Surfaces

- `app-bg`: 投射燈漸層 + 固定附著，整頁背景。
- `arena-pattern`: 同心刻線 + 發射台視角，用於登入與角色選擇。
- `arena-rings`: 可放在任何卡片內的刻線層，以 `--rings-x` / `--rings-y` 調整圓心。
- `speed-lines`: 斜向加速軌跡，疊在英雄區與魔王卡上。

### Spinning Tops

`components/BeyTop.tsx` 以參數繪製：刀刃形狀與數量、齒輪樣式、軸尖樣式、配色。給 `bladeId`/`ratchetId`/`bitId` 畫出特定組合，給 `color` 畫隊色，給 `colorSet` 畫魔王。轉速 `idle` / `slow` / `fast` 代表狀態，不是裝飾——**打不了的時候不要快轉**。

### Navigation

導覽有「首頁／陀螺／日誌／設定（家長）」。手機與直式 iPad 用底部導覽，橫式 iPad 以上用左側欄；側欄每顆圖示下方都有看得見的中文標籤，只放圖示孩子找不到陀螺在哪。作用中用青色；每個分頁的圖示底色是語義色，不是隊色。

花園與植物圖鑑是首頁的子頁（首頁 → 花園 → 圖鑑），不進導覽；在這兩頁時導覽的「首頁」仍算作用中，頁首放一顆 44px 的返回鈕。

### Home Page

首頁的目標是**手機一個畫面看完**：積分 → 摘要清單 → 收集入口卡。

- **摘要清單**：一張卡片裡的 48px 列（目標／收藏／本週／指南），每列一行摘要，點開才在原地展開明細，一次只開一列。空的列（沒有目標、沒有卡片）不顯示。
- **收集入口卡**：陀螺工房與花園兩張小卡並排，只寫一兩行狀態。有事可做（可鍛造、魔王今天可打、可澆水、開花待選新種子）時才給青色邊框和小點，其餘是 `steel` 邊框；顏色在這裡代表「這裡有事」。
- 鼓勵語放在身分列右側，不佔分數下方一整列；名字前不放頭像。

### Battle Arena

魔王戰開戰後是一個俯視的圓形競技場（Canvas）：雙方繞場、擦撞、決定性的一撞，火花用 `referee-gold` 色碼，爆冷時震動更大，輸家被撞到場邊、減速、搖晃後側倒變暗。上方各兩格體力，我方用隊色（兩人出戰時每格左右各半），魔王用自己的色。

- 勝負在按下開戰時已算好，畫面只是演出；下方比數列在每次撞擊的那一刻才出現，文字與畫面對得上。
- 場上的陀螺就是孩子自己組的那一顆（由 `BeyTop` 轉成圖片），魔王保持尖刺輪廓，眼睛不跟著轉。
- Canvas 裡沒有 Tailwind，顏色直接用主題色碼。畫布本身 `aria-hidden`，結果由比數列與結語用文字傳達。

## 6. Do's and Don'ts

### Do:

- 讓每個強調色只做一件事，並在新增顏色前先問「現有的哪一個已經代表這件事」。
- 次要資訊用 `dim` 實色與 400 字重。
- 分層用邊框與底色，不用陰影堆疊。
- 陀螺與魔王的圖形全部原創，用幾何結構表達，不描摹既有商品。
- 動效對應狀態：轉速、鎖定、已完成都要看得出差別。
- 首頁只放摘要與入口，明細藏在一次點擊之後或各自的頁面。

### Don't:

- 不要把青色給任何一個孩子當隊色。
- 不要用 `ink` 加透明度當次要文字。
- 不要把 Orbitron 套在中文上，也不要用它顯示數字。
- 不要讓整段說明文字變粗體。
- 不要在亮色填滿上使用白字。
- 不要讓入口卡一直亮著；沒事可做時就回到 `steel` 邊框。
- 不要為了氣氛讓畫面持續快速動作；深色加高彩已經夠強烈，動效要節制。
- 不要加入兄弟之間分出輸贏的機制（見 PRODUCT.md）。
