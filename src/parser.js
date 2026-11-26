window.MoxingDraw = window.MoxingDraw || {};

(function (MD) {
  // Deterministic hash & Mulberry32 PRNG so each prompt + seed yields reproducible chaos
  MD.hashString = function (str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  MD.createRng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  MD.PRESETS = [
    '一只戴墨镜的胖橘猫骑着霸王龙在火星喝奶茶',
    '黑眼圈程序员在赛博办公室对着冒烟电脑发疯哭泣',
    '暴躁大鹅挥舞激光剑在海边抢老板的钞票',
    '熊猫头戴着皇冠在彩虹梦境里躺平当咸鱼',
    '绿外星人和柴犬在夜市摊吃火锅疯狂蹦迪',
    '奥特曼骑着喷火电瓶车在火山上空飞天送外卖',
    '悲伤青蛙戴耳机在教室里听歌流瀑布泪',
    '二手机器人在月球上拿着拖把暴打小幽灵'
  ];

  var SUBJECT_RULES = [
    { id: 'cat', label: '魔性橘猫', keys: ['橘猫', '胖猫', '小猫', '猫咪', '哈基米', '猫', 'cat', 'kitty'], color: '#fb923c' },
    { id: 'dog', label: '滑稽柴犬', keys: ['柴犬', '二哈', '哈士奇', '柯基', '修勾', '小狗', '狗子', '狗', 'dog', 'doge'], color: '#f59e0b' },
    { id: 'panda', label: '暴漫熊猫头', keys: ['熊猫头', '大熊猫', '熊猫', '国宝', 'panda'], color: '#f8fafc' },
    { id: 'dino', label: '短手霸王龙', keys: ['霸王龙', '暴龙', '恐龙', '巨龙', '龙', 'dino', 'dragon'], color: '#22c55e' },
    { id: 'goose', label: '嚣张大鹅', keys: ['大鹅', '大白鹅', '鹅', '鸭子', '鸭', '小鸭', 'duck', 'goose'], color: '#ffffff' },
    { id: 'frog', label: '悲伤魔性蛙', keys: ['悲伤蛙', '青蛙', '蛤蟆', '蛙', 'frog', 'pepe'], color: '#4ade80' },
    { id: 'fish', label: '躺平咸鱼', keys: ['咸鱼', '摸鱼', '金鱼', '鲨鱼', '鱼', 'fish', 'shark'], color: '#38bdf8' },
    { id: 'pig', label: '圆滚肥猪', keys: ['肥猪', '小猪', '猪猪', '猪', 'pig'], color: '#f9a8d4' },
    { id: 'chicken', label: '唱跳坤鸡', keys: ['坤', '公鸡', '小鸡', '炸鸡', '鸡', 'chicken'], color: '#fde047' },
    { id: 'alien', label: '歪天线外星人', keys: ['外星人', '火星人', '星人', 'alien', 'ufo'], color: '#84cc16' },
    { id: 'robot', label: '冒火花机器人', keys: ['机器人', '机甲', '赛博人', '仿生人', 'ai', 'robot', 'bot'], color: '#94a3b8' },
    { id: 'ultraman', label: '咸蛋眼超人', keys: ['奥特曼', '超人', '英雄', '战士', 'ultraman', 'hero'], color: '#ef4444' },
    { id: 'ghost', label: '吐舌小幽灵', keys: ['幽灵', '小鬼', '鬼', '骷髅', '灵魂', 'ghost'], color: '#e0f2fe' },
    { id: 'rabbit', label: '瞪眼流氓兔', keys: ['兔子', '小兔', '兔', 'rabbit', 'bunny'], color: '#fce7f3' },
    { id: 'coder', label: '黑眼圈程序员', keys: ['程序员', '码农', '打工人', '社畜', '加班狗', 'coder', 'developer'], color: '#60a5fa' },
    { id: 'boss', label: '大肚皮老板', keys: ['老板', '甲方', '领导', '大款', '富豪', 'boss'], color: '#f43f5e' },
    { id: 'bancho', label: '发光飞机头不良', keys: ['不良', '飞机头', '石河', '大哥', '老大', '校霸', '学生', '老师', '大妈', '宿管'], color: '#a855f7' },
    { id: 'human', label: '灵魂大头小人', keys: ['帅哥', '美女', '女孩', '男孩', '人类', '人', '我', '朋友', 'girl', 'boy', 'man', 'woman'], color: '#ffd4a3' }
  ];

  var SCENE_RULES = [
    { id: 'space', label: '抽象宇宙/火星', keys: ['火星', '太空', '宇宙', '月球', '星球', '银河', '外太空', 'space', 'mars', 'moon'] },
    { id: 'cyber', label: '赛博霓虹夜', keys: ['赛博', '霓虹', '未来', '科技', '电玩', '网吧', '夜景', '夜晚', 'cyber', 'neon'] },
    { id: 'beach', label: '魔性海边沙滩', keys: ['海边', '沙滩', '大海', '海滩', '海底', '泳池', 'beach', 'sea', 'ocean'] },
    { id: 'office', label: '牛马办公室', keys: ['办公室', '公司', '工位', '教室', '学校', '宿舍', '会议室', 'office', 'school'] },
    { id: 'volcano', label: '火山爆炸现场', keys: ['火山', '岩浆', '地狱', '爆炸', '战场', '火海', '末日', 'volcano', 'fire'] },
    { id: 'nightmarket', label: '赛博夜市摊', keys: ['夜市', '小吃摊', '街头', '巷子', '拉面', '火锅', '烧烤', '餐厅', '厨房', '街'] },
    { id: 'meadow', label: '暴漫大草原', keys: ['草原', '森林', '草地', '公园', '山上', '田野', '花园', 'grass', 'forest'] },
    { id: 'rainbow', label: '精神污染彩虹梦境', keys: ['彩虹', '梦境', '抽象', '发疯', '精神污染', '魔幻', '二次元', 'rainbow'] }
  ];

  var ACTION_RULES = [
    { id: 'ride', label: '叠罗汉骑乘', keys: ['骑着', '骑在', '骑', '坐在', 'riding'] },
    { id: 'fight', label: '街头互殴', keys: ['打架', '暴打', '殴打', '揍', '干架', '抢', 'pk', '决斗', '打', 'fight'] },
    { id: 'fly', label: '喷火飞天', keys: ['飞天', '上天', '起飞', '飞翔', '飞', '跳', 'fly', 'jump'] },
    { id: 'dance', label: '疯狂蹦迪', keys: ['蹦迪', '跳舞', '唱跳', '扭', '摇摆', '迪斯科', 'dance'] },
    { id: 'sleep', label: '躺平摆烂', keys: ['躺平', '摆烂', '睡觉', '睡', '摸鱼', '咸鱼', 'sleep'] },
    { id: 'cry', label: '瀑布爆哭', keys: ['哭泣', '大哭', '爆哭', '流泪', '瀑布泪', '哭', '破防', '崩溃', '委屈', 'cry'] },
    { id: 'angry', label: '怒火中烧', keys: ['生气', '暴躁', '发疯', '狂怒', '怒', '愤怒', '气炸', 'angry'] },
    { id: 'rich', label: '漫天撒钱', keys: ['发财', '暴富', '钞票', '撒钱', '赚钱', '钱', '金币', 'money', 'rich'] },
    { id: 'work', label: '冒烟加班', keys: ['加班', '写代码', '敲代码', '办公', '上班', '学习', '考试', '写作业', 'code', 'work'] },
    { id: 'eat', label: '狂炫干饭', keys: ['喝奶茶', '奶茶', '吃火锅', '火锅', '拉面', '吃', '干饭', '外卖', '烧烤', 'eat', 'food'] },
    { id: 'drive', label: '狂飙电驴', keys: ['电瓶车', '电驴', '赛车', '开车', '飙车', '摩托', '滑板', 'car', 'bike'] }
  ];

  var PROP_RULES = [
    { id: 'sunglasses', label: '炫酷墨镜', keys: ['墨镜', '太阳镜', '眼镜', 'glasses', 'sunglasses'] },
    { id: 'crown', label: '闪亮皇冠', keys: ['皇冠', '王冠', '国王', '王者', 'crown'] },
    { id: 'headphones', label: '大头耳机', keys: ['耳机', '听歌', '音乐', 'headphone', 'music'] },
    { id: 'sword', label: '发光激光剑', keys: ['激光剑', '光剑', '宝剑', '大刀', '剑', '刀', 'sword'] },
    { id: 'mop', label: '等离子拖把', keys: ['拖把', '扫把', '大扫除', 'mop'] },
    { id: 'boba', label: '超大杯奶茶', keys: ['奶茶', '咖啡', '可乐', '啤酒', '酒', 'tea', 'coffee'] },
    { id: 'laptop', label: '冒烟笔记本', keys: ['电脑', '笔记本', '代码', '键盘', '显卡', 'laptop', 'pc'] },
    { id: 'hotpot', label: '喷火大火锅', keys: ['火锅', '拉面', '外卖', '面', '肉', 'hotpot', 'ramen'] },
    { id: 'money', label: '厚厚钞票', keys: ['钞票', '钱', '发财', '暴富', '红包', 'money'] },
    { id: 'wings', label: '魔性小翅膀', keys: ['翅膀', '天使', '恶魔', '飞', 'wings'] },
    { id: 'fire', label: '背后大爆炸', keys: ['爆炸', '喷火', '火焰', '着火', '冒烟', 'fire', 'boom'] }
  ];

  MD.parsePrompt = function (rawPrompt, seedOffset) {
    var text = (rawPrompt || '').trim() || MD.PRESETS[0];
    var lower = text.toLowerCase();
    var seed = (MD.hashString(text) + (seedOffset || 0) * 7919) >>> 0;
    var rng = MD.createRng(seed);

    // 1. Find up to 2 subjects in order of appearance in text
    var foundSubjects = [];
    for (var i = 0; i < SUBJECT_RULES.length; i++) {
      var rule = SUBJECT_RULES[i];
      var bestIdx = -1;
      for (var k = 0; k < rule.keys.length; k++) {
        var idx = lower.indexOf(rule.keys[k]);
        if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
          bestIdx = idx;
        }
      }
      if (bestIdx !== -1) {
        foundSubjects.push({ pos: bestIdx, rule: rule });
      }
    }
    foundSubjects.sort(function (a, b) { return a.pos - b.pos; });

    // Avoid matching generic 'human' if 'coder'/'boss'/'bancho' already matched at same spot
    var subjects = [];
    for (var s = 0; s < foundSubjects.length && subjects.length < 2; s++) {
      var r = foundSubjects[s].rule;
      if (r.id === 'human' && subjects.some(function (x) { return x.id === 'coder' || x.id === 'boss' || x.id === 'bancho'; })) {
        continue;
      }
      subjects.push(r);
    }

    if (subjects.length === 0) {
      subjects.push({
        id: 'blob',
        label: '抽象拟人团子',
        color: ['#fde047', '#f472b6', '#38bdf8', '#a3e635'][Math.floor(rng() * 4)]
      });
    }

    // 2. Scene
    var scene = null;
    for (var sc = 0; sc < SCENE_RULES.length; sc++) {
      var sr = SCENE_RULES[sc];
      for (var sk = 0; sk < sr.keys.length; sk++) {
        if (lower.indexOf(sr.keys[sk]) !== -1) {
          scene = sr;
          break;
        }
      }
      if (scene) break;
    }
    if (!scene) {
      var fallbackScenes = [SCENE_RULES[7], SCENE_RULES[1], SCENE_RULES[0], SCENE_RULES[6]];
      scene = fallbackScenes[Math.floor(rng() * fallbackScenes.length)];
    }

    // 3. Actions (multiple allowed!)
    var actions = [];
    for (var a = 0; a < ACTION_RULES.length; a++) {
      var ar = ACTION_RULES[a];
      for (var ak = 0; ak < ar.keys.length; ak++) {
        if (lower.indexOf(ar.keys[ak]) !== -1) {
          actions.push(ar);
          break;
        }
      }
    }

    // 4. Props
    var props = [];
    for (var p = 0; p < PROP_RULES.length; p++) {
      var pr = PROP_RULES[p];
      for (var pk = 0; pk < pr.keys.length; pk++) {
        if (lower.indexOf(pr.keys[pk]) !== -1) {
          props.push(pr);
          break;
        }
      }
    }

    // Special modifiers
    var isFat = /胖|肥|大肚|圆滚|壮/.test(text);
    var hasDarkCircles = /黑眼圈|熬夜|加班|程序员|社畜|累|困/.test(text);
    var isBald = /光头|秃头|秃|卤蛋/.test(text);
    var isOrange = /橘|橙|黄/.test(text);
    var isPink = /粉|红|猛男/.test(text);
    var isGreen = /绿|青/.test(text);

    // Emotion derivation
    var emotion = 'derp';
    if (actions.some(function (x) { return x.id === 'cry'; })) emotion = 'cry';
    else if (actions.some(function (x) { return x.id === 'angry' || x.id === 'fight'; })) emotion = 'angry';
    else if (actions.some(function (x) { return x.id === 'sleep'; })) emotion = 'sleep';
    else if (actions.some(function (x) { return x.id === 'rich'; })) emotion = 'rich';
    else if (/开心|大笑|哈哈|笑|爽|嗨|蹦迪/.test(text)) emotion = 'manic';
    else if (/惊讶|震惊|离谱|卧槽|懵|呆/.test(text)) emotion = 'shock';

    // Auto-generate hilarious meme caption matching prompt!
    var captions = [
      '精神状态极其稳定：' + text.slice(0, 14) + (text.length > 14 ? '…' : ''),
      '这就是传说中的「' + subjects[0].label + '」巅峰时刻！',
      '救命，这画面太超前了！',
      'AI 看了连夜卸载显卡驱动',
      '合理，非常合理，甚至有点优雅',
      '别问，问就是大脑过载了！'
    ];
    if (emotion === 'cry') captions.unshift('破大防了家人们谁懂啊！！');
    if (emotion === 'rich') captions.unshift('别打扰我，正在精神暴富！');
    if (emotion === 'sleep') captions.unshift('今天先这样，地球没我也照转');
    if (emotion === 'angry') captions.unshift('今天谁也别想好过！！');

    return {
      raw: text,
      seed: seed,
      subjects: subjects,
      scene: scene,
      actions: actions,
      props: props,
      emotion: emotion,
      mods: {
        isFat: isFat,
        hasDarkCircles: hasDarkCircles,
        isBald: isBald,
        tint: isOrange ? '#fb923c' : (isPink ? '#f472b6' : (isGreen ? '#4ade80' : null))
      },
      autoCaption: captions[Math.floor(rng() * Math.min(3, captions.length))]
    };
  };
})(window.MoxingDraw);
