(function () {
  "use strict";

  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;

  var HOLD_MS = 1200;
  var DELETE_MS = 320;
  var RESET_MS = 2000;
  var SHAKE_AT = 0.3;

  root.querySelectorAll(".cmp-hold").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";

    var btn = el.querySelector(".cmp-hold__btn");
    var fill = el.querySelector(".cmp-hold__fill");
    var label = el.querySelector(".cmp-hold__label");
    if (!btn || !fill || !label) return;

    var state = "idle"; // idle -> holding -> done -> idle
    var rafId = 0;
    var startTime = 0;
    var progress = 0;
    var deleteTimer = 0;
    var resetTimer = 0;

    function setProgress(p) {
      progress = p;
      btn.style.setProperty("--hold-progress", String(p));
    }

    function setLabel(text) {
      if (label.textContent !== text) label.textContent = text;
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function clearTimers() {
      if (deleteTimer) { clearTimeout(deleteTimer); deleteTimer = 0; }
      if (resetTimer) { clearTimeout(resetTimer); resetTimer = 0; }
    }

    function finish() {
      stopLoop();
      setProgress(1);
      btn.classList.remove("is-shake");
      btn.classList.add("is-swapping");
      setLabel("Deleting…");
      state = "done";

      deleteTimer = setTimeout(function () {
        deleteTimer = 0;
        btn.classList.remove("is-holding", "is-swapping");
        btn.classList.add("is-done");
        setLabel("Deleted ✓");
        btn.setAttribute("aria-disabled", "true");

        resetTimer = setTimeout(function () {
          resetTimer = 0;
          btn.classList.remove("is-done");
          btn.removeAttribute("aria-disabled");
          setProgress(0);
          setLabel("Hold to delete");
          state = "idle";
        }, RESET_MS);
      }, DELETE_MS);
    }

    function tick() {
      rafId = 0;
      if (state !== "holding") return;
      var p = (performance.now() - startTime) / HOLD_MS;
      if (p >= 1) {
        finish();
        return;
      }
      setProgress(p);
      rafId = requestAnimationFrame(tick);
    }

    function startHold() {
      if (state !== "idle") return;
      clearTimers();
      state = "holding";
      startTime = performance.now();
      btn.classList.remove("is-shake", "is-swapping");
      btn.classList.add("is-holding");
      setProgress(0);
      rafId = requestAnimationFrame(tick);
    }

    function cancelHold() {
      if (state !== "holding") return;
      var held = progress;
      stopLoop();
      state = "idle";
      btn.classList.remove("is-holding");
      setProgress(0);
      setLabel("Hold to delete");
      if (held > SHAKE_AT) {
        btn.classList.remove("is-shake");
        // restart the shake animation even on rapid re-releases
        void btn.offsetWidth;
        btn.classList.add("is-shake");
      }
    }

    btn.addEventListener("animationend", function (e) {
      if (e.animationName === "holdShake") btn.classList.remove("is-shake");
      if (e.animationName === "holdLabelIn") btn.classList.remove("is-swapping");
    });

    btn.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      btn.focus({ preventScroll: true });
      startHold();
    });

    btn.addEventListener("pointerup", function (e) {
      e.stopPropagation();
      cancelHold();
    });

    btn.addEventListener("pointerleave", function (e) {
      e.stopPropagation();
      cancelHold();
    });

    btn.addEventListener("pointercancel", function (e) {
      e.stopPropagation();
      cancelHold();
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key !== " " && e.key !== "Enter" && e.key !== "Spacebar") return;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      startHold();
    });

    btn.addEventListener("keyup", function (e) {
      if (e.key !== " " && e.key !== "Enter" && e.key !== "Spacebar") return;
      e.preventDefault();
      e.stopPropagation();
      cancelHold();
    });

    btn.addEventListener("blur", function () {
      cancelHold();
    });

    btn.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });

    btn.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });
})();
