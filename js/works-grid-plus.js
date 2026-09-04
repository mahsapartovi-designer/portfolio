(function () {
  var grid = document.querySelector(".worksGrid");
  if (!grid) return;

  var PER_ROW = 2; // matches .worksGrid grid-template-columns: repeat(2, 1fr)

  function isSingleColumn() {
    var cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/);
    return cols.length < 2;
  }

  function placePluses() {
    var existing = grid.querySelectorAll(".worksGrid__plus");
    for (var i = 0; i < existing.length; i++) {
      existing[i].remove();
    }

    if (isSingleColumn()) return; // no interior vertical divider to mark

    var cards = grid.querySelectorAll(".workCard");
    if (cards.length < PER_ROW * 2) return; // need at least two full rows

    var gridRect = grid.getBoundingClientRect();

    for (var i = PER_ROW - 1; i < cards.length - 1; i += PER_ROW) {
      var rect = cards[i].getBoundingClientRect();
      var bottomY = rect.bottom - gridRect.top;
      var plus = document.createElement("span");
      plus.className = "worksGrid__plus";
      plus.setAttribute("aria-hidden", "true");
      plus.style.top = bottomY + "px";
      grid.appendChild(plus);
    }
  }

  placePluses();

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(placePluses, 150);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(placePluses).catch(function () {});
  }

  window.addEventListener("load", placePluses);
})();
