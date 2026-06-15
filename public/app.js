// ========== DOM 引用 ==========
const configToggle = document.getElementById('configToggle');
const configToggleText = document.getElementById('configToggleText');
const configPanel = document.getElementById('configPanel');
const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('apiKey');
const baseUrlInput = document.getElementById('baseUrl');
const modelInput = document.getElementById('model');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const generateBtnText = document.getElementById('generateBtnText');
const loadingDots = document.getElementById('loadingDots');
const statusBar = document.getElementById('statusBar');
const previewFrame = document.getElementById('previewFrame');
const previewActions = document.getElementById('previewActions');
const previewHint = document.getElementById('previewHint');
const saveBtn = document.getElementById('saveBtn');
const discardBtn = document.getElementById('discardBtn');
const savedList = document.getElementById('savedList');
const refreshSaved = document.getElementById('refreshSaved');

// ========== Provider 默认值 ==========
const PROVIDER_DEFAULTS = {
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' },
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  glm: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  openai: { baseUrl: 'https://api.openai.com', model: 'gpt-4o' },
  custom: { baseUrl: '', model: '' },
};

// 当前生成的 HTML（用于保存）
let currentHtml = '';

// ========== 配置管理 ==========
function saveConfig() {
  const config = {
    provider: providerSelect.value,
    apiKey: apiKeyInput.value,
    baseUrl: baseUrlInput.value,
    model: modelInput.value,
  };
  localStorage.setItem('physics-sim-config', JSON.stringify(config));
}

function loadConfig() {
  const saved = localStorage.getItem('physics-sim-config');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      providerSelect.value = config.provider || 'gemini';
      apiKeyInput.value = config.apiKey || '';
      baseUrlInput.value = config.baseUrl || '';
      modelInput.value = config.model || '';
      updateConfigToggleText();
      // 如果有 API Key，收起配置面板
      if (config.apiKey) {
        configPanel.classList.remove('open');
      } else {
        configPanel.classList.add('open');
      }
    } catch (e) {
      configPanel.classList.add('open');
    }
  } else {
    configPanel.classList.add('open');
  }
}

function updateConfigToggleText() {
  const hasKey = apiKeyInput.value.length > 0;
  configToggleText.textContent = hasKey ? `✅ ${providerSelect.options[providerSelect.selectedIndex].text} 已配置` : 'API 配置';
}

// Provider 切换时自动填充默认 Base URL 和 Model
providerSelect.addEventListener('change', () => {
  const provider = providerSelect.value;
  const defaults = PROVIDER_DEFAULTS[provider];
  if (provider !== 'custom') {
    if (!baseUrlInput.value || Object.values(PROVIDER_DEFAULTS).some(d => d.baseUrl === baseUrlInput.value)) {
      baseUrlInput.value = defaults.baseUrl;
    }
    if (!modelInput.value || Object.values(PROVIDER_DEFAULTS).some(d => d.model === modelInput.value)) {
      modelInput.value = defaults.model;
    }
  }
  saveConfig();
  updateConfigToggleText();
});

// 输入变化时自动保存
[apiKeyInput, baseUrlInput, modelInput].forEach(el => {
  el.addEventListener('input', () => {
    saveConfig();
    updateConfigToggleText();
  });
});

// 配置面板折叠
configToggle.addEventListener('click', () => {
  configPanel.classList.toggle('open');
});

// ========== 模板按钮 ==========
document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    promptInput.value = btn.dataset.prompt;
    promptInput.focus();
  });
});

// ========== 生成模拟 ==========
async function generate() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showStatus('请输入物理场景描述', 'error');
    return;
  }

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showStatus('请先在上方配置 API Key', 'error');
    configPanel.classList.add('open');
    return;
  }

  // 设置 loading 状态
  generateBtn.disabled = true;
  generateBtnText.textContent = '生成中';
  loadingDots.classList.remove('hidden');
  loadingDots.classList.add('flex');
  showStatus('正在生成物理模拟，请耐心等待 10-30 秒...', 'info');

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider: providerSelect.value,
        apiKey,
        baseUrl: baseUrlInput.value.trim(),
        model: modelInput.value.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`);
    }

    // 渲染预览
    currentHtml = data.html;
    renderPreview(data.html);
    previewActions.classList.remove('hidden');
    previewActions.classList.add('flex');
    previewHint.textContent = '预览已生成 — 可保存或丢弃';
    showStatus('✅ 生成成功！', 'success');
  } catch (err) {
    console.error('生成失败:', err);
    showStatus(`❌ ${err.message}`, 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtnText.textContent = '✨ 生成物理模拟';
    loadingDots.classList.add('hidden');
    loadingDots.classList.remove('flex');
  }
}

generateBtn.addEventListener('click', generate);

// Ctrl/Cmd + Enter 快捷生成
promptInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    generate();
  }
});

// ========== 预览渲染 ==========
function renderPreview(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  previewFrame.src = url;
  // 清理旧的 blob URL
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ========== 保存 / 丢弃 ==========
saveBtn.addEventListener('click', async () => {
  if (!currentHtml) return;
  
  saveBtn.disabled = true;
  saveBtn.textContent = '💾 保存中...';

  try {
    const description = promptInput.value.trim().slice(0, 20) || 'simulation';
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: currentHtml, description }),
    });
    const data = await response.json();
    if (data.success) {
      showStatus(`✅ 已保存: ${data.filename}`, 'success');
      loadSavedList();
    } else {
      throw new Error(data.error || '保存失败');
    }
  } catch (err) {
    showStatus(`❌ 保存失败: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾</span> 保存';
  }
});

