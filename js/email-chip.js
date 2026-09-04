(function () {
  var trigger = document.getElementById("emailIconTrigger");
  if (!trigger) return;

  var EMAIL_USER = "partovimahsa";
  var EMAIL_DOMAIN = "yahoo.com";
  var MARGIN = 10; // minimum gap kept between the chip and the viewport edge
  var GAP = 12; // gap between the icon and the chip

  // Build the chip once and attach it directly to <body>. Being a
  // top-level body child (not a descendant of .contactBox), it is never
  // clipped by .contactBox's overflow:hidden, and position:fixed keeps
  // it anchored to the viewport rather than to any scrolling container.
  var chip = document.createElement("div");
  chip.className = "emailChip";
  chip.setAttribute("aria-hidden", "true");

  var atSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'width="100%" height="100%"><circle cx="12" cy="12" r="4"></circle>' +
    '<path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path></svg>';

  chip.innerHTML =
    "<span>" + EMAIL_USER + "</span>" +
    '<span class="emailChip__at">' + atSvg + "</span>" +
    "<span>" + EMAIL_DOMAIN + "</span>";

  document.body.appendChild(chip);

  var visible = false;

  function position() {
    var r = trigger.getBoundingClientRect();
    var chipRect = chip.getBoundingClientRect();
    var centerX = r.left + r.width / 2;

    // Prefer sitting just above the icon; flip below if there isn't
    // enough room above (e.g. the icon is near the top of the screen).
    var top = r.top - GAP - chipRect.height;
    if (top < MARGIN) {
      top = r.bottom + GAP;
    }
    // Never let it run past the bottom edge either.
    top = Math.min(top, window.innerHeight - chipRect.height - MARGIN);

    var left = centerX - chipRect.width / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - chipRect.width - MARGIN));

    chip.style.transform = "translate(" + Math.round(left) + "px, " + Math.round(top) + "px)";
  }

  function show() {
    visible = true;
    chip.classList.add("is-visible");
    // Position after becoming part of the visible layout so its measured
    // size (chipRect) is accurate; opacity doesn't affect layout, so this
    // is safe to do immediately, with no flash of incorrect placement.
    position();
  }

  function hide() {
    visible = false;
    chip.classList.remove("is-visible");
  }

  trigger.addEventListener("mouseenter", show);
  trigger.addEventListener("mouseleave", hide);
  trigger.addEventListener("focus", show);
  trigger.addEventListener("blur", hide);

  window.addEventListener(
    "scroll",
    function () {
      if (visible) position();
    },
    { passive: true }
  );
  window.addEventListener("resize", function () {
    if (visible) position();
  });
})();
