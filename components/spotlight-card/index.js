(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  root.querySelectorAll(".cmp-spotlight").forEach(function (el) {
    if (!el || el.dataset.wired) return;
    el.dataset.wired = "1";

    var rafId = 0;
    var px = 0;
    var py = 0;

    function paint() {
      rafId = 0;
      var rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      el.style.setProperty("--mx", (px - rect.left) + "px");
      el.style.setProperty("--my", (py - rect.top) + "px");
    }

    function onMove(e) {
      if (!e) return;
      px = e.clientX;
      py = e.clientY;
      if (!rafId) rafId = window.requestAnimationFrame(paint);
    }

    function onEnter(e) {
      el.classList.add("is-lit");
      onMove(e);
    }

    function onLeave() {
      el.classList.remove("is-lit");
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);
  });
})();
