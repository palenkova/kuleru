/* ============================================================
   Kuleru: BEYOND THE GATES — interactions
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     0. Year
     --------------------------------------------------------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     1. Reveal on scroll
     --------------------------------------------------------- */
  (function reveal() {
    var items = $$(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, idx) {
        if (en.isIntersecting) {
          var t = en.target;
          window.setTimeout(function () { t.classList.add("in"); }, Math.min(idx * 70, 240));
          io.unobserve(t);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (i) { io.observe(i); });
  })();

  /* ---------------------------------------------------------
     3. Nav: scrolled state + mobile menu
     --------------------------------------------------------- */
  (function nav() {
    var nav = $("#nav");
    var toggle = $("#navToggle");
    var menu = $("#mobileMenu");
    if (!nav) return;

    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && menu) {
      var close = function () {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        nav.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      };
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("open");
        toggle.classList.toggle("open", open);
        nav.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      $$("a", menu).forEach(function (a) { a.addEventListener("click", close); });
    }
  })();

  /* ---------------------------------------------------------
     4. Parallax (hero / story / download backgrounds)
     --------------------------------------------------------- */
  (function parallax() {
    if (reduced) return;
    var fine = window.matchMedia("(min-width: 880px)").matches;
    if (!fine) return;
    var layers = $$("[data-parallax]");
    if (!layers.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      layers.forEach(function (layer) {
        var rect = layer.parentElement.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var speed = parseFloat(layer.getAttribute("data-parallax")) || 0.1;
        var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        layer.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  })();

  /* ---------------------------------------------------------
     5. Ambient particles (petals + embers)
     --------------------------------------------------------- */
  (function ambient() {
    var canvas = $("#ambient");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    var running = true, raf = null;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(Math.min(54, (W * H) / 26000));
      build(target);
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function build(n) {
      parts = [];
      for (var i = 0; i < n; i++) parts.push(make(Math.random() < 0.4));
    }
    function make(ember) {
      if (ember) {
        return { e: true, x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2.2),
          vy: rnd(-0.5, -1.4), vx: rnd(-0.25, 0.25), a: rnd(0.2, 0.7), tw: rnd(0.01, 0.05), p: Math.random() * 6 };
      }
      return { e: false, x: rnd(0, W), y: rnd(-H, H), r: rnd(4, 9),
        vy: rnd(0.5, 1.3), vx: rnd(-0.4, 0.4), a: rnd(0.25, 0.6),
        rot: Math.random() * Math.PI, vr: rnd(-0.02, 0.02), sw: rnd(0.5, 1.4), p: Math.random() * 6.28 };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.e) {
          p.p += p.tw; p.y += p.vy; p.x += p.vx + Math.sin(p.p) * 0.2;
          var fl = p.a * (0.6 + 0.4 * Math.sin(p.p * 3));
          ctx.beginPath();
          ctx.fillStyle = "rgba(224,112,58," + fl.toFixed(3) + ")";
          ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          if (p.y < -10) { p.y = H + 10; p.x = rnd(0, W); }
        } else {
          p.p += 0.02; p.y += p.vy; p.x += p.vx + Math.sin(p.p) * p.sw; p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = "rgba(232,210,180," + p.a.toFixed(3) + ")";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.2832);
          ctx.fill();
          ctx.restore();
          if (p.y > H + 14) { p.y = -14; p.x = rnd(0, W); }
          if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        }
      }
      if (running) raf = window.requestAnimationFrame(draw);
    }
    function start() { if (!running) { running = true; raf = window.requestAnimationFrame(draw); } }
    function stop() { running = false; if (raf) window.cancelAnimationFrame(raf); }

    if (reduced) {
      resize();
      // static sparse scatter, single frame
      running = false; draw();
      return;
    }
    resize();
    window.addEventListener("resize", debounce(resize, 200));
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
    raf = window.requestAnimationFrame(draw);
  })();

  /* ---------------------------------------------------------
     7. Gate of Worlds — before/after slider
     --------------------------------------------------------- */
  (function gateOfWorlds() {
    var stage = $("#beforeAfter");
    var before = $("#baBefore");
    var handle = $("#baHandle");
    if (!stage || !before || !handle) return;

    var pct = 50;
    function set(p) {
      pct = Math.max(0, Math.min(100, p));
      before.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      handle.style.left = pct + "%";
      handle.setAttribute("aria-valuenow", Math.round(pct));
    }
    function fromX(clientX) {
      var r = stage.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
    }
    var dragging = false;
    function down(e) {
      dragging = true;
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      fromX(cx);
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      fromX(cx);
    }
    function up() { dragging = false; }

    handle.addEventListener("mousedown", down);
    stage.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseup", up);
    handle.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);

    handle.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { set(pct - 4); e.preventDefault(); }
      else if (e.key === "ArrowRight") { set(pct + 4); e.preventDefault(); }
      else if (e.key === "Home") { set(0); e.preventDefault(); }
      else if (e.key === "End") { set(100); e.preventDefault(); }
    });

    set(reduced ? 60 : 50);
  })();

  /* ---------------------------------------------------------
     8. FAQ accordion (smooth height on native <details>)
     --------------------------------------------------------- */
  (function faq() {
    var items = $$(".qa");
    items.forEach(function (d) {
      var body = $(".qa__body", d);
      if (!body) return;
      var summary = $("summary", d);

      function expand() {
        body.style.height = "0px";
        var h = body.scrollHeight;
        // force reflow then animate
        window.requestAnimationFrame(function () { body.style.height = h + "px"; });
        body.addEventListener("transitionend", function te() {
          body.style.height = "auto"; body.removeEventListener("transitionend", te);
        });
      }
      function collapse() {
        var h = body.scrollHeight;
        body.style.height = h + "px";
        window.requestAnimationFrame(function () { body.style.height = "0px"; });
      }

      if (reduced) return; // native instant behaviour

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (d.open) {
          collapse();
          body.addEventListener("transitionend", function te() {
            d.open = false; body.style.height = ""; body.removeEventListener("transitionend", te);
          });
        } else {
          // optional: close siblings for a clean accordion
          items.forEach(function (o) {
            if (o !== d && o.open) {
              var ob = $(".qa__body", o);
              var oh = ob.scrollHeight; ob.style.height = oh + "px";
              window.requestAnimationFrame(function () { ob.style.height = "0px"; });
              ob.addEventListener("transitionend", function te() {
                o.open = false; ob.style.height = ""; ob.removeEventListener("transitionend", te);
              });
            }
          });
          d.open = true;
          expand();
        }
      });
    });
  })();

  /* ---------------------------------------------------------
     9. System-requirements tabs
     --------------------------------------------------------- */
  (function sysreq() {
    var tabs = $$(".sysreq__tab");
    var panels = $$(".sysreq__panel");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var os = tab.getAttribute("data-os");
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach(function (p) {
          p.classList.toggle("is-hidden", p.getAttribute("data-os") !== os);
        });
      });
    });
  })();

  /* ---------------------------------------------------------
     10. Lightbox
     --------------------------------------------------------- */
  (function lightbox() {
    var lb = $("#lightbox");
    var img = $("#lbImg");
    var cap = $("#lbCap");
    var count = $("#lbCount");
    var btnClose = $("#lbClose");
    var btnPrev = $("#lbPrev");
    var btnNext = $("#lbNext");
    var shots = $$(".shot");
    if (!lb || !shots.length) return;

    var index = 0;
    var lastFocus = null;
    var data = shots.map(function (s) {
      return { full: s.getAttribute("data-full"), cap: s.getAttribute("data-cap"),
        alt: (s.querySelector("img") || {}).alt || "" };
    });

    function render() {
      var d = data[index];
      img.src = d.full; img.alt = d.alt;
      cap.textContent = d.cap;
      count.textContent = ("0" + (index + 1)).slice(-2) + " / " + ("0" + data.length).slice(-2);
    }
    function open(i) {
      index = i; lastFocus = document.activeElement;
      lb.hidden = false; render();
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(function () { lb.classList.add("show"); });
      btnClose.focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      lb.classList.remove("show");
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.setTimeout(function () {
        lb.hidden = true; img.src = "";
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }, 280);
    }
    function go(step) { index = (index + step + data.length) % data.length; render(); }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {
        // simple focus trap among the dialog buttons
        var f = [btnPrev, btnNext, btnClose];
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey) { (f[(i - 1 + f.length) % f.length] || btnClose).focus(); }
        else { (f[(i + 1) % f.length] || btnClose).focus(); }
        e.preventDefault();
      }
    }

    shots.forEach(function (s, i) { s.addEventListener("click", function () { open(i); }); });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { go(-1); });
    btnNext.addEventListener("click", function () { go(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });

    // swipe
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  /* ---------------------------------------------------------
     12. YouTube trailer facade (lazy-load the player on click)
     --------------------------------------------------------- */
  (function trailerEmbed() {
    var facade = $("#trailerVideo");
    if (!facade) return;
    facade.addEventListener("click", function () {
      var id = facade.getAttribute("data-video");
      if (!id) return;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1";
      iframe.title = "Kuleru trailer";
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      var wrap = facade.parentNode;
      if (wrap) wrap.replaceChild(iframe, facade);
    });
  })();

  /* ---------------------------------------------------------
     util
     --------------------------------------------------------- */
  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
})();