/* Elastic Slider — prism/ui
   Syncs the native range input to the visual fill/thumb/bubble via --val. */
(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;

  function wire(el) {
    if (!el || !el.dataset || el.dataset.wired) return;
    el.dataset.wired = "1";

    var input = el.querySelector(".cmp-slider__input");
    if (!input) return;
    var bubble = el.querySelector(".cmp-slider__bubble");

    function sync() {
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      var val = parseFloat(input.value);
      if (!isFinite(min)) min = 0;
      if (!isFinite(max)) max = 100;
      if (!isFinite(val)) val = min;
      var span = max - min;
      var t = span > 0 ? (val - min) / span : 0;
      t = Math.max(0, Math.min(1, t));
      el.style.setProperty("--val", t.toFixed(4));
      if (bubble) bubble.textContent = String(Math.round(val));
    }

    function engage() { el.classList.add("is-dragging"); }
    function release() { el.classList.remove("is-dragging"); }
    function down(e) {
      if (e && typeof e.stopPropagation === "function") e.stopPropagation();
      engage();
    }

    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    input.addEventListener("focus", engage);
    input.addEventListener("blur", release);
    input.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown" ||
          k === "Home" || k === "End" || k === "PageUp" || k === "PageDown") {
        engage();
      }
    });

    if (window.PointerEvent) {
      input.addEventListener("pointerdown", down);
      input.addEventListener("pointerup", release);
      input.addEventListener("pointercancel", release);
      window.addEventListener("pointerup", release);
    } else {
      input.addEventListener("mousedown", down);
      input.addEventListener("touchstart", down, { passive: true });
      window.addEventListener("mouseup", release);
      window.addEventListener("touchend", release);
    }
    window.addEventListener("blur", release);

    sync();
  }

  root.querySelectorAll(".cmp-slider").forEach(function (el) { wire(el); });
  if (root.classList && root.classList.contains("cmp-slider")) wire(root);
})();