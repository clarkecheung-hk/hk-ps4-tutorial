/* =========================================================
   wb.js — 共用白板（Apple Pencil / 手指手寫 + 自動儲存）
   任何頁面只要加一行：
     <script src="assets/wb.js"></script>
   就會自動加入白板。科學科三個頁面共用同一個筆記本。
   ========================================================= */
(function () {
  'use strict';

  if (window.__wbLoaded) return;
  window.__wbLoaded = true;

  /* ---------------------------------------------------------
     1. 樣式（自動注入，唔需要另外加 CSS 檔）
     --------------------------------------------------------- */
  var CSS = `
  html{ --wb-w:0px; }
  body.wb-open{ --wb-w:min(50vw,640px); }

  /* 主內容讓出右邊空間 */
  body.wb-open{ padding-right:var(--wb-w); box-sizing:border-box; }

  /* 白板打開後 topbar 要讓位：
     收窄品牌／分頁／喇叭，令 topbar 保持一行高，
     唔會影響 scoreboard、chapter-nav 等 top:64px 嘅 sticky 位置 */
  body.wb-open .topbar{ gap:8px; padding-left:14px; padding-right:14px; }
  body.wb-open .brand{ font-size:15px; gap:8px; min-width:0; }
  body.wb-open .brand span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  body.wb-open .brand small{ display:none; }
  body.wb-open .brand-mark{ width:30px; height:30px; }
  body.wb-open .tabs{ padding:4px; gap:3px; }
  body.wb-open .tab{ padding:7px 9px; font-size:12.5px; }
  body.wb-open .sound-btn{ width:34px; height:34px; font-size:15px; flex:none; }

  /* 固定喺底部嘅元素唔存在，故略去 */

  /* ---------- 面板 ---------- */
  /* 科學科頁面冇底部工具列，所以面板可以貼到底
     z-index 要高過 sticky topbar（70），但低過遊戲頁彈窗（200）同彩紙（150） */
  .wbpane{
    position:fixed; top:0; right:0;
    bottom:0;
    width:var(--wb-w);
    z-index:80;
    display:none;
    padding:calc(env(safe-area-inset-top,0px) + 8px) 0 8px 0;
    background:rgba(243,250,246,.97);
    border-left:1px solid #DCEAE1;
    box-shadow:-8px 0 30px rgba(46,158,107,.12);
  }
  body.wb-open .wbpane{ display:block; }
  body.wb-open .wbpane{ animation:wbSlide .24s cubic-bezier(.34,1.1,.5,1); }
  @keyframes wbSlide{ from{transform:translateX(26px);opacity:.4} to{transform:none;opacity:1} }

  .wbpane-inner{
    display:flex; flex-direction:column;
    height:100%; min-height:0;
    margin:0 10px;
    background:#fff; border:1px solid #DCEAE1;
    border-radius:20px; overflow:hidden;
    box-shadow:0 6px 24px rgba(46,158,107,.10);
  }

  /* ---------- 標題列 ---------- */
  .wb-head{
    display:flex; align-items:center; gap:6px;
    padding:9px 10px; border-bottom:1px solid #DCEAE1;
    background:linear-gradient(180deg,#FAFDFB,#EDF8F2);
    flex:0 0 auto;
  }
  .wb-close{
    width:44px;height:44px;border-radius:12px;border:1px solid #DCEAE1;
    background:#fff;color:#4A5A52;font-size:20px;font-weight:900;
    cursor:pointer;display:grid;place-items:center;flex:0 0 auto;
    transition:background .14s,transform .1s;
    -webkit-tap-highlight-color:transparent;font-family:inherit;
  }
  .wb-close:active{transform:scale(.92);background:#fdeaea;color:#e8503f}
  .wb-title{font-size:17px;font-weight:900;white-space:nowrap;margin-right:2px;color:#2E9E6B}
  .wb-pages{display:flex;align-items:center;gap:3px;margin-left:auto}
  .wb-pg{
    font-size:16px;font-weight:900;color:#4A5A52;
    min-width:52px;text-align:center;font-variant-numeric:tabular-nums;
  }

  .wbb{
    width:44px;height:44px;border-radius:12px;border:1px solid #DCEAE1;
    background:#fff;color:#1F2B26;font-size:18px;font-weight:800;
    cursor:pointer;display:grid;place-items:center;flex:0 0 auto;
    transition:background .14s,transform .1s;
    -webkit-tap-highlight-color:transparent;
  }
  .wbb:active{transform:scale(.92);background:#E7F6EE}
  .wbb:disabled{opacity:.32;cursor:default}
  .wbb.danger:active{background:#fdeaea}

  /* ---------- 工具列 ---------- */
  .wb-tools{
    display:flex; flex-wrap:wrap; gap:7px; padding:9px 10px;
    border-bottom:1px solid #DCEAE1; background:#FAFDFB; flex:0 0 auto;
  }
  .wb-group{
    display:flex; gap:3px; align-items:center;
    background:#fff; border:1px solid #DCEAE1; border-radius:14px; padding:3px;
  }
  .wbt{
    width:46px;height:46px;border-radius:11px;border:none;background:transparent;
    font-size:20px;cursor:pointer;display:grid;place-items:center;
    transition:background .14s,transform .1s;color:#1F2B26;
    -webkit-tap-highlight-color:transparent;
  }
  .wbt:active{transform:scale(.9)}
  .wbt.on{background:linear-gradient(180deg,#4CC48B,#2E9E6B);color:#fff;box-shadow:0 3px 10px rgba(46,158,107,.34)}
  .wbt:hover:not(.on){background:#E7F6EE}

  .wbw{
    width:46px;height:46px;border-radius:11px;border:none;background:transparent;
    cursor:pointer;display:grid;place-items:center;transition:background .14s;
  }
  .wbw i{display:block;border-radius:99px;background:#1F2B26}
  .wbw[data-w="2"] i{width:6px;height:6px}
  .wbw[data-w="4"] i{width:11px;height:11px}
  .wbw[data-w="7"] i{width:17px;height:17px}
  .wbw.on{background:#E7F6EE;box-shadow:inset 0 0 0 2px #2E9E6B}
  .wbw.on i{background:#2E9E6B}

  .wbc{
    width:38px;height:38px;border-radius:50%;border:2px solid #fff;
    box-shadow:0 0 0 1px #DCEAE1;cursor:pointer;
    transition:transform .12s,box-shadow .12s;
  }
  .wbc:active{transform:scale(.9)}
  .wbc.on{box-shadow:0 0 0 3px #2E9E6B;transform:scale(1.06)}

  /* ---------- 畫布 ---------- */
  .wb-stage{
    position:relative; flex:1 1 auto; min-height:0;
    margin:10px; border-radius:14px; overflow:hidden;
    background-color:#fff;
    background-image:
      linear-gradient(rgba(190,222,201,.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(190,222,201,.5) 1px, transparent 1px);
    background-size:28px 28px;
    box-shadow:inset 0 0 0 1px #DCEAE1;
    touch-action:none;
  }
  #wbCanvas{
    display:block; width:100%; height:100%;
    touch-action:none; cursor:crosshair;
    -webkit-user-select:none; user-select:none;
    -webkit-touch-callout:none;
  }

  .wb-foot{
    display:flex; align-items:center; gap:8px;
    padding:0 12px 10px; font-size:13px; color:#7C8C83; flex:0 0 auto;
  }
  .wb-foot .sp{flex:1}

  /* ---------- 觸發按鈕 ---------- */
  .wb-toggle{
    display:inline-grid; place-items:center;
    width:52px;height:52px;border-radius:14px;
    border:1px solid #DCEAE1; background:#fff; color:#2E9E6B;
    font-size:22px; cursor:pointer; flex:0 0 auto;
    transition:background .15s,transform .1s,box-shadow .15s;
    -webkit-tap-highlight-color:transparent;
    font-family:inherit;
  }
  .wb-toggle:active{transform:scale(.92);background:#E7F6EE}
  .wb-toggle.on{
    background:linear-gradient(135deg,#4CC48B,#2E9E6B);
    color:#fff; border-color:transparent;
    box-shadow:0 4px 14px rgba(46,158,107,.36);
  }
  /* ---------- 統一位置嘅白板開關 ---------- */
  /* 所有頁面都用同一個固定螢幕位置，唔受各頁 topbar 內容影響 */
  .wb-toggle.pinned{
    position:fixed; z-index:90;
    right:max(16px, env(safe-area-inset-right,0px));
    bottom:calc(24px + env(safe-area-inset-bottom,0px));
    width:62px;height:62px;border-radius:50%;
    box-shadow:0 8px 24px rgba(46,158,107,.28);
    font-size:26px;
    transition:right .22s cubic-bezier(.34,1.1,.5,1),
               background .15s, transform .1s, box-shadow .15s;
  }
  .wb-toggle.pinned:active{transform:scale(.92)}
  /* 打開白板後，按鈕貼住面板左邊，變成「收起」手柄 */
  body.wb-open .wb-toggle.pinned{
    right:calc(var(--wb-w) + 14px);
    background:linear-gradient(135deg,#4CC48B,#2E9E6B);
    color:#fff; border-color:transparent;
    box-shadow:0 8px 26px rgba(46,158,107,.44);
  }
  @media (max-width:899px){
    /* 窄螢幕：白板蓋住大半個畫面，改用面板內嘅 ✕ 同遮罩關閉 */
    body.wb-open .wb-toggle.pinned{ display:none; }
  }

  /* ---------- 遮罩 / 抽屜（窄螢幕） ---------- */
  .wb-scrim{
    position:fixed; inset:0; z-index:78;
    background:rgba(20,55,40,.34);
    -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px);
    opacity:0; pointer-events:none; transition:opacity .2s;
    display:none;
  }

  @media (max-width:899px){
    body.wb-open{ --wb-w:0px; padding-right:0; }
    body.wb-open .wbpane{
      width:min(620px, 94vw);
      bottom:0;
      padding:calc(env(safe-area-inset-top,0px) + 8px) 8px calc(env(safe-area-inset-bottom,0px) + 8px) 0;
      z-index:82;
    }
    body.wb-open .wb-scrim{ display:block; opacity:1; pointer-events:auto; }
    .wb-stage{ background-size:24px 24px; }
  }

  /* 手機：工具列收窄，畫布留多啲位寫字 */
  @media (max-width:520px){
    .wb-tools{gap:5px;padding:7px 8px}
    .wb-group{padding:2px;border-radius:12px}
    .wbt{width:40px;height:40px;font-size:18px;border-radius:9px}
    .wbw{width:40px;height:40px;border-radius:9px}
    .wbw[data-w="2"] i{width:5px;height:5px}
    .wbw[data-w="4"] i{width:9px;height:9px}
    .wbw[data-w="7"] i{width:14px;height:14px}
    .wbc{width:33px;height:33px}
    .wbb{width:40px;height:40px;border-radius:10px;font-size:16px}
    .wb-head{padding:7px 8px}
    .wb-title{font-size:16px}
    .wb-close{width:40px;height:40px}
    .wb-pg{font-size:15px;min-width:46px}
    .wb-stage{margin:8px}
    .wb-foot{font-size:12px;padding:0 10px 8px}
  }

  @media print{
    .wbpane,.wb-scrim,.wb-toggle{ display:none !important; }
    body.wb-open{ padding-right:0 !important; --wb-w:0px; }
  }
  `;

  function injectCSS() {
    if (document.getElementById('wb-style')) return;
    var st = document.createElement('style');
    st.id = 'wb-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------------------------------------------------
     2. 狀態
     --------------------------------------------------------- */
  var COLORS = ['#1F2B26', '#dc2626', '#2E9E6B', '#2f9e44', '#f0a500', '#3D6FBF', '#8E5AD6'];
  var KEY = 'sci_whiteboard_v1';
  var OPEN_KEY = 'sci_wb_open';

  var S = {
    canvas: null, ctx: null,
    dpr: 1, W: 0, H: 0,
    tool: 'pen', color: COLORS[0], width: 4,
    drawing: false, draft: null, snapshot: null,
    strokes: [], undo: [],
    pages: [], pageIndex: 0,
    saveTimer: null, resizeTimer: null,
    ready: false, els: {}
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------------------------------------------------------
     3. 建立 DOM
     --------------------------------------------------------- */
  function buildDOM() {
    var pane = el('aside', 'wbpane');
    pane.id = 'wbpane';
    pane.setAttribute('aria-label', '白板');

    var inner = el('div', 'wbpane-inner');

    // --- 標題列 ---
    var head = el('div', 'wb-head');
    head.appendChild(el('span', 'wb-title', '📝 白板'));

    var pages = el('div', 'wb-pages');
    var prev = el('button', 'wbb', '‹');
    prev.id = 'wbPrevPg'; prev.setAttribute('aria-label', '上一頁');
    var label = el('span', 'wb-pg', '1 / 1');
    label.id = 'wbPgLabel';
    var next = el('button', 'wbb', '›');
    next.id = 'wbNextPg'; next.setAttribute('aria-label', '下一頁');
    pages.appendChild(prev); pages.appendChild(label); pages.appendChild(next);
    head.appendChild(pages);

    var close = el('button', 'wb-close', '✕');
    close.id = 'wbClose';
    close.type = 'button';
    close.setAttribute('aria-label', '收起白板');
    close.title = '收起白板';
    head.appendChild(close);

    inner.appendChild(head);

    // --- 工具列 ---
    var tools = el('div', 'wb-tools');

    var gTools = el('div', 'wb-group');
    gTools.setAttribute('role', 'group');
    gTools.setAttribute('aria-label', '工具');
    [
      ['pen', '✏️', '鉛筆'], ['line', '╱', '直線'], ['rect', '▭', '長方形'],
      ['circle', '◯', '圓形'], ['tri', '△', '三角形'], ['eraser', '🧽', '擦膠']
    ].forEach(function (t) {
      var b = el('button', 'wbt' + (t[0] === 'pen' ? ' on' : ''), t[1]);
      b.dataset.tool = t[0];
      b.setAttribute('aria-label', t[2]);
      b.title = t[2];
      gTools.appendChild(b);
    });
    tools.appendChild(gTools);

    var gW = el('div', 'wb-group');
    gW.setAttribute('role', 'group');
    gW.setAttribute('aria-label', '粗細');
    [2, 4, 7].forEach(function (w) {
      var b = el('button', 'wbw' + (w === S.width ? ' on' : ''), '<i></i>');
      b.dataset.w = String(w);
      b.setAttribute('aria-label', '線寬 ' + w);
      gW.appendChild(b);
    });
    tools.appendChild(gW);

    var gC = el('div', 'wb-group');
    gC.id = 'wbColors';
    gC.setAttribute('role', 'group');
    gC.setAttribute('aria-label', '顏色');
    COLORS.forEach(function (c, i) {
      var b = el('button', 'wbc' + (c === S.color ? ' on' : ''));
      b.dataset.c = c;
      b.style.background = c;
      b.setAttribute('aria-label', '顏色 ' + (i + 1));
      gC.appendChild(b);
    });
    tools.appendChild(gC);

    var gA = el('div', 'wb-group');
    [['wbUndo', '↶', '復原', ''], ['wbClear', '🗑', '清空本頁', ' danger'],
      ['wbAddPg', '＋', '新增頁', ''], ['wbDelPg', '－', '刪除此頁', ' danger']]
      .forEach(function (a) {
        var b = el('button', 'wbb' + a[3], a[1]);
        b.id = a[0];
        b.setAttribute('aria-label', a[2]);
        b.title = a[2];
        gA.appendChild(b);
      });
    tools.appendChild(gA);
    inner.appendChild(tools);

    // --- 畫布 ---
    var stage = el('div', 'wb-stage');
    stage.id = 'wbStage';
    var cv = document.createElement('canvas');
    cv.id = 'wbCanvas';
    stage.appendChild(cv);
    inner.appendChild(stage);

    // --- 頁腳 ---
    var foot = el('div', 'wb-foot');
    foot.appendChild(el('span', null, '✍️ Apple Pencil 或手指直接書寫'));
    foot.appendChild(el('span', 'sp'));
    var status = el('span', null, '已儲存');
    status.id = 'wbStatus';
    foot.appendChild(status);
    inner.appendChild(foot);

    pane.appendChild(inner);
    document.body.appendChild(pane);

    var scrim = el('div', 'wb-scrim');
    scrim.id = 'wbScrim';
    document.body.appendChild(scrim);

    S.els = {
      pane: pane, stage: stage, canvas: cv, label: label,
      prev: prev, next: next, status: status, scrim: scrim, close: close,
      undo: gA.children[0], clear: gA.children[1],
      addPg: gA.children[2], delPg: gA.children[3]
    };
    S.canvas = cv;
  }

  /* ---------------------------------------------------------
     4. 儲存
     --------------------------------------------------------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && d.pages && d.pages.length) {
        S.pages = d.pages;
        S.pageIndex = clamp(d.pageIndex || 0, 0, d.pages.length - 1);
      }
    } catch (e) {}
  }

  function setStatus(t) {
    if (S.els.status) S.els.status.textContent = t;
  }

  function save(now) {
    if (now) return flush();
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(flush, 500);
  }

  function flush() {
    clearTimeout(S.saveTimer);
    try {
      localStorage.setItem(KEY, JSON.stringify({
        pages: S.pages, pageIndex: S.pageIndex
      }));
      setStatus('已儲存');
    } catch (e) {
      setStatus('儲存空間不足');
    }
  }

  /* ---------------------------------------------------------
     5. 畫布尺寸
     --------------------------------------------------------- */
  function resize() {
    if (!S.canvas || !S.els.stage) return;
    var r = S.els.stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    S.dpr = dpr;
    S.W = Math.round(r.width);
    S.H = Math.round(r.height);

    S.canvas.width = Math.round(S.W * dpr);
    S.canvas.height = Math.round(S.H * dpr);
    S.canvas.style.width = S.W + 'px';
    S.canvas.style.height = S.H + 'px';

    S.ctx = S.canvas.getContext('2d');
    S.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.ctx.lineCap = 'round';
    S.ctx.lineJoin = 'round';
    repaint();
  }

  function scheduleResize() {
    clearTimeout(S.resizeTimer);
    S.resizeTimer = setTimeout(resize, 40);
  }

  /* ---------------------------------------------------------
     6. 繪圖
     --------------------------------------------------------- */
  function drawStroke(ctx, s) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.t === 'pen' || s.t === 'eraser') {
      ctx.globalCompositeOperation = (s.t === 'eraser') ? 'destination-out' : 'source-over';
      if (s.t === 'eraser') ctx.lineWidth = s.w * 4;

      var p = s.pts;
      if (p.length === 1) {
        ctx.beginPath();
        ctx.arc(p[0][0], p[0][1], Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
        ctx.stroke();
      }
    } else {
      ctx.globalCompositeOperation = 'source-over';
      var x1 = s.a[0], y1 = s.a[1], x2 = s.b[0], y2 = s.b[1];
      ctx.beginPath();
      if (s.t === 'line') {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      } else if (s.t === 'rect') {
        ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      } else if (s.t === 'circle') {
        var rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
        if (rx > 0 || ry > 0) ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, rx, ry, 0, 0, Math.PI * 2);
      } else if (s.t === 'tri') {
        ctx.moveTo((x1 + x2) / 2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.closePath();
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function repaint() {
    if (!S.ctx) return;
    S.ctx.clearRect(0, 0, S.W, S.H);
    S.strokes.forEach(function (s) { drawStroke(S.ctx, s); });
  }

  function pt(e) {
    var r = S.canvas.getBoundingClientRect();
    return [
      Math.round((e.clientX - r.left) * 10) / 10,
      Math.round((e.clientY - r.top) * 10) / 10
    ];
  }

  function pushUndo() {
    S.undo.push(JSON.stringify(S.strokes));
    if (S.undo.length > 40) S.undo.shift();
  }

  /* ---------------------------------------------------------
     7. 指標事件
     --------------------------------------------------------- */
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { S.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    S.drawing = true;

    var p = pt(e);
    var pressure = (e.pointerType === 'pen' && e.pressure > 0) ? e.pressure : 1;
    pushUndo();

    if (S.tool === 'pen' || S.tool === 'eraser') {
      S.draft = {
        t: S.tool, color: S.color,
        w: S.width * (0.6 + pressure * 0.8),
        pts: [p]
      };
      drawStroke(S.ctx, S.draft);
    } else {
      S.draft = { t: S.tool, color: S.color, w: S.width, a: p, b: p };
      S.snapshot = S.ctx.getImageData(0, 0, S.canvas.width, S.canvas.height);
    }
  }

  function onMove(e) {
    if (!S.drawing || !S.draft) return;
    e.preventDefault();

    var list = (e.getCoalescedEvents && e.getCoalescedEvents().length)
      ? e.getCoalescedEvents() : [e];
    var pts = list.map(pt);

    if (S.tool === 'pen' || S.tool === 'eraser') {
      var d = S.draft;
      var start = d.pts.length;
      pts.forEach(function (p) { d.pts.push(p); });

      S.ctx.save();
      S.ctx.strokeStyle = d.color;
      S.ctx.lineWidth = d.w;
      S.ctx.lineCap = 'round';
      S.ctx.lineJoin = 'round';
      S.ctx.globalCompositeOperation = (d.t === 'eraser') ? 'destination-out' : 'source-over';
      if (d.t === 'eraser') S.ctx.lineWidth = d.w * 4;
      S.ctx.beginPath();
      S.ctx.moveTo(d.pts[Math.max(0, start - 1)][0], d.pts[Math.max(0, start - 1)][1]);
      for (var i = start; i < d.pts.length; i++) S.ctx.lineTo(d.pts[i][0], d.pts[i][1]);
      S.ctx.stroke();
      S.ctx.restore();
    } else {
      S.draft.b = pts[pts.length - 1];
      if (S.snapshot) S.ctx.putImageData(S.snapshot, 0, 0);
      drawStroke(S.ctx, S.draft);
    }
  }

  function onUp(e) {
    if (!S.drawing) return;
    S.drawing = false;
    if (!S.draft) return;

    var s = S.draft;
    S.draft = null;
    S.snapshot = null;

    if (s.t !== 'pen' && s.t !== 'eraser') {
      var dx = Math.abs(s.b[0] - s.a[0]);
      var dy = Math.abs(s.b[1] - s.a[1]);
      if (dx < 4 && dy < 4) { repaint(); return; }
    }

    S.strokes.push(s);
    S.pages[S.pageIndex] = { strokes: S.strokes };
    save();
    setStatus('已儲存');
  }

  /* ---------------------------------------------------------
     8. 工具 / 顏色 / 粗細
     --------------------------------------------------------- */
  function setTool(t) {
    S.tool = t;
    document.querySelectorAll('.wbt').forEach(function (b) {
      b.classList.toggle('on', b.dataset.tool === t);
    });
  }
  function setWidth(w) {
    S.width = w;
    document.querySelectorAll('.wbw').forEach(function (b) {
      b.classList.toggle('on', Number(b.dataset.w) === w);
    });
  }
  function setColor(c) {
    S.color = c;
    document.querySelectorAll('.wbc').forEach(function (b) {
      b.classList.toggle('on', b.dataset.c === c);
    });
    // 揀顏色即係想用鉛筆寫；擦膠／圖形工具都切返鉛筆
    if (S.tool !== 'pen') setTool('pen');
  }

  /* ---------------------------------------------------------
     9. 頁面
     --------------------------------------------------------- */
  function updatePageUI() {
    if (S.els.label) S.els.label.textContent = (S.pageIndex + 1) + ' / ' + S.pages.length;
    if (S.els.prev) S.els.prev.disabled = S.pageIndex === 0;
    if (S.els.next) S.els.next.disabled = S.pageIndex >= S.pages.length - 1;
    if (S.els.delPg) S.els.delPg.disabled = S.pages.length <= 1;
  }

  function gotoPage(i) {
    S.pageIndex = clamp(i, 0, S.pages.length - 1);
    S.strokes = S.pages[S.pageIndex].strokes || [];
    S.pages[S.pageIndex].strokes = S.strokes;
    S.undo = [];
    repaint();
    updatePageUI();
    save();
  }

  function addPage() {
    S.pages.push({ strokes: [] });
    gotoPage(S.pages.length - 1);
    setStatus('已新增第 ' + S.pages.length + ' 頁');
  }

  function delPage() {
    if (S.pages.length <= 1) return;
    if (!window.confirm('刪除第 ' + (S.pageIndex + 1) + ' 頁？')) return;
    S.pages.splice(S.pageIndex, 1);
    gotoPage(clamp(S.pageIndex, 0, S.pages.length - 1));
    save(true);
    setStatus('已刪除');
  }

  /* ---------------------------------------------------------
     10. 開關
     --------------------------------------------------------- */
  function setOpen(open) {
    document.body.classList.toggle('wb-open', !!open);
    var btns = document.querySelectorAll('.wb-toggle, #wbToggle');
    btns.forEach(function (b) { b.classList.toggle('on', !!open); });
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch (e) {}
    if (open) {
      scheduleResize();
      setTimeout(resize, 260);
      setTimeout(resize, 460);
    }
  }

  function toggle() {
    setOpen(!document.body.classList.contains('wb-open'));
  }

  /* ---------------------------------------------------------
     11. 觸發按鈕
     --------------------------------------------------------- */
  function ensureToggle() {
    // 一律建立一個固定位置嘅浮動按鈕，
    // 咁樣每一頁嘅位置都完全一樣（唔會因為 topbar 內容唔同而移位）
    var btn = document.getElementById('wbToggle');
    if (!btn) {
      btn = el('button', 'wb-toggle', '📝');
      btn.id = 'wbToggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', '白板');
      btn.title = '白板：寫字練習';
      document.body.appendChild(btn);
    } else {
      // 如果頁面本身有內嵌按鈕，搬去 body 並改用固定位置樣式
      if (btn.parentNode !== document.body) {
        document.body.appendChild(btn);
      }
      btn.classList.remove('iconbtn');
    }
    btn.classList.add('pinned');
    btn.addEventListener('click', toggle);
  }

  /* ---------------------------------------------------------
     12. 初始化
     --------------------------------------------------------- */
  function init() {
    injectCSS();
    buildDOM();
    load();

    if (!S.pages.length) S.pages = [{ strokes: [] }];
    S.pageIndex = clamp(S.pageIndex, 0, S.pages.length - 1);
    S.strokes = S.pages[S.pageIndex].strokes || [];
    S.pages[S.pageIndex].strokes = S.strokes;

    // 工具
    document.querySelectorAll('.wbt').forEach(function (b) {
      b.addEventListener('click', function () { setTool(b.dataset.tool); });
    });
    document.querySelectorAll('.wbw').forEach(function (b) {
      b.addEventListener('click', function () { setWidth(Number(b.dataset.w)); });
    });
    document.querySelectorAll('.wbc').forEach(function (b) {
      b.addEventListener('click', function () { setColor(b.dataset.c); });
    });

    // 畫布
    var cv = S.canvas;
    cv.addEventListener('pointerdown', onDown, { passive: false });
    cv.addEventListener('pointermove', onMove, { passive: false });
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('pointerleave', function (e) {
      if (S.drawing && e.pointerType === 'pen') onUp(e);
    });
    // 寫字時唔好捲動頁面
    cv.addEventListener('touchstart', function (e) {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    cv.addEventListener('touchmove', function (e) {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    // 按鈕
    S.els.undo.addEventListener('click', function () {
      if (!S.undo.length) return;
      S.strokes = JSON.parse(S.undo.pop());
      S.pages[S.pageIndex] = { strokes: S.strokes };
      repaint();
      save();
    });
    S.els.clear.addEventListener('click', function () {
      if (!S.strokes.length) return;
      pushUndo();
      S.strokes = [];
      S.pages[S.pageIndex] = { strokes: S.strokes };
      repaint();
      save(true);
      setStatus('已清空本頁');
    });
    S.els.addPg.addEventListener('click', addPage);
    S.els.delPg.addEventListener('click', delPage);
    S.els.prev.addEventListener('click', function () { gotoPage(S.pageIndex - 1); });
    S.els.next.addEventListener('click', function () { gotoPage(S.pageIndex + 1); });
    S.els.scrim.addEventListener('click', function () { setOpen(false); });
    S.els.close.addEventListener('click', function () { setOpen(false); });

    updatePageUI();
    initToggle();

    if (window.ResizeObserver) {
      try { new ResizeObserver(scheduleResize).observe(S.els.stage); } catch (e) {}
    }
    window.addEventListener('resize', scheduleResize);
    window.addEventListener('orientationchange', function () {
      setTimeout(resize, 260);
    });

    flush();
    S.ready = true;
  }

  function initToggle() {
    ensureToggle();
    // 記住上次開關狀態
    var open = false;
    try { open = localStorage.getItem(OPEN_KEY) === '1'; } catch (e) {}
    if (open) setOpen(true);
    else {
      var b = document.getElementById('wbToggle');
      if (b) b.classList.remove('on');
    }
  }

  /* 公開 API（方便測試 / 其他頁面呼叫） */
  window.Whiteboard = {
    toggle: toggle,
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    resize: resize,
    state: S,
    flush: flush,
    _internal: {
      setTool: setTool, setWidth: setWidth, setColor: setColor,
      onDown: onDown, onMove: onMove, onUp: onUp,
      repaint: repaint, gotoPage: gotoPage, addPage: addPage,
      drawStroke: drawStroke, resizeCanvas: resize
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
