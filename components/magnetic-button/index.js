/* Magnetic Button — prism/ui
   pointermove -> rAF loop: exponential lerp toward a clamped 8px pull while hovering,
   underdamped spring back to rest on leave. Label drifts at 0.4x the shell offset.
   Reads one rect per frame (before writes); writes transforms + custom props only. */
(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;

  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  root.querySelectorAll(".cmp-magnetic").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";
    if (motionQuery && motionQuery.matches) return;

    var stage = el.querySelector(".cmp-magnetic__stage");
    var button = el.querySelector(".cmp-magnetic__button");
    var label = el.querySelector(".cmp-magnetic__label");
    if (!stage || !button || !label) return;

    var MAX_PULL = 8;          // px, hard cap on magnetic displacement
    var PULL_GAIN = 0.35;      // fraction of cursor distance converted to pull
    var LABEL_RATIO = 0.4;     // parallax: label drift relative to shell
    var FOLLOW_RATE = 14;      // 1/s, exponential smoothing while hovering
    var SHEEN_RATE = 18;       // 1/s, sheen follows slightly tighter
    var SCALE_RATE = 20;       // 1/s, press-scale smoothing
    var SPRING_K = 190;        // stiffness for the release spring
    var SPRING_DAMPING = 13;   // underdamped: one soft overshoot on leave
    var PRESS_SCALE = 0.965;
    var EPSILON = 0.05;

    var hovering = false;
    var pressed = false;
    var suspended = false;
    var pointerX = 0;
    var pointerY = 0;
    var offsetX = 0;
    var offsetY = 0;
    var velocityX = 0;
    var velocityY = 0;
    var sheenX = 0;
    var sheenY = 0;
    var scale = 1;
    var frameId = 0;
    var lastTime = 0;

    function applyTransforms() {
      stage.style.transform =
        "translate3d(" + offsetX.toFixed(2) + "px, " + offsetY.toFixed(2) + "px, 0) scale(" + scale.toFixed(3) + ")";
      label.style.transform =
        "translate3d(" + (offsetX * LABEL_RATIO).toFixed(2) + "px, " + (offsetY * LABEL_RATIO).toFixed(2) + "px, 0)";
      button.style.setProperty("--mx", sheenX.toFixed(1) + "px");
      button.style.setProperty("--my", sheenY.toFixed(1) + "px");
    }

    function rest() {
      hovering = false;
      pressed = false;
      offsetX = 0;
      offsetY = 0;
      velocityX = 0;
      velocityY = 0;
      scale = 1;
      el.classList.remove("is-hover");
      applyTransforms();
    }

    function frame(now) {
      frameId = 0;
      var dt = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.05);
      lastTime = now;

      if (hovering) {
        // Single layout read, before any writes. Subtract the current offset so the
        // pull is measured from the untransformed center (no feedback loop).
        var rect = button.getBoundingClientRect();
        var baseLeft = rect.left - offsetX;
        var baseTop = rect.top - offsetY;
        var dx = pointerX - (baseLeft + rect.width / 2);
        var dy = pointerY - (baseTop + rect.height / 2);
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var pull = Math.min(distance * PULL_GAIN, MAX_PULL);
        var targetX = (dx / distance) * pull;
        var targetY = (dy / distance) * pull;

        var follow = 1 - Math.exp(-FOLLOW_RATE * dt);
        offsetX += (targetX - offsetX) * follow;
        offsetY += (targetY - offsetY) * follow;

        var sheenFollow = 1 - Math.exp(-SHEEN_RATE * dt);
        sheenX += (pointerX - baseLeft - sheenX) * sheenFollow;
        sheenY += (pointerY - baseTop - sheenY) * sheenFollow;
      } else {
        velocityX += (-SPRING_K * offsetX - SPRING_DAMPING * velocityX) * dt;
        velocityY += (-SPRING_K * offsetY - SPRING_DAMPING * velocityY) * dt;
        offsetX += velocityX * dt;
        offsetY += velocityY * dt;
      }

      var scaleTarget = pressed ? PRESS_SCALE : 1;
      scale += (scaleTarget - scale) * (1 - Math.exp(-SCALE_RATE * dt));
      applyTransforms();

      var settled =
        !hovering && !pressed &&
        Math.abs(offsetX) < EPSILON && Math.abs(offsetY) < EPSILON &&
        Math.abs(velocityX) < EPSILON && Math.abs(velocityY) < EPSILON &&
        Math.abs(scale - 1) < 0.002;

      if (settled) {
        rest();
        return;
      }
      frameId = requestAnimationFrame(frame);
    }

    function kick() {
      if (suspended || frameId) return;
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    }

    function onEnter(event) {
      if (suspended) return;
      hovering = true;
      velocityX = 0;
      velocityY = 0;
      pointerX = event.clientX;
      pointerY = event.clientY;
      var rect = button.getBoundingClientRect();
      sheenX = pointerX - (rect.left - offsetX);
      sheenY = pointerY - (rect.top - offsetY);
      el.classList.add("is-hover");
      kick();
    }

    function onMove(event) {
      if (suspended || !hovering) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
    }

    function onLeave() {
      if (suspended) return;
      hovering = false;
      pressed = false;
      el.classList.remove("is-hover");
      kick();
    }

    function onDown() {
      if (suspended) return;
      pressed = true;
      kick();
    }

    function onUp() {
      if (suspended) return;
      pressed = false;
      kick();
    }

    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", onLeave);
    button.addEventListener("pointerdown", onDown);
    button.addEventListener("pointerup", onUp);
    button.addEventListener("pointercancel", onUp);

    if (motionQuery && typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", function (event) {
        if (event.matches) {
          suspended = true;
          if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = 0;
          }
          rest();
        } else {
          suspended = false;
        }
      });
    }
  });
})();
