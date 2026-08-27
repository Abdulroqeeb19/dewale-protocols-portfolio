/* ChatBot Pro — Embeddable Widget v2 (Hardened) */
(function() {
  'use strict';
  const SCRIPT = document.currentScript;
  const BUSINESS_ID = SCRIPT?.getAttribute('data-business-id') || '';

  if (!BUSINESS_ID || BUSINESS_ID.length > 100 || !/^[a-zA-Z0-9\-]+$/.test(BUSINESS_ID)) {
    console.warn('ChatBot Pro: invalid business-id');
    return;
  }

  let chatOpen = false;
  let messages = [];
  let flowState = 'greeting';
  let collected = {};
  let businessConfig = null;
  let submitTimestamp = 0;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitize(str) {
    return escapeHtml(String(str || '')).slice(0, 2000);
  }

  function init() {
    loadConfig().then(() => {
      renderWidget();
      if (!chatOpen) showBubble();
    });
  }

  async function loadConfig() {
    try {
      const API = SCRIPT.src.replace('/widget.js', '');
      const res = await fetch(`${API}/api/widget-config?id=${BUSINESS_ID}`);
      const data = await res.json();
      if (data.ok) businessConfig = data.config;
    } catch(e) { console.error('ChatBot Pro: config load failed', e); }
  }

  function getConfig() {
    return businessConfig || {
      greeting: 'Hello! How can I help you today?',
      primaryColor: '#6366f1',
      position: 'bottom-right',
      businessName: 'Business',
      services: [],
    };
  }

  function renderWidget() {
    const cfg = getConfig();
    const pos = cfg.position === 'bottom-left' ? 'left:20px' : 'right:20px';

    const css = document.createElement('style');
    css.textContent = `
      #cbp-fab{position:fixed;bottom:24px;${pos};z-index:99999;width:60px;height:60px;border-radius:50%;background:${cfg.primaryColor};color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px ${cfg.primaryColor}66;display:grid;place-items:center;font-size:24px;transition:transform .2s}
      #cbp-fab:hover{transform:scale(1.08)}
      #cbp-window{position:fixed;bottom:96px;${pos};z-index:99999;width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);border-radius:16px;overflow:hidden;display:none;flex-direction:column;background:#0f1219;border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:Inter,system-ui,sans-serif}
      #cbp-window.open{display:flex}
      #cbp-header{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#161b26;border-bottom:1px solid rgba(255,255,255,.06)}
      #cbp-header-avatar{width:36px;height:36px;border-radius:50%;background:${cfg.primaryColor};display:grid;place-items:center;font-weight:700;font-size:.75rem;color:#fff}
      #cbp-header-info{flex:1}#cbp-header-info strong{display:block;font-size:.9rem;color:#f1f5f9}#cbp-header-info span{font-size:.7rem;color:#22c55e}
      #cbp-close{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#94a3b8;cursor:pointer;border:none;background:none}#cbp-close:hover{background:rgba(255,255,255,.06)}
      #cbp-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#0f1219}
      .cbp-msg{display:flex;gap:8px;max-width:85%;animation:cbpIn .3s ease both}
      .cbp-msg-bot{align-self:flex-start}.cbp-msg-user{align-self:flex-end;flex-direction:row-reverse}
      .cbp-bubble{padding:10px 14px;border-radius:14px;font-size:.88rem;line-height:1.5}
      .cbp-msg-bot .cbp-bubble{background:#1c2233;color:#e2e8f0;border-bottom-left-radius:4px}
      .cbp-msg-user .cbp-bubble{background:${cfg.primaryColor};color:#fff;border-bottom-right-radius:4px}
      .cbp-options{display:flex;flex-direction:column;gap:5px;margin-top:6px}
      .cbp-option{padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:${cfg.primaryColor};font-size:.82rem;text-align:left;cursor:pointer;font-family:inherit}
      .cbp-option:hover{background:rgba(255,255,255,.08);border-color:${cfg.primaryColor}}
      #cbp-input-bar{display:flex;gap:8px;padding:10px 12px;background:#161b26;border-top:1px solid rgba(255,255,255,.06)}
      #cbp-input{flex:1;padding:10px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:#0f1219;color:#f1f5f9;font-size:.88rem;outline:none;font-family:inherit}
      #cbp-input:focus{border-color:${cfg.primaryColor}}
      #cbp-send{width:38px;height:38px;border-radius:50%;background:${cfg.primaryColor};color:#fff;border:none;cursor:pointer;display:grid;place-items:center}
      #cbp-send:disabled{opacity:.4;cursor:not-allowed}
      .cbp-typing{display:flex;gap:4px;padding:12px 16px}
      .cbp-typing span{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:cbpDot 1.2s infinite}
      .cbp-typing span:nth-child(2){animation-delay:.15s}.cbp-typing span:nth-child(3){animation-delay:.3s}
      @keyframes cbpIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes cbpDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
      @media(max-width:480px){#cbp-window{bottom:0;right:0;width:100%;height:100%;max-height:100vh;border-radius:0}}
    `;
    document.head.appendChild(css);

    const fab = document.createElement('button');
    fab.id = 'cbp-fab';
    fab.innerHTML = '💬';
    fab.onclick = toggleChat;
    document.body.appendChild(fab);

    const win = document.createElement('div');
    win.id = 'cbp-window';
    win.innerHTML = `
      <div id="cbp-header">
        <div id="cbp-header-avatar">${(cfg.businessName||'B').charAt(0)}</div>
        <div id="cbp-header-info"><strong>${cfg.businessName||'Business'}</strong><span>Online</span></div>
        <button id="cbp-close" onclick="document.getElementById('cbp-window').classList.remove('open')">✕</button>
      </div>
      <div id="cbp-messages"></div>
      <div id="cbp-input-bar">
        <input id="cbp-input" placeholder="Type a message..." />
        <button id="cbp-send" disabled>➤</button>
      </div>
    `;
    document.body.appendChild(win);

    document.getElementById('cbp-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('cbp-input').addEventListener('input', e => {
      document.getElementById('cbp-send').disabled = !e.target.value.trim();
    });
    document.getElementById('cbp-send').addEventListener('click', sendMessage);

    addBotMessage(cfg.greeting, [
      { label: '📋 Our Services', value: 'services' },
      { label: '📅 Book Appointment', value: 'booking' },
      { label: '💬 General Enquiry', value: 'enquiry' },
    ]);
  }

  function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('cbp-window').classList.toggle('open', chatOpen);
    if (chatOpen) {
      document.getElementById('cbp-fab').innerHTML = '✕';
      document.getElementById('cbp-messages').scrollTop = 999999;
    } else {
      document.getElementById('cbp-fab').innerHTML = '💬';
    }
  }

  function showBubble() {}

  function addBotMessage(text, options) {
    const el = document.getElementById('cbp-messages');
    if (!el) return;
    const msg = document.createElement('div');
    msg.className = 'cbp-msg cbp-msg-bot';
    let html = `<div class="cbp-bubble">${text.replace(/\n/g,'<br>')}</div>`;
    if (options) {
      html += '<div class="cbp-options">';
      options.forEach(o => {
        html += `<button class="cbp-option" data-value="${o.value}">${o.label}</button>`;
      });
      html += '</div>';
    }
    msg.innerHTML = html;
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;

    if (options) {
      msg.querySelectorAll('.cbp-option').forEach(btn => {
        btn.onclick = () => handleOption(btn.dataset.value, btn.textContent);
      });
    }
  }

  function addUserMessage(text) {
    const el = document.getElementById('cbp-messages');
    if (!el) return;
    const msg = document.createElement('div');
    msg.className = 'cbp-msg cbp-msg-user';
    msg.innerHTML = `<div class="cbp-bubble">${text}</div>`;
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;
  }

  function showTyping() {
    const el = document.getElementById('cbp-messages');
    if (!el) return;
    const t = document.createElement('div');
    t.id = 'cbp-typing';
    t.className = 'cbp-msg cbp-msg-bot';
    t.innerHTML = '<div class="cbp-bubble cbp-typing"><span></span><span></span><span></span></div>';
    el.appendChild(t);
    el.scrollTop = el.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('cbp-typing')?.remove();
  }

  function handleOption(value, label) {
    addUserMessage(label);
    document.querySelectorAll('#cbp-messages .cbp-options').forEach(el => {
      el.querySelectorAll('button').forEach(b => b.disabled = true);
      el.style.opacity = '0.5';
    });

    collected.intent = value;

    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        if (value === 'services') {
          const cfg = getConfig();
          if (cfg.services?.length) {
            let text = 'Here are our services:\n\n';
            cfg.services.forEach((s, i) => {
              text += `${i+1}. ${s.name}${s.price ? ' — ' + s.price : ''}\n`;
              if (s.description) text += `   ${s.description}\n`;
            });
            text += '\nWould you like to book one of these?';
            addBotMessage(text, cfg.services.map(s => ({ label: s.name, value: 'book:'+s.name })));
          } else {
            addBotMessage('Our services are being updated. Please contact us directly for more info.');
          }
          flowState = 'services';
        } else if (value === 'booking' || value === 'enquiry') {
          addBotMessage('Great! What is your name?');
          flowState = 'name';
        } else if (value?.startsWith('book:')) {
          collected.service = value.replace('book:', '');
          addBotMessage('What is your name?');
          flowState = 'name';
        }
      }, 600);
    }, 300);
  }

  function sendMessage() {
    const input = document.getElementById('cbp-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    document.getElementById('cbp-send').disabled = true;
    addUserMessage(text);

    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        processInput(text);
      }, 500);
    }, 200);
  }

  function processInput(text) {
    if (flowState === 'name') {
      collected.name = text;
      addBotMessage('What is your email address?');
      flowState = 'email';
    } else if (flowState === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        addBotMessage('Please enter a valid email address.');
        return;
      }
      collected.email = text;
      addBotMessage('What is your phone number?');
      flowState = 'phone';
    } else if (flowState === 'phone') {
      collected.phone = text;
      addBotMessage('How can we help you? Please describe what you need.');
      flowState = 'message';
    } else if (flowState === 'message') {
      collected.message = text;
      submitLead();
    } else {
      addBotMessage('Type "menu" to start over, or tell me how I can help.', [
        { label: '📋 Our Services', value: 'services' },
        { label: '📅 Book Appointment', value: 'booking' },
        { label: '💬 General Enquiry', value: 'enquiry' },
      ]);
      flowState = 'greeting';
      collected = {};
    }
  }

  async function submitLead() {
    if (Date.now() - submitTimestamp < 3000) return;
    submitTimestamp = Date.now();

    const name = sanitize(collected.name);
    const email = sanitize(collected.email);
    const phone = sanitize(collected.phone);
    const service = sanitize(collected.service || '');
    const message = sanitize(collected.message || '');

    if (!name || name.length < 2) { addBotMessage('Please enter a valid name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { addBotMessage('Please enter a valid email.'); return; }

    addBotMessage(`Thank you, ${name}! Your enquiry has been submitted. We'll get back to you at ${email} within 24 hours.`);

    try {
      const API = SCRIPT.src.replace('/widget.js', '');
      await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: BUSINESS_ID, name, email, phone, service, message }),
      });
    } catch(e) { console.error('Lead submit failed', e); }

    setTimeout(() => {
      addBotMessage('Is there anything else I can help with?', [
        { label: '📋 Our Services', value: 'services' },
        { label: '💬 Start Over', value: 'services' },
      ]);
      flowState = 'greeting';
      collected = {};
    }, 1500);
  }

  window.addEventListener('open-chatbot', () => { if (!chatOpen) toggleChat(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
