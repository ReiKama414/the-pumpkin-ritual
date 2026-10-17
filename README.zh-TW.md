# The Pumpkin Ritual

[English](./README.md) · **繁體中文**

> **本機萬聖 WebGL 儀式** — 自包含的 React 體驗：參數化南瓜在月光下裂開、懸停、再重組

<p align="center">
  <a href="https://github.com/ReiKama414/the-pumpkin-ritual"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-ReiKama414%2Fthe--pumpkin--ritual-181717?logo=github" /></a>
  <a href="https://reikama414.vercel.app/"><img alt="作品集" src="https://img.shields.io/badge/Site-reikama414.vercel.app-0A0A0A" /></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-r182-000000?logo=threedotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img alt="授權" src="https://img.shields.io/badge/License-MIT-green" />
</p>

<p align="center">
  <strong><a href="https://github.com/ReiKama414/the-pumpkin-ritual">★ 幫這個專案按 Star</a></strong>
  ·
  <a href="https://reikama414.vercel.app/">個人網站</a>
  ·
  <a href="#快速開始">快速開始</a>
  ·
  <a href="#授權">授權</a>
</p>

---

## 為什麼做這個？

多數萬聖展示靠影片循環、貼圖換臉或球體堆疊。**The Pumpkin Ritual** 是單場景互動小品：十種雕刻參數外殼、物理切面、滾動章節，以及可重複的裂開 → 懸停 → 重組流程 — 全程在瀏覽器渲染，不需外連媒體

給想要小而精、仍保有手感 WebGL 的人：找氛圍參考的設計師、好奇的前端學習者，以及深夜還在滑頁的人

---

## 亮點

- **參數化南瓜** — 外皮、果肉與裁切後的鑲嵌牆面；不用臉部貼圖、透明遮罩或影片替代  
- **五種表情** — Classic、Wicked、Haunted、Hollow、Cursed，搭配收縮再綻放的拓撲轉換  
- **儀式編舞** — 炸裂花瓣保留完整 3D 網格；葉片與花瓣共用同一分離驅動  
- **滾動敘事** — 五個章節，滾輪或鍵盤皆可；章節圓點可跳段  
- **午夜儀式** — 三連點彩蛋；完成後解鎖秘密 Classic 表情  
- **程序化音效** — 僅用 Web Audio 合成；預設關聲，需手動開啟  
- **可及性外殼** — 原生 About 對話框、減少動態路徑、WebGL 失敗時有標示的 SVG 後備  
- **效能護欄** — 自適應 DPR 上限 1.6，後處理依效能調整  

---

## 技術棧

| 層級 | 選用 |
| --- | --- |
| UI | React 19、Zustand、Tailwind CSS 4 |
| 3D | Three.js、React Three Fiber、Drei、postprocessing |
| 動態 | GSAP、ScrollTrigger |
| 幾何 | polygon-clipping、自訂參數外殼 |
| 工具 | Vite 7、TypeScript、Vitest |

---

## 快速開始

**需求：** 建議 Node.js 20+，以及支援 WebGL2 的顯示卡

```bash
git clone https://github.com/ReiKama414/the-pumpkin-ritual.git
cd the-pumpkin-ritual
npm install
npm run dev
```

開啟 Vite 印出的本機網址。正式版：`npm run build`，再 `npm run preview`

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發伺服器 + 熱更新 |
| `npm run build` | 型別檢查 + 正式打包 |
| `npm run typecheck` | `tsc -b` |
| `npm run preview` | 預覽正式建置 |
| `npm test` | Vitest（幾何 + 儀式生命週期） |

---

## 操作

| 輸入 | 動作 |
| --- | --- |
| 滾輪 · ↑ ↓ · Page Up / Down | 走過五個儀式章節 |
| 章節圓點 | 跳到該章節 |
| 拖曳南瓜 · ← → | 自由旋轉 |
| 點南瓜 · 空白鍵 | 執行裂開 / 懸停 / 重組 |
| `1`–`5` | 切換表情（頁面有焦點時） |
| 三連點南瓜 | 召喚午夜儀式 |
| About | 鍵盤可及的操控說明 |
| 音效切換 | 開啟合成音效 |

> **提醒：** 減少動態會關閉閒置漂移、塵埃、火花與幽影效果，並縮短轉場、跳過自動儀式旋轉。拖曳與滾動擦洗仍可使用

---

## 專案結構

```
src/
├── App.tsx           # 版面、UI、對話框
├── Scene.tsx         # R3F 場景、燈光、後處理
├── geometry.ts       # 參數外殼、裁切、轉場
├── materials.ts      # PBR + 自訂 GLSL 皮膚／木質
├── ritual.ts         # 章節狀態、分離、午夜流程
├── sound.ts          # Web Audio 合成
├── geometry.test.ts  # 射線、厚度、屬性檢查
└── ritual.test.ts    # 生命週期、時序、滾動端點
```

---

## 驗證

```bash
npm run typecheck
npm test
npm run build
```

幾何測試對五種造型的眼洞做射線檢測、在未雕刻臉頰檢查殼厚，並確認位置與法線為有限值。生命週期測試涵蓋重複重組、轉場時序、中斷與滾動端點（共 11 項）

瀏覽器 QA 涵蓋場景、章節控制、五種造型、拖曳、三連點午夜儀式、重開、音效與可及對話框。曾在 1440×900、390×844、320×700 檢查版面。桌面 60 FPS 是目標而非保證；嵌入式 WebView 與真實觸控硬體在此環境未完整驗證

---

## 第三方套件

執行期依賴（React、Three.js、GSAP 等）仍各自遵循原授權。那**不會**改變本倉庫下方 [MIT 授權](./LICENSE) 的適用範圍

---

## 連結

| | |
| --- | --- |
| **GitHub** | [ReiKama414/the-pumpkin-ritual](https://github.com/ReiKama414/the-pumpkin-ritual) |
| **作者** | [ReiKama414（Myers）](https://github.com/ReiKama414) |
| **個人網站** | [reikama414.vercel.app](https://reikama414.vercel.app/) |

---

## 授權

**本倉庫以 [MIT License](./LICENSE) 釋出**  
Copyright (c) 2026 ReiKama414

可依授權條款使用、複製、修改、合併、發布、散布、再授權與出售本軟體副本

- [GitHub](https://github.com/ReiKama414/the-pumpkin-ritual)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<p align="center"><sub>The Pumpkin Ritual · by ReiKama414 · after midnight.</sub></p>
