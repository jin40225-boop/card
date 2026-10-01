/* 林彥宇電子名片：只做互動。內容都寫在 index.html，這支檔案壞掉時頁面仍可讀、連結仍可點。 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var page = doc.getElementById('page');

  var FOR_KEYS = ['child', 'disability', 'adhd'];
  var CARD_IMAGE_URL = 'assets/card-1080x1440.png';
  var CARD_IMAGE_NAME = '林彥宇_電子名片.png';
  var SAVE_FAIL_TEXT = '這個瀏覽器不能直接存，請長按圖片儲存';

  var mqDesktop = window.matchMedia('(min-width: 1024px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- F2 依對象開啟：?for=child|disability|adhd ---------- */
  var forKey = null;
  try {
    var param = new URLSearchParams(window.location.search).get('for');
    if (FOR_KEYS.indexOf(param) !== -1) { forKey = param; }
  } catch (err) { forKey = null; }

  /* ---------- 手風琴（<1024 才收合；>=1024 三欄全開） ---------- */
  var cols = Array.prototype.slice.call(doc.querySelectorAll('.col'));
  var openKey = forKey || 'child';

  function renderAccordion() {
    var desktop = mqDesktop.matches;
    cols.forEach(function (col) {
      var btn = col.querySelector('.col-toggle');
      var open = desktop || col.getAttribute('data-for') === openKey;
      col.classList.toggle('is-collapsed', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (desktop) { btn.setAttribute('tabindex', '-1'); } else { btn.removeAttribute('tabindex'); }
    });
  }

  function scrollToCol(col) {
    col.scrollIntoView({ block: 'start', behavior: mqReduce.matches ? 'auto' : 'smooth' });
  }

  cols.forEach(function (col) {
    col.querySelector('.col-toggle').addEventListener('click', function () {
      if (mqDesktop.matches) { return; }
      var key = col.getAttribute('data-for');
      openKey = (openKey === key) ? null : key;
      renderAccordion();
      /* 上面那格收起來後，被點的這格可能跑出畫面上緣，拉回來 */
      if (openKey && col.getBoundingClientRect().top < 0) { scrollToCol(col); }
    });
  });

  if (mqDesktop.addEventListener) { mqDesktop.addEventListener('change', renderAccordion); }
  else if (mqDesktop.addListener) { mqDesktop.addListener(renderAccordion); }

  renderAccordion();

  if (forKey) {
    var target = doc.getElementById(forKey);
    target.classList.add('is-target');   /* 樣式只在 >=1024 生效（粗框標示） */
    if (!mqDesktop.matches) { scrollToCol(target); }
  }

  /* ---------- F9 版本水印 ---------- */
  var versionEl = doc.getElementById('build-version');
  var build = window.__BUILD__;
  if (versionEl) {
    versionEl.textContent = (build && build.date && build.commit)
      ? '版本 ' + build.date + ' · ' + build.commit
      : '版本 未標記';
  }

  /* ---------- 小工具 ---------- */
  function flash(el, text, ms, restore) {
    window.clearTimeout(el._flashTimer);
    el.textContent = text;
    el._flashTimer = window.setTimeout(function () { el.textContent = restore; }, ms);
  }

  function writeClipboard(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return Promise.reject(new Error('clipboard unavailable'));
    }
    return navigator.clipboard.writeText(text);
  }

  function selectText(el) {
    var range = doc.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ---------- F7 複製信箱 ---------- */
  function copyEmail(btn) {
    var textEl = btn.parentNode.querySelector('.email-text');
    var pill = btn.querySelector('.copy-pill');
    writeClipboard(textEl.textContent.trim()).then(function () {
      flash(pill, '已複製', 2000, '複製');
    }, function () {
      selectText(textEl);
      flash(pill, '請長按複製', 6000, '複製');
    });
  }

  /* ---------- F6 分享 ---------- */
  function copyUrl(statusEl) {
    writeClipboard(window.location.href).then(function () {
      flash(statusEl, '已複製網址', 2000, '');
    }, function () {
      flash(statusEl, '無法自動複製，請複製網址列', 4000, '');
    });
  }

  function share(btn) {
    var statusEl = btn.parentNode.querySelector('.share-status');
    if (navigator.share) {
      navigator.share({ title: doc.title, url: window.location.href }).catch(function (err) {
        if (err && err.name === 'AbortError') { return; }   /* 使用者自己關掉分享面板 */
        copyUrl(statusEl);
      });
      return;
    }
    copyUrl(statusEl);
  }

  /* ---------- 覆層共用：鎖捲動、焦點移入、Esc 關閉、焦點還原 ---------- */
  var activeOverlay = null;
  var lastFocus = null;

  function focusables(container) {
    return Array.prototype.slice.call(container.querySelectorAll('button, a[href]'));
  }

  function openOverlay(overlay) {
    if (activeOverlay) { return; }
    lastFocus = doc.activeElement;
    overlay.hidden = false;
    root.classList.add('is-locked');
    page.setAttribute('inert', '');
    activeOverlay = overlay;
    overlay.scrollTop = 0;
    var first = focusables(overlay)[0];
    if (first) { first.focus(); }
  }

  function closeOverlay() {
    if (!activeOverlay) { return; }
    activeOverlay.hidden = true;
    activeOverlay = null;
    root.classList.remove('is-locked');
    page.removeAttribute('inert');
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    lastFocus = null;
  }

  doc.addEventListener('keydown', function (e) {
    if (!activeOverlay) { return; }
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeOverlay();
      return;
    }
    if (e.key === 'Tab') {
      var items = focusables(activeOverlay);
      if (!items.length) { return; }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && (doc.activeElement === first || !activeOverlay.contains(doc.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (doc.activeElement === last || !activeOverlay.contains(doc.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- F3 出示 QR ---------- */
  var qrOverlay = doc.getElementById('qr-overlay');
  var qrImg = doc.getElementById('qr-img');
  var chips = Array.prototype.slice.call(qrOverlay.querySelectorAll('.chip'));
  var qrKey = forKey;   /* null = 通用 QR */

  function renderQr() {
    qrImg.setAttribute('src', 'assets/qr-card' + (qrKey ? '-' + qrKey : '') + '.svg');
    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-qr') === qrKey ? 'true' : 'false');
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var key = chip.getAttribute('data-qr');
      qrKey = (qrKey === key) ? null : key;   /* 再按一次已選的 chip 回到通用 QR */
      renderQr();
    });
  });

  renderQr();

  /* ---------- F10 存名片圖到相簿 ---------- */
  var imgOverlay = doc.getElementById('img-overlay');
  var imgMsg = doc.getElementById('img-msg');
  var cardFilePromise = null;

  function fetchCardFile() {
    return fetch(CARD_IMAGE_URL).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.blob();
    }).then(function (blob) {
      return new File([blob], CARD_IMAGE_NAME, { type: 'image/png' });
    });
  }

  function openImageOverlay() {
    imgMsg.textContent = '';
    openOverlay(imgOverlay);
    /* 先抓好圖檔，按「儲存／分享圖片」時才能在同一次點擊內叫出分享面板 */
    cardFilePromise = fetchCardFile();
    cardFilePromise.catch(function () { /* 失敗留到按下按鈕時再顯示 */ });
  }

  function saveImage() {
    imgMsg.textContent = '';
    if (!cardFilePromise) { cardFilePromise = fetchCardFile(); }
    cardFilePromise.then(function (file) {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file] });
      }
      var url = URL.createObjectURL(file);
      var a = doc.createElement('a');
      a.href = url;
      a.download = CARD_IMAGE_NAME;
      a.style.display = 'none';
      imgOverlay.appendChild(a);
      a.click();
      imgOverlay.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }).catch(function (err) {
      if (err && err.name === 'AbortError') { return; }   /* 使用者自己關掉分享面板 */
      cardFilePromise = null;   /* 下次按再重抓一次 */
      imgMsg.textContent = SAVE_FAIL_TEXT;
    });
  }

  /* ---------- 點擊分派 ---------- */
  doc.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) { return; }
    var action = el.getAttribute('data-action');

    if (action === 'open-qr' || action === 'open-image') {
      /* 這兩顆在沒有 JS 時是直接開圖檔的連結；有 JS 時改開覆層。保留 Ctrl/Cmd 點擊開新分頁 */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      e.preventDefault();
      if (action === 'open-qr') { openOverlay(qrOverlay); } else { openImageOverlay(); }
    } else if (action === 'close-overlay') {
      closeOverlay();
    } else if (action === 'save-image') {
      saveImage();
    } else if (action === 'share') {
      share(el);
    } else if (action === 'copy-email') {
      copyEmail(el);
    }
  });
})();
