# 🔬 Physics Sim Generator

AI-powered physics simulation generator — describe a scene in natural language, get an interactive physics simulation page.

**English** | **[中文](README.zh-CN.md)**

## ✨ Features

- 🤖 **AI generation**: describe a physics scenario, get a complete interactive simulation
- 🎛️ **Adjustable parameters**: generated sims include sliders, buttons, and interactive controls
- 📱 **Responsive design**: desktop, tablet, and phone
- 💾 **Save & reuse**: keep generated sims locally and open them anytime
- 🎨 **Classroom-friendly**: dark theme, large fonts, great for projection


## 🚀 Quick Start

### Install

```bash
cd physics-sim-generator
npm install
```

### Run

```bash
npm start
```

Open http://localhost:3456 in your browser.

### Configure the API

1. Click "API Config" in the top-right corner
2. Pick a provider (Gemini / DeepSeek / GLM / Qwen / OpenAI / Custom)
3. Enter your API key
4. Base URL and model auto-fill (editable)

### Usage

1. Describe a physics scene in the input box, or pick a quick template
2. Click "✨ Generate Simulation"
3. Wait 10–30 seconds and preview the result
4. Click "💾 Save" if satisfied, or "🗑️ Discard" and regenerate

## 📁 Project Structure

```
physics-sim-generator/
├── package.json          # Project config
├── server.js             # Express backend
├── public/               # Frontend static files
│   ├── index.html        # Main page
│   ├── app.js            # Frontend logic
│   └── styles.css        # Custom styles
├── prompts/
│   └── physics.js        # System prompt template
├── saved/                # Saved simulation files
└── README.md
```

## 🎯 Example Supported Scenarios

- 🎯 Projectile motion (initial speed, angle, air drag)
- Pendulum (length, angle, gravity)
- Spring oscillator (stiffness, mass, damping)
- 💥 Collisions (elastic/inelastic, adjustable mass & velocity)
- 📐 Inclined plane (angle, friction, force analysis)
- ⚡ Circuits (series/parallel, voltage, resistance)
- 🌊 Wave interference (two-source patterns)
- 🔍 Lens imaging (object distance, focal length, ray diagram)

Any physics scene you can describe works!

## 🔧 Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML + CSS + JavaScript (Tailwind CDN)
- **API**: OpenAI-compatible format
- **No framework dependencies**: no React/Vue, no build step

## 📝 License

MIT
