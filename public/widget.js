(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  var API_HOST = SCRIPT ? (new URL(SCRIPT.src)).origin : window.location.origin;
  var USER_ID = '';
  if (SCRIPT) {
    var params = new URL(SCRIPT.src).searchParams;
    USER_ID = params.get('u') || '';
  }

  // 未显式传入 u 且与宿主同源时（如预览页），尝试自动探测登录用户 id；跨域静默跳过
  function resolveUserId() {
    if (USER_ID || API_HOST !== window.location.origin) return Promise.resolve();
    return fetchJson(API_HOST + '/api/auth/me').then(function (res) {
      if (res && res.success && res.data && res.data.id) USER_ID = String(res.data.id);
    }).catch(function () {});
  }

  // i18n：接口不可用时的兜底语言配置（与 locales/config.json 保持一致）
  var I18N_FALLBACK_CONFIG = {
    default: 'zh-CN',
    locales: [
      { code: 'zh-CN', name: '简体中文' },
      { code: 'en-US', name: 'English' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' }
    ]
  };
  // 网络失败时的内置兜底文案（至少保证中/英可用）
  var I18N_FALLBACK_STR = {
    'zh-CN': {
      read: '已读', unread: '未读', emptyRead: '暂无已读通知',
      emptyUnread: '没有未读通知', prev: '上一页', next: '下一页',
      emergency: '紧急', noData: '暂无通知', bellTitle: '通知'
    },
    'en-US': {
      read: 'Read', unread: 'Unread', emptyRead: 'No read notifications',
      emptyUnread: 'No unread notifications', prev: 'Prev', next: 'Next',
      emergency: 'Emergency', noData: 'No notifications', bellTitle: 'Notifications'
    }
  };

  var i18nConfig = I18N_FALLBACK_CONFIG;
  var i18nCache = {};
  var wLang = 'zh-CN';
  var wStr = I18N_FALLBACK_STR['zh-CN'];

  function fetchJson(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function isValidLang(code) {
    return i18nConfig.locales.some(function (l) { return l.code === code; });
  }

  // 语言探测优先级：管理员指定(auto 以外) > 访客手动选择(ns_widget_lang) > 浏览器语言(精确/主标签回退) > 默认语言
  function detectLang(configLang) {
    if (configLang && configLang !== 'auto' && isValidLang(configLang)) return configLang;
    var saved = null;
    try { saved = localStorage.getItem('ns_widget_lang'); } catch (e) {}
    if (saved && isValidLang(saved)) return saved;

    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    for (var i = 0; i < langs.length; i++) {
      var tag = String(langs[i] || '').toLowerCase();
      if (!tag) continue;
      var exact = i18nConfig.locales.filter(function (l) { return l.code.toLowerCase() === tag; })[0];
      if (exact) return exact.code;
      var primary = tag.split('-')[0];
      var prefix = i18nConfig.locales.filter(function (l) { return l.code.toLowerCase().split('-')[0] === primary; })[0];
      if (prefix) return prefix.code;
    }
    return i18nConfig.default || 'zh-CN';
  }

  function stringsFromJson(json) {
    return {
      read: json['widget.read'],
      unread: json['widget.unread'],
      emptyRead: json['widget.emptyRead'],
      emptyUnread: json['widget.emptyUnread'],
      prev: json['widget.prev'],
      next: json['widget.next'],
      emergency: json['notify.badgeEmergency'],
      noData: json['widget.noData'],
      bellTitle: json['widget.bellTitle']
    };
  }

  function applyLang(code, json) {
    var base = I18N_FALLBACK_STR[code]
      || I18N_FALLBACK_STR[i18nConfig.default]
      || I18N_FALLBACK_STR['zh-CN'];
    var merged = {};
    Object.keys(base).forEach(function (k) { merged[k] = base[k]; });
    if (json) {
      var mapped = stringsFromJson(json);
      Object.keys(mapped).forEach(function (k) {
        if (mapped[k] !== undefined && mapped[k] !== null) merged[k] = mapped[k];
      });
    }
    wStr = merged;
    wLang = code;
    if (toggle) toggle.title = wStr.bellTitle;
  }

  function loadLangStrings(code) {
    if (i18nCache[code]) { applyLang(code, i18nCache[code]); return Promise.resolve(); }
    return fetchJson(API_HOST + '/api/i18n/' + encodeURIComponent(code) + '.json').then(function (json) {
      if (json) i18nCache[code] = json;
      applyLang(code, json);
    }).catch(function () { applyLang(code, null); });
  }

  // 配置默认值（Corporate Clean 企业简洁配色）
  var DEF = {
    position: 'top-right', offsetX: 20, offsetY: 20,
    buttonSize: 48, buttonColor: '#ffffff', buttonBg: '#2563eb',
    showBadge: true, badgeBg: '#dc2626', badgeColor: '#ffffff',
    panelWidth: 400, panelMaxHeight: 520,
    animationEnabled: true, soundEnabled: true,
    borderRadius: 12, language: 'auto',
    primaryColor: '#2563eb', successColor: '#16a34a',
    warningColor: '#d97706', errorColor: '#dc2626'
  };
  var cfg = {};

  // SVG 图标集
  var ICONS = {
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>',
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>',
    emergency: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>',
    bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
  };

  // 注入样式：Corporate Clean 企业简洁风（扁平、圆角、轻投影、动画≤200ms）
  var CSS = '' +
    '#ns-widget-root{position:fixed;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans","Noto Sans SC","Microsoft YaHei",sans-serif;font-size:14px;line-height:1.5;direction:ltr}' +
    '#ns-widget-root *{box-sizing:border-box}' +
    '.ns-toggle{width:var(--ns-tgl-w, 48px);height:var(--ns-tgl-w, 48px);border-radius:12px;background:var(--ns-tgl-bg, #2563eb);border:1px solid rgba(0,0,0,.06);box-shadow:0 1px 2px rgba(16,24,40,.06),0 2px 6px rgba(16,24,40,.10);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ns-tgl-clr, #ffffff);transition:transform .15s cubic-bezier(.16,1,.3,1),box-shadow .15s cubic-bezier(.16,1,.3,1),background-color .15s ease;margin-left:auto;position:relative}' +
    '.ns-toggle:hover{box-shadow:0 2px 6px rgba(16,24,40,.10),0 4px 12px rgba(16,24,40,.12);transform:translateY(-1px)}' +
    '.ns-toggle:active{transform:translateY(0) scale(.98);box-shadow:0 1px 2px rgba(16,24,40,.08)}' +
    '.ns-toggle:focus-visible{outline:2px solid #3b82f6;outline-offset:2px}' +
    '.ns-badge-count{position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;border-radius:999px;background:var(--ns-bdg-bg, #dc2626);color:var(--ns-bdg-clr, #ffffff);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 6px;line-height:1;box-shadow:0 1px 3px rgba(220,38,38,.35);pointer-events:none;border:2px solid #fff}' +
    '.ns-panel{position:absolute;top:var(--ns-pnl-top);bottom:var(--ns-pnl-bottom);left:var(--ns-pnl-left);right:var(--ns-pnl-right);width:var(--ns-pnl-w);max-height:var(--ns-pnl-mh);overflow-y:auto;overflow-x:hidden;display:none;border-radius:var(--ns-rad)px;background:#fff;box-shadow:0 8px 28px rgba(16,24,40,.12),0 2px 8px rgba(16,24,40,.06);border:1px solid #e5e7eb}' +
    '.ns-panel.ns-open{display:block}' +
    '.ns-panel::-webkit-scrollbar{width:6px}' +
    '.ns-panel::-webkit-scrollbar-track{background:transparent}' +
    '.ns-panel::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}' +
    '.ns-panel::-webkit-scrollbar-thumb:hover{background:#9ca3af}' +
    '.ns-tabs{display:flex;background:#f8fafc;border-radius:var(--ns-rad)px var(--ns-rad)px 0 0;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:1}' +
    '.ns-tab{flex:1;padding:13px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#6b7280;font-family:inherit;transition:color .15s ease,background-color .15s ease;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:6px;position:relative}' +
    '.ns-tab:hover{color:#374151;background:#f3f4f6}' +
    '.ns-tab:focus-visible{outline:2px solid #3b82f6;outline-offset:-2px}' +
    '.ns-tab.ns-active{color:var(--ns-primary);background:#fff}' +
    '.ns-tab.ns-active::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--ns-primary)}' +
    '.ns-tab .ns-tab-num{font-size:11px;color:#9ca3af;font-weight:600}' +
    '.ns-tab.ns-active .ns-tab-num{color:var(--ns-primary)}' +
    '.ns-list{display:none;flex-direction:column;gap:10px;padding:12px}' +
    '.ns-list.ns-show{display:flex}' +
    '.ns-notification{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.05);position:relative;overflow:hidden;opacity:0;transform:translateX(20px);transition:opacity .2s cubic-bezier(.16,1,.3,1),transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s ease,border-color .2s ease;border:1px solid #e5e7eb}' +
    '.ns-notification:hover{box-shadow:0 4px 12px rgba(16,24,40,.10);transform:translateY(-1px);border-color:#d8dee8}' +
    '.ns-notification.ns-dismissing{transform:translateX(100%);opacity:0}' +
    '.ns-notification.ns-type-info .ns-icon{color:var(--ns-primary)}' +
    '.ns-notification.ns-type-success .ns-icon{color:var(--ns-success)}' +
    '.ns-notification.ns-type-warning .ns-icon{color:var(--ns-warn)}' +
    '.ns-notification.ns-type-error .ns-icon{color:var(--ns-error)}' +
    '.ns-notification.ns-emergency{background:#fef2f2;border-color:#fecaca;box-shadow:0 1px 3px rgba(220,38,38,.15)}' +
    '.ns-notification.ns-emergency .ns-icon,.ns-notification.ns-emergency .ns-title{color:var(--ns-error)}' +
    '.ns-icon{flex-shrink:0;width:22px;height:22px;display:flex;align-items:center;justify-content:center;margin-top:1px}' +
    '.ns-body{flex:1;min-width:0}' +
    '.ns-title{font-size:14px;font-weight:600;color:#111827;margin:0;line-height:1.4;display:flex;align-items:center;flex-wrap:wrap;gap:6px}' +
    '.ns-time{font-size:11px;color:#9ca3af;margin-top:6px}' +
    '.ns-content{font-size:13px;color:#4b5563;margin:6px 0 0 0;line-height:1.55;word-break:break-word}' +
    '.ns-content code{background:#f3f4f6;padding:2px 6px;border-radius:6px;font-family:ui-monospace,"SFMono-Regular",Consolas,monospace;font-size:12px;color:var(--ns-error)}' +
    '.ns-content strong{color:#111827}' +
    '.ns-content a{color:var(--ns-primary);text-decoration:none}' +
    '.ns-content a:hover{text-decoration:underline}' +
    '.ns-content pre{background:#f9fafb;border:1px solid #e5e7eb;padding:8px 12px;border-radius:8px;overflow-x:auto;font-size:12px;margin:6px 0}' +
    '.ns-badge{display:inline-flex;align-items:center;font-size:10px;height:18px;padding:0 8px;border-radius:999px;font-weight:600}' +
    '.ns-badge-emergency{background:var(--ns-error);color:#fff}' +
    '.ns-close{flex-shrink:0;width:26px;height:26px;border-radius:8px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9ca3af;padding:0;margin-top:-2px;transition:background-color .15s ease,color .15s ease,transform .15s ease}' +
    '.ns-close:hover{background:#f3f4f6;color:#374151}' +
    '.ns-close:active{background:#e5e7eb;transform:scale(.95)}' +
    '.ns-close:focus-visible{outline:2px solid #3b82f6;outline-offset:1px}' +
    '.ns-empty{padding:40px 20px;text-align:center;color:#9ca3af;font-size:13px;line-height:1.6}' +
    '.ns-pagination{display:flex;justify-content:center;align-items:center;gap:6px;padding:10px 0 6px;flex-wrap:wrap}' +
    '.ns-page-btn{padding:7px 14px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:500;color:#4b5563;font-family:inherit;transition:transform .15s ease,background-color .15s ease,color .15s ease,border-color .15s ease;min-width:36px;text-align:center}' +
    '.ns-page-btn:hover{background:#f8fafc;color:#111827;border-color:#d1d5db;transform:translateY(-1px)}' +
    '.ns-page-btn:active{transform:translateY(0) scale(.98)}' +
    '.ns-page-btn:focus-visible{outline:2px solid #3b82f6;outline-offset:2px}' +
    '.ns-page-btn.ns-active{background:var(--ns-primary);color:#fff;border-color:var(--ns-primary);box-shadow:0 1px 2px rgba(37,99,235,.25)}' +
    '.ns-page-btn.ns-disabled{opacity:.35;cursor:default;pointer-events:none}' +
    '.ns-lang-wrap{display:flex;justify-content:center;padding:2px 0 6px}' +
    '.ns-lang-select{appearance:none;-webkit-appearance:none;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;color:#6b7280;cursor:pointer;font-family:inherit;font-size:11px;padding:5px 24px 5px 10px;line-height:1.4;transition:color .15s ease,border-color .15s ease;background-image:url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%228%22 height=%228%22 viewBox=%220 0 8 8%22><path fill=%22%239ca3af%22 d=%22M4 6L0 2h8z%22/></svg>");background-repeat:no-repeat;background-position:right 9px center}' +
    '.ns-lang-select:hover{color:#374151;border-color:#d1d5db}' +
    '.ns-lang-select:focus-visible{outline:2px solid #3b82f6;outline-offset:2px;border-color:var(--ns-primary)}' +
    '@keyframes nsSlideIn{to{opacity:1;transform:translateX(0)}}' +
    '@keyframes nsPulse{0%,100%{box-shadow:0 1px 3px rgba(220,38,38,.20)}50%{box-shadow:0 2px 8px rgba(220,38,38,.32)}}' +
    '@media (max-width:480px){' +
    '#ns-widget-root{--ns-tgl-w:40px}' +
    '.ns-toggle{border-radius:10px}' +
    '.ns-panel{position:fixed;top:60px;right:8px;left:8px;width:auto;max-height:calc(100vh - 80px)}' +
    '.ns-tab{padding:10px 12px;font-size:12px}' +
    '.ns-notification{padding:12px 14px;gap:10px}' +
    '.ns-page-btn{padding:5px 10px;font-size:11px;min-width:28px}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){#ns-widget-root *{animation-duration:.01ms!important;transition-duration:.01ms!important}}';

  // 运行时状态与本地缓存
  var PAGE = 5;
  var dismissed = {};
  try { dismissed = JSON.parse(localStorage.getItem('ns-dismissed') || '{}'); } catch (e) {}
  var readCache = [];
  try { readCache = JSON.parse(localStorage.getItem('ns-read') || '[]'); } catch (e) {}

  var root, toggle, panel, badge, isOpen = false;
  var tab = 'unread', readPage = 0, unreadPage = 0;
  var currentData = [], lastDataIds = '';
  var readEl, unreadEl, tabsEl;

  function mergeConfig(config) {
    cfg = {};
    Object.keys(DEF).forEach(function(k) { cfg[k] = (config[k] !== undefined) ? config[k] : DEF[k]; });
    if (!cfg.soundEnabled) playDing = function(){};
  }

  function applyConfigToRoot() {
    if (!root || !cfg || !cfg.position) return;
    var x = cfg.offsetX, y = cfg.offsetY;
    var pos = {};
    if (cfg.position.indexOf('top') === 0) pos.top = y + 'px';
    else pos.bottom = y + 'px';
    if (cfg.position.indexOf('right') > -1) pos.right = x + 'px';
    else pos.left = x + 'px';

    root.style.setProperty('top', pos.top || 'auto');
    root.style.setProperty('bottom', pos.bottom || 'auto');
    root.style.setProperty('right', pos.right || 'auto');
    root.style.setProperty('left', pos.left || 'auto');
    root.style.setProperty('--ns-tgl-w', cfg.buttonSize + 'px');
    root.style.setProperty('--ns-tgl-clr', cfg.buttonColor);
    root.style.setProperty('--ns-tgl-bg', cfg.buttonBg);
    root.style.setProperty('--ns-bdg-bg', cfg.badgeBg);
    root.style.setProperty('--ns-bdg-clr', cfg.badgeColor);
    root.style.setProperty('--ns-pnl-w', cfg.panelWidth + 'px');
    root.style.setProperty('--ns-pnl-mh', cfg.panelMaxHeight + 'px');
    root.style.setProperty('--ns-rad', cfg.borderRadius);
    root.style.setProperty('--ns-primary', cfg.primaryColor);
    root.style.setProperty('--ns-success', cfg.successColor);
    root.style.setProperty('--ns-warn', cfg.warningColor);
    root.style.setProperty('--ns-error', cfg.errorColor);

    // 根据按钮位置调整面板弹出方向
    var gap = 'calc(var(--ns-tgl-w) + 8px)';
    if (cfg.position.startsWith('top')) {
      root.style.setProperty('--ns-pnl-top', gap);
      root.style.setProperty('--ns-pnl-bottom', 'auto');
    } else {
      root.style.setProperty('--ns-pnl-top', 'auto');
      root.style.setProperty('--ns-pnl-bottom', gap);
    }
    if (cfg.position.endsWith('right')) {
      root.style.setProperty('--ns-pnl-right', '0');
      root.style.setProperty('--ns-pnl-left', 'auto');
    } else {
      root.style.setProperty('--ns-pnl-right', 'auto');
      root.style.setProperty('--ns-pnl-left', '0');
    }

    if (!cfg.showBadge && badge) badge.style.display = 'none';

    var styleBlock = document.getElementById('ns-anim-style');
    if (!cfg.animationEnabled) {
      if (!styleBlock) {
        styleBlock = document.createElement('style');
        styleBlock.id = 'ns-anim-style';
        document.head.appendChild(styleBlock);
      }
      styleBlock.textContent = '#ns-widget-root .ns-notification{animation:none!important;opacity:1!important;transform:none!important}';
    } else if (styleBlock) {
      styleBlock.remove();
    }
  }

  function fetchConfig(cb) {
    fetch(API_HOST + '/api/widget-config')
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success && res.data) cb(res.data);
        else cb(null);
      })
      .catch(function() { cb(null); });
  }

  function initUI(config) {
    // 注意：mergeConfig 已在 bootstrap 中完成（此时语言探测也已就绪）

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.id = 'ns-widget-root';
    root.innerHTML = '<button class="ns-toggle" title="' + esc(wStr.bellTitle) + '">' + ICONS.bell + '<span class="ns-badge-count" style="display:none">0</span></button><div class="ns-panel"></div>';
    if (SCRIPT && SCRIPT.parentNode) {
      SCRIPT.parentNode.insertBefore(root, SCRIPT.nextSibling);
    } else {
      document.body.appendChild(root);
    }

    toggle = root.querySelector('.ns-toggle');
    panel = root.querySelector('.ns-panel');
    badge = root.querySelector('.ns-badge-count');

    // 在 root 创建后应用样式变量
    applyConfigToRoot();

    toggle.onclick = function () {
      isOpen = !isOpen;
      if (isOpen) { panel.classList.add('ns-open'); readPage = 0; unreadPage = 0; fullRender(false); }
      else { panel.classList.remove('ns-open'); }
      ensureAudioCtx();
    };

    document.addEventListener('click', function (e) {
      if (isOpen && !root.contains(e.target)) { isOpen = false; panel.classList.remove('ns-open'); }
    });

    load();
    connectSSE();
    setInterval(load, 5000);
  }

  // 渲染
  function collectRead(notifications) {
    var list = notifications.filter(function (n) { return dismissed[n.id]; });
    readCache.forEach(function (r) {
      if (!list.some(function (d) { return d.id === r.id; })) list.push(r);
    });
    list.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    return list;
  }

  function fullRender(refresh) {
    var unread = sortUrgentFirst(currentData.filter(function (n) { return !dismissed[n.id]; }));
    var readAll = collectRead(currentData);

    if (unread.length && cfg.showBadge) {
      badge.textContent = unread.length > 99 ? '99+' : unread.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
    if (tab === 'read' && !readAll.length) tab = 'unread';

    var h = '';
    h += '<div class="ns-tabs" id="ns-tabs">' +
      '<button class="ns-tab' + (tab === 'read'  ? ' ns-active' : '') + '" data-tab="read">' + esc(wStr.read) + '<span class="ns-tab-num">' + readAll.length + '</span></button>' +
      '<button class="ns-tab' + (tab === 'unread' ? ' ns-active' : '') + '" data-tab="unread">' + esc(wStr.unread) + '<span class="ns-tab-num">' + (unread.length > 99 ? '99+' : unread.length) + '</span></button>' +
    '</div>';

    h += '<div class="ns-list' + (tab === 'read'  ? ' ns-show' : '') + '" id="ns-list-read">';
    if (!readAll.length) {
      h += '<div class="ns-empty">' + esc(wStr.emptyRead) + '</div>';
    } else {
      var rStart = readPage * PAGE;
      var rEnd = Math.min((readPage + 1) * PAGE, readAll.length);
      for (var i = rStart; i < rEnd; i++) h += card(readAll[i], i - rStart, true, refresh);
      if (readAll.length > PAGE) h += buildPagination(readAll.length, readPage, 'read');
    }
    h += '</div>';

    h += '<div class="ns-list' + (tab === 'unread'  ? ' ns-show' : '') + '" id="ns-list-unread">';
    if (!unread.length) {
      h += '<div class="ns-empty">' + esc(wStr.emptyUnread) + '</div>';
    } else {
      var uStart = unreadPage * PAGE;
      var uEnd = Math.min((unreadPage + 1) * PAGE, unread.length);
      for (var ui = uStart; ui < uEnd; ui++) h += card(unread[ui], ui - uStart, false, refresh);
      if (unread.length > PAGE) h += buildPagination(unread.length, unreadPage, 'unread');
    }
    h += '</div>';

    // Language switcher (all configured locales)
    h += '<div class="ns-lang-wrap"><select class="ns-lang-select" id="ns-lang-select" aria-label="Language">' +
      i18nConfig.locales.map(function (l) {
        var label = (i18nCache[wLang] && i18nCache[wLang]['lang.' + l.code]) || l.name;
        return '<option value="' + l.code + '"' + (l.code === wLang ? ' selected' : '') + '>' + esc(label) + '</option>';
      }).join('') +
      '</select></div>';

    panel.innerHTML = h;

    readEl = document.getElementById('ns-list-read');
    unreadEl = document.getElementById('ns-list-unread');
    tabsEl = document.getElementById('ns-tabs');

    var tabs = tabsEl.querySelectorAll('.ns-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].onclick = function (e) { e.stopPropagation(); switchTab(this.getAttribute('data-tab')); };
    }
    var btns = panel.querySelectorAll('.ns-close');
    for (var j = 0; j < btns.length; j++) {
      btns[j].onclick = function (e) { e.stopPropagation(); dismiss(this.getAttribute('data-id')); };
    }
    bindPagination(readEl, 'read');
    bindPagination(unreadEl, 'unread');
    var langSelect = document.getElementById('ns-lang-select');
    if (langSelect) {
      langSelect.onclick = function (e) { e.stopPropagation(); };
      langSelect.onchange = function (e) {
        e.stopPropagation();
        var code = this.value;
        try { localStorage.setItem('ns_widget_lang', code); } catch (err) {}
        loadLangStrings(code).then(function () { fullRender(false); });
      };
    }
  }

  // 单条通知卡片（read=true 已读，refresh=true 重渲染不播放入场动画）
  function card(n, i, read, refresh) {
    var anim = '';
    if (cfg.animationEnabled && !refresh) {
      anim = 'animation-duration:.2s;animation-fill-mode:forwards;animation-name:nsSlideIn;animation-delay:' + Math.min(i * 0.03, 0.15) + 's';
    } else {
      anim = 'opacity:1;transform:none';
    }
    return '<div class="ns-notification ns-type-' + n.type + (n.is_emergency ? ' ns-emergency' : '') + '" ' +
      'style="' + anim + '" data-id="' + n.id + '">' +
      '<span class="ns-icon">' + (n.is_emergency ? ICONS.emergency : (ICONS[n.type] || ICONS.info)) + '</span>' +
      '<div class="ns-body">' +
        '<div class="ns-title">' + esc(n.title) + (n.is_emergency ? '<span class="ns-badge ns-badge-emergency">' + esc(wStr.emergency) + '</span>' : '') + '</div>' +
        (n.content ? '<div class="ns-content">' + md(n.content) + '</div>' : '') +
        '<div class="ns-time">' + n.created_at + '</div>' +
      '</div>' +
      (read ? '<span style="flex-shrink:0;color:#388e3c;margin-top:-2px">' + ICONS.check + '</span>' : '<button class="ns-close" data-id="' + n.id + '">' + ICONS.close + '</button>') +
    '</div>';
  }

  function buildPagination(total, page, listType) {
    var totalPages = Math.ceil(total / PAGE);
    if (totalPages <= 1) return '';
    var h = '<div class="ns-pagination">';
    h += '<button class="ns-page-btn' + (page === 0 ? ' ns-disabled' : '') + '" data-page="' + (page - 1) + '" data-list="' + listType + '">' + esc(wStr.prev) + '</button>';
    var maxShow = 5, half = Math.floor(maxShow / 2);
    var pStart = Math.max(0, page - half), pEnd = Math.min(totalPages, pStart + maxShow);
    if (pEnd - pStart < maxShow) pStart = Math.max(0, pEnd - maxShow);
    for (var p = pStart; p < pEnd; p++) {
      h += '<button class="ns-page-btn ns-page-num' + (p === page ? ' ns-active' : '') + '" data-page="' + p + '" data-list="' + listType + '">' + (p + 1) + '</button>';
    }
    h += '<button class="ns-page-btn' + (page >= totalPages - 1 ? ' ns-disabled' : '') + '" data-page="' + (page + 1) + '" data-list="' + listType + '">' + esc(wStr.next) + '</button>';
    h += '</div>';
    return h;
  }

  function bindPagination(container, listType) {
    var btns = container.querySelectorAll('.ns-page-btn:not(.ns-disabled)');
    for (var b = 0; b < btns.length; b++) {
      btns[b].onclick = function (e) {
        e.stopPropagation();
        var p = parseInt(this.getAttribute('data-page'));
        if (listType === 'read') readPage = p; else unreadPage = p;
        refreshListView(listType);
      };
    }
  }

  function refreshListView(listType) {
    var container, items, page, isRead;
    if (listType === 'read') {
      container = readEl; items = collectRead(currentData); page = readPage; isRead = true;
    } else {
      container = unreadEl; items = sortUrgentFirst(currentData.filter(function(n){return !dismissed[n.id]})); page = unreadPage; isRead = false;
    }
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<div class="ns-empty">' + esc(isRead ? wStr.emptyRead : wStr.emptyUnread) + '</div>';
    } else {
      var start = page * PAGE, end = Math.min((page + 1) * PAGE, items.length);
      if (page * PAGE >= items.length) { page = 0; start = 0; end = Math.min(PAGE, items.length); if (isRead) readPage = 0; else unreadPage = 0; }
      for (var i = start; i < end; i++) {
        var tmp = document.createElement('div');
        tmp.innerHTML = card(items[i], i - start, isRead, true);
        var el = tmp.firstChild;
        container.appendChild(el);
        if (!isRead) {
          var btn = el.querySelector('.ns-close');
          if (btn) btn.onclick = function(e){e.stopPropagation();dismiss(this.getAttribute('data-id'));};
        }
      }
      if (items.length > PAGE) {
        var tmp2 = document.createElement('div');
        tmp2.innerHTML = buildPagination(items.length, page, listType);
        container.appendChild(tmp2.firstChild);
        bindPagination(container, listType);
      }
    }
    updateTabNums();
  }

  function updateTabNums() {
    var unread = sortUrgentFirst(currentData.filter(function(n){return !dismissed[n.id]}));
    var readAll = collectRead(currentData);
    var numEls = tabsEl.querySelectorAll('.ns-tab .ns-tab-num');
    if (numEls.length >= 2) {
      numEls[0].textContent = readAll.length;
      numEls[1].textContent = unread.length > 99 ? '99+' : unread.length;
    }
  }

  function switchTab(newTab) {
    if (tab !== newTab) {
      var tabs = tabsEl.querySelectorAll('.ns-tab');
      for (var t = 0; t < tabs.length; t++) {
        tabs[t].classList.toggle('ns-active', tabs[t].getAttribute('data-tab') === newTab);
      }
      readEl.classList.toggle('ns-show', newTab === 'read');
      unreadEl.classList.toggle('ns-show', newTab === 'unread');
      tab = newTab;
      refreshListView(newTab);
    }
  }

  function dismiss(id) {
    dismissed[id] = true;
    try { localStorage.setItem('ns-dismissed', JSON.stringify(dismissed)); } catch (e) {}
    var item = currentData.find(function(n){return n.id===id});
    if (item && !readCache.some(function(r){return r.id===id})) {
      readCache.push(item);
      try { localStorage.setItem('ns-read', JSON.stringify(readCache)); } catch (e) {}
    }
    var el = panel.querySelector('.ns-notification[data-id="' + id + '"]');
    if (el) { el.classList.add('ns-dismissing'); el.addEventListener('transitionend', function(){refreshListView(tab);}, {once:true}); }
    else { refreshListView(tab); }
  }

  function sortUrgentFirst(list) {
    return list.sort(function(a,b) {
      if (a.is_emergency && !b.is_emergency) return -1;
      if (!a.is_emergency && b.is_emergency) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  function esc(str) { var d=document.createElement('div'); d.textContent=str; return d.innerHTML; }

  function sanitize(str) {
    if (!str) return '';
    var div = document.createElement('div'); div.innerHTML = str;
    function clean(node) {
      if (node.nodeType === 1) {
        if (node.tagName === 'SCRIPT'||node.tagName==='IFRAME'||node.tagName==='OBJECT'||node.tagName==='EMBED') { node.remove(); return; }
        var attrs = node.attributes;
        for (var i = attrs.length-1; i>=0; i--) {
          if (/^on/i.test(attrs[i].name) || (attrs[i].name==='href' && /^javascript:/i.test(attrs[i].value))) node.removeAttribute(attrs[i].name);
        }
      }
      var children = node.childNodes;
      for (var c = children.length-1; c>=0; c--) clean(children[c]);
    }
    var frag = document.createDocumentFragment();
    while (div.firstChild) frag.appendChild(div.firstChild);
    clean(frag);
    var tmp = document.createElement('div'); tmp.appendChild(frag);
    return tmp.innerHTML;
  }

  function md(str) {
    if (!str) return '';
    str = sanitize(str);
    str = str.replace(/```(\w*)\n([\s\S]*?)```/g,'<pre><code>$2</code></pre>');
    str = str.replace(/`([^`]+)`/g,'<code>$1</code>');
    str = str.replace(/^### (.+)$/gm,'<h4>$1</h4>');
    str = str.replace(/^## (.+)$/gm,'<h3>$1</h3>');
    str = str.replace(/^# (.+)$/gm,'<h2>$1</h2>');
    str = str.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>');
    str = str.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    str = str.replace(/\*(.+?)\*/g,'<em>$1</em>');
    str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
    str = str.replace(/^[\-\*] (.+)$/gm,'<li>$1</li>');
    str = str.replace(/(<li>.*<\/li>)/s,'<ul>$1</ul>');
    str = str.replace(/\n\n/g,'<br><br>');
    return str;
  }

  var audioCtx = null;
  function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  document.addEventListener('click', ensureAudioCtx, {once:true});
  document.addEventListener('touchstart', ensureAudioCtx, {once:true});

  function playDing() {
    try {
      ensureAudioCtx();
      var now = audioCtx.currentTime;
      var osc1 = audioCtx.createOscillator(); var osc2 = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc1.type='sine'; osc1.frequency.value=880;
      osc2.type='sine'; osc2.frequency.value=1100;
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now+0.5);
      osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
      osc1.start(now); osc2.start(now); osc1.stop(now+0.15); osc2.stop(now+0.3);
    } catch(e) {}
  }

  function load() {
    fetch(API_HOST + '/api/notifications/active' + (USER_ID ? '?u='+USER_ID : ''))
      .then(function(r){return r.json()})
      .then(function(res) {
        if (res.success) {
          var apiIds = {};
          res.data.forEach(function(n){apiIds[n.id]=true});
          var cleaned = readCache.filter(function(r){return apiIds[r.id]});
          if (cleaned.length !== readCache.length) { readCache = cleaned; try{localStorage.setItem('ns-read',JSON.stringify(readCache))}catch(e){} }
          var dirty = false;
          for (var key in dismissed) { if (dismissed.hasOwnProperty(key) && !apiIds[key]) { delete dismissed[key]; dirty = true; } }
          if (dirty) { try{localStorage.setItem('ns-dismissed',JSON.stringify(dismissed))}catch(e){} }
          var ids = res.data.map(function(n){return n.id}).sort().join(',');
          if (lastDataIds && ids !== lastDataIds) {
            var oldSet = {};
            lastDataIds.split(',').forEach(function(id){if(id) oldSet[id]=true});
            var hasNew = res.data.some(function(n){return !oldSet[n.id]});
            if (hasNew && cfg.soundEnabled !== false) playDing();
          }
          lastDataIds = ids;
          currentData = res.data;
          var unread = res.data.filter(function(n){return !dismissed[n.id]});
          if (cfg.showBadge !== false) {
            badge.textContent = unread.length > 99 ? '99+' : unread.length;
            badge.style.display = unread.length ? 'flex' : 'none';
          }
          if (isOpen) refreshListView(tab);
        }
      })
      .catch(function(){});
  }

  function connectSSE() {
    try {
      var evtSource = new EventSource(API_HOST + '/api/notifications/stream');
      evtSource.addEventListener('update', function(){load()});
      evtSource.onerror = function(){evtSource.close(); setTimeout(connectSSE, 5000)};
    } catch(e) { setTimeout(connectSSE, 5000); }
  }

  // 启动：先取小部件配置与 i18n 配置/语言包再渲染 UI，任一失败均降级到内置兜底
  function bootstrap(config) {
    mergeConfig(config || {});
    resolveUserId().then(function () {
      return fetchJson(API_HOST + '/api/i18n/config');
    }).then(function (cfg) {
      if (cfg && cfg.locales && cfg.locales.length) i18nConfig = cfg;
      if (!i18nConfig.default) i18nConfig.default = I18N_FALLBACK_CONFIG.default;
      wLang = detectLang(config && config.language);
      return loadLangStrings(wLang);
    }).then(function () {
      initUI(config);
    }).catch(function () {
      initUI(config);
    });
  }

  try {
    fetchConfig(function(config) {
      try { bootstrap(config); } catch (e) { bootstrap(null); }
    });
  } catch (e) {
    bootstrap(null);
  }

})();
