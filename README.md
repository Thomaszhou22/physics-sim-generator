# 🔬 Physics Sim Generator

AI 驱动的物理模拟生成器 — 输入自然语言描述，自动生成可交互的物理仿真页面。

## ✨ 功能特性

- 🤖 **AI 生成**：描述物理场景，自动生成完整的交互式模拟
- 🎛️ **参数可调**：生成的模拟包含滑块、按钮等交互控件
- 📱 **响应式设计**：适配桌面、平板、手机
- 💾 **保存复用**：生成的模拟可保存到本地，随时打开使用
- 🎨 **课堂友好**：深色主题、大字体，适合投影展示

## 🚀 快速开始

### 安装

```bash
cd physics-sim-generator
npm install
```

### 启动

```bash
npm start
```

浏览器打开 http://localhost:3456

### 配置 API

1. 点击右上角「API 配置」
2. 选择 Provider（Gemini / DeepSeek / GLM / Qwen / OpenAI / Custom）
3. 填入 API Key
4. Base URL 和 Model 会自动填充（也可手动修改）

### 使用

1. 在输入框描述物理场景，或点击快捷模板
2. 点击「✨ 生成物理模拟」
3. 等待 10-30 秒，预览生成结果
4. 满意则点击「💾 保存」，不满意点击「🗑️ 丢弃」重新生成

## 📁 项目结构

```
physics-sim-generator/
├── package.json          # 项目配置
├── server.js             # Express 后端
├── public/               # 前端静态文件
│   ├── index.html        # 主页面
│   ├── app.js            # 前端逻辑
│   └── styles.css        # 自定义样式
├── prompts/
│   └── physics.js        # System Prompt 模板
├── saved/                # 保存的模拟文件
└── README.md
```

## 🎯 支持的物理场景示例

- 🎯 抛体运动（初速度、角度、空气阻力）
- pendulum 单摆（摆长、角度、重力）
- 弹簧振子（劲度系数、质量、阻尼）
- 💥 碰撞（弹性/非弹性，质量、速度可调）
- 📐 斜面滑块（角度、摩擦系数、受力分析）
- ⚡ 电路（串/并联，电压、电阻）
- 🌊 波的干涉（双源干涉条纹）
- 🔍 透镜成像（物距、焦距、光路图）

你也可以自由描述任何物理场景！

## 🔧 技术栈

- **后端**：Node.js + Express
- **前端**：HTML + CSS + JavaScript（Tailwind CDN）
- **API**：OpenAI 兼容格式
- **无框架依赖**：无需 React/Vue，无需构建

## 📝 License

MIT