discardBtn.addEventListener('click', () => {
  currentHtml = '';
  previewFrame.src = 'about:blank';
  previewActions.classList.add('hidden');
  previewActions.classList.remove('flex');
  previewHint.textContent = '生成的模拟将在此处预览';
  showStatus('已丢弃', 'info');
});

// ========== 状态栏 ==========
function showStatus(msg, type = 'info') {
  statusBar.classList.remove('hidden');
  statusBar.textContent = msg;
  const styles = {
    error: 'bg-red-500/20 text-red-300 border border-red-500/40',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  };
  statusBar.className = `text-sm rounded-lg px-4 py-3 ${styles[type]}`;
  if (type === 'success') {
    setTimeout(() => statusBar.classList.add('hidden'), 3000);
  }
}

// ========== 已保存列表 ==========
async function loadSavedList() {
  try {
    const response = await fetch('/api/saved');
    const data = await response.json();
    
    if (!data.files || data.files.length === 0) {
      savedList.innerHTML = '<p class="text-gray-600 text-sm col-span-full text-center py-8">暂无保存的模拟</p>';
      return;
    }

    savedList.innerHTML = data.files.map(f => `
      <div class="saved-card bg-sim-card border border-sim-border rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <h4 class="text-sm font-medium truncate flex-1" title="${f.name}">${formatName(f.name)}</h4>
          <span class="text-xs text-gray-600 whitespace-nowrap">${formatSize(f.size)}</span>
        </div>
        <p class="text-xs text-gray-500">${formatDate(f.mtime)}</p>
        <div class="flex gap-2 mt-1">
          <button class="text-xs px-3 py-1.5 rounded-lg bg-sim-accent/20 border border-sim-accent/40 text-sim-accent-light hover:bg-sim-accent/30 transition open-sim" data-filename="${f.filename}">
            🔗 打开
          </button>
          <button class="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition preview-sim" data-filename="${f.filename}">
            👀 预览
          </button>
          <button class="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition delete-sim ml-auto" data-filename="${f.filename}">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // 绑定事件
    savedList.querySelectorAll('.open-sim').forEach(btn => {
      btn.addEventListener('click', () => {
        window.open(`/saved/${btn.dataset.filename}`, '_blank');
      });
    });

    savedList.querySelectorAll('.preview-sim').forEach(btn => {
      btn.addEventListener('click', async () => {
        const resp = await fetch(`/saved/${btn.dataset.filename}`);
        const html = await resp.text();
        currentHtml = html;
        renderPreview(html);
        previewActions.classList.remove('hidden');
        previewActions.classList.add('flex');
        previewHint.textContent = `预览: ${btn.dataset.filename}`;
        // 滚动到预览区
        document.getElementById('previewFrame').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    savedList.querySelectorAll('.delete-sim').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确定删除这个模拟吗？')) return;
        const resp = await fetch(`/api/saved/${btn.dataset.filename}`, { method: 'DELETE' });
        const data = await resp.json();
        if (data.success) {
          showStatus('已删除', 'success');
          loadSavedList();
        } else {
          showStatus(`删除失败: ${data.error}`, 'error');
        }
      });
    });
  } catch (err) {
    console.error('加载列表失败:', err);
  }
}

refreshSaved.addEventListener('click', loadSavedList);

// ========== 工具函数 ==========
function formatName(name) {
  // 2025-01-15T12-30-00_抛体运动 → 01-15 12:30 · 抛体运动
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})_(.*)$/);
  if (m) {
    return `${m[2]}-${m[3]} ${m[4]}:${m[5]} · ${m[7]}`;
  }
  return name;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ========== 初始化 ==========
loadConfig();
loadSavedList();
