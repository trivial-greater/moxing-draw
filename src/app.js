window.MoxingDraw = window.MoxingDraw || {};

(function (MD) {
  var PRESETS = [
    '数学家梵高',
    '爱因斯坦在菜市场和阿姨疯狂砍价',
    '秦始皇骑着喷火电瓶车送外卖',
    '一只戴墨镜的胖橘猫骑着霸王龙在火星喝奶茶',
    '黑眼圈程序员在赛博办公室对着冒烟电脑发疯哭泣',
    '暴躁大鹅挥舞激光剑在海边抢老板的钞票',
    '李白拿着激光麦克风在月球夜市狂飙说唱',
    '蒙娜丽莎戴着耳机一边吃火锅一边比耶'
  ];

  var PROVIDER_DEFAULTS = {
    siliconflow: {
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Kwai-Kolors/Kolors',
      hint: '推荐国内直连！前往 <a href="https://cloud.siliconflow.cn/account/ak" target="_blank" rel="noopener">cloud.siliconflow.cn</a> 免费注册拿 Key，默认调用免费中文生图模型 <code>Kwai-Kolors/Kolors</code>（也可改 <code>black-forest-labs/FLUX.1-schnell</code>）。'
    },
    pollinations: {
      baseUrl: 'https://gen.pollinations.ai',
      model: 'flux',
      hint: '前往 <a href="https://enter.pollinations.ai/keys" target="_blank" rel="noopener">enter.pollinations.ai/keys</a> 用 GitHub 登录可免费领 Key，摆脱共享 IP 402 限流。'
    },
    huggingface: {
      baseUrl: 'https://router.huggingface.co/hf-inference/models',
      model: 'black-forest-labs/FLUX.1-schnell',
      hint: '前往 <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener">huggingface.co/settings/tokens</a> 免费创建 Read/Inference Token（<code>hf_...</code>），调用开源 <code>FLUX.1-schnell</code>。'
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-2.5-flash-image',
      hint: '前往 <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener">aistudio.google.com</a> 获取 <code>AIza...</code> Key（生图模型需开通结算）。'
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'dall-e-3',
      hint: '兼容任何支持 <code>/images/generations</code> 的 OpenAI 风格中转站，填写 Base URL、模型名与 API Key 即可。'
    }
  };

  var STYLE_PROMPTS = {
    soul: 'hilarious exaggerated comedy caricature illustration, wildly goofy cross-eyed or derpy facial expression, absurd comedic pose, bold expressive brushstrokes, vibrant pop-art colors',
    meme: 'laugh-out-loud absurd internet reaction meme art, hugely exaggerated comical facial expression, dramatic manga speedlines background, hilarious chaotic energy',
    pixel: 'retro 16-bit arcade pixel art comedy illustration, funny chunky big-head proportions, goofy expressive face, crisp vibrant colors',
    cyber: 'chaotic neon cyberpunk comedy cartoon, hilarious goofy exaggerated face, glowing cyan and magenta neon lights, absurd futuristic gadgets',
    abstract: 'hilariously unhinged Picasso-meets-surrealist comedy painting, comically distorted goofy features, vibrant chaotic oil brushstrokes, dreamlike absurdity'
  };

  var state = {
    engine: 'free-ai', // 'free-ai' | 'custom-ai' | 'local'
    provider: 'siliconflow',
    style: 'soul',
    chaos: 78,
    seedOffset: 0,
    wobbleOn: false,
    wobbleFrame: 0,
    wobbleTimer: null,
    history: [],
    lastAiImage: null,
    lastPrompt: '',
    lastBadge: 'AI',
    generating: false
  };

  function $(id) { return document.getElementById(id); }

  function showToast(msg) {
    var el = $('status-toast');
    el.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.textContent = ''; }, 3200);
  }

  function setLoading(show, title, sub) {
    state.generating = show;
    $('loading-overlay').classList.toggle('hidden', !show);
    $('btn-generate').disabled = show;
    if (title) $('loading-text').textContent = title;
    if (sub) $('loading-sub').textContent = sub;
  }

  function chaosLabel(val) {
    if (val < 35) return val + '% 轻微离谱';
    if (val < 65) return val + '% 相当魔性';
    if (val < 90) return val + '% 精神超前';
    return val + '% 彻底发疯!!';
  }

  function triggerPopAnim() {
    var frame = $('canvas-frame');
    frame.classList.remove('pop-anim');
    void frame.offsetWidth;
    frame.classList.add('pop-anim');
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
          state.lastAiImage = null;
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

  function buildAutoCaption(rawPrompt, chaos) {
    var clean = rawPrompt.trim();
    if (chaos >= 85) {
      return clean.length <= 10 ? (clean + '，精神状态极其超前！') : ('离谱！' + clean.slice(0, 14) + '…');
    }
    return clean.length <= 16 ? ('魔性版：' + clean) : (clean.slice(0, 16) + '…');
  }

  // Re-composite current real AI image when user tweaks caption / stickers / chaos / style post-fx
  function recompositeCurrentAI(saveHistory) {
    if (!state.lastAiImage) return;
    var canvas = $('art-canvas');
    var raw = state.lastPrompt || $('prompt-input').value.trim();
    var cap = ($('custom-caption').value || '').trim() || buildAutoCaption(raw, state.chaos);
    MD.painter.compositeImage(canvas, state.lastAiImage, raw, {
      style: state.style,
      chaos: state.chaos,
      seedOffset: state.seedOffset,
      wobbleFrame: state.wobbleFrame,
      showCaption: $('chk-caption').checked,
      showStickers: $('chk-stickers').checked,
      customCaption: cap,
      badgeText: state.lastBadge
    });
    if (saveHistory) {
      triggerPopAnim();
      pushHistory(raw, canvas.toDataURL('image/png'));
    }
  }

  // Translate & expand Chinese description into vivid hilarious English prompt via free Pollinations Text API
  function expandChineseToMoxingPrompt(rawPrompt) {
    var styleDesc = STYLE_PROMPTS[state.style] || STYLE_PROMPTS.soul;
    var chaosAdd = state.chaos >= 75
      ? ', ultra comical absurd energy, funny exaggerated bulging eyes, silly chaotic visual gags, no text'
      : ', funny charming cartoon caricature, expressive quirky face, no text';

    // If purely ASCII/English, wrap directly without waiting on text API
    if (/^[\x00-\x7F\s]+$/.test(rawPrompt)) {
      return Promise.resolve(rawPrompt + ', ' + styleDesc + chaosAdd);
    }

    var instruction = 'Translate and expand this Chinese scene into ONE vivid English image-generation prompt (under 36 words, output ONLY the English prompt, no quotes, no explanation). Faithfully depict every named person/character/object with hilarious goofy exaggerated comedic details: ' + rawPrompt;
    var url = 'https://text.pollinations.ai/' + encodeURIComponent(instruction) + '?seed=' + (100 + state.seedOffset);

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 7500);

    return fetch(url, { signal: controller.signal })
      .then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('text HTTP ' + r.status);
        return r.text();
      })
      .then(function (txt) {
        var cleaned = (txt || '').replace(/[\r\n"]+/g, ' ').trim();
        if (!cleaned || cleaned.length > 320 || cleaned.indexOf('{') === 0) {
          throw new Error('unexpected text response');
        }
        return cleaned + ', ' + styleDesc + chaosAdd;
      })
      .catch(function () {
        clearTimeout(timer);
        // Safe direct fallback (FLUX understands mixed prompts too)
        return rawPrompt + ', ' + styleDesc + chaosAdd;
      });
  }

  function loadBlobToImage(blob) {
    return new Promise(function (resolve, reject) {
      var objUrl = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(objUrl);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(objUrl);
        reject(new Error('图像解码失败'));
      };
      img.src = objUrl;
    });
  }

  // Engine 1: Free Zero-Key Real AI via Pollinations.ai (with automatic retry on burst 503)
  function generateFreeAI() {
    var raw = $('prompt-input').value.trim() || PRESETS[0];
    setLoading(true, '🧠 正在理解「' + raw.slice(0, 12) + '」并魔性扩写...', '免 Key 真 AI 生图，通常需 4~10 秒');

    expandChineseToMoxingPrompt(raw).then(function (fullPrompt) {
      $('prompt-preview').textContent = '✨ AI 绘图咒语：' + fullPrompt;
      var seed = (MD.hashString(raw) + state.seedOffset * 977 + Math.floor(Math.random() * 999)) % 999999;

      function fetchAttempt(attempt) {
        setLoading(
          true,
          attempt === 1 ? '🎨 真 AI 正在疯狂作画中...' : '⏳ 免费通道排队中，自动重试第 ' + attempt + ' 次...',
          '描述：' + raw
        );
        var url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(fullPrompt) +
          '?width=640&height=640&seed=' + (seed + attempt) + '&nologo=true';

        return fetch(url)
          .then(function (res) {
            if (res.status === 503 && attempt < 3) {
              return new Promise(function (resolve) { setTimeout(resolve, 4500); })
                .then(function () { return fetchAttempt(attempt + 1); });
            }
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var ct = res.headers.get('content-type') || '';
            if (ct.indexOf('image') === -1) throw new Error('服务繁忙，未返回图片');
            return res.blob();
          });
      }

      return fetchAttempt(1);
    })
      .then(loadBlobToImage)
      .then(function (img) {
        state.lastAiImage = img;
        state.lastPrompt = raw;
        state.lastBadge = 'AI · ' + state.style.toUpperCase();
        setLoading(false);
        recompositeCurrentAI(true);
        showToast('🎉 真 AI 魔性神图出炉！');
      })
      .catch(function (err) {
        setLoading(false);
        var hintMsg = err.message.indexOf('402') !== -1
          ? '⚠️ 免费公共通道在当前代理 IP 下已触发 402 限流：点顶部「🔑 自定义 API」填入免费个人 Key（硅基流动国内免费中文 Kolors，或 GitHub 一键领 Pollinations Key）即可无限稳定生成「' + raw + '」！'
          : '⚠️ 免费公共通道暂时繁忙 (' + err.message + ')：可点「再抽一张」重试，或切到「🔑 自定义 API」使用硅基流动/Pollinations 个人免费 Key！';
        $('prompt-preview').textContent = hintMsg;
        MD.painter.drawNoticeCard($('art-canvas'), '公共免 Key 通道被挤爆啦！', [
          '返回状态：' + err.message + '（共享 IP 匿名限流）',
          '👉 点顶部「🔑 自定义 API」用个人免费 Key：',
          '① 硅基流动：国内直连免费中文 Kolors',
          '② Pollinations：GitHub 一键领免费 Key',
          '③ 或点「🤪 纯离线涂鸦」体验本地预设画风'
        ]);
        showToast('公共通道限流，建议切到自定义免费 Key');
      });
  }

  // Engine 2: Custom API (SiliconFlow Free Chinese Kolors / Pollinations Key / Gemini / OpenAI-Compatible)
  function generateCustomAI() {
    var raw = $('prompt-input').value.trim() || PRESETS[0];
    var provider = $('provider-select').value;
    var apiKey = ($('api-key-input').value || '').trim();
    var baseUrl = ($('base-url-input').value || PROVIDER_DEFAULTS[provider].baseUrl).trim().replace(/\/$/, '');
    var model = ($('model-input').value || PROVIDER_DEFAULTS[provider].model).trim();

    if (!apiKey) {
      showToast('请先填入对应平台的 API Key！');
      return;
    }
    localStorage.setItem('moxing_key_' + provider, apiKey);
    localStorage.setItem('moxing_base_' + provider, baseUrl);
    localStorage.setItem('moxing_model_' + provider, model);

    setLoading(true, '🚀 正在呼叫 ' + provider.toUpperCase() + ' 真 AI 生图...', '模型：' + model);

    var styleCn = {
      soul: '极度魔性搞笑的夸张漫画风，人物表情滑稽斗鸡眼、喜感爆棚、色彩明快、粗黑描边',
      meme: '爆笑精神污染表情包风格，夸张颜艺、放射速度线、戏剧性喜剧张力',
      pixel: '复古16位像素喜剧风，大头搞笑比例、色彩鲜艳',
      cyber: '赛博朋克霓虹崩坏喜剧风，荧光粉青配色、荒诞科幻细节',
      abstract: '抽象毕加索涂鸦魔性名画风，五官滑稽错位、浓郁笔触、荒诞幽默'
    };

    var pPromise;
    if (provider === 'siliconflow' || provider === 'openai') {
      var finalPrompt = raw + '，' + (styleCn[state.style] || styleCn.soul) + '，不要在画面里生成乱码文字';
      $('prompt-preview').textContent = '✨ ' + provider + ' 咒语：' + finalPrompt;
      pPromise = fetch(baseUrl + '/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: model,
          prompt: finalPrompt,
          image_size: '768x768',
          size: '1024x1024',
          n: 1
        })
      })
        .then(function (r) {
          if (!r.ok) return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 80)); });
          return r.json();
        })
        .then(function (data) {
          var item = (data.images && data.images[0]) || (data.data && data.data[0]);
          if (!item) throw new Error('接口未返回图片字段');
          if (item.b64_json) {
            return new Promise(function (resolve, reject) {
              var im = new Image();
              im.onload = function () { resolve(im); };
              im.onerror = reject;
              im.src = 'data:image/png;base64,' + item.b64_json;
            });
          }
          return fetch(item.url).then(function (r) { return r.blob(); }).then(loadBlobToImage);
        });
    } else if (provider === 'huggingface') {
      pPromise = expandChineseToMoxingPrompt(raw).then(function (fullPrompt) {
        $('prompt-preview').textContent = '✨ Hugging Face 咒语：' + fullPrompt;
        return fetch(baseUrl + '/' + model, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: fullPrompt })
        })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.blob();
          })
          .then(loadBlobToImage);
      });
    } else if (provider === 'pollinations') {
      pPromise = expandChineseToMoxingPrompt(raw).then(function (fullPrompt) {
        $('prompt-preview').textContent = '✨ Pollinations 咒语：' + fullPrompt;
        var seed = (MD.hashString(raw) + state.seedOffset * 977) % 999999;
        var url = baseUrl + '/image/' + encodeURIComponent(fullPrompt) + '?model=' + encodeURIComponent(model) + '&width=640&height=640&seed=' + seed;
        return fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.blob();
          })
          .then(loadBlobToImage);
      });
    } else {
      // Google Gemini Image API
      pPromise = expandChineseToMoxingPrompt(raw).then(function (fullPrompt) {
        $('prompt-preview').textContent = '✨ Gemini 咒语：' + fullPrompt;
        var ep = baseUrl + '/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
        return fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseModalities: ['IMAGE'] }
          })
        })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function (data) {
            var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
            var ip = parts.find(function (p) { return p.inlineData && p.inlineData.data; });
            if (!ip) throw new Error('Gemini 未返回图像');
            return new Promise(function (resolve, reject) {
              var im = new Image();
              im.onload = function () { resolve(im); };
              im.onerror = reject;
              im.src = 'data:' + (ip.inlineData.mimeType || 'image/png') + ';base64,' + ip.inlineData.data;
            });
          });
      });
    }

    pPromise.then(function (img) {
      state.lastAiImage = img;
      state.lastPrompt = raw;
      state.lastBadge = provider.toUpperCase();
      setLoading(false);
      recompositeCurrentAI(true);
      showToast('🎉 ' + provider.toUpperCase() + ' 真 AI 神图生成完成！');
    }).catch(function (err) {
      setLoading(false);
      $('prompt-preview').textContent = '⚠️ 接口调用失败：' + err.message;
      showToast('调用失败: ' + err.message);
    });
  }

  // Engine 3: Pure Offline Cartoon Doodle Mode
  function generateLocal(saveToHistory) {
    var raw = $('prompt-input').value.trim() || PRESETS[0];
    var parsed = MD.parsePrompt(raw, state.seedOffset);
    state.lastAiImage = null;
    state.lastPrompt = raw;

    $('prompt-preview').textContent =
      '🤪 离线简笔画模式（仅识别常见动物/人物/场景预设词；任意人物如“数学家梵高”请切回上方「🤖 免费真 AI」！）｜已匹配：' +
      parsed.subjects.map(function (s) { return s.label; }).join(' + ') + ' · ' + parsed.scene.label;

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
      pushHistory(raw, canvas.toDataURL('image/png'));
    }
  }

  function runGenerate() {
    if (state.generating) return;
    if (state.engine === 'free-ai') {
      generateFreeAI();
    } else if (state.engine === 'custom-ai') {
      generateCustomAI();
    } else {
      generateLocal(true);
      showToast('🤪 离线涂鸦已出图！');
    }
  }

  function refreshCurrentPostFx() {
    if (state.engine === 'local') {
      generateLocal(false);
    } else if (state.lastAiImage) {
      recompositeCurrentAI(false);
    }
  }

  function syncProviderUI() {
    var prov = $('provider-select').value;
    state.provider = prov;
    var def = PROVIDER_DEFAULTS[prov];
    $('provider-hint').innerHTML = def.hint;
    $('api-key-input').value = localStorage.getItem('moxing_key_' + prov) || '';
    $('base-url-input').value = localStorage.getItem('moxing_base_' + prov) || def.baseUrl;
    $('model-input').value = localStorage.getItem('moxing_model_' + prov) || def.model;
    $('custom-endpoint-fields').classList.toggle('hidden', prov === 'pollinations' || prov === 'gemini' || prov === 'huggingface');
  }

  function toggleWobble() {
    state.wobbleOn = !state.wobbleOn;
    var btn = $('btn-wobble');
    btn.textContent = '🎬 鬼畜抖动预览: ' + (state.wobbleOn ? '开' : '关');
    btn.classList.toggle('active', state.wobbleOn);
    if (state.wobbleOn) {
      state.wobbleTimer = setInterval(function () {
        state.wobbleFrame = (state.wobbleFrame + 1) % 6;
        refreshCurrentPostFx();
      }, 130);
    } else {
      clearInterval(state.wobbleTimer);
      state.wobbleFrame = 0;
      refreshCurrentPostFx();
    }
  }

  function init() {
    // Quick hilarious presets
    var chips = $('preset-chips');
    PRESETS.slice(0, 6).forEach(function (txt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = txt.length > 14 ? txt.slice(0, 14) + '…' : txt;
      b.title = txt;
      b.addEventListener('click', function () {
        $('prompt-input').value = txt;
        state.seedOffset++;
        runGenerate();
      });
      chips.appendChild(b);
    });

    $('btn-random').addEventListener('click', function () {
      var cur = $('prompt-input').value.trim();
      var pool = PRESETS.filter(function (x) { return x !== cur; });
      $('prompt-input').value = pool[Math.floor(Math.random() * pool.length)];
      state.seedOffset++;
      runGenerate();
    });

    // 3-Mode Engine Switcher
    function setEngine(mode) {
      state.engine = mode;
      $('mode-free-ai').classList.toggle('active', mode === 'free-ai');
      $('mode-custom-ai').classList.toggle('active', mode === 'custom-ai');
      $('mode-local').classList.toggle('active', mode === 'local');
      $('ai-config').classList.toggle('hidden', mode !== 'custom-ai');
      $('btn-generate').textContent =
        mode === 'free-ai' ? '🔥 真 AI 生成魔性神图' :
        (mode === 'custom-ai' ? '🚀 用自定义 API 生成' : '🤪 离线简笔画秒出');
    }
    $('engine-switch').addEventListener('click', function (e) {
      var btn = e.target.closest('.pill-btn');
      if (!btn) return;
      setEngine(btn.getAttribute('data-mode'));
    });

    $('provider-select').addEventListener('change', syncProviderUI);
    syncProviderUI();

    // Style cards: instantly update overlay style on current AI image (or re-render local)
    $('style-grid').addEventListener('click', function (e) {
      var card = e.target.closest('.style-card');
      if (!card) return;
      document.querySelectorAll('.style-card').forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');
      state.style = card.getAttribute('data-style');
      refreshCurrentPostFx();
    });

    $('chaos-slider').addEventListener('input', function () {
      state.chaos = parseInt(this.value, 10);
      $('chaos-val').textContent = chaosLabel(state.chaos);
      refreshCurrentPostFx();
    });

    $('chk-caption').addEventListener('change', refreshCurrentPostFx);
    $('chk-stickers').addEventListener('change', refreshCurrentPostFx);
    $('custom-caption').addEventListener('input', refreshCurrentPostFx);

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

    $('btn-download').addEventListener('click', function () {
      var a = document.createElement('a');
      a.download = 'moxing-' + Date.now() + '.png';
      a.href = $('art-canvas').toDataURL('image/png');
      a.click();
      showToast('已保存 PNG 原图！');
    });

    $('btn-copy').addEventListener('click', function () {
      var canvas = $('art-canvas');
      if (navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(function (blob) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(function () { showToast('已复制图片到剪贴板！'); })
            .catch(function () { showToast('当前环境不支持复制，请点“下载 PNG”'); });
        });
      } else {
        showToast('当前环境不支持复制，请点“下载 PNG”');
      }
    });

    $('btn-wobble').addEventListener('click', toggleWobble);
    $('btn-clear-hist').addEventListener('click', function () {
      state.history = [];
      renderHistory();
      showToast('历史记录已清空');
    });

    // Generate the default "数学家梵高" immediately via real free AI!
    generateFreeAI();
  }

  window.addEventListener('DOMContentLoaded', init);
})(window.MoxingDraw);
