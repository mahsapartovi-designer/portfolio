/* ==========================================================================
   Interactive letter titles ("hoverLetters" effect)
   - Applies to every element with class "letterFx" (currently: the hero
     ".info__title" and the big low-opacity ".outroTitle" above the footer),
     each one running its own independent instance of the effect.
   - "MAHSA" and "PARTOVI" are treated as two independent words: the effect
     only ever applies within the word the cursor is actually over (or,
     during idle, within each word's own sweep) - it never bleeds from one
     line into the other.
   - Per letter: the "peak" of the effect is a forward pop toward the
     viewer (translateZ + slight scale, via the perspective set on the
     title element), not a vertical lift.
   - Per word: on top of that, the whole line the cursor/wave is currently
     over gets a gentle rotateX tilt + scale, so the entire word leans
     toward the viewer in 3D, not just the individual letter.
   - The letter's -webkit-text-stroke (its extra "boldness") is set every
     frame; a CSS transition on that property (see style.css) makes the
     weight change glide smoothly instead of snapping.
   - Idle state: the same forward-pop + tilt + bold falloff as hover,
     self-triggered - a virtual point sweeps once across each word (in
     parallel, like a Mexican wave), then rests, then repeats every ~5s.
   - Letter/word rest positions are measured once (and re-measured on
     resize) instead of read on every animation frame - reading layout
     every frame while writing transforms in the same frame is what was
     causing the stutter/"tick" on phones.
   - Every letter also remembers the last power value it was drawn at.
     If a frame's power hasn't meaningfully changed since the last one
     (true for most letters most of the time, since only the letters
     near the sweep's current position are doing anything), the frame
     is skipped entirely instead of re-writing style/transform. This
     matters most for ".outroTitle": it sits on top of a live WebGL
     background that's already rendering every frame, so cutting this
     loop's per-frame work down to only the letters actually moving is
     what keeps its sweep gliding instead of visibly ticking.
   - The -webkit-text-stroke "boldness" is skipped below a small power
     threshold instead of always being written (even as "0.00px"),
     since it forces a repaint every time it's touched - unlike the
     transform properties, which the compositor handles on its own
     thread and are cheap to re-write every frame.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof gsap === "undefined") return;

  var titleEls = Array.prototype.slice.call(document.querySelectorAll(".letterFx"));
  titleEls.forEach(initLetterFx);

  function initLetterFx(titleEl) {
    var wordGroups = Array.prototype.slice.call(titleEl.querySelectorAll(".word")).map(function (el) {
      el.style.transformOrigin = "50% 100%";
      return { el: el, letters: Array.prototype.slice.call(el.querySelectorAll(".letter")), midY: 0, start: 0, end: 0 };
    });
    var letters = wordGroups.reduce(function (all, g) { return all.concat(g.letters); }, []);
    if (!letters.length) return;

    var idleTl = null;
    var resumeTimeout = null;
    var resizeTimeout = null;

    var hoverRadius = 150; // px, horizontal falloff distance - recalculated
                           // per element in measure() below; this is just
                           // the starting/minimum value.
    // maxZ/maxStroke are in px, so they need to scale with the title's own
    // font-size or the effect looks "flatter" the bigger the text gets (46px
    // of forward-pop reads as a strong lift on the hero's ~86px letters, but
    // as barely anything on the outro title's ~200px letters). maxScale/
    // maxWordScale/maxTilt are ratios/degrees, already scale-independent,
    // so they're left as-is. REFERENCE_FONT_SIZE is the hero's desktop
    // font-size (5.4rem) - the size these numbers were originally tuned for.
    var REFERENCE_FONT_SIZE = 86;
    var fxScale = 1; // recalculated per element in measure() below
    var maxZ = 46;          // px, peak per-letter forward pop (at reference size)
    var maxScale = 1.05;    // peak per-letter scale bump
    var maxStroke = 1.3;    // px, peak text-stroke (at reference size)
    var maxTilt = 9;        // deg, peak whole-word rotateX toward the viewer
    var maxWordScale = 1.04; // peak whole-word scale bump

    var POWER_EPSILON = 0.01; // ignore power changes smaller than this

    // How many letter-widths the falloff should span. A fixed pixel radius
    // (the old behaviour) is only "wide" relative to the hero title's small
    // font -- there, neighbouring letters sit well inside 150px of each
    // other, so several of them are always partway lit at once and the
    // sweep reads as one continuous rolling wave. On the much bigger
    // outroTitle the same 150px barely reaches past a single letter, so
    // each letter jumps from 0 to full power and back almost on its own,
    // with no overlap with its neighbours -- that's the "stiff"/one-letter-
    // at-a-time motion instead of a smooth Mexican-wave roll. Deriving the
    // radius from the title's own measured letter spacing keeps the same
    // relative overlap (and therefore the same smoothness) at any font size.
    var RADIUS_PITCH_MULTIPLIER = 2.3;

    function measure() {
      wordGroups.forEach(function (g) {
        var wordRect = g.el.getBoundingClientRect();
        g.midY = wordRect.top + wordRect.height / 2;
        g.letters.forEach(function (letter) {
          var r = letter.getBoundingClientRect();
          letter._cx = r.left + r.width / 2;
          if (letter._lastPower === undefined) letter._lastPower = -1;
        });
      });

      var totalGap = 0, gapCount = 0;
      wordGroups.forEach(function (g) {
        for (var i = 1; i < g.letters.length; i++) {
          totalGap += g.letters[i]._cx - g.letters[i - 1]._cx;
          gapCount++;
        }
      });
      var avgPitch = gapCount ? totalGap / gapCount : 0;
      hoverRadius = Math.max(150, avgPitch * RADIUS_PITCH_MULTIPLIER);

      var currentFontSize = parseFloat(getComputedStyle(titleEl).fontSize) || REFERENCE_FONT_SIZE;
      fxScale = currentFontSize / REFERENCE_FONT_SIZE;

      wordGroups.forEach(function (g) {
        g.start = g.letters[0]._cx - hoverRadius;
        g.end = g.letters[g.letters.length - 1]._cx + hoverRadius;
        g._lastPeak = -1;
      });
    }

    // Applies one letter's power for this frame, but only touches the DOM
    // if the value actually moved since last frame - see note at top of file.
    function applyLetterPower(letter, power) {
      if (Math.abs(power - letter._lastPower) < POWER_EPSILON) return;
      letter._lastPower = power;
      gsap.set(letter, { z: maxZ * fxScale * power, scale: 1 + (maxScale - 1) * power });
      letter.style.webkitTextStroke = power > POWER_EPSILON
        ? (maxStroke * fxScale * power).toFixed(2) + "px currentColor"
        : "";
    }

    function applyWordPeak(g, peak) {
      if (Math.abs(peak - g._lastPeak) < POWER_EPSILON) return;
      g._lastPeak = peak;
      gsap.set(g.el, {
        rotateX: -maxTilt * peak,
        scale: 1 + (maxWordScale - 1) * peak
      });
    }

    function powerAt(letter, x) {
      var dist = Math.abs(x - letter._cx);
      var power = Math.max(0, 1 - dist / hoverRadius);
      return power * power * (3 - 2 * power); // smoothstep falloff
    }

    function peakPowerOf(g, x) {
      var peak = 0;
      g.letters.forEach(function (letter) {
        var p = powerAt(letter, x);
        if (p > peak) peak = p;
      });
      return peak;
    }

    function activeWordFor(mouseY) {
      var best = null;
      var bestDist = Infinity;
      wordGroups.forEach(function (g) {
        var d = Math.abs(mouseY - g.midY);
        if (d < bestDist) {
          bestDist = d;
          best = g;
        }
      });
      return best;
    }

    function resetLetters() {
      letters.forEach(function (letter) {
        gsap.to(letter, {
          z: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto"
        });
        letter.style.webkitTextStroke = "";
        letter._lastPower = -1;
      });
      wordGroups.forEach(function (g) {
        gsap.to(g.el, {
          rotateX: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto"
        });
        g._lastPeak = -1;
      });
    }

    function startIdle() {
      stopIdle();
      measure();
      idleTl = gsap.timeline({ repeat: -1, repeatDelay: 5 });
      wordGroups.forEach(function (g) {
        var proxy = { x: g.start };

        idleTl.to(proxy, {
          x: g.end,
          duration: 1.7,
          ease: "sine.inOut",
          onUpdate: function () {
            g.letters.forEach(function (letter) {
              applyLetterPower(letter, powerAt(letter, proxy.x));
            });
            applyWordPeak(g, peakPowerOf(g, proxy.x));
          }
        }, 0);
      });
    }

    function stopIdle() {
      if (idleTl) {
        idleTl.kill();
        idleTl = null;
      }
    }

    function scheduleResume() {
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(function () {
        resetLetters();
        startIdle();
      }, 250);
    }

    measure();
    startIdle();

    window.addEventListener("resize", function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(measure, 150);
    });

    // The outroTitle only ever runs the automatic idle wave - it never
    // reacts to the cursor. Skipping the mousemove/mouseleave listeners
    // entirely (rather than just no-oping inside them) means idleTl is
    // never stopped, so the wave just keeps repeating on its own forever.
    // The hero title (.info__title) keeps the full hover interaction.
    if (titleEl.classList.contains("outroTitle")) return;

    titleEl.addEventListener("mousemove", function (e) {
      clearTimeout(resumeTimeout);
      if (idleTl) stopIdle();

      var mouseX = e.clientX;
      var active = activeWordFor(e.clientY);

      wordGroups.forEach(function (g) {
        g.letters.forEach(function (letter) {
          var power = (g === active) ? powerAt(letter, mouseX) : 0;
          // Direct hover response stays a real GSAP tween (feels snappier
          // under the cursor); only the stroke write gets the same
          // skip-if-unchanged treatment to avoid needless repaints.
          gsap.to(letter, {
            z: maxZ * fxScale * power,
            scale: 1 + (maxScale - 1) * power,
            duration: 0.45,
            ease: "power2.out",
            overwrite: "auto"
          });
          if (Math.abs(power - letter._lastPower) >= POWER_EPSILON) {
            letter._lastPower = power;
            letter.style.webkitTextStroke = power > POWER_EPSILON
              ? (maxStroke * fxScale * power).toFixed(2) + "px currentColor"
              : "";
          }
        });

        var peak = g === active ? peakPowerOf(g, mouseX) : 0;
        gsap.to(g.el, {
          rotateX: -maxTilt * peak,
          scale: 1 + (maxWordScale - 1) * peak,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    });

    titleEl.addEventListener("mouseleave", function () {
      resetLetters();
      scheduleResume();
    });
  }
});
