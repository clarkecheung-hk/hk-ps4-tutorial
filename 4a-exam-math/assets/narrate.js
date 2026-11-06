/* =========================================================
   narrate.js — 廣東話旁白（共用）
   用 iOS / iPadOS 內建 zh-HK 語音，唔需要下載任何檔案。

   加入：
     <script src="assets/narrate.js"></script>

   用法：
     Narrate.say('文字')                     // 讀一句
     Narrate.attach(buttonEl, () => '文字')   // 綁落按鈕，點一下讀
     Narrate.auto(textEl, () => '文字')       // 文字改變時自動讀
     Narrate.toggleButton(btnEl)              // 開關按鈕
   ========================================================= */
(function () {
  'use strict';

  if (window.Narrate) return;

  var N = {
    supported: ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window),
    on: true,
    voice: null,
    speaking: false,
    rate: 0.9,
    warned: false,
    tokens: [],
    _auto: [],          // { el, getText, lastText }
    _observer: null
  };

  /* ---------- 語音選擇 ---------- */
  function score(v) {
    var lang = (v.lang || '').toLowerCase().replace('_', '-');
    var nm = (v.name || '').toLowerCase();
    var s = 0;
    if (lang === 'zh-hk' || lang === 'yue-hk' || lang === 'yue') s += 100;
    else if (lang === 'zh-yue') s += 95;
    else if (lang === 'zh-tw' || lang === 'zh-hant-tw') s += 60;
    else if (lang.indexOf('zh') === 0) s += 40;
    else return -1;
    if (/cantonese|粵|粤|hong kong|香港/.test(nm)) s += 30;
    if (v.localService) s += 5;
    return s;
  }

  function pickVoice() {
    if (!N.supported) return null;
    var vs = window.speechSynthesis.getVoices() || [];
    if (!vs.length) return null;
    var best = null, bestScore = -1;
    vs.forEach(function (v) {
      var s = score(v);
      if (s > bestScore) { bestScore = s; best = v; }
    });
    return bestScore < 0 ? null : best;
  }

  function initVoices() {
    if (!N.supported) return;
    N.voice = pickVoice();
    if (!N.voice) {
      setTimeout(function () { N.voice = pickVoice(); }, 400);
      setTimeout(function () { N.voice = pickVoice(); }, 1400);
    }
    // 有語音之後補讀排隊中的
    if (N.voice && N._pending) {
      var t = N._pending;
      N._pending = null;
      N.say(t);
    }
  }

  if (N.supported) {
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }

  /* ---------- 朗讀 ---------- */
  function strip(s) {
    return String(s)
      .replace(/<br\s*\/?>/gi, '，')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '小於')
      .replace(/&gt;/g, '大於')
      .replace(/&amp;/g, '和')
      .replace(/\s+/g, ' ')
      .trim();
  }

  N.say = function (text, opts) {
    opts = opts || {};
    if (!N.on || !N.supported) return false;
    if (text === null || text === undefined) return false;
    var clean = strip(text);
    if (!clean) return false;

    var syn = window.speechSynthesis;
    try { syn.cancel(); } catch (e) {}

    var u = new window.SpeechSynthesisUtterance(clean);
    var v = N.voice || pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    else {
      u.lang = 'zh-HK';
      var vs = syn.getVoices() || [];
      if (vs.length && !vs.some(function (x) { return /^zh/i.test(x.lang || ''); })) {
        N.warnMissing();
      }
    }
    u.rate = opts.rate || N.rate;
    u.pitch = 1.02;
    u.volume = 1;

    u.onstart = function () {
      N.speaking = true;
      document.body.classList.add('narrating');
      if (opts.onstart) opts.onstart();
    };
    var done = function () {
      N.speaking = false;
      document.body.classList.remove('narrating');
      if (opts.onend) opts.onend();
    };
    u.onend = done;
    u.onerror = done;

    // iOS 需要保留引用，否則會被靜靜取消
    N.tokens.push(u);
    if (N.tokens.length > 10) N.tokens.shift();

    syn.speak(u);
    return true;
  };

  N.stop = function () {
    if (!N.supported) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    N.speaking = false;
    document.body.classList.remove('narrating');
  };

  N.warnMissing = function () {
    if (N.warned) return;
    N.warned = true;
    if (window.Whiteboard && typeof window.Whiteboard.toast === 'function') {
      window.Whiteboard.toast('未找到廣東話語音　設定 → 輔助使用 → 語音內容 → 加入「粵語（香港）」');
    }
  };

  /* ---------- 綁按鈕 ---------- */
  N.attach = function (btn, getText) {
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var t = typeof getText === 'function' ? getText() : getText;
      if (t) N.say(t);
    });
  };

  /* ---------- 自動朗讀（元素文字改變時） ---------- */
  N.auto = function (el, getText) {
    if (!el) return;
    N._auto.push({ el: el, getText: getText, last: '' });
    ensureObserver();
  };

  function ensureObserver() {
    if (N._observer || !window.MutationObserver) return;
    N._observer = new MutationObserver(function () {
      N._auto.forEach(function (item) {
        if (!item.el.isConnected) return;
        var t = typeof item.getText === 'function' ? item.getText() : item.el.textContent;
        if (!t) return;
        if (t === item.last) return;
        item.last = t;
        if (N.on) N.say(t);
      });
    });
    N._auto.forEach(function (item) {
      if (item.el && item.el.parentNode) {
        N._observer.observe(item.el, { childList: true, subtree: true, characterData: true });
      }
    });
  }

  /* ---------- 開關按鈕 ---------- */
  N.toggleButton = function (btn) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      N.on = !N.on;
      btn.textContent = N.on ? '🗣️' : '🚫';
      btn.classList.toggle('off', !N.on);
      btn.setAttribute('aria-label', N.on ? '關閉旁白' : '開啟旁白');
      if (N.on) {
        initVoices();
        if (N.voice) N.say('旁白已經開啟');
      } else {
        N.stop();
      }
    });
  };

  /* ---------- 全站共用嘅小喇叭按鈕 ---------- */
  N.speakerHTML = '<span class="narr-spk" aria-hidden="true">🔊</span>';

  /* 注入最小樣式 */
  var css = `
    .narr-spk{
      display:inline-grid;place-items:center;
      width:34px;height:34px;border-radius:50%;
      background:rgba(79,70,229,.09);color:#4f46e5;
      font-size:15px;cursor:pointer;flex:0 0 auto;
      border:none;transition:background .14s,transform .12s;
      -webkit-tap-highlight-color:transparent;vertical-align:middle;
    }
    .narr-spk:active{transform:scale(.88);background:rgba(79,70,229,.2)}
    .narr-spk:hover{background:rgba(79,70,229,.16)}
    body.narrating .narr-spk{animation:spkPulse 1.1s ease-in-out infinite}
    @keyframes spkPulse{
      0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,.34)}
      60%{box-shadow:0 0 0 8px rgba(79,70,229,0)}
    }
  `;
  function injectCSS() {
    if (document.getElementById('narrate-style')) return;
    var st = document.createElement('style');
    st.id = 'narrate-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* 建立一個小喇叭按鈕 */
  N.makeButton = function (getText, label) {
    var b = document.createElement('button');
    b.className = 'narr-spk';
    b.setAttribute('aria-label', label || '朗讀');
    b.title = label || '朗讀';
    b.innerHTML = '🔊';
    N.attach(b, getText);
    return b;
  };

  /* 停掉所有朗讀當離開頁面 */
  window.addEventListener('pagehide', N.stop);
  window.addEventListener('beforeunload', N.stop);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) N.stop();
  });

  injectCSS();

  window.Narrate = N;
})();