window.MoxingDraw = window.MoxingDraw || {};

(function (MD) {
  var state = {
    engine: 'local', // 'local' | 'ai'
    style: 'soul',
    chaos: 78,
    seedOffset: 0,
    wobbleOn: false,
    wobbleFrame: 0,
    wobbleTimer: null,
    history: [],
    lastParsed: null
  };

  function $(id) { return document.getElementById(id); }

  function showToast(msg) {
    var el = $('status-toast');
    el.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.textContent = ''; }, 2600);
  }

  function chaosLabel(val) {
    if (val < 35) return val + '% 轻微离谱';
    if (val < 65) return val + '% 相当魔性';
    if (val < 90) return val + '% 精神超前';
    return val + '% 彻底发疯!!';
  }

  function renderParsedTags(parsed) {
    var box = $('parsed-tags');
    box.innerHTML = '';
    var add = function (cls, txt) {
      var sp = document.createElement('span');
      sp.className = 'ptag ' + cls;
      sp.textContent = txt;
      box.appendChild(sp);
    };
    parsed.subjects.forEach(function (s) { add('subj', '主角: ' + s.label); });
    add('scene', '场景: ' + parsed.scene.label);
    parsed.actions.slice(0, 3).forEach(function (a) { add('act', '动作: ' + a.label); });
    parsed.props.slice(0, 4).forEach(function (p) { add('prop', '道具: ' + p.label); });
  }

  function pushHistory(prompt, dataUrl) {
    state.history.unshift({ prompt: prompt, dataUrl: dataUrl });
    if (state.history.length > 10) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    var strip = $('history-strip');
    strip.innerHTML = '';
    if (state.history.length === 0) {
      strip.innerHTML = '<span class="empty-hint">还没有历史作品，快点生成一张吧！</span>';
      return;
    }
    state.history.forEach(function (item) {
      var btn = document.createElement('div');
      btn.className = 'hist-thumb';
      btn.title = item.prompt;
      var img = document.createElement('img');
      img.src = item.dataUrl;
      btn.appendChild(img);
      btn.addEventListener('click', function () {
        var canvas = $('art-canvas');
        var ctx = canvas.getContext('2d');
        var loaded = new Image();
        loaded.onload = function () {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height);
        };
        loaded.src = item.dataUrl;
        $('prompt-input').value = item.prompt;
        showToast('已切回历史大作');
      });
      strip.appendChild(btn);
    });
  }

  function triggerPopAnim() {
    var frame = $('canvas-frame');
    frame.classList.remove('pop-anim');
    void frame.offsetWidth;
    frame.classList.add('pop-anim');
  }

  function generateLocal(saveToHistory) {
    var prompt = $('prompt-input').value.trim() || MD.PRESETS[0];
    var parsed = MD.parsePrompt(prompt, state.seedOffset);
    state.lastParsed = parsed;
    renderParsedTags(parsed);

    var canvas = $('art-canvas');
    MD.painter.render(canvas, parsed, {
      style: state.style,
      chaos: state.chaos,
      wobbleFrame: state.wobbleFrame,
      showCaption: $('chk-caption').checked,
      customCaption: $('custom-caption').value
    });

    if (saveToHistory !== false) {
      triggerPopAnim();
      pushHistory(prompt, canvas.toDataURL('image/png'));
    }
  }

  // Optional Gemini Official Image API mode (BYOK, stays client-side!)
  function generateWithAI() {
    var apiKey = ($('api-key-input').value || '').trim();
    var prompt = $('prompt-input').value.trim() || MD.PRESETS[0];
    if (!apiKey) {
      showToast('请先填入 Gemini API Key，或切回离线灵魂画师！');
      return;
    }
    localStorage.setItem('moxing_gemini_key', apiKey);

    var stylePrompts = {
      soul: 'hilarious cursed hand-drawn wobbly comic illustration, exaggerated bulging derpy eyes, chaotic pop-art colors, bold black ink outlines',
      meme: 'absurd Chinese reaction meme sticker style, explosive radial background, hilarious exaggerated goofy expression',
      pixel: 'retro 8-bit pixel art comedy scene, funny goofy character proportions, vibrant neon glitch colors',
      cyber: 'chaotic neon cyberpunk comedy cartoon, hilarious expression, electric cyan and hot pink glow',
      abstract: 'unhinged Picasso-style funny doodle art, wildly exaggerated silly proportions, vibrant chaotic colors'
    };

    var enhancedPrompt = 'Create a hilariously absurd, goofy, laugh-out-loud cartoon image (no readable gibberish text) depicting: "' + prompt + '". Art style: ' + (stylePrompts[state.style] || stylePrompts.soul) + '. Chaos level: ' + state.chaos + '%.';

    $('loading-overlay').classList.remove('hidden');
    $('loading-text').textContent = '正在呼叫 AI 灵魂画师疯狂创作...';

    var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + encodeURIComponent(apiKey);
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] }
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        var imgPart = parts.find(function (p) { return p.inlineData && p.inlineData.data; });
        if (!imgPart) throw new Error('模型未返回图像数据');

        var mime = imgPart.inlineData.mimeType || 'image/png';
        var src = 'data:' + mime + ';base64,' + imgPart.inlineData.data;
        var img = new Image();
        img.onload = function () {
          var canvas = $('art-canvas');
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          if ($('chk-caption').checked) {
            var parsed = MD.parsePrompt(prompt, state.seedOffset);
            var cap = ($('custom-caption').value || '').trim() || parsed.autoCaption;
            MD.painter._drawMemeCaption(ctx, cap, prompt, state.style);
          }
          MD.painter._drawCornerStamp(ctx, 'AI');
          $('loading-overlay').classList.add('hidden');
          triggerPopAnim();
          pushHistory(prompt, canvas.toDataURL('image/png'));
          showToast('AI 魔性神图生成完毕！');
        };
        img.src = src;
      })
      .catch(function (err) {
        $('loading-overlay').classList.add('hidden');
        showToast('AI 接口调用失败 (' + err.message + ')，已自动用离线灵魂画师出图！');
        generateLocal(true);
      });
  }

  function runGenerate() {
    if (state.engine === 'ai') {
      generateWithAI();
    } else {
      generateLocal(true);
      showToast('✨ 魔性神图已出炉！');
    }
  }

  function toggleWobble() {
    state.wobbleOn = !state.wobbleOn;
    var btn = $('btn-wobble');
    btn.textContent = '🎬 鬼畜抖动预览: ' + (state.wobbleOn ? '开' : '关');
    btn.classList.toggle('active', state.wobbleOn);
    if (state.wobbleOn) {
      if (state.engine === 'ai') {
        showToast('鬼畜抖动仅适用于离线灵魂画师模式');
        state.wobbleOn = false;
        btn.textContent = '🎬 鬼畜抖动预览: 关';
        btn.classList.remove('active');
        return;
      }
      state.wobbleTimer = setInterval(function () {
        state.wobbleFrame = (state.wobbleFrame + 1) % 6;
        generateLocal(false);
      }, 130);
    } else {
      clearInterval(state.wobbleTimer);
      state.wobbleFrame = 0;
      generateLocal(false);
    }
  }

  function init() {
    // Restore saved Gemini key if present
    var savedKey = localStorage.getItem('moxing_gemini_key');
    if (savedKey) $('api-key-input').value = savedKey;

    // Populate quick hilarious presets
    var chips = $('preset-chips');
    MD.PRESETS.slice(0, 5).forEach(function (txt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = txt.length > 15 ? txt.slice(0, 15) + '…' : txt;
      b.title = txt;
      b.addEventListener('click', function () {
        $('prompt-input').value = txt;
        state.seedOffset = 0;
        runGenerate();
      });
      chips.appendChild(b);
    });

    // Random prompt button
    $('btn-random').addEventListener('click', function () {
      var cur = $('prompt-input').value.trim();
      var pool = MD.PRESETS.filter(function (x) { return x !== cur; });
      $('prompt-input').value = pool[Math.floor(Math.random() * pool.length)];
      state.seedOffset++;
      runGenerate();
    });

    // Engine toggle
    var setEngine = function (mode) {
      state.engine = mode;
      $('mode-local').classList.toggle('active', mode === 'local');
      $('mode-ai').classList.toggle('active', mode === 'ai');
      $('ai-config').classList.toggle('hidden', mode !== 'ai');
    };
    $('mode-local').addEventListener('click', function () { setEngine('local'); });
    $('mode-ai').addEventListener('click', function () { setEngine('ai'); });

    // Style cards
    $('style-grid').addEventListener('click', function (e) {
      var card = e.target.closest('.style-card');
      if (!card) return;
      document.querySelectorAll('.style-card').forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');
      state.style = card.getAttribute('data-style');
      if (state.engine === 'local') generateLocal(true);
    });

    // Chaos slider
    $('chaos-slider').addEventListener('input', function () {
      state.chaos = parseInt(this.value, 10);
      $('chaos-val').textContent = chaosLabel(state.chaos);
      if (state.engine === 'local') generateLocal(false);
    });

    // Caption live toggle
    $('chk-caption').addEventListener('change', function () {
      if (state.engine === 'local') generateLocal(false);
    });
    $('custom-caption').addEventListener('input', function () {
      if (state.engine === 'local') generateLocal(false);
    });

    // Generate & Reroll buttons
    $('btn-generate').addEventListener('click', runGenerate);
    $('btn-reroll').addEventListener('click', function () {
      state.seedOffset++;
      runGenerate();
    });
    $('prompt-input').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runGenerate();
      }
    });

    // Download PNG
    $('btn-download').addEventListener('click', function () {
      var a = document.createElement('a');
      a.download = 'moxing-' + Date.now() + '.png';
      a.href = $('art-canvas').toDataURL('image/png');
      a.click();
      showToast('已保存 PNG 原图！');
    });

    // Copy to clipboard
    $('btn-copy').addEventListener('click', function () {
      var canvas = $('art-canvas');
      if (navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(function (blob) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(function () { showToast('已复制图片到剪贴板，快去斗图！'); })
            .catch(function () { showToast('当前环境不支持直接复制，请点“下载 PNG”'); });
        });
      } else {
        showToast('当前环境不支持直接复制，请点“下载 PNG”');
      }
    });

    // Wobble preview toggle
    $('btn-wobble').addEventListener('click', toggleWobble);

    // Clear history
    $('btn-clear-hist').addEventListener('click', function () {
      state.history = [];
      renderHistory();
      showToast('历史记录已清空');
    });

    // Initial hilarious render on load!
    generateLocal(true);
  }

  window.addEventListener('DOMContentLoaded', init);
})(window.MoxingDraw);
