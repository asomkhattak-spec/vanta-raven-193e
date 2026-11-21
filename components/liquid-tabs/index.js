(function () {
  var root = document.currentScript
    ? document.currentScript.closest("[data-component]")
    : document;
  if (!root) root = document;

  root.querySelectorAll(".cmp-tabs").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";

    var track = el.querySelector(".cmp-tabs__track");
    var pill = el.querySelector(".cmp-tabs__pill");
    if (!track || !pill) return;

    var tabs = Array.prototype.slice.call(
      track.querySelectorAll('[role="tab"]')
    );
    if (!tabs.length) return;

    var motionQuery = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    var resizeFrame = 0;

    function activeTab() {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].getAttribute("aria-selected") === "true") return tabs[i];
      }
      return tabs[0];
    }

    // One measurement per activation: offsetLeft/offsetWidth relative to the
    // positioned track, written as transform + width. Never measured per frame.
    function place(tab, animate) {
      if (!tab) return;
      var instant = !animate || (motionQuery && motionQuery.matches);
      if (instant) pill.classList.add("cmp-tabs__pill--instant");
      pill.style.transform = "translateX(" + tab.offsetLeft + "px)";
      pill.style.width = tab.offsetWidth + "px";
      if (instant) {
        void pill.offsetWidth; // flush the jump before transitions re-arm
        pill.classList.remove("cmp-tabs__pill--instant");
      }
    }

    function activate(tab, moveFocus) {
      if (!tab) return;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle("is-active", on);
      });
      place(tab, true);
      if (moveFocus) tab.focus();
    }

    track.addEventListener("click", function (event) {
      var target = event.target;
      var tab =
        target && target.closest ? target.closest('[role="tab"]') : null;
      if (tab && track.contains(tab)) activate(tab, false);
    });

    track.addEventListener("keydown", function (event) {
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      var next = null;
      if (event.key === "ArrowLeft") {
        next = tabs[(index - 1 + tabs.length) % tabs.length];
      } else if (event.key === "ArrowRight") {
        next = tabs[(index + 1) % tabs.length];
      } else if (event.key === "Home") {
        next = tabs[0];
      } else if (event.key === "End") {
        next = tabs[tabs.length - 1];
      } else {
        return;
      }
      event.preventDefault();
      activate(next, true);
    });

    function reposition() {
      resizeFrame = 0;
      place(activeTab(), false);
    }

    function scheduleReposition() {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(reposition);
    }

    // Initial placement is instant; transitions arm only afterwards.
    place(activeTab(), false);
    el.classList.add("is-ready");

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(scheduleReposition).observe(track);
    }
    window.addEventListener("resize", scheduleReposition);
  });
})();