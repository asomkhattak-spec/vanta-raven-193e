(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;
  root.querySelectorAll(".cmp-search").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";

    var trigger = el.querySelector(".cmp-search__trigger");
    var input = el.querySelector(".cmp-search__input");
    var clear = el.querySelector(".cmp-search__clear");
    if (!trigger || !input) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var focusTimer = null;

    function isOpen() {
      return el.classList.contains("is-open");
    }

    function syncValue() {
      el.classList.toggle("has-value", input.value.length > 0);
    }

    function open() {
      if (isOpen()) return;
      el.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      syncValue();
      if (focusTimer) clearTimeout(focusTimer);
      // Focus after the width morph settles so the caret lands in place.
      focusTimer = setTimeout(function () {
        focusTimer = null;
        if (isOpen()) input.focus();
      }, reduceMotion ? 0 : 250);
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      if (focusTimer) {
        clearTimeout(focusTimer);
        focusTimer = null;
      }
      el.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      if (returnFocus) trigger.focus();
    }

    // Keep host cards from reacting to interaction inside the component.
    el.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    trigger.addEventListener("click", function () {
      if (isOpen()) {
        input.focus();
      } else {
        open();
      }
    });

    input.addEventListener("input", syncValue);

    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        syncValue();
        input.focus();
      });
    }

    el.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) {
        e.stopPropagation();
        e.preventDefault();
        close(true);
      }
    });

    // Collapse on blur only when the field is empty and focus left the component.
    el.addEventListener("focusout", function (e) {
      if (!isOpen()) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      requestAnimationFrame(function () {
        if (!isOpen()) return;
        if (el.contains(document.activeElement)) return;
        if (input.value === "") close(false);
      });
    });

    syncValue();
  });
})();
