(function () {
  var root = document.currentScript ? document.currentScript.closest("[data-component]") : document;
  if (!root) root = document;
  root.querySelectorAll(".cmp-term").forEach(function (el) {
    if (el.dataset.wired) return;
    el.dataset.wired = "1";

    var body = el.querySelector(".cmp-term__body");
    if (!body) return;

    var COMMAND = "npx prism-ui add tilt-card";
    var OUTPUT = [
      "Resolved registry (no auth needed)",
      "Added tilt-card \u2192 components/"
    ];

    var reduced = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };

    var timer = null; // single stored handle: at most one pending step
    var parked = null; // step held while the tab is hidden
    var cursor = null;
    var disposed = false;

    function span(cls, text) {
      var s = document.createElement("span");
      s.className = "cmp-term__" + cls;
      s.textContent = text;
      return s;
    }

    function makeCursor() {
      var c = document.createElement("span");
      c.className = "cmp-term__cursor";
      return c;
    }

    function clearBody() {
      while (body.firstChild) body.removeChild(body.firstChild);
    }

    // Pause-aware scheduler: one outstanding timeout. While the tab is
    // hidden the step is parked (no polling) and resumed on visibilitychange.
    function schedule(fn, delay) {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      parked = null;
      var due = Date.now() + delay;
      function tick() {
        timer = null;
        if (disposed) return;
        if (document.hidden) {
          parked = { fn: fn, delay: Math.max(0, due - Date.now()) };
          return;
        }
        fn();
      }
      timer = setTimeout(tick, delay);
    }

    function renderStatic() {
      clearBody();
      var cmd = document.createElement("span");
      cmd.className = "cmp-term__line";
      cmd.appendChild(span("prompt", "$ "));
      cmd.appendChild(span("cmd", COMMAND));
      cmd.appendChild(makeCursor());
      body.appendChild(cmd);
      OUTPUT.forEach(function (text) {
        var line = document.createElement("span");
        line.className = "cmp-term__line";
        line.appendChild(span("check", "\u2714 "));
        line.appendChild(span("out", text));
        body.appendChild(line);
      });
    }

    function runSession() {
      if (disposed) return;
      clearBody();

      var line = document.createElement("span");
      line.className = "cmp-term__line";
      line.appendChild(span("prompt", "$ "));
      var cmdText = span("cmd", "");
      line.appendChild(cmdText);
      cursor = makeCursor();
      line.appendChild(cursor);
      body.appendChild(line);

      var i = 0;

      // Human cadence: 24ms base + jitter; word boundaries and the
      // subcommand get hesitation beats, like a real typist.
      function typeDelay() {
        var ch = COMMAND.charAt(i - 1);
        var d = 24 + Math.random() * 38; // 24-62ms
        if (ch === " ") d += 60 + Math.random() * 120;
        if (Math.random() < 0.06) d += 140 + Math.random() * 160; // occasional think-pause
        return d;
      }

      function typeStep() {
        if (i < COMMAND.length) {
          i += 1;
          cmdText.textContent = COMMAND.slice(0, i);
          schedule(typeStep, typeDelay());
        } else {
          // Enter pressed: cursor drops to a fresh line while the CLI "runs".
          schedule(function () {
            var wait = document.createElement("span");
            wait.className = "cmp-term__line";
            wait.appendChild(cursor);
            body.appendChild(wait);
            schedule(function () { printOutput(0, wait); }, 420 + Math.random() * 260);
          }, 180 + Math.random() * 140);
        }
      }

      function printOutput(n, waitLine) {
        if (n >= OUTPUT.length) {
          // Session done: hold 3s, wipe, retype.
          schedule(runSession, 3000);
          return;
        }
        if (waitLine.parentNode) body.removeChild(waitLine);
        var out = document.createElement("span");
        out.className = "cmp-term__line";
        out.appendChild(span("check", "\u2714 "));
        out.appendChild(span("out", OUTPUT[n]));
        body.appendChild(out);
        if (n + 1 < OUTPUT.length) {
          schedule(function () { printOutput(n + 1, waitLine); }, 380 + Math.random() * 300);
        } else {
          var last = document.createElement("span");
          last.className = "cmp-term__line";
          last.appendChild(span("prompt", "$ "));
          last.appendChild(cursor);
          body.appendChild(last);
          schedule(runSession, 3000);
        }
      }

      schedule(typeStep, 600 + Math.random() * 400);
    }

    function onVisibility() {
      if (!document.hidden && parked && !reduced.matches) {
        var p = parked;
        parked = null;
        schedule(p.fn, p.delay);
      }
    }

    if (reduced.matches) {
      renderStatic();
    } else {
      runSession();
      document.addEventListener("visibilitychange", onVisibility);
    }

    // Respond if the user flips the OS setting mid-session.
    if (typeof reduced.addEventListener === "function") {
      reduced.addEventListener("change", function () {
        if (timer !== null) { clearTimeout(timer); timer = null; }
        parked = null;
        if (reduced.matches) {
          renderStatic();
        } else {
          runSession();
        }
      });
    }
  });
})();
