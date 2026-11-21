(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;
  root.querySelectorAll(".cmp-burst").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";

    var btn = el.querySelector(".cmp-burst__btn");
    var layer = el.querySelector(".cmp-burst__particles");
    if (!btn || !layer) return;

    var COLORS = ["#7c5cff", "#22d3ee", "#f472b6", "#ffc800", "#00da72"];
    var MAX_PARTICLES = 80;
    var MAX_RINGS = 3;
    var PER_BURST = 26;
    var GRAVITY = 900; // px/s^2
    var TAU = Math.PI * 2;

    var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

    var live = [];   // active particle/ring records, in spawn order
    var pool = [];   // recycled record objects; spans are created fresh and removed on death
    var particleCount = 0;
    var ringCount = 0;
    var rafId = 0;
    var last = 0;

    function killAt(i) {
      var p = live[i];
      live.splice(i, 1);
      if (p.ring) ringCount--; else particleCount--;
      if (p.span && p.span.parentNode) p.span.parentNode.removeChild(p.span);
      p.span = null;
      pool.push(p);
    }

    function oldestIndex(wantRing) {
      for (var i = 0; i < live.length; i++) {
        if (live[i].ring === wantRing) return i;
      }
      return -1;
    }

    function spawnParticle() {
      if (particleCount >= MAX_PARTICLES) {
        var old = oldestIndex(false);
        if (old >= 0) killAt(old); else return;
      }
      var p = pool.pop() || {};
      var span = document.createElement("span");
      span.className = "cmp-burst__particle";
      var size = 3 + Math.random() * 3; // 3–6px
      var circle = Math.random() < 0.4;
      span.style.width = size.toFixed(1) + "px";
      span.style.height = (circle ? size : size * 0.62).toFixed(1) + "px";
      span.style.background = COLORS[(Math.random() * COLORS.length) | 0];
      span.style.borderRadius = circle ? "50%" : "1px";
      span.style.opacity = "1";
      span.style.transform = "translate(-50%,-50%)";

      var angle = Math.random() * TAU;
      var speed = 170 + Math.random() * 260;
      p.span = span;
      p.ring = false;
      p.x = 0;
      p.y = 0;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 130; // slight upward bias
      p.rot = Math.random() * 360;
      p.spin = (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 480);
      p.t = 0;
      p.life = 0.7 + Math.random() * 0.3; // 700–1000ms
      layer.appendChild(span);
      live.push(p);
      particleCount++;
    }

    function spawnRing() {
      if (ringCount >= MAX_RINGS) {
        var old = oldestIndex(true);
        if (old >= 0) killAt(old); else return;
      }
      var r = pool.pop() || {};
      var span = document.createElement("span");
      span.className = "cmp-burst__ring";
      span.style.opacity = "0.75";
      span.style.transform = "translate(-50%,-50%) scale(0.35)";
      r.span = span;
      r.ring = true;
      r.t = 0;
      r.life = 0.5;
      layer.appendChild(span);
      live.push(r);
      ringCount++;
    }

    function tick(now) {
      if (mq.matches) { // motion preference flipped mid-flight: clear everything
        while (live.length) killAt(live.length - 1);
        rafId = 0;
        last = 0;
        return;
      }
      var dt = last ? Math.min((now - last) / 1000, 0.034) : 0.016;
      last = now;
      for (var i = live.length - 1; i >= 0; i--) {
        var p = live[i];
        p.t += dt;
        var k = p.t / p.life;
        if (k >= 1) {
          killAt(i);
          continue;
        }
        if (p.ring) {
          var ease = 1 - Math.pow(1 - k, 3);
          p.span.style.transform = "translate(-50%,-50%) scale(" + (0.35 + 2.55 * ease).toFixed(3) + ")";
          p.span.style.opacity = (0.75 * (1 - k)).toFixed(3);
        } else {
          p.vy += GRAVITY * dt;
          p.vx *= Math.exp(-0.9 * dt); // mild air drag on the horizontal axis
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          var o = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
          p.span.style.transform = "translate(-50%,-50%) translate3d(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px,0) rotate(" + p.rot.toFixed(1) + "deg)";
          p.span.style.opacity = o.toFixed(3);
        }
      }
      if (live.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
        last = 0;
      }
    }

    function start() {
      if (!rafId) {
        last = 0;
        rafId = requestAnimationFrame(tick);
      }
    }

    btn.addEventListener("animationend", function () {
      btn.classList.remove("is-punching");
    });

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      btn.classList.remove("is-punching");
      void btn.offsetWidth; // restart the punch animation on rapid clicks
      btn.classList.add("is-punching");
      if (mq.matches) return; // reduced motion: opacity pulse only, no burst
      spawnRing();
      for (var i = 0; i < PER_BURST; i++) spawnParticle();
      start();
    });
  });
})();
