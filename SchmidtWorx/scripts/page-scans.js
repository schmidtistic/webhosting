/* Page-scan viewer for preserved-document entries.
 *
 * Markup contract (see Reflections/ronald-schmidt.html):
 *   <div class="scan-row">
 *     <button class="scan-page" data-src="…full.jpg" data-caption="…">
 *       <img src="…-thumb.jpg" alt="…">
 *     </button>
 *   </div>
 * plus one .lightbox block per page.
 *
 * The gallery is scoped to the .scan-row that was clicked, so the counter
 * reads "3 / 7" within that document rather than counting every scan on
 * the page.
 */
document.addEventListener("DOMContentLoaded", function () {
    const lb = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightboxImg");
    const lbCap = document.getElementById("lightboxCaption");
    const lbCount = document.getElementById("lightboxCounter");
    const triggers = document.querySelectorAll(".scan-page");

    if (!lb || !lbImg || !triggers.length) return;

    let pages = [];
    let idx = 0;

    function show(i) {
        idx = (i + pages.length) % pages.length;
        const el = pages[idx];
        const img = el.querySelector("img");
        lbImg.src = el.dataset.src;
        lbImg.alt = img ? img.alt : "";
        if (lbCap) lbCap.textContent = el.dataset.caption || "";
        if (lbCount) lbCount.textContent = (idx + 1) + " / " + pages.length;
    }

    function open(el) {
        const row = el.closest(".scan-row");
        pages = Array.from(row ? row.querySelectorAll(".scan-page") : [el]);
        show(pages.indexOf(el));
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function close() {
        lb.classList.remove("open");
        document.body.style.overflow = "";
        lbImg.src = "";
    }

    triggers.forEach(function (el) {
        el.addEventListener("click", function () { open(el); });
    });

    const closeBtn = document.getElementById("lightboxClose");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { show(idx - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(idx + 1); });

    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });

    document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(idx - 1);
        if (e.key === "ArrowRight") show(idx + 1);
    });
});
