/* flip-clock — prism/ui — vanilla IIFE, one interval per component */
(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;
  root.querySelectorAll(".cmp-flip").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";

    var FLAP_MS = 150;
    var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var cards = [];

    function makeGlyph(parent) {
      var g = document.createElement("span");
      g.className = "cmp-flip__glyph";
      g.textContent = "0";
      parent.appendChild(g);
      return g;
    }

    function makePanel(cardEl, cls) {
      var p = document.createElement("div");
      p.className = cls;
      cardEl.appendChild(p);
      return makeGlyph(p);
    }

    function makeCard() {
      var cardEl = document.createElement("div");
      cardEl.className = "cmp-flip__card";
      var card = {
        el: cardEl,
        top: makePanel(cardEl, "cmp-flip__half cmp-flip__half--top"),
        bottom: makePanel(cardEl, "cmp-flip__half cmp-flip__half--bottom"),
        flapTop: makePanel(cardEl, "cmp-flip__flap cmp-flip__flap--top"),
        flapBottom: makePanel(cardEl, "cmp-flip__flap cmp-flip__flap--bottom"),
        value: null,
        t1: 0,
        t2: 0
      };
      var seam = document.createElement("div");
      seam.className = "cmp-flip__seam";
      cardEl.appendChild(seam);
      return card;
    }

    function settle(card) {
      clearTimeout(card.t1);
      clearTimeout(card.t2);
      card.t1 = 0;
      card.t2 = 0;
      card.el.classList.remove("is-flip-a", "is-flip-b");
      if (card.value !== null) {
        card.top.textContent = card.value;
        card.bottom.textContent = card.value;
      }
    }

    function setDigit(card, digit, animate) {
      if (card.value === digit) return;
      var old = card.value;
      settle(card);
      card.value = digit;

      var reduced = reduceQuery && reduceQuery.matches;
      if (!animate || reduced || document.hidden || old === null) {
        card.top.textContent = digit;
        card.bottom.textContent = digit;
        return;
      }

      /* new top sits under the old top flap; old bottom stays until phase 2 */
      card.top.textContent = digit;
      card.bottom.textContent = old;
      card.flapTop.textContent = old;
      card.flapBottom.textContent = digit;

      /* reflow so a re-triggered flap restarts its animation cleanly */
      void card.el.offsetWidth;
      card.el.classList.add("is-flip-a");

      card.t1 = setTimeout(function () {
        card.bottom.textContent = digit;
        card.el.classList.add("is-flip-b");
      }, FLAP_MS);

      card.t2 = setTimeout(function () {
        settle(card);
      }, FLAP_MS * 2);
    }

    function pad(n) {
      return (n < 10 ? "0" : "") + n;
    }

    function tick(animate) {
      var now = new Date();
      var digits = (pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds())).split("");
      for (var i = 0; i < 6; i++) setDigit(cards[i], digits[i], animate);
    }

    /* build: replace fallback text with six cards + two colons */
    el.textContent = "";
    for (var i = 0; i < 6; i++) {
      var card = makeCard();
      cards.push(card);
      el.appendChild(card.el);
      if (i === 1 || i === 3) {
        var colon = document.createElement("span");
        colon.className = "cmp-flip__colon";
        colon.textContent = ":";
        el.appendChild(colon);
      }
    }

    tick(false);

    /* align the first tick to the next second boundary, then hold 1000ms cadence */
    var delay = 1000 - (Date.now() % 1000);
    el.__flipAlign = setTimeout(function () {
      el.__flipAlign = 0;
      tick(true);
      el.__flipInterval = setInterval(function () {
        tick(true);
      }, 1000);
    }, delay);
  });
})();
