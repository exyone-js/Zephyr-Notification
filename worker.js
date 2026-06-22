import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('/*', cors());

// ---- file contents ----
const WIDGET_JS = `(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  var API_HOST = SCRIPT ? (new URL(SCRIPT.src)).origin : window.location.origin;

  var ICONS = {
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>',
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>',
    emergency: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>',
    bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>'
  };

  var CSS = '' +
    '#ns-widget-root{position:fixed;top:20px;right:20px;z-index:2147483647;font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:14px;line-height:1.5;direction:ltr}' +
    '#ns-widget-root *{box-sizing:border-box}' +
    '.ns-toggle{width:44px;height:44px;border-radius:50%;background:#fff;border:none;box-shadow:0 2px 8px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.6);transition:all .2s cubic-bezier(.4,0,.2,1);margin-left:auto;position:relative}' +
    '.ns-toggle:hover{box-shadow:0 4px 12px rgba(0,0,0,.2);color:rgba(0,0,0,.87);transform:scale(1.05)}' +
    '.ns-toggle:active{transform:scale(.95)}' +
    '.ns-badge-count{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:#d32f2f;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.2);pointer-events:none}' +
    '.ns-panel{position:absolute;top:52px;right:0;width:380px;max-height:480px;overflow-y:auto;display:none;border-radius:8px}' +
    '.ns-panel.ns-open{display:block}' +
    '.ns-panel::-webkit-scrollbar{width:4px}' +
    '.ns-panel::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:2px}' +
    '.ns-tabs{display:flex;background:#fff;border-radius:8px 8px 0 0;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:hidden;position:sticky;top:0;z-index:1}' +
    '.ns-tab{flex:1;padding:12px 16px;border:none;border-bottom:2px solid transparent;background:none;cursor:pointer;font-size:13px;font-weight:500;color:rgba(0,0,0,.54);font-family:inherit;transition:all .15s;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:4px}' +
    '.ns-tab:hover{color:rgba(0,0,0,.87);background:rgba(0,0,0,.03)}' +
    '.ns-tab.ns-active{color:#1976d2;border-bottom-color:#1976d2}' +
    '.ns-tab .ns-tab-num{font-size:11px;opacity:.7}' +
    '.ns-tab.ns-active .ns-tab-num{color:#1976d2}' +
    '.ns-list{display:none;flex-direction:column;gap:8px;padding:10px 2px 2px 0}' +
    '.ns-list.ns-show{display:flex}' +
    '.ns-list::-webkit-scrollbar{width:4px}' +
    '.ns-list::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:2px}' +
    '.ns-notification{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.08);position:relative;overflow:hidden;opacity:0;transform:translateX(40px);animation:nsSlideIn .3s cubic-bezier(.4,0,.2,1) forwards;transition:box-shadow .2s,transform .25s ease-in,opacity .25s ease-in}' +
    '.ns-notification:hover{box-shadow:0 4px 16px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.1)}' +
    '.ns-notification.ns-dismissing{transform:translateX(100%);opacity:0}' +
    '.ns-notification.ns-no-anim{animation:none;opacity:1;transform:none}' +
    '.ns-notification::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:4px 0 0 4px}' +
    '.ns-notification.ns-type-info::before{background:#1976d2}.ns-notification.ns-type-info .ns-icon{color:#1976d2}' +
    '.ns-notification.ns-type-success::before{background:#388e3c}.ns-notification.ns-type-success .ns-icon{color:#388e3c}' +
    '.ns-notification.ns-type-warning::before{background:#f57c00}.ns-notification.ns-type-warning .ns-icon{color:#f57c00}' +
    '.ns-notification.ns-type-error::before{background:#d32f2f}.ns-notification.ns-type-error .ns-icon{color:#d32f2f}' +
    '.ns-notification.ns-emergency{box-shadow:0 2px 8px rgba(211,47,47,.25),0 1px 3px rgba(0,0,0,.08);animation:nsSlideIn .3s cubic-bezier(.4,0,.2,1) forwards,nsPulse 2s ease-in-out infinite}' +
    '.ns-notification.ns-emergency::before{background:#d32f2f}' +
    '.ns-notification.ns-emergency .ns-icon,.ns-notification.ns-emergency .ns-title{color:#d32f2f}' +
    '.ns-icon{flex-shrink:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center;margin-top:1px}' +
    '.ns-body{flex:1;min-width:0}' +
    '.ns-title{font-size:14px;font-weight:500;color:rgba(0,0,0,.87);margin:0;line-height:1.4;display:flex;align-items:center;flex-wrap:wrap;gap:6px}' +
    '.ns-time{font-size:11px;color:rgba(0,0,0,.38);margin-top:6px}' +
    '.ns-content{font-size:13px;color:rgba(0,0,0,.6);margin:4px 0 0 0;line-height:1.5;word-break:break-word}' +
    '.ns-content code{background:rgba(0,0,0,.06);padding:1px 6px;border-radius:4px;font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:12px;color:#d32f2f}' +
    '.ns-content strong{color:rgba(0,0,0,.87)}' +
    '.ns-content em{color:rgba(0,0,0,.6)}' +
    '.ns-content a{color:#1976d2;text-decoration:none}' +
    '.ns-content a:hover{text-decoration:underline}' +
    '.ns-badge{display:inline-flex;align-items:center;font-size:10px;height:18px;padding:0 8px;border-radius:9px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}' +
    '.ns-badge-emergency{background:#d32f2f;color:#fff}' +
    '.ns-close{flex-shrink:0;width:24px;height:24px;border-radius:50%;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.38);padding:0;margin-top:-2px;transition:all .15s}' +
    '.ns-close:hover{background:rgba(0,0,0,.06);color:rgba(0,0,0,.87)}' +
    '.ns-close:active{background:rgba(0,0,0,.12)}' +
    '.ns-empty{padding:32px 16px;text-align:center;color:rgba(0,0,0,.38);font-size:13px;line-height:1.6}' +
    '.ns-pagination{display:flex;justify-content:center;align-items:center;gap:4px;padding:8px 0 4px;flex-wrap:wrap}' +
    '.ns-page-btn{padding:6px 12px;border:1px solid rgba(0,0,0,.12);border-radius:4px;background:#fff;cursor:pointer;font-size:12px;font-weight:500;color:rgba(0,0,0,.6);font-family:inherit;transition:all .15s;min-width:32px;text-align:center}' +
    '.ns-page-btn:hover{background:#f5f5f5;color:rgba(0,0,0,.87);border-color:rgba(0,0,0,.24)}' +
    '.ns-page-btn.ns-active{background:#1976d2;color:#fff;border-color:#1976d2}' +
    '.ns-page-btn.ns-disabled{opacity:.3;cursor:default;pointer-events:none}' +
    '@keyframes nsSlideIn{to{opacity:1;transform:translateX(0)}}' +
    '@keyframes nsPulse{0%,100%{box-shadow:0 2px 8px rgba(211,47,47,.25),0 1px 3px rgba(0,0,0,.08)}50%{box-shadow:0 4px 16px rgba(211,47,47,.4),0 2px 6px rgba(0,0,0,.12)}}';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var PAGE = 5;
  var dismissed = {};
  try { dismissed = JSON.parse(localStorage.getItem('ns-dismissed') || '{}'); } catch (e) {}
  var readCache = [];
  try { readCache = JSON.parse(localStorage.getItem('ns-read') || '[]'); } catch (e) {}

  var root = document.createElement('div');
  root.id = 'ns-widget-root';
  root.innerHTML = '<button class="ns-toggle" title="通知">' + ICONS.bell + '<span class="ns-badge-count" style="display:none">0</span></button><div class="ns-panel"></div>';
  SCRIPT.parentNode.insertBefore(root, SCRIPT.nextSibling);

  var toggle = root.querySelector('.ns-toggle');
  var panel = root.querySelector('.ns-panel');
  var badge = root.querySelector('.ns-badge-count');
  var isOpen = false;
  var tab = 'unread';
  var readPage = 0;
  var unreadPage = 0;
  var currentData = [];
  var lastDataIds = '';
  var readEl, unreadEl, tabsEl;

  toggle.onclick = function () {
    isOpen = !isOpen;
    if (isOpen) { panel.classList.add('ns-open'); fullRender(false); }
    else { panel.classList.remove('ns-open'); }
    ensureAudioCtx();
  };

  document.addEventListener('click', function (e) {
    if (isOpen && !root.contains(e.target)) { isOpen = false; panel.classList.remove('ns-open'); }
  });

  function collectRead(notifications) {
    var list = notifications.filter(function (n) { return dismissed[n.id]; });
    readCache.forEach(function (r) {
      if (!list.some(function (d) { return d.id === r.id; })) list.push(r);
    });
    list.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    return list;
  }

  // Full rebuild (panel open or data changed)
  function fullRender(refresh) {
    var unread = currentData.filter(function (n) { return !dismissed[n.id]; });
    var readAll = collectRead(currentData);

    if (unread.length) {
      badge.textContent = unread.length > 99 ? '99+' : unread.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
    if (tab === 'read' && !readAll.length) tab = 'unread';
    // Reset page if it exceeds available items
    if (readPage * PAGE >= readAll.length) readPage = Math.max(0, Math.floor((readAll.length - 1) / PAGE));
    if (unreadPage * PAGE >= unread.length) unreadPage = Math.max(0, Math.floor((unread.length - 1) / PAGE));

    var h = '';
    h += '<div class="ns-tabs" id="ns-tabs">' +
      '<button class="ns-tab' + (tab === 'read'  ? ' ns-active' : '') + '" data-tab="read">已读<span class="ns-tab-num">' + readAll.length + '</span></button>' +
      '<button class="ns-tab' + (tab === 'unread' ? ' ns-active' : '') + '" data-tab="unread">未读<span class="ns-tab-num">' + (unread.length > 99 ? '99+' : unread.length) + '</span></button>' +
    '</div>';

    h += '<div class="ns-list' + (tab === 'read'  ? ' ns-show' : '') + '" id="ns-list-read">';
    if (!readAll.length) {
      h += '<div class="ns-empty">暂无已读通知</div>';
    } else {
      var end = Math.min((readPage + 1) * PAGE, readAll.length);
      for (var i = 0; i < end; i++) h += card(readAll[i], i, true, refresh);
      if (readAll.length > PAGE) h += buildPagination(readAll.length, readPage, 'read');
    }
    h += '</div>';

    h += '<div class="ns-list' + (tab === 'unread'  ? ' ns-show' : '') + '" id="ns-list-unread">';
    if (!unread.length) {
      h += '<div class="ns-empty">没有未读通知</div>';
    } else {
      var uEnd = Math.min((unreadPage + 1) * PAGE, unread.length);
      for (var ui = 0; ui < uEnd; ui++) h += card(unread[ui], ui, false, refresh);
      if (unread.length > PAGE) h += buildPagination(unread.length, unreadPage, 'unread');
    }
    h += '</div>';

    panel.innerHTML = h;

    readEl = document.getElementById('ns-list-read');
    unreadEl = document.getElementById('ns-list-unread');
    tabsEl = document.getElementById('ns-tabs');

    // tab clicks: CSS-only toggle, no rebuild
    var tabs = tabsEl.querySelectorAll('.ns-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].onclick = function (e) { e.stopPropagation(); switchTab(this.getAttribute('data-tab')); };
    }

    // close buttons
    var btns = panel.querySelectorAll('.ns-close');
    for (var j = 0; j < btns.length; j++) {
      btns[j].onclick = function (e) { e.stopPropagation(); dismiss(this.getAttribute('data-id')); };
    }

    // pagination bindings
    bindPagination(readEl, 'read');
    bindPagination(unreadEl, 'unread');
  }

  function buildPagination(total, page, listType) {
    var totalPages = Math.ceil(total / PAGE);
    if (totalPages <= 1) return '';
    var h = '<div class="ns-pagination">';
    h += '<button class="ns-page-btn' + (page === 0 ? ' ns-disabled' : '') + '" data-page="' + (page - 1) + '" data-list="' + listType + '">上一页</button>';
    var maxShow = 5;
    var half = Math.floor(maxShow / 2);
    var pStart = Math.max(0, page - half);
    var pEnd = Math.min(totalPages, pStart + maxShow);
    if (pEnd - pStart < maxShow) pStart = Math.max(0, pEnd - maxShow);
    for (var p = pStart; p < pEnd; p++) {
      h += '<button class="ns-page-btn ns-page-num' + (p === page ? ' ns-active' : '') + '" data-page="' + p + '" data-list="' + listType + '">' + (p + 1) + '</button>';
    }
    h += '<button class="ns-page-btn' + (page >= totalPages - 1 ? ' ns-disabled' : '') + '" data-page="' + (page + 1) + '" data-list="' + listType + '">下一页</button>';
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

  // Refresh only the list content (cards + pagination), no tab/panel rebuild
  function refreshListView(listType) {
    var container, items, page, isRead;
    if (listType === 'read') {
      container = readEl;
      items = collectRead(currentData);
      page = readPage;
      isRead = true;
    } else {
      container = unreadEl;
      items = currentData.filter(function (n) { return !dismissed[n.id]; });
      page = unreadPage;
      isRead = false;
    }
    // Clear existing
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<div class="ns-empty">' + (isRead ? '暂无已读通知' : '没有未读通知') + '</div>';
    } else {
      var start = page * PAGE;
      var end = Math.min((page + 1) * PAGE, items.length);
      if (page * PAGE >= items.length) { page = 0; start = 0; end = Math.min(PAGE, items.length); if (isRead) readPage = 0; else unreadPage = 0; }
      for (var i = start; i < end; i++) {
        var tmp = document.createElement('div');
        tmp.innerHTML = card(items[i], i - start, isRead, true);
        var el = tmp.firstChild;
        container.appendChild(el);
        if (!isRead) {
          var btn = el.querySelector('.ns-close');
          if (btn) btn.onclick = function (e) { e.stopPropagation(); dismiss(this.getAttribute('data-id')); };
        }
      }
      if (items.length > PAGE) {
        var tmp2 = document.createElement('div');
        tmp2.innerHTML = buildPagination(items.length, page, listType);
        container.appendChild(tmp2.firstChild);
        bindPagination(container, listType);
      }
    }
    // update tab counts
    updateTabNums();
  }

  function updateTabNums() {
    var unread = currentData.filter(function (n) { return !dismissed[n.id]; });
    var readAll = collectRead(currentData);
    var numEls = tabsEl.querySelectorAll('.ns-tab .ns-tab-num');
    if (numEls.length >= 2) {
      numEls[0].textContent = readAll.length;
      numEls[1].textContent = unread.length > 99 ? '99+' : unread.length;
    }
  }

  // Seamless tab switch: CSS only, no DOM rebuild
  function switchTab(newTab) {
    if (tab !== newTab) {
      var tabs = tabsEl.querySelectorAll('.ns-tab');
      for (var t = 0; t < tabs.length; t++) {
        tabs[t].classList.toggle('ns-active', tabs[t].getAttribute('data-tab') === newTab);
      }
      readEl.classList.toggle('ns-show', newTab === 'read');
      unreadEl.classList.toggle('ns-show', newTab === 'unread');
      tab = newTab;
      // Refresh list content on tab switch
      refreshListView(newTab);
    }
  }

  function card(n, i, read, refresh) {
    var anim = refresh ? ' ns-no-anim' : '';
    return '<div class="ns-notification ns-type-' + n.type + (n.is_emergency ? ' ns-emergency' : '') + anim +
      '" data-id="' + n.id + '" style="animation-delay:' + (i * 0.04) + 's">' +
      '<span class="ns-icon">' + (n.is_emergency ? ICONS.emergency : (ICONS[n.type] || ICONS.info)) + '</span>' +
      '<div class="ns-body">' +
        '<div class="ns-title">' + esc(n.title) + (n.is_emergency ? '<span class="ns-badge ns-badge-emergency">紧急</span>' : '') + '</div>' +
        (n.content ? '<div class="ns-content">' + n.content + '</div>' : '') +
        '<div class="ns-time">' + n.created_at + '</div>' +
      '</div>' +
      (read ? '<span style="flex-shrink:0;color:#388e3c;margin-top:-2px">' + ICONS.check + '</span>' : '<button class="ns-close" data-id="' + n.id + '">' + ICONS.close + '</button>') +
    '</div>';
  }

  function dismiss(id) {
    dismissed[id] = true;
    try { localStorage.setItem('ns-dismissed', JSON.stringify(dismissed)); } catch (e) {}
    var item = currentData.find(function (n) { return n.id === id; });
    if (item && !readCache.some(function (r) { return r.id === id; })) {
      readCache.push(item);
      try { localStorage.setItem('ns-read', JSON.stringify(readCache)); } catch (e) {}
    }
    // Animate card out, then refresh current tab's list
    var el = panel.querySelector('.ns-notification[data-id="' + id + '"]');
    if (el) {
      el.classList.add('ns-dismissing');
      el.addEventListener('transitionend', function () { refreshListView(tab); }, { once: true });
    } else {
      refreshListView(tab);
    }
  }

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Play a "ding" notification sound
  var audioCtx = null;

  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  // Resume AudioContext on first user interaction (browser autoplay policy)
  document.addEventListener('click', ensureAudioCtx, { once: true });
  document.addEventListener('touchstart', ensureAudioCtx, { once: true });

  function playDing() {
    try {
      ensureAudioCtx();
      var now = audioCtx.currentTime;
      var osc1 = audioCtx.createOscillator();
      var osc2 = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc1.type = 'sine'; osc1.frequency.value = 880;
      osc2.type = 'sine'; osc2.frequency.value = 1100;
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc1.connect(gain); osc2.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start(now); osc2.start(now);
      osc1.stop(now + 0.15); osc2.stop(now + 0.3);
    } catch (e) {}
  }

  function load() {
    fetch(API_HOST + '/api/notifications/active')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) {
          var apiIds = {};
          res.data.forEach(function (n) { apiIds[n.id] = true; });

          var cleaned = readCache.filter(function (r) { return apiIds[r.id]; });
          if (cleaned.length !== readCache.length) {
            readCache = cleaned;
            try { localStorage.setItem('ns-read', JSON.stringify(readCache)); } catch (e) {}
          }
          var dirty = false;
          for (var key in dismissed) {
            if (dismissed.hasOwnProperty(key) && !apiIds[key]) { delete dismissed[key]; dirty = true; }
          }
          if (dirty) {
            try { localStorage.setItem('ns-dismissed', JSON.stringify(dismissed)); } catch (e) {}
          }

          var ids = res.data.map(function (n) { return n.id; }).sort().join(',');
          // Check for new notifications and play ding
          if (lastDataIds && ids !== lastDataIds) {
            var oldSet = {};
            lastDataIds.split(',').forEach(function (id) { if (id) oldSet[id] = true; });
            var hasNew = res.data.some(function (n) { return !oldSet[n.id]; });
            if (hasNew) playDing();
          }
          lastDataIds = ids;
          currentData = res.data;
          var unread = res.data.filter(function (n) { return !dismissed[n.id]; });
          badge.textContent = unread.length > 99 ? '99+' : unread.length;
          badge.style.display = unread.length ? 'flex' : 'none';
        }
      })
      .catch(function () {});
  }

  // SSE real-time sync
  function connectSSE() {
    try {
      var evtSource = new EventSource(API_HOST + '/api/notifications/stream');
      evtSource.addEventListener('update', function () { load(); });
      evtSource.onerror = function () {
        evtSource.close();
        setTimeout(connectSSE, 5000);
      };
    } catch (e) {
      setTimeout(connectSSE, 5000);
    }
  }

  load();
  connectSSE();
  setInterval(load, 30000);
})();
`;
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>通知管理系统 - 后台</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>通知管理系统</h1>
      <div class="header-actions">
        <button class="btn btn-outline" onclick="window.open('/preview.html')">预览通知</button>
        <button class="btn btn-outline" id="btnGetCode">获取嵌入代码</button>
      </div>
    </header>

    <section class="panel add-panel">
      <h2>添加新通知</h2>
      <form id="formAdd">
        <div class="form-row">
          <div class="form-group flex-1">
            <label for="title">标题 *</label>
            <input type="text" id="title" placeholder="通知标题" required>
          </div>
          <div class="form-group">
            <label for="type">类型</label>
            <select id="type">
              <option value="info">信息 (info)</option>
              <option value="success">成功 (success)</option>
              <option value="warning">警告 (warning)</option>
              <option value="error">错误 (error)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="content">内容 <span style="font-weight:400;color:#999;font-size:12px">（支持 HTML：&lt;b&gt;粗体&lt;/b&gt; &lt;i&gt;斜体&lt;/i&gt; &lt;a href="#"&gt;链接&lt;/a&gt;）</span></label>
          <textarea id="content" rows="3" placeholder="通知详细内容（支持 HTML 语法）"></textarea>
        </div>
        <div class="form-row">
          <label class="checkbox-label">
            <input type="checkbox" id="is_emergency">
            <span>紧急通知 (红色突出显示)</span>
          </label>
          <button type="submit" class="btn btn-primary">添加通知</button>
        </div>
      </form>
    </section>

    <section class="panel emergency-panel" id="emergencyPanel" style="display:none">
      <h2 class="emergency-title">紧急通知</h2>
      <div id="emergencyList"></div>
    </section>

    <section class="panel list-panel">
      <div class="list-header">
        <h2>所有通知</h2>
        <div class="list-actions">
          <button class="btn btn-sm" id="btnRefresh">刷新</button>
          <button class="btn btn-sm btn-danger" id="btnClearAll">清空全部</button>
        </div>
      </div>
      <div id="notificationList">
        <div class="empty">暂无通知</div>
      </div>
    </section>

    <div class="modal" id="modalCode">
      <div class="modal-content">
        <div class="modal-header">
          <h3>嵌入代码</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <p class="modal-hint">将以下代码复制到你网站的 &lt;body&gt; 标签内即可显示通知：</p>
        <textarea id="embedCode" readonly rows="5"></textarea>
        <button class="btn btn-primary" id="btnCopy">复制代码</button>
      </div>
    </div>
    <div class="modal-overlay" id="modalOverlay" onclick="closeModal()"></div>
  </div>

  <footer style="text-align:center;padding:20px 0 10px;color:#999;font-size:12px;">&copy; 002.HK</footer>

  <script src="admin.js"></script>
