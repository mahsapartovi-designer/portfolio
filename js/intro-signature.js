(function () {
  // This is a one-time page-load entrance animation that always plays
  // relative to the hero section at the top of the page. If the browser
  // restores a mid-page scroll position on reload, the position math below
  // (which mixes getBoundingClientRect() + window.scrollY) would be computed
  // against the wrong scroll offset and the signature line would land in
  // the wrong spot. Forcing scroll-to-top up front (already done even
  // earlier, inline in <head>) keeps it locked above "Mahsa Partovi" in
  // the hero section every time, regardless of reload.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // Safety net: some browsers (notably Safari/iOS) restore scroll position
  // late — on the "load" event, or when the page is served from the
  // back-forward cache on "pageshow" — which can happen after everything
  // above already ran. Re-pin to the top whenever that happens too.
  window.addEventListener("load", function () {
    window.scrollTo(0, 0);
  });
  window.addEventListener("pageshow", function () {
    window.scrollTo(0, 0);
  });

  var path = document.getElementById("mSignaturePath");
  var overlay = document.getElementById("introOverlay");
  var logo = document.getElementById("introLogo");
  var title = document.querySelector(".info__title");
  var tools = document.getElementById("infoTools");
  var heroSection = document.getElementById("info");

  // Hands off to js/main.js's hero content chain (title -> right label ->
  // left label -> tool badges). Flagged as well as dispatched: this can
  // fire synchronously below, before main.js's ready callback has even
  // registered its listener, so a plain event alone would be missed.
  function fireHeroSignatureDone() {
    if (window.__heroSignatureDone) return;
    window.__heroSignatureDone = true;
    document.dispatchEvent(new CustomEvent("heroSignatureDone"));
  }

  function revealInstantly() {
    if (overlay) {
      overlay.style.transition = "none";
      overlay.style.opacity = "0";
      overlay.style.display = "none";
    }
    if (logo) {
      logo.style.transform = "none";
    }
    document.body.style.overflow = "";
    fireHeroSignatureDone();
  }

  // Places the logo's resting spot near the top of the hero (#info)
  // section, horizontally centered on the section, with a small gap from
  // the section's top edge -- and it just stays there (this is a one-time
  // placement, not something that re-centers on the title). Falls back to
  // a top-right default if the section isn't found (e.g. markup changes
  // later).
  var SECTION_TOP_GAP = 40;
  var SECTION_TOP_GAP_MOBILE = 20;
  function positionLogo() {
    if (!logo) return;
    var cs = getComputedStyle(logo);
    var w = parseFloat(cs.width);
    var h = parseFloat(cs.height);
    if (!w || !h) {
      var lr = logo.getBoundingClientRect();
      w = w || lr.width;
      h = h || lr.height;
    }

    if (heroSection) {
      var rect = heroSection.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var isMobile = window.innerWidth <= 767;
      var topGap = isMobile ? SECTION_TOP_GAP_MOBILE : SECTION_TOP_GAP;
      var topY = rect.top + topGap;
      logo.style.left = Math.round(centerX - w / 2 + window.scrollX) + "px";
      logo.style.top = Math.round(topY + window.scrollY) + "px";
    } else {
      logo.style.left =
        Math.round(window.innerWidth - w - 40 + window.scrollX) + "px";
      logo.style.top = Math.round(26 + window.scrollY) + "px";
    }
  }

  // Rests the tool badges row directly below the title, the same way
  // positionLogo() rests the signature above it -- read from the title's
  // real rendered position rather than a guessed fixed offset, so it
  // still lines up after font swap / resize / orientation change.
  var TOOLS_GAP = 34;
  var TOOLS_GAP_MOBILE = 46;
  function positionTools() {
    if (!tools || !title) return;
    var rect = title.getBoundingClientRect();
    var isMobile = window.innerWidth <= 767;
    var gap = isMobile ? TOOLS_GAP_MOBILE : TOOLS_GAP;
    tools.style.top = Math.round(rect.bottom + gap + window.scrollY) + "px";
  }

  if (!path || !overlay || !logo || typeof gsap === "undefined") {
    positionLogo();
    positionTools();
    revealInstantly();
    return;
  }

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    positionLogo();
    positionTools();
    revealInstantly();
    return;
  }

  positionLogo();
  positionTools();

  // Keep it aligned with the title on resize / orientation change.
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      positionLogo();
      positionTools();
    }, 120);
  });

  // Re-check once the custom font finishes loading, since that can
  // reflow the title text after the first paint.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      positionLogo();
      positionTools();
    }).catch(function () {});
  }

  // Safety net in case something goes wrong with the timeline.
  var safety = setTimeout(revealInstantly, 4500);

  var length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;

  document.body.style.overflow = "hidden";

  // Start big and centered in the viewport, drawn on top of the
  // full-screen overlay, then animate to the resting spot computed above.
  var restRect = logo.getBoundingClientRect();
  var restCenterX = restRect.left + restRect.width / 2;
  var restCenterY = restRect.top + restRect.height / 2;
  var deltaX = window.innerWidth / 2 - restCenterX;
  var deltaY = window.innerHeight / 2 - restCenterY;

  // Scale the draw-in relative to the viewport instead of a fixed 6.5x.
  // That fixed multiplier was tuned against the desktop logo's 130px base
  // width; against mobile's smaller 92px base it drew the signature far
  // wider than the phone's own screen, running off both edges.
  var maxDrawWidth = Math.min(window.innerWidth * 0.78, 860);
  var drawScale = maxDrawWidth / restRect.width;
  drawScale = Math.max(2.2, Math.min(drawScale, 7));

  gsap.set(logo, {
    scale: drawScale,
    x: deltaX,
    y: deltaY
  });

  var tl = gsap.timeline({
    onComplete: function () {
      clearTimeout(safety);
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  tl.to(path, {
    strokeDashoffset: 0,
    duration: 1.9,
    ease: "sine.inOut"
  })
    .to(
      logo,
      {
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.9,
        ease: "power3.inOut"
      },
      "-=0.15"
    )
    // The signature has drawn in and settled -- hand off to js/main.js's
    // hero content chain (title -> right label -> left label -> tool
    // badges) right here, overlapping with the overlay fade below rather
    // than waiting for it, so there's no dead gap between the two.
    .call(fireHeroSignatureDone)
    .to(
      overlay,
      {
        opacity: 0,
        duration: 0.7,
        ease: "power1.out"
      },
      "-=0.6"
    );
})();
