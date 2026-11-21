// From Uiverse.io by marcelodolza — improved: class-driven state instead of :focus.
// Click sends (plane takes off, Sent appears), auto-resets after 2.6s.
(function () {
  var root = document.currentScript.closest("[data-component]") || document;
  root.querySelectorAll(".cmp-send .send-button").forEach(function (btn) {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (btn.classList.contains("is-sent")) return;
      btn.classList.add("is-sent");
      setTimeout(function () { btn.classList.remove("is-sent"); }, 2600);
    });
  });
})();