</body>
</html>
`;
const ADMIN_CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f0f2f5; color: #333; line-height: 1.6; }
.container { max-width: 900px; margin: 0 auto; padding: 20px; }

header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e8e8e8; }
header h1 { font-size: 24px; color: #1a1a1a; }
.header-actions { display: flex; gap: 8px; }

.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
.btn:hover { opacity: 0.85; }
.btn-primary { background: #1677ff; color: #fff; }
.btn-danger { background: #ff4d4f; color: #fff; }
.btn-outline { background: #fff; border: 1px solid #d9d9d9; color: #333; }
.btn-outline:hover { border-color: #1677ff; color: #1677ff; }
.btn-sm { padding: 5px 12px; font-size: 13px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.panel { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.panel h2 { font-size: 18px; margin-bottom: 16px; color: #1a1a1a; }

.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 14px; font-weight: 500; color: #555; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; transition: border 0.2s; }
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.1); }
.form-group textarea { resize: vertical; font-family: inherit; }
.form-row { display: flex; align-items: flex-end; gap: 12px; }
.flex-1 { flex: 1; }

.checkbox-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: #555; flex: 1; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #ff4d4f; }

.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list-header h2 { margin-bottom: 0; }
.list-actions { display: flex; gap: 8px; }

.notification-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; }
.notification-item:hover { border-color: #d9d9d9; background: #fafafa; }
.notification-item.emergency { border-color: #ffccc7; background: #fff2f0; }
.notification-item.inactive { opacity: 0.5; }
.notification-item .dot { width: 8px; height: 8px; min-width: 8px; border-radius: 50%; }
.notification-item .dot.info { background: #1677ff; }
.notification-item .dot.success { background: #52c41a; }
.notification-item .dot.warning { background: #faad14; }
.notification-item .dot.error { background: #ff4d4f; }
.notification-item .info-main { flex: 1; min-width: 0; }
.notification-item .info-title { font-weight: 600; font-size: 15px; }
.notification-item .info-meta { font-size: 12px; color: #999; margin-top: 2px; }
.notification-item .info-content { font-size: 13px; color: #666; margin-top: 4px; line-height: 1.4; }
.notification-item .info-content code { background: #f5f5f5; padding: 1px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 12px; color: #d32f2f; }
.notification-item .info-content strong { color: #333; }
.notification-item .info-content a { color: #1677ff; text-decoration: none; }
.notification-item .info-content a:hover { text-decoration: underline; }
.notification-item .badge { font-size: 11px; padding: 1px 8px; border-radius: 10px; font-weight: 500; }
.notification-item .badge.emergency-badge { background: #ff4d4f; color: #fff; }
.notification-item .badge.type-badge { background: #e6f4ff; color: #1677ff; }
.notification-item .item-actions { display: flex; gap: 6px; flex-shrink: 0; }
.item-actions button { padding: 4px 10px; font-size: 12px; border-radius: 4px; cursor: pointer; border: 1px solid #d9d9d9; background: #fff; transition: all 0.2s; }
.item-actions button:hover { border-color: #1677ff; color: #1677ff; }
.item-actions button.btn-del:hover { border-color: #ff4d4f; color: #ff4d4f; }

.emergency-panel { border: 2px solid #ffccc7; background: #fffbfb; }
.emergency-title { color: #ff4d4f !important; }

.modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 1000; }
.modal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; border-radius: 12px; box-shadow: 0 8px 40px rgba(0,0,0,0.15); z-index: 1001; width: 600px; max-width: 95vw; }
.modal.active, .modal-overlay.active { display: block; }
.modal-content { padding: 24px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { font-size: 18px; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; line-height: 1; }
.modal-close:hover { color: #333; }
.modal-hint { font-size: 13px; color: #666; margin-bottom: 12px; }
#embedCode { width: 100%; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; padding: 12px; border: 1px solid #d9d9d9; border-radius: 6px; background: #fafafa; }

.empty { text-align: center; padding: 40px 0; color: #999; }
.toast { position: fixed; top: 24px; right: 24px; padding: 10px 20px; border-radius: 6px; color: #fff; font-size: 14px; z-index: 9999; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.toast.show { opacity: 1; }
.toast.success { background: #52c41a; }
.toast.error { background: #ff4d4f; }

@media (max-width: 640px) {
  .container { padding: 12px; }
  header { flex-direction: column; gap: 12px; align-items: flex-start; }
  .form-row { flex-direction: column; align-items: stretch; }
  .notification-item { flex-wrap: wrap; }
  .notification-item .item-actions { width: 100%; justify-content: flex-end; }
}
`;
const ADMIN_JS = `const API = '/api/notifications';
const $ = s => document.querySelector(s);

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = \`toast \${type}\`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2000);
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  return res.json();
}

// ========== 加载通知列表 ==========

async function loadNotifications() {
  const res = await fetchJSON(API);
  const list = $('#notificationList');
  const emergencyList = $('#emergencyList');
  const emergencyPanel = $('#emergencyPanel');

  if (!res.success || !res.data.length) {
    list.innerHTML = '<div class="empty">暂无通知</div>';
    emergencyPanel.style.display = 'none';
    return;
  }

  const emergencies = res.data.filter(n => n.is_emergency && n.is_active);
  const all = res.data;

  // 紧急通知面板
  if (emergencies.length > 0) {
    emergencyPanel.style.display = '';
    emergencyList.innerHTML = emergencies.map(n => renderItem(n)).join('');
  } else {
    emergencyPanel.style.display = 'none';
  }

  // 所有通知
  list.innerHTML = all.map(n => renderItem(n)).join('');
}

function renderItem(n) {
  const typeLabels = { info: '信息', success: '成功', warning: '警告', error: '错误' };
  const cls = [];
  if (n.is_emergency) cls.push('emergency');
  if (!n.is_active) cls.push('inactive');

  return \`
    <div class="notification-item \${cls.join(' ')}" data-id="\${n.id}">
      <div class="dot \${n.type}"></div>
      <div class="info-main">
        <div class="info-title">
          \${n.title}
          \${n.is_emergency ? '<span class="badge emergency-badge">紧急</span>' : ''}
          <span class="badge type-badge">\${typeLabels[n.type] || n.type}</span>
          \${!n.is_active ? '<span class="badge" style="background:#eee;color:#999;">已停用</span>' : ''}
        </div>
        \${n.content ? \`<div class="info-content">\${n.content}</div>\` : ''}
        <div class="info-meta">\${n.created_at}</div>
      </div>
      <div class="item-actions">
        <button onclick="toggleActive('\${n.id}', \${n.is_active})">\${n.is_active ? '停用' : '启用'}</button>
        \${n.is_emergency ? \`<button onclick="toggleEmergency('\${n.id}', false)">取消紧急</button>\` : \`<button onclick="toggleEmergency('\${n.id}', true)">设紧急</button>\`}
        <button class="btn-del" onclick="deleteNotification('\${n.id}')">删除</button>
      </div>
    </div>\`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== 添加通知 ==========

$('#formAdd').addEventListener('submit', async e => {
  e.preventDefault();
  const title = $('#title').value.trim();
  if (!title) return toast('请输入标题', 'error');

  const res = await fetchJSON(API, {
    method: 'POST',
    body: JSON.stringify({
      title,
      content: $('#content').value.trim(),
      type: $('#type').value,
      is_emergency: $('#is_emergency').checked
    })
  });

  if (res.success) {
    toast('添加成功');
    $('#formAdd').reset();
    $('#is_emergency').checked = false;
    loadNotifications();
  } else {
    toast(res.message || '添加失败', 'error');
  }
});

// ========== 操作 ==========

async function deleteNotification(id) {
  if (!confirm('确定要删除这条通知吗？')) return;
  const res = await fetchJSON(\`\${API}/\${id}\`, { method: 'DELETE' });
  if (res.success) { toast('删除成功'); loadNotifications(); }
  else toast(res.message, 'error');
}

async function toggleActive(id, current) {
  const res = await fetchJSON(\`\${API}/\${id}\`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: current ? 0 : 1 })
  });
  if (res.success) { loadNotifications(); }
  else toast(res.message, 'error');
}

async function toggleEmergency(id, set) {
  const res = await fetchJSON(\`\${API}/\${id}\`, {
    method: 'PUT',
    body: JSON.stringify({ is_emergency: set ? 1 : 0 })
  });
  if (res.success) { toast(set ? '已设为紧急通知' : '已取消紧急'); loadNotifications(); }
  else toast(res.message, 'error');
}

$('#btnRefresh').addEventListener('click', loadNotifications);

$('#btnClearAll').addEventListener('click', async () => {
  if (!confirm('确定要清空所有通知吗？此操作不可恢复！')) return;
  const res = await fetchJSON(\`\${API}/clear-all\`, { method: 'POST' });
  if (res.success) { toast('已清空所有通知'); loadNotifications(); }
});

// ========== 嵌入代码弹窗 ==========

$('#btnGetCode').addEventListener('click', async () => {
  const res = await fetchJSON('/api/widget-code');
  if (res.success) {
    $('#embedCode').value = res.data;
    openModal();
  }
});

function openModal() {
  $('#modalCode').classList.add('active');
  $('#modalOverlay').classList.add('active');
}

function closeModal() {
  $('#modalCode').classList.remove('active');
  $('#modalOverlay').classList.remove('active');
}

$('#btnCopy').addEventListener('click', () => {
  $('#embedCode').select();
  document.execCommand('copy');
  toast('代码已复制到剪贴板');
});

// ========== 初始加载 ==========

loadNotifications();
`;
const PREVIEW_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>通知预览</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f5f5f5; min-height: 100vh; }
    .preview-header { background: #fff; padding: 16px 24px; border-bottom: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; }
    .preview-header h1 { font-size: 18px; color: #1a1a1a; }
    .preview-header a { color: #1677ff; text-decoration: none; font-size: 14px; }
    .preview-header a:hover { text-decoration: underline; }
    .preview-main { max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .mock-site { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .mock-site h2 { font-size: 20px; margin-bottom: 12px; color: #333; }
    .mock-site p { color: #666; margin-bottom: 24px; line-height: 1.8; }
    .widget-area { background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 8px; padding: 20px; margin-top: 16px; }
    .widget-area-label { font-size: 12px; color: #999; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    @media (max-width: 640px) {
      .preview-main { margin: 20px auto; padding: 0 12px; }
    }
  </style>
</head>
<body>
  <div class="preview-header">
    <h1>通知组件预览</h1>
    <a href="admin.html">返回后台</a>
  </div>

  <div class="preview-main">
    <div class="mock-site">
      <h2>示例网站页面</h2>
      <p>这是模拟你网站的页面内容。下方展示的是通知组件嵌入后的实际效果。通知数据来自 API，30 秒自动刷新一次。</p>

      <div class="widget-area">
        <div class="widget-area-label">通知组件嵌入区域</div>
        <script src="widget.js"></script>
      </div>

      <p style="margin-top:20px;">上面的通知组件就是用户在你网站上看到的实际样子。你可以在后台管理页面添加、删除、启停通知，此处会自动更新。</p>
    </div>
  </div>

  <footer style="text-align:center;padding:20px 0 10px;color:#999;font-size:12px;">&copy; 002.HK</footer>

</body>
</html>
`;

// ---- static file routes ----
app.get('/widget.js', c => c.newResponse(WIDGET_JS, 200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' }));
app.get('/admin.html', c => c.html(ADMIN_HTML));
app.get('/admin.css', c => c.newResponse(ADMIN_CSS, 200, { 'Content-Type': 'text/css; charset=utf-8' }));
app.get('/admin.js', c => c.newResponse(ADMIN_JS, 200, { 'Content-Type': 'application/javascript; charset=utf-8' }));
app.get('/preview.html', c => c.html(PREVIEW_HTML));
app.get('/', c => c.redirect('/admin.html'));

// ---- KV 存储 ----
function store(env) {
  const KV = env.NOTIFICATIONS;
  return {
    async getAll() {
      const raw = await KV.get('notifications', 'json');
      return (raw || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async saveAll(list) { await KV.put('notifications', JSON.stringify(list)); },
    async getActive() { return (await this.getAll()).filter(n => n.is_active); },
    async getEmergency() { return (await this.getAll()).filter(n => n.is_emergency && n.is_active); },
    async getById(id) { return (await this.getAll()).find(n => n.id === id) || null; },
    async create({ title, content, type, is_emergency }) {
      const all = await this.getAll();
      const item = {
        id: crypto.randomUUID(), title, content: content || '', type: type || 'info',
        is_emergency: !!is_emergency, is_active: true,
        created_at: now(), updated_at: now()
      };
      all.push(item);
      await this.saveAll(all);
      return item;
    },
    async update(id, fields) {
      const all = await this.getAll();
      const idx = all.findIndex(n => n.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...fields, updated_at: now() };
      await this.saveAll(all);
      return all[idx];
    },
    async delete(id) {
      const all = await this.getAll();
      const idx = all.findIndex(n => n.id === id);
      if (idx === -1) return { changes: 0 };
      all.splice(idx, 1);
      await this.saveAll(all);
      return { changes: 1 };
    },
    async deleteAll() { await KV.put('notifications', '[]'); }
  };
}

function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

// ---- API routes ----
app.get('/api/notifications', async c => c.json({ success: true, data: await store(c.env).getAll() }));
app.get('/api/notifications/active', async c => c.json({ success: true, data: await store(c.env).getActive() }));
app.get('/api/notifications/emergency', async c => c.json({ success: true, data: await store(c.env).getEmergency() }));

// SSE 实时推送 - 必须在 :id 之前
app.get('/api/notifications/stream', async c => {
  const db = store(c.env);
  let lastHash = '';
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue('data: connected\n\n');
      for (let i = 0; i < 300; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const raw = await c.env.NOTIFICATIONS.get('notifications');
          const hash = raw ? raw.length.toString() : '0';
          if (hash !== lastHash) {
            lastHash = hash;
            controller.enqueue('event: update\ndata: {}\n\n');
          }
        } catch (e) { break; }
      }
      controller.close();
    }
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' }
  });
});

app.get('/api/notifications/:id', async c => {
  const item = await store(c.env).getById(c.req.param('id'));
  if (!item) return c.json({ success: false, message: '通知不存在' }, 404);
  return c.json({ success: true, data: item });
});
app.post('/api/notifications', async c => {
  const body = await c.req.json();
  if (!body.title) return c.json({ success: false, message: '标题不能为空' }, 400);
  const item = await store(c.env).create(body);
  return c.json({ success: true, data: item }, 201);
});
app.put('/api/notifications/:id', async c => {
  const item = await store(c.env).update(c.req.param('id'), await c.req.json());
  if (!item) return c.json({ success: false, message: '通知不存在' }, 404);
  return c.json({ success: true, data: item });
});
app.delete('/api/notifications/:id', async c => {
  const r = await store(c.env).delete(c.req.param('id'));
  if (!r.changes) return c.json({ success: false, message: '通知不存在' }, 404);
  return c.json({ success: true, message: '删除成功' });
});
app.post('/api/notifications/clear-all', async c => { await store(c.env).deleteAll(); return c.json({ success: true, message: '已清空所有通知' }); });
app.get('/api/widget-code', c => {
  const u = new URL(c.req.url);
  return c.json({ success: true, data: `<script src="${u.protocol}//${u.host}/widget.js"></script>` });
});

export default app;
