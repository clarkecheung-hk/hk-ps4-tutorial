/* ===========================================================
   今日人文 4上 · 溫習網站  — 共用程式
   音效 / 朗讀 / 進度 / 動畫
   =========================================================== */
(function () {
  "use strict";

  /* ---------------- 音效引擎 (Web Audio, 無需外部檔案) ---------------- */
  var AC = null;
  var soundOn = true;
  try {
    soundOn = localStorage.getItem("hums_sound") !== "off";
  } catch (e) {}

  function ctx() {
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C();
    }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    var a = ctx();
    if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, a.currentTime + start);
    if (slideTo) {
      o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + start + dur);
    }
    g.gain.setValueAtTime(0.0001, a.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, a.currentTime + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start(a.currentTime + start);
    o.stop(a.currentTime + start + dur + 0.03);
  }

  var SFX = {
    click: function () { tone(660, 0, 0.07, "triangle", 0.10); },
    pop: function () { tone(520, 0, 0.09, "sine", 0.13, 900); },
    correct: function () {
      tone(659.25, 0, 0.13, "sine", 0.16);
      tone(783.99, 0.10, 0.13, "sine", 0.16);
      tone(1046.5, 0.20, 0.26, "sine", 0.16);
    },
    wrong: function () {
      tone(300, 0, 0.16, "sawtooth", 0.09, 190);
      tone(200, 0.13, 0.22, "sawtooth", 0.08, 130);
    },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        tone(f, i * 0.09, 0.3, "triangle", 0.14);
      });
    },
    lose: function () {
      [440, 392, 349.23, 293.66].forEach(function (f, i) {
        tone(f, i * 0.13, 0.28, "sine", 0.12);
      });
    },
    flip: function () { tone(880, 0, 0.06, "square", 0.06, 1200); },
    tick: function () { tone(1200, 0, 0.03, "square", 0.05); },
    swoosh: function () { tone(200, 0, 0.25, "sine", 0.10, 1400); },
    levelup: function () {
      [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        tone(f, i * 0.07, 0.35, "triangle", 0.13);
      });
    },
    bubble: function () { tone(700, 0, 0.08, "sine", 0.10, 1500); }
  };

  function play(name) {
    if (!soundOn) return;
    try { (SFX[name] || SFX.click)(); } catch (e) {}
  }

  /* ---------------- 朗讀 (粵語優先) ---------------- */
  var voice = null;
  var speaking = false;

  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var vs = window.speechSynthesis.getVoices() || [];
    var pref = ["zh-HK", "zh_HK", "yue", "zh-TW", "zh-TW", "zh-CN", "zh"];
    for (var i = 0; i < pref.length; i++) {
      for (var j = 0; j < vs.length; j++) {
        if ((vs[j].lang || "").replace("_", "-").toLowerCase().indexOf(pref[i].toLowerCase()) === 0) {
          return vs[j];
        }
      }
    }
    return vs.length ? vs[0] : null;
  }

  if (window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = function () { voice = pickVoice(); };
  }

  function speak(text, btn) {
    if (!window.speechSynthesis) {
      alert("你的瀏覽器不支援朗讀功能，試用 Chrome 或 Edge 吧！");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      speaking = false;
      document.querySelectorAll(".speak.playing").forEach(function (b) { b.classList.remove("playing"); });
      if (btn && btn.dataset.wasPlaying === "1") { btn.dataset.wasPlaying = "0"; return; }
    }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-HK";
    if (!voice) voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = 0.88;
    u.pitch = 1.05;
    u.onstart = function () {
      speaking = true;
      if (btn) { btn.classList.add("playing"); btn.dataset.wasPlaying = "1"; }
    };
    u.onend = u.onerror = function () {
      speaking = false;
      if (btn) { btn.classList.remove("playing"); btn.dataset.wasPlaying = "0"; }
    };
    window.speechSynthesis.speak(u);
  }

  /* ---------------- 進度儲存 ---------------- */
  var STORE = "hums_progress_v1";
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; }
  }
  function setProgress(k, v) {
    var p = getProgress();
    p[k] = v;
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch (e) {}
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    /* 背景雲朵 */
    var deco = document.querySelector(".bg-deco");
    if (deco) {
      var clouds = ["☁️", "☁️", "🌤️", "☁️"];
      clouds.forEach(function (c, i) {
        var el = document.createElement("div");
        el.className = "cloud";
        el.textContent = c;
        el.style.top = (8 + i * 22) + "%";
        el.style.animationDuration = (48 + i * 16) + "s";
        el.style.animationDelay = (-i * 12) + "s";
        el.style.fontSize = (44 + i * 14) + "px";
        deco.appendChild(el);
      });
    }

    /* 進度條 */
    var bar = document.querySelector(".progress-bar");
    if (bar) {
      var upd = function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      };
      window.addEventListener("scroll", upd, { passive: true });
      upd();
    }

    /* 卡片進場 */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".lesson").forEach(function (el) { io.observe(el); });

    /* 摺疊 */
    document.querySelectorAll(".lesson-head").forEach(function (h) {
      h.addEventListener("click", function () {
        var card = h.closest(".lesson");
        card.classList.toggle("collapsed");
        play("click");
      });
    });

    /* 朗讀按鈕 */
    document.querySelectorAll("[data-speak]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var sel = btn.getAttribute("data-speak");
        var target = sel ? document.querySelector(sel) : btn.closest(".lesson-body");
        var text = target ? target.innerText.replace(/\s+/g, " ").trim() : "";
        if (text) speak(text, btn);
      });
    });

    /* 勾選進度 */
    document.querySelectorAll(".checkline input[type=checkbox]").forEach(function (cb) {
      var key = cb.getAttribute("data-key");
      if (key && getProgress()[key]) {
        cb.checked = true;
        cb.closest(".checkline").classList.add("done");
      }
      cb.addEventListener("change", function () {
        if (key) setProgress(key, cb.checked);
        cb.closest(".checkline").classList.toggle("done", cb.checked);
        play(cb.checked ? "correct" : "click");
      });
    });

    /* 音效開關 */
    var sBtn = document.getElementById("soundToggle");
    if (sBtn) {
      var paint = function () {
        sBtn.textContent = soundOn ? "🔊" : "🔇";
        sBtn.title = soundOn ? "音效：開" : "音效：關";
      };
      paint();
      sBtn.addEventListener("click", function () {
        soundOn = !soundOn;
        try { localStorage.setItem("hums_sound", soundOn ? "on" : "off"); } catch (e) {}
        paint();
        if (soundOn) play("pop");
      });
    }

    /* 回到頂部 */
    var fab = document.getElementById("toTop");
    if (fab) {
      fab.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
        play("swoosh");
      });
    }

    /* 主要按鈕加音效（各遊戲按鈕有自己的音效，不重複） */
    document.querySelectorAll(".btn").forEach(function (b) {
      if (b.dataset.nosfx) return;
      b.addEventListener("click", function () { play("click"); });
    });
  }

  /* 對外 API */
  window.HUMS = {
    play: play,
    speak: speak,
    getProgress: getProgress,
    setProgress: setProgress,
    isSoundOn: function () { return soundOn; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
