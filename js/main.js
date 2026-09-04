

$(document).ready(function () {

  AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: false,
    offset: 100,
    delay: 0,
    mirror: true,
  });


});


(function ($) {
  $(window).on("load", function () {
    $("a[rel='m_PageScroll2id']").mPageScroll2id();
  });
})(jQuery);


$(document).ready(function () {
  if (typeof gsap === "undefined") return;

  /* Everything the hero reveals in sequence starts fully hidden. This is
     a plain gsap.set() (renders immediately, regardless of the timeline
     below being paused) rather than relying on .from()'s immediateRender,
     so section #info is genuinely empty the instant the page paints —
     nothing flashes into view before the signature hands off to it. */
  gsap.set(".info__title .letter", {
    yPercent: "random([-120, 120])",
    opacity: 0
  });
  gsap.set([".spiral", ".cylander", ".photoshop"], { opacity: 0, scale: 0 });
  gsap.set(".windwill", { rotation: 360, scale: 0 });
  gsap.set(".info__meta-line", { scaleX: 0 });
  gsap.set(".info__meta-label", { opacity: 0, y: 10 });
  gsap.set(".info__tool", { opacity: 0, scale: 0.4, y: 14 });

  /* Built paused: js/intro-signature.js plays it once the signature svg
     has drawn in and settled into its resting spot above the title, so
     the two animations run as one chain instead of two independent
     timers racing each other. Created (paused, at progress 0) here
     rather than later so js/stack-reveal.js -- which runs right after
     this script and checks window.__introTl -- always finds it and can
     register its own onComplete, however long it ends up waiting. */
  var introTl = gsap.timeline({ paused: true });
  window.__introTl = introTl;

  // 1) Hero title ("Mahsa Partovi") flies in first.
  introTl.to(".info__title .letter", {
    yPercent: 0,
    opacity: 1,
    duration: 1,
    stagger: 0.05,
    ease: "back.out"
  });

  // Decorative shapes settle in alongside the title, as before.
  introTl.to(".spiral", {
    opacity: 1,
    scale: 1,
    duration: 1,
    ease: "back.out"
  }, "-=0.6");
  introTl.to(".windwill", {
    rotation: 0,
    scale: 1,
    duration: 1.2,
    ease: "back.out"
  }, "-=0.8");
  introTl.to(".cylander", {
    opacity: 1,
    scale: 1,
    duration: 1.2,
    ease: "back.out"
  }, "-=1");
  introTl.to(".photoshop", {
    opacity: 1,
    scale: 1,
    duration: 1.2,
    ease: "back.out"
  }, "-=1");

  // 2) Right-side label ("Based in Iran"), then 3) left-side label
  // ("UI/UX Designer") -- in that order, one after the other.
  introTl.to(".info__meta--right .info__meta-line", {
    scaleX: 1,
    duration: 0.7,
    ease: "power3.out"
  }, "+=0.1");
  introTl.to(".info__meta--right .info__meta-label", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out"
  }, "-=0.45");

  introTl.to(".info__meta--left .info__meta-line", {
    scaleX: 1,
    duration: 0.7,
    ease: "power3.out"
  }, "+=0.05");
  introTl.to(".info__meta--left .info__meta-label", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out"
  }, "-=0.45");

  // 4) Tool badges (Figma / Adobe XD / Claude AI) arrive last.
  introTl.to(".info__tool", {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.55,
    stagger: 0.16,
    ease: "back.out(1.7)"
  }, "+=0.1");

  function playHeroIntro() {
    if (window.__heroIntroStarted) return;
    window.__heroIntroStarted = true;
    introTl.play();
  }

  // js/intro-signature.js may report completion before this line ever
  // runs (its reduced-motion / missing-element fallbacks fire
  // synchronously, earlier in the script order than this ready callback)
  // or after it (the normal draw-in takes a couple of seconds). The flag
  // covers the first case, the event covers the second.
  if (window.__heroSignatureDone) {
    playHeroIntro();
  } else {
    document.addEventListener("heroSignatureDone", playHeroIntro);
  }
  // Safety net so the hero content is never left hidden indefinitely if
  // the signature script fails to report completion for any reason.
  setTimeout(playHeroIntro, 6000);
});
var path = document.querySelector(".st2");
if (path) {
  var total_length = path.getTotalLength();
  // alert(total_length);
}

/* ===== Outro signature (above the footer) — same fly-in as the hero title,
   just replayed via ScrollTrigger the first time it scrolls into view. ===== */
$(document).ready(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  var outroLetters = document.querySelectorAll(".outroTitle .letter");
  if (!outroLetters.length) return;

  gsap.from(outroLetters, {
    yPercent: "random([-120, 120])",
    duration: 1,
    opacity: 0,
    stagger: 0.05,
    ease: "back.out",
    scrollTrigger: {
      trigger: "#outroSignature",
      start: "top 80%",
      once: true
    }
  });
});

