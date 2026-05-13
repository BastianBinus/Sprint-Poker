(function (global) {
  'use strict';

  let cfg = {
    selfId: () => null,
    broadcast: () => {},
    trayEmojis: [
      { emoji: '💩', label: 'Scheisse' },
      { emoji: '🍅', label: 'Tomate' },
      { emoji: '👏', label: 'Applaus' },
      { emoji: '🔥', label: 'Fire' }
    ]
  };

  let openTrayPid = null;
  const activeFires = new Map();
  const seenThrows = new Set();

  const genId = () => Math.random().toString(36).slice(2,10);

  function ensureTray(wrap, pid, isMe) {
    if (isMe) return;
    if (wrap.querySelector(':scope > .emoji-throw-tray')) return;
    const tray = document.createElement('div');
    tray.className = 'emoji-throw-tray';
    tray.innerHTML = cfg.trayEmojis.map(t =>
      `<button class="emoji-throw-btn" data-throw="${t.emoji}" data-label="${t.label}" data-target="${pid}">${t.emoji}</button>`
    ).join('');
    wrap.insertBefore(tray, wrap.firstChild);
  }

  function scanAvatars() {
    const selfPid = cfg.selfId();
    document.querySelectorAll('.player-avatar-wrap').forEach(wrap => {
      const av = wrap.querySelector('.player-avatar');
      if (!av) return;
      const pid = av.dataset.pid;
      if (!pid) return;
      const isMe = av.classList.contains('me') || pid === selfPid;
      ensureTray(wrap, pid, isMe);
    });
  }

  function applyOpenTrayDOM() {
    document.querySelectorAll('.player-avatar-wrap.tray-open').forEach(w => w.classList.remove('tray-open'));
    if (openTrayPid) {
      const el = document.querySelector(`.player-avatar[data-pid="${openTrayPid}"]`);
      el?.closest('.player-avatar-wrap')?.classList.add('tray-open');
    }
  }

  document.addEventListener('click', e => {
    const throwBtn = e.target.closest('.emoji-throw-btn');
    if (throwBtn) {
      e.stopPropagation();
      send(throwBtn.dataset.target, throwBtn.dataset.throw, throwBtn);
      return;
    }
    const otherAv = e.target.closest('.player-avatar:not(.me)');
    if (otherAv) {
      const pid = otherAv.dataset.pid;
      const selfPid = cfg.selfId();
      if (pid && pid !== selfPid) {
        openTrayPid = (openTrayPid === pid) ? null : pid;
      } else {
        openTrayPid = null;
      }
    } else if (!e.target.closest('.emoji-throw-tray')) {
      openTrayPid = null;
    }
    applyOpenTrayDOM();
  });

  function send(targetId, emoji, srcEl) {
    const id = genId() + '_' + Date.now();
    const srcRect = srcEl ? srcEl.getBoundingClientRect() : null;
    const payload = {
      id, emoji, target: targetId,
      from: cfg.selfId(),
      ts: Date.now()
    };
    if (srcRect) {
      payload.srcX = srcRect.left + srcRect.width / 2;
      payload.srcY = srcRect.top  + srcRect.height / 2;
      payload.srcViewportW = window.innerWidth;
      payload.srcViewportH = window.innerHeight;
    }
    cfg.broadcast(payload);
    receive(payload);
  }

  function receive(payload) {
    if (!payload || !payload.id) return;
    if (seenThrows.has(payload.id)) return;
    seenThrows.add(payload.id);
    if (Date.now() - (payload.ts || 0) > 3500) return;
    playFlight(payload);
  }

  function playFlight(t) {
    const targetEl = document.querySelector(`.player-avatar[data-pid="${t.target}"]`);
    if (!targetEl) return;

    let startX, startY;
    const senderEl = document.querySelector(`.player-avatar[data-pid="${t.from}"]`);
    if (t.srcX != null && t.srcViewportW) {
      startX = (t.srcX / t.srcViewportW) * window.innerWidth;
      startY = (t.srcY / t.srcViewportH) * window.innerHeight;
    } else if (senderEl) {
      const r = senderEl.getBoundingClientRect();
      startX = r.left + r.width / 2;
      startY = r.top  + r.height / 2;
    } else {
      startX = window.innerWidth / 2;
      startY = -40;
    }
    const tr = targetEl.getBoundingClientRect();
    const endX = tr.left + tr.width / 2;
    const endY = tr.top  + tr.height / 2;

    const fly = document.createElement('div');
    fly.className = 'flying-emoji';
    fly.textContent = t.emoji;
    fly.style.left = (startX - 18) + 'px';
    fly.style.top  = (startY - 18) + 'px';
    fly.style.transform = 'translate(0,0) rotate(0deg) scale(1)';
    document.body.appendChild(fly);
    requestAnimationFrame(() => {
      const dx = endX - startX, dy = endY - startY;
      fly.style.transform = `translate(${dx}px, ${dy}px) rotate(540deg) scale(1.2)`;
      fly.style.opacity = '0.95';
    });
    setTimeout(() => {
      fly.remove();
      applyHitEffect(targetEl, t.emoji);
    }, 850);
  }

  function applyHitEffect(targetEl, emoji) {
    switch (emoji) {
      case '💩': return fxPoop(targetEl);
      case '🔥': return fxFire(targetEl);
      case '🍅': return fxTomato(targetEl);
      case '👏': return fxClap(targetEl);
      default:   return fxFallback(targetEl, emoji);
    }
  }

  function fxPoop(targetEl) {
    const ov = document.createElement('div');
    ov.className = 'hit-fx hit-poop';
    ov.innerHTML = `
      <svg class="poop-splat-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="poopG_${Math.random().toString(36).slice(2,7)}" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#8b5a2b"/>
            <stop offset="60%" stop-color="#5a3a1e"/>
            <stop offset="100%" stop-color="#3a2510"/>
          </radialGradient>
        </defs>
        <path d="M50 8 C72 8, 90 24, 85 44 C95 50, 96 70, 78 78 C82 92, 60 96, 50 90 C40 96, 18 92, 22 78 C4 70, 5 50, 15 44 C10 24, 28 8, 50 8 Z" fill="#5a3a1e"/>
        <ellipse cx="38" cy="32" rx="6" ry="4" fill="#a87543" opacity="0.6"/>
        <ellipse cx="62" cy="38" rx="4" ry="3" fill="#a87543" opacity="0.5"/>
      </svg>
      <div class="poop-drip drip-l"></div>
      <div class="poop-drip drip-r"></div>
      <div class="poop-drip drip-c"></div>
      <div class="poop-stink stink-1">~</div>
      <div class="poop-stink stink-2">~</div>`;
    targetEl.appendChild(ov);
    setTimeout(() => ov.remove(), 1600);
  }

  function fireOverlayHTML() {
    return `
      <div class="fire-glow"></div>
      <svg class="fire-flame f1" viewBox="0 0 32 48" preserveAspectRatio="none"><path d="M16 46 C2 38, 4 24, 12 18 C10 12, 14 8, 16 2 C18 10, 26 14, 22 22 C30 26, 30 40, 16 46 Z" fill="#ff8a1a"/><path d="M16 42 C8 36, 10 26, 16 22 C20 28, 22 34, 16 42 Z" fill="#ffe89a" opacity="0.9"/></svg>
      <svg class="fire-flame f2" viewBox="0 0 32 48" preserveAspectRatio="none"><path d="M16 46 C2 38, 4 24, 12 18 C10 12, 14 8, 16 2 C18 10, 26 14, 22 22 C30 26, 30 40, 16 46 Z" fill="#ff9020"/></svg>
      <svg class="fire-flame f3" viewBox="0 0 32 48" preserveAspectRatio="none"><path d="M16 46 C2 38, 4 24, 12 18 C10 12, 14 8, 16 2 C18 10, 26 14, 22 22 C30 26, 30 40, 16 46 Z" fill="#ff5a1a"/></svg>
      <div class="fire-spark s1"></div><div class="fire-spark s2"></div>
      <div class="fire-spark s3"></div><div class="fire-spark s4"></div>
      <div class="fire-smoke"></div>`;
  }

  function fxFire(targetEl) {
    const wrap = targetEl.parentElement;
    if (!wrap) return;
    const pid = targetEl.dataset.pid;
    const FIRE_DURATION = 2000;

    wrap.querySelectorAll('.hit-fire.fire-behind').forEach(el => el.remove());
    clearTimeout(activeFires.get(pid + '_timer'));

    const ov = document.createElement('div');
    ov.className = 'hit-fx hit-fire fire-behind';
    ov.innerHTML = fireOverlayHTML();
    wrap.insertBefore(ov, targetEl);
    targetEl.classList.add('is-burning');

    const timer = setTimeout(() => {
      ov.remove();
      targetEl.classList.remove('is-burning');
      activeFires.delete(pid);
      activeFires.delete(pid + '_timer');
    }, FIRE_DURATION);

    activeFires.set(pid, Date.now() + FIRE_DURATION);
    activeFires.set(pid + '_timer', timer);
  }

  function reapplyActiveFires() {
    const now = Date.now();
    activeFires.forEach((endsAt, pid) => {
      if (pid.endsWith('_timer')) return;
      if (endsAt <= now) { activeFires.delete(pid); return; }
      const targetEl = document.querySelector(`.player-avatar[data-pid="${pid}"]`);
      if (!targetEl) return;
      const wrap = targetEl.parentElement;
      if (!wrap || wrap.querySelector('.hit-fire.fire-behind')) return;
      const ov = document.createElement('div');
      ov.className = 'hit-fx hit-fire fire-behind';
      ov.innerHTML = fireOverlayHTML();
      wrap.insertBefore(ov, targetEl);
      targetEl.classList.add('is-burning');
    });
  }

  function fxTomato(targetEl) {
    const ov = document.createElement('div');
    ov.className = 'hit-fx hit-tomato';
    ov.innerHTML = `
      <svg class="tomato-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="tomG_${Math.random().toString(36).slice(2,7)}" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ff6b6b"/>
            <stop offset="55%" stop-color="#d1242a"/>
            <stop offset="100%" stop-color="#7a1014"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="55" r="38" fill="#d1242a"/>
        <path d="M50 22 L42 14 L50 18 L58 14 L50 22 Z" fill="#2a7a2a"/>
        <path d="M44 16 L40 12 M50 14 L50 8 M56 16 L60 12" stroke="#2a7a2a" stroke-width="2" stroke-linecap="round" fill="none"/>
        <ellipse cx="38" cy="44" rx="8" ry="5" fill="#ff9c9c" opacity="0.7"/>
      </svg>
      <svg class="tomato-burst" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 50 C70 30, 90 35, 85 50 C95 55, 85 75, 70 70 C75 90, 55 88, 50 75 C45 88, 25 90, 30 70 C15 75, 5 55, 15 50 C10 35, 30 30, 50 50 Z" fill="#c1272d"/>
      </svg>
      <div class="tomato-drip td1"></div>
      <div class="tomato-drip td2"></div>
      <div class="tomato-drip td3"></div>
      <div class="tomato-chunk tc1"></div>
      <div class="tomato-chunk tc2"></div>`;
    targetEl.appendChild(ov);
    setTimeout(() => ov.remove(), 2400);
  }

  function fxClap(targetEl) {
    const ov = document.createElement('div');
    ov.className = 'hit-fx hit-clap';
    ov.innerHTML = `
      <div class="clap-burst"></div>
      <div class="et-spark sp1"></div><div class="et-spark sp2"></div>
      <div class="et-spark sp3"></div><div class="et-spark sp4"></div>
      <div class="et-spark sp5"></div><div class="et-spark sp6"></div>
      <svg class="et-star s-a" viewBox="0 0 24 24"><path d="M12 2 L14.5 9 L22 9.5 L16 14 L18 22 L12 17.5 L6 22 L8 14 L2 9.5 L9.5 9 Z" fill="#ffd700"/></svg>
      <svg class="et-star s-b" viewBox="0 0 24 24"><path d="M12 2 L14.5 9 L22 9.5 L16 14 L18 22 L12 17.5 L6 22 L8 14 L2 9.5 L9.5 9 Z" fill="#8ccd0f"/></svg>
      <svg class="et-star s-c" viewBox="0 0 24 24"><path d="M12 2 L14.5 9 L22 9.5 L16 14 L18 22 L12 17.5 L6 22 L8 14 L2 9.5 L9.5 9 Z" fill="#fff"/></svg>`;
    targetEl.appendChild(ov);
    targetEl.classList.add('is-cheered');
    setTimeout(() => { ov.remove(); targetEl.classList.remove('is-cheered'); }, 1400);
  }

  function fxFallback(targetEl, emoji) {
    const splat = document.createElement('div');
    splat.className = 'emoji-splat';
    splat.textContent = emoji;
    targetEl.appendChild(splat);
    setTimeout(() => splat.remove(), 900);
  }

  const mo = new MutationObserver(() => { scanAvatars(); applyOpenTrayDOM(); reapplyActiveFires(); });

  function init(options = {}) {
    cfg = { ...cfg, ...options };
    scanAvatars();
    applyOpenTrayDOM();
    if (!mo._started) { mo.observe(document.body, { childList: true, subtree: true }); mo._started = true; }
  }
  function refresh() { scanAvatars(); applyOpenTrayDOM(); reapplyActiveFires(); }

  global.EmojiThrow = {
    init,
    refresh,
    send,
    receive,
    closeTray: () => { openTrayPid = null; applyOpenTrayDOM(); }
  };
})(window);