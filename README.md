
# 咔咔 StyleWeave - 智能时尚工作流平台

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/React-18.0-blue) ![Gemini](https://img.shields.io/badge/Model-Gemini%202.5%20%2F%203.0-orange)

**咔咔 StyleWeave** 是一款专为时尚电商设计的 AI 工作流工具。它不仅仅是一个生图工具，而是一个**虚拟摄影工作室**。它利用 Google Gemini 多模态大模型，模拟真实的商业摄影流程：从面料分析、创意总监脚本规划，到最终的光学物理渲染。

---

## 🏗️ 核心技术栈 (Tech Stack)

*   **前端框架**: React 18, TypeScript, Vite
*   **UI/UX**: Tailwind CSS, Framer Motion (动画), **Three.js / React Three Fiber** (丝绸背景渲染)
*   **AI 引擎**:
    *   **视觉理解 (VLM)**: `gemini-3-flash-preview` (用于提取面料 DNA、生成 Protocol 协议、质检)
    *   **图像生成**: `gemini-2.5-flash-image` (高保真图像生成)
    *   **SDK**: `@google/genai` (Official Google GenAI SDK v1.35+)

---

## 🚀 核心工作流模式 (Core Workflows)

### 1. 🤖 Agent 模式 (Smart Workflow) - 品牌资产托管

> **核心理念**: "One Brand, One Identity"。通过构建具有记忆的 AI Agent，实现品牌视觉的极致统一。

#### 1.1 资产初始化 (Setup Wizard)
通过 5 步向导，将抽象的品牌风格转化为可执行的 AI 协议：
*   **Identity (骨相)**: 定义模特的种族、骨骼结构（如：韩系鹅蛋脸 vs 欧美折叠度）。
*   **Anchor Generation (数字分身)**: 系统生成一张**8K 高保真锚点图 (Anchor Image)**。这张图将作为该 Agent 的生物学指纹，确保后续生成的每一张图，模特长相都 100% 一致。
*   **Protocol Synthesis (协议合成)**: 
    *   **首席视觉协议官 (Protocol Officer)**: 一个专门的 AI 角色，负责将用户选择的相机（如胶片/单反）、光线（如柔光/夕阳）和场景池编译为一份**严格的物理参数 JSON** (`StylePreset`)。
    *   **Vibe Pool (表现力池)**: 用户定义模特允许的“情绪范围”（如：清冷、大笑、松弛感）。生图时，AI 将根据衣服风格自动从池中调取最匹配的情绪。

#### 1.2 预设装配中心 (Preset Assembly Center)
位于智能工作台内的核心模块，采用 **"三区装配"** 逻辑：
*   **Zone 1: 模特资产库 (Assets)**: 存储所有生成的模特 Anchor（脸、身材、肤色）。
*   **Zone 2: 风格逻辑库 (Matrix)**: 存储光影、镜头参数和环境逻辑（如 "极简水泥风 + 85mm 镜头"）。
*   **Zone 3: 最终装配 (Assembly)**: 用户可以像换装备一样，将 "模特 A" 与 "风格 B" 组合，生成一个新的临时 Session。

#### 1.3 AI 创意总监引擎 (AI Director Engine)
在生成过程中，系统不仅是拼接 Prompt，而是运行一个复杂的决策链：
1.  **输入**: 服装面料 DNA + Agent 协议 (`StylePreset`) + 用户上传的图。
2.  **思考 (`generateDirectorConfig`)**: AI 扮演创意总监，输出一份 `DirectorConfig` JSON。
    *   *约束*: 必须严格遵守协议官制定的物理法则（如：必须用 35mm 镜头，必须是胶片质感）。
    *   *决策*: "这件衣服是丝绸材质，协议允许‘松弛感’，因此我决定让模特呈现动态行走的姿势，并抓取‘微笑’表情。"
3.  **执行**: 将 JSON 转化为最终的渲染指令。

---

### 2. 📸 商业摄影模式 (Review Mode) - 单次精修

> **核心理念**: "物理级的光学模拟"。提供类似相机的专业参数控制。

#### 物理摄影矩阵 (Photographic Style Matrix)
我们抛弃了传统的 "风格滤镜" 概念，转而使用基于物理光学的矩阵 (`services/promptConfig.ts`)：

| 风格层级 | 物理定义 (Physics) | 适用场景 |
| :--- | :--- | :--- |
| **Lo-Fi Raw** (0-30%) | 设备: iPhone/CCD <br> 镜头: 28mm 广角 <br> 光圈: f/11 (全清) <br> 皮肤: 保留真实瑕疵、油光 | 社交媒体、种草、真实感 |
| **Commercial** (31-70%) | 设备: Sony A7R <br> 镜头: 50mm 标准 <br> 光圈: f/5.6 <br> 皮肤: 商业级磨皮，保留质感 | 电商主图、详情页 |
| **Editorial** (71-100%) | 设备: Hasselblad 中画幅 <br> 镜头: 85mm 定焦 <br> 光圈: f/1.4 (虚化) <br> 光线: 戏剧性布光 (Chiaroscuro) | 品牌形象片、杂志大片 |

#### 姿态概率注入 (Probabilistic Pose Injection)
为了避免 AI 生成千篇一律的 "站桩图"，系统在底层注入了概率机制：
*   **25% Avoidance**: 眼神躲避镜头，营造抓拍感。
*   **25% Side Glance**: 侧身回顾。
*   **25% Candid**: 漫不经心的自然状态。
*   **25% Model Stance**: 专业模特站姿。

#### PRO 稳定模式 (Stable Mode & VLM Inspector)
引入 **AI 质检员 (VLM)** 闭环：
1.  **生成**: AI 生成图片。
2.  **质检 (`evaluateGeneratedImage`)**: 使用 Gemini 2.5 Flash 对比原图和生成图。
3.  **评分**: 检查袖长、领口结构、手部细节。
    *   **PASS (>95)**: 直接输出。
    *   **FAIL (<85)**: 自动触发重绘 (Auto-Regenerate)，并附带修正指令（如 "Fix the left sleeve length"）。
    *   **WARN**: 输出图片但标记警告区域。

---

### 3. 🎨 设计师模式 (Design Mode) - 款式重构

> **核心理念**: "锁定面料，重构版型"。

*   **面料 DNA 锁定**: 无论如何修改版型，原本的面料材质（如粗花呢、真丝、印花）保持不变。
*   **结构重组**:
    *   **改长短**: Mini / Knee / Midi / Maxi。
    *   **换品类**: 上衣 -> 连衣裙，长袖 -> 无袖。
*   **应用场景**: 设计师快速改款预览、一衣多穿营销图制作。

---

### 4. 📦 批量工作流 (Batch Workflow)

*   **智能人台处理 (Smart Mannequin)**: 内置预处理管线，自动识别并裁剪掉人台/衣架背景，回填纯白底，居中校正。
*   **并发队列**: 支持多图并发上传与处理。
*   **一键打包**: 生成完成后，支持导出包含所有主图及变体（背面/侧面/细节）的 ZIP 包。

---

## 📂 项目结构 (Key Structure)

```
src/
├── components/
│   ├── batch/          # 批量处理专用组件 (ItemCard, ConfigPanel)
│   ├── smart/          # Agent 模式组件 (SetupWizard, Workbench)
│   ├── steps/          # 核心流程页面 (Upload, Review, Result)
│   ├── UI/             # 通用 UI (GlassSurface, ElasticSlider)
│   └── Silk.tsx        # Three.js 丝绸背景特效
├── services/
│   ├── gemini/
│   │   ├── analysis.ts     # VLM 视觉分析 & Protocol Logic
│   │   ├── generation.ts   # 核心生图逻辑 & Director Logic
│   │   ├── evaluation.ts   # 稳定模式质检逻辑
│   │   └── client.ts       # SDK 初始化
│   └── promptConfig.ts     # 物理摄影矩阵与全局配置
└── types.ts            # 核心类型定义 (SmartProfile, DirectorConfig)
```

## 🔧 配置与运行

1.  **安装依赖**:
    ```bash
    npm install
    ```

2.  **配置环境变量**:
    在根目录创建 `.env.local` 文件：
    ```env
    GEMINI_API_KEY=your_google_api_key_here
    ```

3.  **启动开发服务器**:
    ```bash
    npm run dev
    ```

---

## ⚠️ 开发注意事项

1.  **Safety Settings**: 由于时尚图片可能包含皮肤露出（如泳装、内衣），Gemini API 的安全设置 (`SAFETY_SETTINGS`) 必须保持为 `BLOCK_NONE`，否则会频繁触发误拦截。
2.  **Prompt Engineering**: 所有的提示词逻辑均位于 `services/gemini` 目录下。修改时请遵循 "Subtractive Prompting" 原则（少即是多，物理名词优于形容词）。
