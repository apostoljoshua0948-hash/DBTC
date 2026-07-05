
(function () {
  const SYSTEM_PROMPT = `You are a helpful AI assistant for Don Bosco Training Center, Mati City. You help students with questions about the Officers Election system, voting procedures, student council, and general school-related topics. Be friendly, concise, and helpful. Respond in Filipino or English depending on what the student uses.`;

  const MODEL_ID = "Phi-3.5-mini-instruct-q4f16_1-MLC";

  const styles = `
    #ai-chat-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #ai-chat-toggle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a3a5c, #c8a84b);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: transform 0.2s;
      margin-left: auto;
    }
    #ai-chat-toggle:hover { transform: scale(1.08); }
    #ai-chat-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #c8a84b;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      border-radius: 10px;
      padding: 2px 6px;
      display: none;
    }
    #ai-chat-window {
      display: none;
      flex-direction: column;
      width: 340px;
      max-width: calc(100vw - 48px);
      height: 480px;
      max-height: calc(100vh - 100px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.2);
      margin-bottom: 12px;
      overflow: hidden;
    }
    #ai-chat-window.open { display: flex; }
    #ai-chat-header {
      background: linear-gradient(135deg, #1a3a5c, #2d5a8a);
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #ai-chat-header .ai-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: #c8a84b;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    #ai-chat-header .ai-info { flex: 1; }
    #ai-chat-header .ai-name { font-weight: 700; font-size: 14px; }
    #ai-chat-header .ai-status { font-size: 11px; opacity: 0.8; }
    #ai-chat-close {
      background: none; border: none; color: #fff;
      font-size: 20px; cursor: pointer; padding: 0 4px; opacity: 0.8;
    }
    #ai-chat-close:hover { opacity: 1; }
    #ai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f7f9fc;
    }
    .ai-msg {
      max-width: 85%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .ai-msg.bot {
      background: #fff;
      border: 1px solid #e0e7ef;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .ai-msg.user {
      background: linear-gradient(135deg, #1a3a5c, #2d5a8a);
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .ai-msg.loading {
      background: #fff;
      border: 1px solid #e0e7ef;
      align-self: flex-start;
      color: #888;
    }
    #ai-chat-init-msg {
      text-align: center;
      padding: 20px 12px;
      color: #555;
      font-size: 12px;
    }
    #ai-chat-init-msg .init-icon { font-size: 28px; margin-bottom: 8px; }
    #ai-chat-init-msg .init-title { font-weight: 700; color: #1a3a5c; font-size: 14px; margin-bottom: 4px; }
    #ai-load-btn {
      margin: 10px auto 0;
      display: block;
      background: #c8a84b;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    #ai-load-btn:hover { background: #b8943b; }
    #ai-load-progress {
      margin-top: 10px;
      font-size: 11px;
      color: #888;
      text-align: center;
    }
    #ai-chat-footer {
      padding: 10px;
      border-top: 1px solid #e0e7ef;
      display: flex;
      gap: 8px;
      background: #fff;
    }
    #ai-chat-input {
      flex: 1;
      border: 1px solid #d0d9e6;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      outline: none;
      resize: none;
      height: 38px;
      font-family: inherit;
    }
    #ai-chat-input:focus { border-color: #1a3a5c; }
    #ai-chat-send {
      background: #1a3a5c;
      color: #fff;
      border: none;
      border-radius: 8px;
      width: 38px; height: 38px;
      cursor: pointer;
      font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    #ai-chat-send:hover { background: #2d5a8a; }
    #ai-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const container = document.createElement('div');
  container.id = 'ai-chat-bubble';
  container.innerHTML = `
    <div id="ai-chat-window">
      <div id="ai-chat-header">
        <div class="ai-avatar">🤖</div>
        <div class="ai-info">
          <div class="ai-name">DBTC AI Assistant</div>
          <div class="ai-status" id="ai-status-text">Local AI • Runs on your device</div>
        </div>
        <button id="ai-chat-close">✕</button>
      </div>
      <div id="ai-chat-messages">
        <div id="ai-chat-init-msg">
          <div class="init-icon">🧠</div>
          <div class="init-title">Local AI Assistant</div>
          <div>Libre at private — tumatakbo sa iyong browser mismo. Hindi kailangan ng internet pagkatapos mag-load.</div>
          <button id="ai-load-btn">I-load ang AI (once lang)</button>
          <div id="ai-load-progress"></div>
        </div>
      </div>
      <div id="ai-chat-footer" style="display:none;">
        <textarea id="ai-chat-input" placeholder="Mag-type ng tanong..." rows="1"></textarea>
        <button id="ai-chat-send">➤</button>
      </div>
    </div>
    <div style="position:relative;">
      <span id="ai-chat-badge">AI</span>
      <button id="ai-chat-toggle" title="AI Assistant">🤖</button>
    </div>
  `;
  document.body.appendChild(container);

  const win = document.getElementById('ai-chat-window');
  const toggle = document.getElementById('ai-chat-toggle');
  const close = document.getElementById('ai-chat-close');
  const messages = document.getElementById('ai-chat-messages');
  const footer = document.getElementById('ai-chat-footer');
  const input = document.getElementById('ai-chat-input');
  const send = document.getElementById('ai-chat-send');
  const loadBtn = document.getElementById('ai-load-btn');
  const loadProgress = document.getElementById('ai-load-progress');
  const statusText = document.getElementById('ai-status-text');
  const badge = document.getElementById('ai-chat-badge');

  let engine = null;
  let loading = false;
  let ready = false;
  let chatHistory = [];

  toggle.addEventListener('click', () => {
    const isOpen = win.classList.contains('open');
    win.classList.toggle('open', !isOpen);
    badge.style.display = 'none';
  });
  close.addEventListener('click', () => win.classList.remove('open'));

  loadBtn.addEventListener('click', loadModel);

  async function loadModel() {
    if (loading || ready) return;
    loading = true;
    loadBtn.disabled = true;
    loadBtn.textContent = 'Nag-lo-load...';
    loadProgress.textContent = 'Dina-download ang AI model sa iyong browser. Maaaring tumagal ng 1-3 minuto sa unang beses.';
    statusText.textContent = 'Nag-lo-load...';

    try {
      const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');

      engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (progress) => {
          const pct = Math.round((progress.progress || 0) * 100);
          loadProgress.textContent = `${progress.text || 'Loading...'} (${pct}%)`;
        }
      });

      ready = true;
      loading = false;
      statusText.textContent = 'Online • Local AI';

      const initMsg = document.getElementById('ai-chat-init-msg');
      if (initMsg) initMsg.remove();
      footer.style.display = 'flex';

      addMessage('bot', 'Kamusta! Ako ang inyong AI Assistant ng Don Bosco TC. Paano kita matutulungan? 😊');

      chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

    } catch (err) {
      loading = false;
      loadBtn.disabled = false;
      loadBtn.textContent = 'Subukan ulit';
      loadProgress.textContent = 'Error: ' + (err.message || 'Hindi ma-load ang AI. Subukan ulit.');
      statusText.textContent = 'Error';
    }
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  async function sendMessage() {
    if (!ready || !engine) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    send.disabled = true;
    input.disabled = true;

    addMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    const loadingDiv = addMessage('loading', '...');

    try {
      const reply = await engine.chat.completions.create({
        messages: chatHistory,
        stream: true,
        temperature: 0.7,
        max_tokens: 400,
      });

      let fullText = '';
      loadingDiv.className = 'ai-msg bot';
      loadingDiv.textContent = '';

      for await (const chunk of reply) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullText += delta;
        loadingDiv.textContent = fullText;
        messages.scrollTop = messages.scrollHeight;
      }

      chatHistory.push({ role: 'assistant', content: fullText });

    } catch (err) {
      loadingDiv.className = 'ai-msg bot';
      loadingDiv.textContent = 'Error: ' + (err.message || 'Hindi makuha ang sagot. Subukan ulit.');
    }

    send.disabled = false;
    input.disabled = false;
    input.focus();
  }

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  setTimeout(() => {
    badge.style.display = 'block';
  }, 2000);
})();
