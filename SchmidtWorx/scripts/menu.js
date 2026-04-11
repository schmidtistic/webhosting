document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const menu = document.getElementById("menu");
    const navLinks = Array.from(document.querySelectorAll("#menu a"));

    // Mark the current page's nav link
    const normalizePath = function (path) {
        if (!path || path === "/") return "/index.html";
        return path.endsWith("/") ? path + "index.html" : path;
    };

    const currentPath = normalizePath(window.location.pathname);

    navLinks.forEach(function (link) {
        const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
        if (linkPath === currentPath) {
            link.setAttribute("aria-current", "page");
        }

        // Close mobile menu after a nav link is tapped
        link.addEventListener("click", function () {
            if (menu && hamburger && window.innerWidth < 860) {
                menu.classList.remove("open");
                hamburger.setAttribute("aria-expanded", "false");
                hamburger.setAttribute("aria-label", "Open navigation");
            }
        });
    });

    // Hamburger toggle
    if (!hamburger || !menu) return;

    hamburger.addEventListener("click", function () {
        const isOpen = menu.classList.toggle("open");
        hamburger.setAttribute("aria-expanded", String(isOpen));
        hamburger.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
});
