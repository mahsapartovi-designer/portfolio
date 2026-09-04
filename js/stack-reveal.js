/* ===== Hero / About / Works =====
   Sections now sit in plain, normal scroll flow (no fixed/sticky
   stacking, no clip-path staircase), so no scroll-linked JS is
   needed for that anymore. This file only handles blocking scroll
   until the hero's entrance animation has settled. */
(function () {
  /* Block scrolling until the hero's entrance animation (js/main.js)
     has settled, so that animation and any scroll-driven motion can
     never visually overlap. Falls back to a fixed delay if the
     timeline isn't found, so scrolling is never left permanently
     locked. */
  var htmlEl = document.documentElement;
  htmlEl.classList.add("scroll-locked-intro");

  function unlock() {
    htmlEl.classList.remove("scroll-locked-intro");
  }

  if (window.__introTl && typeof window.__introTl.eventCallback === "function") {
    if (window.__introTl.progress() >= 1) {
      unlock();
    } else {
      window.__introTl.eventCallback("onComplete", unlock);
    }
  } else {
    setTimeout(unlock, 2800);
  }
})();
