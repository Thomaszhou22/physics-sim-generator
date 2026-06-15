const express = require('express');
const fs = require('fs');
const path = require('path');
const { buildSystemPrompt } = require('./prompts/physics');

const app = express();
const PORT = 3456;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/saved', express.static(path.join(__dirname, 'saved')));

// 预定义 Provider 配置
const PROVIDERS = {
  openai: { baseUrl: 'https://api.openai.com', model: 'gpt-4o' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' },
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  glm: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  custom: { baseUrl: '', model: '' },
};

// POST /api/generate — 调用 LLM 生成物理模拟 HTML
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, provider, apiKey, baseUrl: customBaseUrl, model: customModel } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: '请先配置 API Key' });
    }
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: '请输入物理场景描述' });
    }

    const providerConfig = PROVIDERS[provider] || PROVIDERS.custom;
    const baseUrl = customBaseUrl || providerConfig.baseUrl;
    const model = customModel || providerConfig.model;

    if (!baseUrl) {
      return res.status(400).json({ error: '请配置 Base URL' });
    }

    const systemPrompt = buildSystemPrompt();
    const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

    console.log(`[生成] Provider: ${provider}, Model: ${model}, Prompt: ${prompt.slice(0, 80)}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[API错误]', response.status, errText);
      let friendlyError = `API 调用失败 (${response.status})`;
      if (response.status === 401) friendlyError = 'API Key 无效，请检查配置';
      else if (response.status === 429) friendlyError = '请求过于频繁，请稍后再试';
      else if (response.status >= 500) friendlyError = 'API 服务暂时不可用，请稍后再试';
      return res.status(response.status).json({ error: friendlyError, detail: errText });
    }

    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || '';

    // 清理可能的 markdown 代码块标记
    html = html.trim();
    if (html.startsWith('```')) {
      // 移除开头的 ```html 或 ```
      html = html.replace(/^```(?:html)?\s*\n?/, '');
      // 移除结尾的 ```
      html = html.replace(/\n?```\s*$/, '');
    }
    html = html.trim();

    if (!html || html.length < 50) {
      return res.status(500).json({ error: '生成内容为空或过短，请重试' });
    }

    console.log(`[完成] 生成 HTML 长度: ${html.length}`);
    res.json({ html });
  } catch (err) {
    console.error('[生成错误]', err);
    if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch')) {
      return res.status(502).json({ error: '无法连接到 API 服务，请检查 Base URL 和网络' });
    }
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

// POST /api/save — 保存生成的 HTML
app.post('/api/save', (req, res) => {
  try {
    const { html, description } = req.body;
    if (!html) {
      return res.status(400).json({ error: '没有可保存的内容' });
    }

    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const desc = (description || 'simulation').slice(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const filename = `${ts}_${desc}.html`;
    const filepath = path.join(__dirname, 'saved', filename);

    fs.writeFileSync(filepath, html, 'utf-8');
    console.log(`[保存] ${filename}`);
    res.json({ success: true, filename });
  } catch (err) {
    console.error('[保存错误]', err);
    res.status(500).json({ error: '保存失败', detail: err.message });
  }
});

// GET /api/saved — 列出已保存的模拟
app.get('/api/saved', (req, res) => {
  try {
    const savedDir = path.join(__dirname, 'saved');
    if (!fs.existsSync(savedDir)) {
      return res.json({ files: [] });
    }
    const files = fs.readdirSync(savedDir)
      .filter(f => f.endsWith('.html'))
      .map(f => {
        const stat = fs.statSync(path.join(savedDir, f));
        return {
          filename: f,
          name: f.replace(/\.html$/, ''),
          size: stat.size,
          mtime: stat.mtime,
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    res.json({ files });
  } catch (err) {
    console.error('[列表错误]', err);
    res.status(500).json({ error: '获取列表失败', detail: err.message });
  }
});

// DELETE /api/saved/:filename — 删除已保存的模拟
app.delete('/api/saved/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filepath = path.join(__dirname, 'saved', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 安全检查：只允许删除 saved 目录下的 .html 文件
    if (!filename.endsWith('.html')) {
      return res.status(400).json({ error: '只能删除 HTML 文件' });
    }

    fs.unlinkSync(filepath);
    console.log(`[删除] ${filename}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[删除错误]', err);
    res.status(500).json({ error: '删除失败', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔬 Physics Sim Generator 运行中`);
  console.log(`   地址: http://localhost:${PORT}\n`);
});
